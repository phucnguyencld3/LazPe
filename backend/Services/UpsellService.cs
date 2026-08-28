using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs.Upsell;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.Services.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class UpsellService : IUpsellService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly ILogger<UpsellService> _logger;
        
        // Trọng số chấm điểm
        private readonly int _categoryWeight;
        private readonly int _supplierWeight;
        private readonly int _bestSellerWeight;
        private readonly int _priceWeight;
        private readonly int _stockWeight;
        private readonly int _cacheDurationMinutes;

        public UpsellService(ApplicationDbContext context, IMemoryCache cache, IConfiguration configuration, ILogger<UpsellService> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
            
            _categoryWeight = configuration.GetValue<int?>("UpsellConfig:CategoryWeight") ?? 3;
            _supplierWeight = configuration.GetValue<int?>("UpsellConfig:SupplierWeight") ?? 2;
            _bestSellerWeight = configuration.GetValue<int?>("UpsellConfig:BestSellerWeight") ?? 2;
            _priceWeight = configuration.GetValue<int?>("UpsellConfig:PriceWeight") ?? 1;
            _stockWeight = configuration.GetValue<int?>("UpsellConfig:StockWeight") ?? 1;
            _cacheDurationMinutes = configuration.GetValue<int?>("UpsellConfig:CacheDurationMinutes") ?? 60;
        }

        public async Task<List<UpsellProductDto>> GetCheckoutUpsellAsync(string userId)
        {
            try
            {
                var cart = !string.IsNullOrEmpty(userId) ? await LoadCartAsync(userId) : null;
                var context = cart != null ? BuildUpsellContext(cart) : new UpsellContext();
                var candidates = await FindCandidateVariantsAsync(context);
                
                if (!candidates.Any()) return new List<UpsellProductDto>();

                var bestSellers = await LoadBestSellerAsync();
                
                CalculateUpsellScore(context, candidates, bestSellers);
                
                var topUpsells = SelectTopUpsells(candidates);
                
                return BuildUpsellDtos(topUpsells);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting checkout upsells for userId: {UserId}", userId);
                return new List<UpsellProductDto>();
            }
        }

        private async Task<Cart?> LoadCartAsync(string userId)
        {
            return await _context.Carts
                .AsSplitQuery()
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Variant)
                        .ThenInclude(v => v.Product)
                .FirstOrDefaultAsync(c => c.UserID == userId && c.Status == true);
        }

        private UpsellContext BuildUpsellContext(Cart cart)
        {
            var ctx = new UpsellContext
            {
                Cart = cart,
                CartDetails = cart.CartDetails?.ToList() ?? new List<CartDetail>(),
                TotalAmount = cart.TotalAmount
            };

            if (cart.CartDetails != null)
            {
                foreach (var detail in cart.CartDetails)
                {
                    if (detail.VariantID.HasValue)
                    {
                        ctx.ExistingVariantIds.Add(detail.VariantID.Value);
                        
                        if (detail.Variant != null && detail.Variant.Product != null)
                        {
                            ctx.CategoryIds.Add(detail.Variant.Product.CategoryID);
                            ctx.SupplierIds.Add(detail.Variant.Product.SupplierID);
                        }
                    }
                }
            }

            return ctx;
        }

        private async Task<List<UpsellCandidate>> FindCandidateVariantsAsync(UpsellContext context)
        {
            var categoryIds = context.CategoryIds.ToList();
            var supplierIds = context.SupplierIds.ToList();
            
            var baseQuery = _context.Variants
                .AsSplitQuery()
                .Include(v => v.Product)
                    .ThenInclude(p => p.Images)
                .Include(v => v.Product)
                    .ThenInclude(p => p.Variants)
                .AsNoTracking()
                .Where(v => v.Status && !v.IsDeleted && v.Stock > 0)
                .Where(v => v.Product != null && v.Product.Status && !v.Product.IsDeleted)
                .Where(v => !context.ExistingVariantIds.Contains(v.VariantID));

            var variants = await baseQuery
                .Where(v => categoryIds.Contains(v.Product.CategoryID) || supplierIds.Contains(v.Product.SupplierID))
                .ToListAsync();

            if (variants.Count < 5)
            {
                var existingVariantIds = variants.Select(v => v.VariantID).Union(context.ExistingVariantIds).ToList();
                var fallbackVariants = await baseQuery
                    .Where(v => !existingVariantIds.Contains(v.VariantID))
                    .OrderByDescending(v => v.VariantID)
                    .Take(10)
                    .ToListAsync();

                variants.AddRange(fallbackVariants);
            }

            return variants
                .Where(v => v != null && v.Product != null)
                .Select(v => new UpsellCandidate(v))
                .ToList();
        }

        private async Task<Dictionary<int, int>> LoadBestSellerAsync()
        {
            const string cacheKey = "BestSellers_Top50";
            
            if (!_cache.TryGetValue(cacheKey, out Dictionary<int, int> bestSellers))
            {
                var bestSellerList = await _context.InvoiceDetails
                    .Where(id => id.VariantID.HasValue)
                    .GroupBy(id => id.VariantID.Value)
                    .Select(g => new { VariantID = g.Key, SoldQuantity = g.Sum(x => x.Quantity) })
                    .OrderByDescending(x => x.SoldQuantity)
                    .Take(50)
                    .ToListAsync();
                    
                bestSellers = bestSellerList
                    .GroupBy(x => x.VariantID)
                    .ToDictionary(g => g.Key, g => g.First().SoldQuantity);

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(_cacheDurationMinutes));
                    
                _cache.Set(cacheKey, bestSellers, cacheOptions);
            }
                
            return bestSellers ?? new Dictionary<int, int>();
        }

        private void CalculateUpsellScore(UpsellContext context, List<UpsellCandidate> candidates, Dictionary<int, int> bestSellers)
        {
            decimal priceThreshold = context.TotalAmount > 0 ? context.TotalAmount * 0.3m : 100000m;

            foreach (var candidate in candidates)
            {
                if (candidate.Variant == null || candidate.Variant.Product == null) continue;
                var product = candidate.Variant.Product;
                
                if (context.CategoryIds.Contains(product.CategoryID))
                    candidate.Score += _categoryWeight;
                    
                if (context.SupplierIds.Contains(product.SupplierID))
                    candidate.Score += _supplierWeight;
                    
                if (bestSellers.ContainsKey(candidate.Variant.VariantID))
                    candidate.Score += _bestSellerWeight;
                    
                if (candidate.Variant.UnitPrice < priceThreshold)
                    candidate.Score += _priceWeight;
                    
                if (candidate.Variant.Stock >= 10)
                    candidate.Score += _stockWeight;
            }
        }

        private List<UpsellCandidate> SelectTopUpsells(List<UpsellCandidate> candidates)
        {
            var validCandidates = candidates.Where(c => c.Variant != null && c.Variant.Product != null).ToList();

            var distinctProducts = validCandidates
                .GroupBy(c => c.Variant.ProductID)
                .Select(g => g.OrderByDescending(c => c.Score).First());

            var rnd = new Random();
            return distinctProducts
                .OrderByDescending(c => c.Score)
                .ThenBy(_ => rnd.Next()) 
                .Take(3)
                .ToList();
        }

        private List<UpsellProductDto> BuildUpsellDtos(List<UpsellCandidate> topUpsells)
        {
            return topUpsells
                .Where(c => c.Variant != null && c.Variant.Product != null)
                .Select(c => 
                {
                    decimal originalPrice = c.Variant.UnitPrice;
                    decimal discountPercent = c.Variant.VariantDiscountPercent;
                    decimal sellingPrice = originalPrice;
                    
                    if (discountPercent > 0)
                    {
                        sellingPrice = originalPrice * (1 - discountPercent / 100);
                    }

                    string imageUrl = !string.IsNullOrWhiteSpace(c.Variant.ImageUrl) 
                        ? c.Variant.ImageUrl 
                        : (c.Variant.Product?.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault(i => !string.IsNullOrWhiteSpace(i.ImageUrl))?.ImageUrl 
                            ?? c.Variant.Product?.Variants?.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v.ImageUrl))?.ImageUrl 
                            ?? string.Empty);

                    return new UpsellProductDto
                    {
                        VariantID = c.Variant.VariantID,
                        ProductID = c.Variant.ProductID,
                        ProductName = c.Variant.Product.ProductName ?? string.Empty,
                        VariantName = c.Variant.VariantName ?? string.Empty,
                        ImageUrl = imageUrl,
                        UnitPrice = sellingPrice, // Giá bán
                        OriginalPrice = originalPrice, // Giá gốc
                        DiscountPercent = discountPercent,
                        Stock = c.Variant.Stock
                    };
                }).ToList();
        }
    }
}

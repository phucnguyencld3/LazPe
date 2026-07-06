using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs.Upsell;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.Services.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class UpsellService : IUpsellService
    {
        private readonly ApplicationDbContext _context;
        
        // Trọng số chấm điểm
        private const int CategoryWeight = 3;
        private const int SupplierWeight = 2;
        private const int BestSellerWeight = 2;
        private const int PriceWeight = 1;
        private const int StockWeight = 1;

        public UpsellService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<UpsellProductDto>> GetCheckoutUpsellAsync(string userId)
        {
            var cart = await LoadCartAsync(userId);
            if (cart == null || !cart.CartDetails.Any()) return new List<UpsellProductDto>();

            var context = BuildUpsellContext(cart);
            var candidates = await FindCandidateVariantsAsync(context);
            
            if (!candidates.Any()) return new List<UpsellProductDto>();

            var bestSellers = await LoadBestSellerAsync();
            
            CalculateUpsellScore(context, candidates, bestSellers);
            
            var topUpsells = SelectTopUpsells(candidates);
            
            return BuildUpsellDtos(topUpsells);
        }

        private async Task<Cart?> LoadCartAsync(string userId)
        {
            return await _context.Carts
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
                CartDetails = cart.CartDetails.ToList(),
                TotalAmount = cart.TotalAmount
            };

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

            return ctx;
        }

        private async Task<List<UpsellCandidate>> FindCandidateVariantsAsync(UpsellContext context)
        {
            var categoryIds = context.CategoryIds.ToList();
            var supplierIds = context.SupplierIds.ToList();
            
            var variants = await _context.Variants
                .Include(v => v.Product)
                .AsNoTracking()
                .Where(v => v.Status && !v.IsDeleted && v.Stock > 0)
                .Where(v => v.Product.Status && !v.Product.IsDeleted)
                .Where(v => !context.ExistingVariantIds.Contains(v.VariantID))
                .Where(v => categoryIds.Contains(v.Product.CategoryID) || supplierIds.Contains(v.Product.SupplierID))
                .ToListAsync();

            return variants.Select(v => new UpsellCandidate(v)).ToList();
        }

        private async Task<Dictionary<int, int>> LoadBestSellerAsync()
        {
            // Lấy top 50 variant bán chạy nhất để chấm điểm (O(1) lookup), tránh N+1
            var bestSellers = await _context.InvoiceDetails
                .Where(id => id.VariantID.HasValue)
                .GroupBy(id => id.VariantID.Value)
                .Select(g => new { VariantID = g.Key, SoldQuantity = g.Sum(x => x.Quantity) })
                .OrderByDescending(x => x.SoldQuantity)
                .Take(50)
                .ToDictionaryAsync(x => x.VariantID, x => x.SoldQuantity);
                
            return bestSellers;
        }

        private void CalculateUpsellScore(UpsellContext context, List<UpsellCandidate> candidates, Dictionary<int, int> bestSellers)
        {
            decimal priceThreshold = context.TotalAmount * 0.3m;

            foreach (var candidate in candidates)
            {
                var product = candidate.Variant.Product;
                
                if (context.CategoryIds.Contains(product.CategoryID))
                    candidate.Score += CategoryWeight;
                    
                if (context.SupplierIds.Contains(product.SupplierID))
                    candidate.Score += SupplierWeight;
                    
                if (bestSellers.ContainsKey(candidate.Variant.VariantID))
                    candidate.Score += BestSellerWeight;
                    
                if (candidate.Variant.UnitPrice < priceThreshold)
                    candidate.Score += PriceWeight;
                    
                if (candidate.Variant.Stock >= 10)
                    candidate.Score += StockWeight;
            }
        }

        private List<UpsellCandidate> SelectTopUpsells(List<UpsellCandidate> candidates)
        {
            // Bước 1: Nhóm theo ProductID để không hiển thị nhiều biến thể (size, màu) của CÙNG 1 sản phẩm
            var distinctProducts = candidates
                .GroupBy(c => c.Variant.ProductID)
                .Select(g => g.OrderByDescending(c => c.Score).First()); // Lấy Variant có điểm cao nhất đại diện cho Product đó

            // Bước 2: Sắp xếp theo điểm giảm dần. 
            // Nếu các sản phẩm có cùng điểm (hòa điểm), dùng Guid.NewGuid() để xáo trộn ngẫu nhiên, giúp danh sách đa dạng hơn mỗi lần checkout.
            return distinctProducts
                .OrderByDescending(c => c.Score)
                .ThenBy(c => Guid.NewGuid()) 
                .Take(3)
                .ToList();
        }

        private List<UpsellProductDto> BuildUpsellDtos(List<UpsellCandidate> topUpsells)
        {
            return topUpsells.Select(c => new UpsellProductDto
            {
                VariantID = c.Variant.VariantID,
                ProductID = c.Variant.ProductID,
                ProductName = c.Variant.Product.ProductName,
                VariantName = c.Variant.VariantName,
                ImageUrl = c.Variant.ImageUrl ?? string.Empty,
                UnitPrice = c.Variant.UnitPrice,
                OriginalPrice = c.Variant.UnitPrice, // Simplified for MVP
                DiscountPercent = c.Variant.VariantDiscountPercent,
                Stock = c.Variant.Stock
            }).ToList();
        }
    }
}

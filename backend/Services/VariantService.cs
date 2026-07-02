using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using Hangfire;

namespace PolyBabyAPI.Services
{
    public class VariantService : IVariantService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VariantService> _logger;
        private readonly Hangfire.IBackgroundJobClient _backgroundJobClient;

        public VariantService(ApplicationDbContext context, ILogger<VariantService> logger, Hangfire.IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _logger = logger;
            _backgroundJobClient = backgroundJobClient;
        }

        public async Task<List<Variant>> GetVariantsByProductIdAsync(int productId)
        {
            return await _context.Variants
                .Include(v => v.VariantOptionValues)
                    .ThenInclude(vov => vov.ProductOptionValue)
                        .ThenInclude(pov => pov.ProductOption)
                .Where(v => v.ProductID == productId && !v.IsDeleted)
                .OrderBy(v => v.VariantName)
                .ToListAsync();
        }

        public async Task<Variant?> GetVariantByIdAsync(int variantId)
        {
            return await _context.Variants
                .Include(v => v.Product)
                .Include(v => v.VariantOptionValues)
                    .ThenInclude(vov => vov.ProductOptionValue)
                        .ThenInclude(pov => pov.ProductOption)
                .FirstOrDefaultAsync(v => v.VariantID == variantId && !v.IsDeleted);
        }

        public async Task<List<Variant>> SearchVariantsAsync(int productId, string searchTerm)
        {
            var query = _context.Variants
                .Include(v => v.VariantOptionValues)
                    .ThenInclude(vov => vov.ProductOptionValue)
                        .ThenInclude(pov => pov.ProductOption)
                .Where(v => v.ProductID == productId && !v.IsDeleted);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(v =>
                    v.VariantName.ToLower().Contains(searchTerm) ||
                    v.SKU.ToLower().Contains(searchTerm));
            }

            return await query.OrderBy(v => v.VariantName).ToListAsync();
        }

        public async Task<bool> CreateVariantAsync(Variant variant, List<int> optionValueIds)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Variants.Add(variant);
                
                var product = await _context.Products.FindAsync(variant.ProductID);
                if (product != null && variant.Stock > 0)
                {
                    product.Stock += variant.Stock;
                    _context.Products.Update(product);
                }
                
                await _context.SaveChangesAsync();

                if (optionValueIds != null && optionValueIds.Any())
                {
                    foreach (var optionValueId in optionValueIds)
                    {
                        _context.VariantOptionValues.Add(new VariantOptionValue
                        {
                            VariantID = variant.VariantID,
                            ProductOptionValueID = optionValueId
                        });
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating variant");
                return false;
            }
        }

        public async Task<List<VariantCombinationDto>> GenerateVariantCombinationsAsync(int productId)
        {
            var product = await _context.Products
                .Include(p => p.ProductOptions)
                    .ThenInclude(po => po.ProductOptionValues)
                .Include(p => p.Variants)
                    .ThenInclude(v => v.VariantOptionValues)
                .FirstOrDefaultAsync(p => p.ProductID == productId);

            if (product == null) return new List<VariantCombinationDto>();

            var combinations = new List<VariantCombinationDto>();
            var optionsList = product.ProductOptions
                .Where(po => po.ProductOptionValues != null && po.ProductOptionValues.Any())
                .OrderBy(po => po.DisplayOrder)
                .ToList();

            if (!optionsList.Any()) return combinations;

            GenerateCombinationsRecursive(product, optionsList, 0,
                new Dictionary<string, string>(), new List<int>(), combinations);

            return combinations;
        }

        private void GenerateCombinationsRecursive(
            Product product, List<ProductOption> options, int depth,
            Dictionary<string, string> currentCombination,
            List<int> currentOptionValueIds,
            List<VariantCombinationDto> combinations)
        {
            if (depth == options.Count)
            {
                var optionTotalPrice = _context.ProductOptionValues
                    .Where(pov => currentOptionValueIds.Contains(pov.ProductOptionValueID))
                    .Sum(pov => pov.Price);

                var totalPrice = product.Price + optionTotalPrice;

                var variantName = product.ProductName;
                if (currentCombination.Any())
                    variantName += " - " + string.Join(" - ", currentCombination.Values);

                var alreadyExists = product.Variants.Any(v =>
                    !v.IsDeleted &&
                    v.VariantOptionValues != null &&
                    v.VariantOptionValues.Count == currentOptionValueIds.Count &&
                    v.VariantOptionValues.All(vov => currentOptionValueIds.Contains(vov.ProductOptionValueID)));

                combinations.Add(new VariantCombinationDto
                {
                    VariantName = variantName,
                    UnitPrice = totalPrice,
                    OptionCombination = new Dictionary<string, string>(currentCombination),
                    OptionValueIds = new List<int>(currentOptionValueIds),
                    AlreadyExists = alreadyExists
                });
                return;
            }

            var currentOption = options[depth];
            if (currentOption.ProductOptionValues == null || !currentOption.ProductOptionValues.Any())
            {
                GenerateCombinationsRecursive(product, options, depth + 1,
                    currentCombination, currentOptionValueIds, combinations);
                return;
            }

            foreach (var optionValue in currentOption.ProductOptionValues.OrderBy(v => v.DisplayOrder))
            {
                currentCombination[currentOption.Name] = optionValue.Value;
                currentOptionValueIds.Add(optionValue.ProductOptionValueID);

                GenerateCombinationsRecursive(product, options, depth + 1,
                    currentCombination, currentOptionValueIds, combinations);

                currentCombination.Remove(currentOption.Name);
                currentOptionValueIds.RemoveAt(currentOptionValueIds.Count - 1);
            }
        }

        public async Task<bool> UpdateVariantAsync(Variant variant)
        {
            try
            {
                var oldVariant = await _context.Variants.AsNoTracking().FirstOrDefaultAsync(v => v.VariantID == variant.VariantID);
                _context.Variants.Update(variant);
                
                if (oldVariant != null)
                {
                    var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductID == variant.ProductID);
                    if (product != null)
                    {
                        var stockDifference = variant.Stock - oldVariant.Stock;
                        if (stockDifference != 0)
                        {
                            product.Stock += stockDifference;
                            if (product.Stock < 0) product.Stock = 0;
                            _context.Products.Update(product);
                        }
                    }
                }
                
                await _context.SaveChangesAsync();

                if (oldVariant != null)
                {
                    var product = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.ProductID == variant.ProductID);
                    var productDiscount = product?.ProductDiscountPercent ?? 0;
                    
                    var oldDiscount = oldVariant.VariantDiscountPercent > 0 ? oldVariant.VariantDiscountPercent : productDiscount;
                    var newDiscount = variant.VariantDiscountPercent > 0 ? variant.VariantDiscountPercent : productDiscount;
                    
                    var oldFinalPrice = oldVariant.UnitPrice * (1m - (oldDiscount / 100m));
                    var newFinalPrice = variant.UnitPrice * (1m - (newDiscount / 100m));

                    if (newFinalPrice < oldFinalPrice)
                    {
                        _backgroundJobClient.Enqueue<IProductAlertService>(s => s.ProcessPriceDropAlertsAsync(variant.ProductID, variant.VariantID, newFinalPrice));
                    }
                    if (oldVariant.Stock == 0 && variant.Stock > 0)
                    {
                        _backgroundJobClient.Enqueue<IProductAlertService>(s => s.ProcessBackInStockAlertsAsync(variant.ProductID, variant.VariantID));
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating variant {VariantId}", variant.VariantID);
                return false;
            }
        }

        public async Task<bool> UpdateStockAsync(int variantId, int newStock)
        {
            var variant = await _context.Variants.FindAsync(variantId);
            if (variant == null) return false;
            
            var oldStock = variant.Stock;
            var stockDifference = newStock - oldStock;
            variant.Stock = newStock;
            
            var product = await _context.Products.FindAsync(variant.ProductID);
            if (product != null)
            {
                product.Stock += stockDifference;
                if (product.Stock < 0) product.Stock = 0;
            }
            
            await _context.SaveChangesAsync();

            if (oldStock == 0 && newStock > 0)
            {
                _backgroundJobClient.Enqueue<IProductAlertService>(s => s.ProcessBackInStockAlertsAsync(variant.ProductID, variant.VariantID));
            }

            return true;
        }

        public async Task<bool> DeleteVariantAsync(int variantId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var variant = await _context.Variants
                    .Include(v => v.VariantOptionValues)
                    .Include(v => v.InvoiceDetails)
                    .Include(v => v.CartDetails)
                    .Include(v => v.BundleItems)
                    .FirstOrDefaultAsync(v => v.VariantID == variantId);

                if (variant == null) return false;
                
                var product = await _context.Products.FindAsync(variant.ProductID);

                if ((variant.InvoiceDetails != null && variant.InvoiceDetails.Any()) || 
                    (variant.CartDetails != null && variant.CartDetails.Any()) ||
                    (variant.BundleItems != null && variant.BundleItems.Any()))
                {
                    variant.IsDeleted = true;
                    _context.Variants.Update(variant);
                }
                else
                {
                    if (variant.VariantOptionValues?.Any() == true)
                        _context.VariantOptionValues.RemoveRange(variant.VariantOptionValues);

                    _context.Variants.Remove(variant);
                }
                
                if (product != null)
                {
                    product.Stock -= variant.Stock;
                    if (product.Stock < 0) product.Stock = 0;
                    _context.Products.Update(product);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error deleting variant {VariantId}", variantId);
                return false;
            }
        }

        public async Task<bool> VariantExistsAsync(int productId, List<int> optionValueIds)
        {
            if (optionValueIds == null || !optionValueIds.Any()) return false;
            return await _context.Variants
                .Include(v => v.VariantOptionValues)
                .Where(v => v.ProductID == productId && !v.IsDeleted)
                .AnyAsync(v =>
                    v.VariantOptionValues.Count == optionValueIds.Count &&
                    v.VariantOptionValues.All(vov => optionValueIds.Contains(vov.ProductOptionValueID)));
        }

        public async Task<decimal> CalculateVariantPriceAsync(int productId, List<int> optionValueIds, decimal basePrice = 0)
        {
            var product = await _context.Products
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ProductID == productId);

            var productBasePrice = product?.Price ?? basePrice;

            if (optionValueIds == null || !optionValueIds.Any()) return productBasePrice;
            var totalPrice = await _context.ProductOptionValues
                .Where(pov => optionValueIds.Contains(pov.ProductOptionValueID))
                .SumAsync(v => v.Price);
            return productBasePrice + totalPrice;
        }

        public async Task<bool> BulkUpdateVariantsAsync(List<BulkUpdateVariantDto> updates)
        {
            if (updates == null || !updates.Any()) return true;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var variantIds = updates.Select(u => u.VariantId).ToList();
                var oldVariants = await _context.Variants.AsNoTracking().Where(v => variantIds.Contains(v.VariantID)).ToListAsync();

                foreach (var update in updates)
                {
                    // Ef Core 8 ExecuteUpdateAsync for performance
                    await _context.Variants
                        .Where(v => v.VariantID == update.VariantId)
                        .ExecuteUpdateAsync(s => s
                            .SetProperty(v => v.UnitPrice, update.UnitPrice)
                            .SetProperty(v => v.Stock, update.Stock));

                    var oldVariant = oldVariants.FirstOrDefault(v => v.VariantID == update.VariantId);
                    if (oldVariant != null)
                    {
                        var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductID == oldVariant.ProductID);
                        if (product != null)
                        {
                            var stockDiff = update.Stock - oldVariant.Stock;
                            if (stockDiff != 0)
                            {
                                product.Stock += stockDiff;
                                if (product.Stock < 0) product.Stock = 0;
                                _context.Products.Update(product);
                            }
                        }

                        var productDiscount = product?.ProductDiscountPercent ?? 0;
                        var discount = oldVariant.VariantDiscountPercent > 0 ? oldVariant.VariantDiscountPercent : productDiscount;
                        var oldFinalPrice = oldVariant.UnitPrice * (1m - (discount / 100m));
                        var newFinalPrice = update.UnitPrice * (1m - (discount / 100m));

                        if (newFinalPrice < oldFinalPrice)
                        {
                            _backgroundJobClient.Enqueue<IProductAlertService>(s => s.ProcessPriceDropAlertsAsync(oldVariant.ProductID, oldVariant.VariantID, newFinalPrice));
                        }
                        if (oldVariant.Stock == 0 && update.Stock > 0)
                        {
                            _backgroundJobClient.Enqueue<IProductAlertService>(s => s.ProcessBackInStockAlertsAsync(oldVariant.ProductID, oldVariant.VariantID));
                        }
                    }
                }

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error bulk updating variants");
                return false;
            }
        }
    }
}
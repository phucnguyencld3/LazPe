using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class BundleService : IBundleService
    {
        private readonly ApplicationDbContext _context;

        public BundleService(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==================== BUNDLE OPERATIONS ====================

        public async Task<IEnumerable<Bundle>> GetAllBundlesAsync()
        {
            return await _context.Bundles
                .Include(b => b.BundleItems)
                    .ThenInclude(bi => bi.Variant)
                        .ThenInclude(v => v.Product)
                .OrderByDescending(b => b.BundleID)
                .ToListAsync();
        }

        public async Task<Bundle> GetBundleByIdAsync(int bundleId)
        {
            return await _context.Bundles
                .FirstOrDefaultAsync(b => b.BundleID == bundleId);
        }

        public async Task<Bundle> GetBundleWithItemsAsync(int bundleId)
        {
            return await _context.Bundles
                .Include(b => b.BundleItems)
                    .ThenInclude(bi => bi.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.Supplier)
                .Include(b => b.BundleItems)
                    .ThenInclude(bi => bi.Variant)
                        .ThenInclude(v => v.VariantOptionValues)
                            .ThenInclude(vov => vov.ProductOptionValue)
                                .ThenInclude(pov => pov.ProductOption)
                .FirstOrDefaultAsync(b => b.BundleID == bundleId);
        }

        public async Task<bool> CreateBundleAsync(Bundle bundle)
        {
            try
            {
                bundle.Code = await GenerateUniqueBundleCodeAsync();

                if (!bundle.Price.HasValue)
                    bundle.Price = 0;

                _context.Bundles.Add(bundle);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        private async Task<string> GenerateUniqueBundleCodeAsync()
        {
            string code;
            bool isUnique;
            var random = new Random();

            do
            {
                int randomNumber = random.Next(100000, 999999);
                code = $"CBO{randomNumber}";
                isUnique = await IsBundleCodeUniqueAsync(code);
            } while (!isUnique);

            return code;
        }

        public async Task<bool> UpdateBundleAsync(Bundle bundle)
        {
            try
            {
                _context.Bundles.Update(bundle);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteBundleAsync(int bundleId)
        {
            try
            {
                var bundle = await GetBundleByIdAsync(bundleId);
                if (bundle == null) return false;

                var bundleItems = await _context.BundleItems
                    .Where(bi => bi.BundleID == bundleId)
                    .ToListAsync();

                _context.BundleItems.RemoveRange(bundleItems);
                _context.Bundles.Remove(bundle);

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> BundleExistsAsync(int bundleId)
        {
            return await _context.Bundles.AnyAsync(b => b.BundleID == bundleId);
        }

        public async Task<bool> IsBundleCodeUniqueAsync(string code, int? excludeBundleId = null)
        {
            if (string.IsNullOrWhiteSpace(code)) return true;

            var query = _context.Bundles.Where(b => b.Code == code);

            if (excludeBundleId.HasValue)
                query = query.Where(b => b.BundleID != excludeBundleId.Value);

            return !await query.AnyAsync();
        }

        // ==================== BUNDLE ITEM OPERATIONS ====================

        public async Task<IEnumerable<BundleItem>> GetBundleItemsAsync(int bundleId)
        {
            return await _context.BundleItems
                .Include(bi => bi.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Supplier)
                .Include(bi => bi.Variant)
                    .ThenInclude(v => v.VariantOptionValues)
                        .ThenInclude(vov => vov.ProductOptionValue)
                            .ThenInclude(pov => pov.ProductOption)
                .Where(bi => bi.BundleID == bundleId)
                .OrderBy(bi => bi.SortOrder)
                .ToListAsync();
        }

        public async Task<BundleItem> GetBundleItemByIdAsync(int bundleItemId)
        {
            return await _context.BundleItems
                .Include(bi => bi.Variant)
                    .ThenInclude(v => v.Product)
                .Include(bi => bi.Bundle)
                .FirstOrDefaultAsync(bi => bi.BundleItemID == bundleItemId);
        }

        public async Task<bool> AddBundleItemAsync(BundleItem bundleItem)
        {
            try
            {
                var variant = await _context.Variants
                    .FirstOrDefaultAsync(v => v.VariantID == bundleItem.VariantID);

                if (variant == null || !variant.Status)
                    return false;

                var maxSortOrder = await _context.BundleItems
                    .Where(bi => bi.BundleID == bundleItem.BundleID)
                    .MaxAsync(bi => (int?)bi.SortOrder) ?? 0;

                bundleItem.SortOrder = maxSortOrder + 1;

                _context.BundleItems.Add(bundleItem);
                await _context.SaveChangesAsync();

                // Tự động cập nhật giá combo sau khi thêm item
                await RecalculateBundlePriceAsync(bundleItem.BundleID);

                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateBundleItemAsync(BundleItem bundleItem)
        {
            try
            {
                var variant = await _context.Variants
                    .FirstOrDefaultAsync(v => v.VariantID == bundleItem.VariantID);

                if (variant == null || !variant.Status)
                    return false;

                _context.BundleItems.Update(bundleItem);
                await _context.SaveChangesAsync();

                await RecalculateBundlePriceAsync(bundleItem.BundleID);

                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteBundleItemAsync(int bundleItemId)
        {
            try
            {
                var bundleItem = await _context.BundleItems
                    .FirstOrDefaultAsync(bi => bi.BundleItemID == bundleItemId);

                if (bundleItem == null) return false;

                var bundleId = bundleItem.BundleID;

                _context.BundleItems.Remove(bundleItem);
                await _context.SaveChangesAsync();

                await RecalculateBundlePriceAsync(bundleId);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting bundle item: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> VariantExistsInBundleAsync(int bundleId, int variantId)
        {
            return await _context.BundleItems
                .AnyAsync(bi => bi.BundleID == bundleId && bi.VariantID == variantId);
        }

        public async Task<decimal> CalculateBundleTotalPriceAsync(int bundleId)
        {
            var bundleItems = await _context.BundleItems
                .Include(bi => bi.Variant)
                .Where(bi => bi.BundleID == bundleId)
                .ToListAsync();

            return bundleItems.Sum(bi => bi.Variant.UnitPrice * bi.Quantity);
        }

        /// <summary>
        /// Tính lại OriginalPrice và Price (áp dụng DiscountPercent)
        /// </summary>
        private async Task RecalculateBundlePriceAsync(int bundleId)
        {
            var bundle = await _context.Bundles.FindAsync(bundleId);
            if (bundle != null)
            {
                var originalPrice = await CalculateBundleTotalPriceAsync(bundleId);
                bundle.OriginalPrice = originalPrice;
                bundle.Price = originalPrice * (1 - bundle.DiscountPercent / 100m);
                bundle.Price = Math.Round(bundle.Price.Value, 0); // Làm tròn
                _context.Bundles.Update(bundle);
                await _context.SaveChangesAsync();
            }
        }

        // ==================== UTILITY ====================

        public async Task<IEnumerable<Variant>> GetAvailableVariantsAsync()
        {
            return await _context.Variants
                .Include(v => v.Product)
                    .ThenInclude(p => p.Supplier)
                .Include(v => v.VariantOptionValues)
                    .ThenInclude(vov => vov.ProductOptionValue)
                        .ThenInclude(pov => pov.ProductOption)
                .Where(v => v.Status && v.Product.Status && v.Stock > 0)
                .OrderBy(v => v.Product.ProductName)
                .ThenBy(v => v.VariantName)
                .ToListAsync();
        }

        public async Task<Variant> GetVariantByIdAsync(int variantId)
        {
            return await _context.Variants
                .Include(v => v.Product)
                    .ThenInclude(p => p.Supplier)
                .Include(v => v.VariantOptionValues)
                    .ThenInclude(vov => vov.ProductOptionValue)
                        .ThenInclude(pov => pov.ProductOption)
                .FirstOrDefaultAsync(v => v.VariantID == variantId);
        }

        public async Task<bool> UpdateBundleDetailsAsync(Bundle bundle)
        {
            try
            {
                _context.Entry(bundle).Property(b => b.Name).IsModified = true;
                _context.Entry(bundle).Property(b => b.Description).IsModified = true;
                _context.Entry(bundle).Property(b => b.Status).IsModified = true;
                _context.Entry(bundle).Property(b => b.ImageUrl).IsModified = true;
                _context.Entry(bundle).Property(b => b.DiscountPercent).IsModified = true;

                await _context.SaveChangesAsync();

                // Tính lại giá sau khi cập nhật discount
                await RecalculateBundlePriceAsync(bundle.BundleID);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating bundle details: {ex.Message}");
                return false;
            }
        }
    }
}
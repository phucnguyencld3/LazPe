using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface IBundleService
    {
        // Bundle Operations
        Task<IEnumerable<Bundle>> GetAllBundlesAsync();
        Task<Bundle> GetBundleByIdAsync(int bundleId);
        Task<Bundle> GetBundleWithItemsAsync(int bundleId);
        Task<bool> CreateBundleAsync(Bundle bundle);
        Task<bool> UpdateBundleAsync(Bundle bundle);
        Task<bool> UpdateBundleDetailsAsync(Bundle bundle);
        Task<bool> DeleteBundleAsync(int bundleId);
        Task<bool> BundleExistsAsync(int bundleId);
        Task<bool> IsBundleCodeUniqueAsync(string code, int? excludeBundleId = null);

        // BundleItem Operations
        Task<IEnumerable<BundleItem>> GetBundleItemsAsync(int bundleId);
        Task<BundleItem> GetBundleItemByIdAsync(int bundleItemId);
        Task<bool> AddBundleItemAsync(BundleItem bundleItem);
        Task<bool> UpdateBundleItemAsync(BundleItem bundleItem);
        Task<bool> DeleteBundleItemAsync(int bundleItemId);
        Task<bool> VariantExistsInBundleAsync(int bundleId, int variantId);
        Task<decimal> CalculateBundleTotalPriceAsync(int bundleId);

        // Utility
        Task<IEnumerable<Variant>> GetAvailableVariantsAsync();
        Task<Variant> GetVariantByIdAsync(int variantId);
        Task<byte[]> ExportExcelAsync(string searchTerm, bool? status);
    }
}

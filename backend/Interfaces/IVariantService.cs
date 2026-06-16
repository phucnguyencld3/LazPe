using PolyBabyAPI.DTOs;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface IVariantService
    {
        Task<List<Variant>> GetVariantsByProductIdAsync(int productId);
        Task<Variant?> GetVariantByIdAsync(int variantId);
        Task<List<Variant>> SearchVariantsAsync(int productId, string searchTerm);
        Task<bool> CreateVariantAsync(Variant variant, List<int> optionValueIds);
        Task<bool> UpdateVariantAsync(Variant variant);
        Task<bool> DeleteVariantAsync(int variantId);
        Task<bool> UpdateStockAsync(int variantId, int newStock);
        Task<List<VariantCombinationDto>> GenerateVariantCombinationsAsync(int productId);
        Task<bool> VariantExistsAsync(int productId, List<int> optionValueIds);
        Task<decimal> CalculateVariantPriceAsync(int productId, List<int> optionValueIds, decimal basePrice = 0);
        Task<bool> BulkUpdateVariantsAsync(List<BulkUpdateVariantDto> updates);
    }
}
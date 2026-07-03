using PolyBabyAPI.Models;
using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    public interface ICartService
    {
        Task<Cart> GetCartByUserIdAsync(string userId);
        Task<Cart> GetCartByIdAsync(int cartId);
        
        Task AddToCartAsync(string userId, int? variantId, int? bundleId, int quantity, int? selectedGiftVariantId = null);
        Task RemoveFromCartAsync(int cartDetailId);
        Task UpdateQuantityAsync(int cartDetailId, int quantity);
        Task ClearCartAsync(int cartId);

        // Voucher logic
        Task<(bool Success, string Message)> ApplyVoucherAsync(int cartId, string voucherCode);
        Task<(bool Success, string Message, string AppliedCodes)> AutoApplyBestVouchersAsync(int cartId);
        Task RemoveVoucherAsync(int cartId, int? type = null);
        Task CalculateCartTotalAsync(int cartId);
        Task<decimal> GetEffectivePriceAsync(string userId, int? variantId, int? bundleId, int quantity);
    }
}

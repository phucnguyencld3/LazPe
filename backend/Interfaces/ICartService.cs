using PolyBabyAPI.Models;
using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    public interface ICartService
    {
        Task<Cart> GetCartByUserIdAsync(string userId);
        Task<Cart> GetCartByIdAsync(int cartId);
        
        // Phương thức thao tác giỏ hàng cơ bản (nếu chưa có trong CartController cũ)
        Task AddToCartAsync(string userId, int? variantId, int? bundleId, int quantity);
        Task RemoveFromCartAsync(int cartDetailId);
        Task UpdateQuantityAsync(int cartDetailId, int quantity);
        Task ClearCartAsync(int cartId);

        // Voucher logic
        Task<(bool Success, string Message)> ApplyVoucherAsync(int cartId, string voucherCode);
        Task RemoveVoucherAsync(int cartId);
        Task CalculateCartTotalAsync(int cartId);
    }
}

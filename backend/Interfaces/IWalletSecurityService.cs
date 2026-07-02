using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface IWalletSecurityService
    {
        /// <summary>
        /// Tạo chữ ký điện tử HMAC-SHA256 cho số dư
        /// </summary>
        string GenerateSignature(string userId, decimal walletBalance, decimal coinsBalance);

        /// <summary>
        /// Kiểm tra tính toàn vẹn của số dư ví (so sánh signature lưu trong DB)
        /// </summary>
        bool ValidateSignature(ApplicationUser user);

        /// <summary>
        /// Băm mã PIN
        /// </summary>
        string HashPaymentPin(string pin);

        /// <summary>
        /// Xác minh mã PIN
        /// </summary>
        bool VerifyPaymentPin(ApplicationUser user, string pin);

        /// <summary>
        /// Xác minh mã PIN kèm xử lý khóa 15 phút nếu sai 5 lần
        /// </summary>
        Task<(bool Success, bool IsLocked, string Message, int FailedCount)> ValidatePaymentPinWithLockoutAsync(ApplicationUser user, string pin);
    }
}

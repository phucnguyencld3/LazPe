using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class WalletSecurityService : IWalletSecurityService
    {
        private readonly string _secretKey;
        private readonly IPasswordHasher<ApplicationUser> _passwordHasher;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailSender _emailSender;

        public WalletSecurityService(
            IConfiguration configuration, 
            IPasswordHasher<ApplicationUser> passwordHasher,
            UserManager<ApplicationUser> userManager,
            IEmailSender emailSender)
        {
            _secretKey = configuration["WalletSecurity:SecretKey"] ?? "default_secret_key_if_missing";
            _passwordHasher = passwordHasher;
            _userManager = userManager;
            _emailSender = emailSender;
        }

        public string GenerateSignature(string userId, decimal walletBalance, decimal coinsBalance)
        {
            string payload = $"{userId}|{walletBalance:0.00}|{coinsBalance:0.00}";
            
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            return Convert.ToBase64String(hashBytes);
        }

        public bool ValidateSignature(ApplicationUser user)
        {
            // Nếu người dùng chưa từng được tạo signature, có thể xem như hợp lệ tạm thời (tuỳ quy tắc business)
            // Tốt nhất là nếu null thì mình tính lại và cho phép (đối với dữ liệu cũ).
            if (string.IsNullOrEmpty(user.WalletSignature))
            {
                return true; 
            }

            string expectedSignature = GenerateSignature(user.Id, user.WalletBalance, user.CoinsBalance);
            return user.WalletSignature == expectedSignature;
        }

        public string HashPaymentPin(string pin)
        {
            // Dùng ApplicationUser dummy để thoả mãn IPasswordHasher, hoặc null nếu được phép
            return _passwordHasher.HashPassword(null!, pin);
        }

        public bool VerifyPaymentPin(ApplicationUser user, string pin)
        {
            if (string.IsNullOrEmpty(user.PaymentPinHash))
                return false;

            var result = _passwordHasher.VerifyHashedPassword(null!, user.PaymentPinHash, pin);
            return result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded;
        }

        public async Task<(bool Success, bool IsLocked, string Message, int FailedCount)> ValidatePaymentPinWithLockoutAsync(ApplicationUser user, string pin)
        {
            if (string.IsNullOrEmpty(user.PaymentPinHash))
            {
                return (false, false, "Bạn chưa thiết lập mã PIN", 0);
            }

            if (user.PaymentPinLockoutEnd.HasValue && user.PaymentPinLockoutEnd.Value > DateTimeOffset.UtcNow)
            {
                var remainingMinutes = (int)Math.Ceiling((user.PaymentPinLockoutEnd.Value - DateTimeOffset.UtcNow).TotalMinutes);
                return (false, true, $"Ví của bạn đang bị khóa do nhập sai mã PIN quá nhiều lần. Vui lòng thử lại sau {remainingMinutes} phút hoặc mở khóa bằng OTP.", user.PaymentPinFailedCount);
            }

            var result = _passwordHasher.VerifyHashedPassword(null!, user.PaymentPinHash, pin);
            var isCorrect = result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded;

            if (isCorrect)
            {
                user.PaymentPinFailedCount = 0;
                user.PaymentPinLockoutEnd = null;
                await _userManager.UpdateAsync(user);
                return (true, false, "Mã PIN chính xác", 0);
            }
            else
            {
                user.PaymentPinFailedCount += 1;
                if (user.PaymentPinFailedCount >= 5)
                {
                    user.PaymentPinLockoutEnd = DateTimeOffset.UtcNow.AddMinutes(15);
                    await _userManager.UpdateAsync(user);

                    // Send email notification
                    var emailSubject = "Cảnh báo bảo mật: Ví LazPe bị khóa tạm thời";
                    var emailBody = $"Chào {user.FullName},<br><br>Ví LazPe của bạn đã bị khóa tạm thời (15 phút) do nhập sai mã PIN 5 lần liên tiếp.<br>Nếu đây không phải là bạn, vui lòng liên hệ bộ phận hỗ trợ ngay lập tức.<br>Bạn có thể mở khóa ví bằng cách sử dụng tính năng 'Quên mã PIN' và xác thực qua email này.";
                    await _emailSender.SendEmailAsync(user.Email!, emailSubject, emailBody);

                    return (false, true, "Ví của bạn đã bị khóa 15 phút do nhập sai mã PIN 5 lần. Vui lòng mở khóa bằng mã OTP.", user.PaymentPinFailedCount);
                }
                
                await _userManager.UpdateAsync(user);
                return (false, false, $"Mã PIN không chính xác. Bạn còn {5 - user.PaymentPinFailedCount} lần thử.", user.PaymentPinFailedCount);
            }
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using Microsoft.AspNetCore.Identity.UI.Services;

namespace PolyBabyAPI.Controllers
{
    [Route("api/wallet-security")]
    [ApiController]
    [Authorize]
    public class WalletSecurityController : ControllerBase
    {
        private readonly IWalletSecurityService _walletSecurityService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailSender _emailSender;

        public WalletSecurityController(IWalletSecurityService walletSecurityService, UserManager<ApplicationUser> userManager, IEmailSender emailSender)
        {
            _walletSecurityService = walletSecurityService;
            _userManager = userManager;
            _emailSender = emailSender;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            bool isPinSet = !string.IsNullOrEmpty(user.PaymentPinHash);
            
            // Nếu chữ ký sai, hệ thống báo lỗi
            bool isValidSignature = _walletSecurityService.ValidateSignature(user);

            bool isLocked = user.PaymentPinLockoutEnd.HasValue && user.PaymentPinLockoutEnd.Value > DateTimeOffset.UtcNow;
            DateTimeOffset? lockoutEnd = isLocked ? user.PaymentPinLockoutEnd : null;

            return Ok(new
            {
                success = true,
                isPinSet,
                isValidSignature,
                isLocked,
                lockoutEnd,
                walletBalance = user.WalletBalance
            });
        }

        [HttpPost("setup-pin/request-otp")]
        public async Task<IActionResult> SetupPinRequestOtp()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            if (!string.IsNullOrEmpty(user.PaymentPinHash))
            {
                return BadRequest(new { success = false, message = "Mã PIN đã được thiết lập" });
            }

            // Tạo OTP cho chức năng thiết lập mã PIN
            var token = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");

            // Gửi email
            var emailSubject = "Mã OTP thiết lập mã PIN ví LazPe";
            var emailBody = $@"
                <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                    <h2 style='color: #db2777; text-align: center;'>Thiết lập mã PIN ví LazPe</h2>
                    <p>Xin chào <strong>{(string.IsNullOrEmpty(user.FullName) ? user.Email : System.Net.WebUtility.HtmlEncode(user.FullName))}</strong>,</p>
                    <p>Bạn đang yêu cầu thiết lập mã PIN cho Ví LazPe của mình. Dưới đây là mã xác thực OTP của bạn:</p>
                    <div style='background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;'>
                        <span style='font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b;'>{token}</span>
                    </div>
                    <p style='font-size: 12px; color: #64748b;'>Mã này có hiệu lực trong vòng 5 phút. KHÔNG chia sẻ mã này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                </div>";
            
            await _emailSender.SendEmailAsync(user.Email!, emailSubject, emailBody);

            return Ok(new { success = true, message = "Mã OTP đã được gửi đến email của bạn" });
        }

        [HttpPost("setup-pin/confirm")]
        public async Task<IActionResult> SetupPinConfirm([FromBody] SetupPinConfirmRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            if (!string.IsNullOrEmpty(user.PaymentPinHash))
            {
                return BadRequest(new { success = false, message = "Mã PIN đã được thiết lập" });
            }

            if (request.Pin.Length != 6 || !request.Pin.All(char.IsDigit))
            {
                return BadRequest(new { success = false, message = "Mã PIN phải là 6 chữ số" });
            }

            // Xác thực OTP
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", request.Otp);
            if (!isValid)
            {
                return BadRequest(new { success = false, message = "Mã OTP không hợp lệ hoặc đã hết hạn" });
            }

            user.PaymentPinHash = _walletSecurityService.HashPaymentPin(request.Pin);
            
            // Khởi tạo chữ ký lần đầu nếu chưa có
            if (string.IsNullOrEmpty(user.WalletSignature))
            {
                user.WalletSignature = _walletSecurityService.GenerateSignature(user.Id, user.WalletBalance, user.CoinsBalance);
            }

            await _userManager.UpdateAsync(user);

            return Ok(new { success = true, message = "Thiết lập mã PIN thành công" });
        }

        [HttpPost("change-pin")]
        public async Task<IActionResult> ChangePin([FromBody] ChangePinRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            if (string.IsNullOrEmpty(user.PaymentPinHash))
            {
                return BadRequest(new { success = false, message = "Bạn chưa thiết lập mã PIN" });
            }

            var validationResult = await _walletSecurityService.ValidatePaymentPinWithLockoutAsync(user, request.OldPin);
            if (!validationResult.Success)
            {
                return BadRequest(new { 
                    success = false, 
                    message = validationResult.Message, 
                    isLocked = validationResult.IsLocked,
                    failedCount = validationResult.FailedCount 
                });
            }

            if (request.NewPin.Length != 6 || !request.NewPin.All(char.IsDigit))
            {
                return BadRequest(new { success = false, message = "Mã PIN mới phải là 6 chữ số" });
            }

            user.PaymentPinHash = _walletSecurityService.HashPaymentPin(request.NewPin);
            await _userManager.UpdateAsync(user);

            return Ok(new { success = true, message = "Đổi mã PIN thành công" });
        }

        [HttpPost("forgot-pin/request-otp")]
        public async Task<IActionResult> ForgotPinRequestOtp()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            // Tạo OTP cho chức năng quên mã PIN (sử dụng Token Provider của Identity)
            var token = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");

            // Gửi email
            var emailSubject = "Mã OTP đặt lại mã PIN ví LazPe";
            var emailBody = $@"
                <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                    <h2 style='color: #db2777; text-align: center;'>Đặt lại mã PIN ví LazPe</h2>
                    <p>Xin chào <strong>{(string.IsNullOrEmpty(user.FullName) ? user.Email : System.Net.WebUtility.HtmlEncode(user.FullName))}</strong>,</p>
                    <p>Bạn vừa yêu cầu đặt lại mã PIN cho Ví LazPe. Dưới đây là mã xác thực OTP của bạn:</p>
                    <div style='background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;'>
                        <span style='font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b;'>{token}</span>
                    </div>
                    <p style='font-size: 12px; color: #64748b;'>Mã này có hiệu lực trong vòng 5 phút. KHÔNG chia sẻ mã này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, vui lòng đổi mật khẩu ngay lập tức.</p>
                </div>";
            
            await _emailSender.SendEmailAsync(user.Email!, emailSubject, emailBody);

            return Ok(new { success = true, message = "Mã OTP đã được gửi đến email của bạn" });
        }

        [HttpPost("forgot-pin/reset")]
        public async Task<IActionResult> ResetPinWithOtp([FromBody] ResetPinRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            // Xác thực OTP
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", request.Otp);
            if (!isValid)
            {
                return BadRequest(new { success = false, message = "Mã OTP không hợp lệ hoặc đã hết hạn" });
            }

            if (request.NewPin.Length != 6 || !request.NewPin.All(char.IsDigit))
            {
                return BadRequest(new { success = false, message = "Mã PIN mới phải là 6 chữ số" });
            }

            user.PaymentPinHash = _walletSecurityService.HashPaymentPin(request.NewPin);
            user.PaymentPinFailedCount = 0;
            user.PaymentPinLockoutEnd = null;
            await _userManager.UpdateAsync(user);

            return Ok(new { success = true, message = "Đặt lại mã PIN thành công" });
        }
    }

    public class SetupPinConfirmRequest
    {
        public string Pin { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
    }

    public class ChangePinRequest
    {
        public string OldPin { get; set; } = string.Empty;
        public string NewPin { get; set; } = string.Empty;
    }

    public class ResetPinRequest
    {
        public string Otp { get; set; } = string.Empty;
        public string NewPin { get; set; } = string.Empty;
    }
}

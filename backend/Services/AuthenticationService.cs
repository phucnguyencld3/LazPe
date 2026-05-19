using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.WebUtilities;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System.Text;
using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Services
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<AuthenticationService> _logger;

        public AuthenticationService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IEmailSender emailSender,
            ILogger<AuthenticationService> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailSender = emailSender;
            _logger = logger;
        }

        public async Task<bool> RegisterAsync(RegisterDto model)
        {
            try
            {
                var user = new ApplicationUser
                {
                    UserName = model.Email,
                    Email = model.Email,
                    FullName = model.FullName,
                    PhoneNumber = model.PhoneNumber,
                    DateOfBirth = model.DateOfBirth,
                    RegisterDate = DateTime.Now,
                    Status = true
                };

                var result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Người dùng đã tạo tài khoản mới với mật khẩu.");

                    // Gửi email xác nhận nếu cần
                    var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                    code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));

                    // Tự động đăng nhập sau khi đăng ký thành công
                    await _signInManager.SignInAsync(user, isPersistent: false);

                    return true;
                }

                foreach (var error in result.Errors)
                {
                    _logger.LogError($"Lỗi đăng ký: {error.Description}");
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình đăng ký");
                return false;
            }
        }

        public async Task<bool> LoginAsync(LoginDto model)
        {
            try
            {
                var result = await _signInManager.PasswordSignInAsync(
                    model.Email,
                    model.Password,
                    model.RememberMe,
                    lockoutOnFailure: false);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Người dùng đã đăng nhập thành công.");
                    return true;
                }

                if (result.RequiresTwoFactor)
                {
                    _logger.LogWarning("Yêu cầu xác thực 2 bước.");
                }

                if (result.IsLockedOut)
                {
                    _logger.LogWarning("Tài khoản bị khóa.");
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình đăng nhập");
                return false;
            }
        }

        public async Task LogoutAsync()
        {
            await _signInManager.SignOutAsync();
            _logger.LogInformation("Người dùng đã đăng xuất.");
        }

        public async Task<ApplicationUser> GetCurrentUserAsync()
        {
            return await _userManager.GetUserAsync(_signInManager.Context.User);
        }

        public async Task<bool> SendPasswordResetEmailAsync(string email)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    return true; // Không tiết lộ thông tin người dùng có tồn tại hay không
                }

                var code = await _userManager.GeneratePasswordResetTokenAsync(user);
                code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));

                // Gửi email reset password
                await _emailSender.SendEmailAsync(
                    email,
                    "Đặt lại mật khẩu - PolyBabyAPI",
                    $"Vui lòng đặt lại mật khẩu bằng cách <a href='#'>nhấp vào đây</a>.");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi email đặt lại mật khẩu");
                return false;
            }
        }

        public async Task<bool> ResetPasswordAsync(string email, string token, string newPassword)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    return false;
                }

                var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
                var result = await _userManager.ResetPasswordAsync(user, decodedToken, newPassword);

                return result.Succeeded;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đặt lại mật khẩu");
                return false;
            }
        }

        public async Task<bool> ConfirmEmailAsync(string userId, string token)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
                var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

                return result.Succeeded;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xác nhận email");
                return false;
            }
        }
        public async Task<(bool exists, string userId)> CheckEmailExistsAsync(string email)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user != null)
                {
                    return (true, user.Id);
                }
                return (false, string.Empty);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kiểm tra email tồn tại");
                return (false, string.Empty);
            }
        }

        public async Task<bool> ResetPasswordDirectAsync(string userId, string newPassword)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                // Generate a password reset token and reset immediately
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Mật khẩu đã được đặt lại trực tiếp cho user: {UserId}", userId);
                    return true;
                }

                foreach (var error in result.Errors)
                {
                    _logger.LogWarning("Lỗi đặt lại mật khẩu: {Error}", error.Description);
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đặt lại mật khẩu trực tiếp");
                return false;
            }
        }


    }
}

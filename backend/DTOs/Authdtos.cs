using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // AUTHENTICATION DTOs
    // =============================================

    /// <summary>
    /// DTO đăng nhập cho user thông thường
    /// </summary>
    public class LoginDto
    {
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string Password { get; set; } = string.Empty;

        public bool RememberMe { get; set; } = false;
    }

    /// <summary>
    /// DTO đăng nhập dành riêng cho Admin (dùng Username thay Email)
    /// </summary>
    public class AdminLoginDto
    {
        [Required(ErrorMessage = "Username là bắt buộc")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO đăng ký tài khoản mới
    /// </summary>
    public class RegisterDto
    {
        [Required(ErrorMessage = "Họ và tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Email không đúng định dạng (ví dụ: example@gmail.com)")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc")]
        [Compare("Password", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmPassword { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(13, ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? PhoneNumber { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [StringLength(20, ErrorMessage = "Mã giới thiệu không hợp lệ")]
        public string? ReferralCode { get; set; }
    }

    /// <summary>
    /// DTO yêu cầu quên mật khẩu
    /// </summary>
    public class ForgotPasswordDto
    {
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordByOtpDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mã OTP là bắt buộc")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải gồm 6 chữ số")]
        public string Otp { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class VerifyResetOtpDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mã OTP là bắt buộc")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải gồm 6 chữ số")]
        public string Otp { get; set; } = string.Empty;
    }

    public class ResetPasswordBySessionDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phiên đặt lại mật khẩu không hợp lệ")]
        public string ResetSessionToken { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO đặt lại mật khẩu qua token email
    /// </summary>
    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;  

        [Required(ErrorMessage = "Token là bắt buộc")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO đặt lại mật khẩu trực tiếp (Admin reset cho user)
    /// </summary>
    public class ResetPasswordDirectDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO xác thực email
    /// </summary>
    public class VerifyEmailDto
    {
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;  
    }

    /// <summary>
    /// DTO xác thực OTP đăng ký tài khoản
    /// </summary>
    public class VerifyRegisterOtpDto
    {
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Email không đúng định dạng (ví dụ: example@gmail.com)")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mã OTP là bắt buộc")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải gồm 6 chữ số")]
        public string Otp { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO xác minh kích hoạt Authenticator App (TOTP)
    /// </summary>
    public class EnableAuthenticatorDto
    {
        [Required(ErrorMessage = "Mã xác thực là bắt buộc")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã xác thực phải gồm 6 chữ số")]
        public string Code { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO xác minh kích hoạt Email 2FA
    /// </summary>
    public class EnableEmail2FaDto
    {
        [Required(ErrorMessage = "Mã xác thực là bắt buộc")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã xác thực phải gồm 6 chữ số")]
        public string Code { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO gửi mã OTP đăng nhập 2FA qua Email
    /// </summary>
    public class Send2FaEmailDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO xác thực đăng nhập 2FA
    /// </summary>
    public class Verify2FaLoginDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mã xác thực là bắt buộc")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã xác thực phải gồm 6 chữ số")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phương thức xác thực là bắt buộc")]
        public string Provider { get; set; } = string.Empty; // "Email" hoặc "Authenticator"
    }

    public class RefreshTokenRequestDto
    {
        [Required(ErrorMessage = "Token là bắt buộc")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "RefreshToken là bắt buộc")]
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class GoogleLoginDto
    {
        [Required(ErrorMessage = "IdToken is required")]
        public string IdToken { get; set; } = string.Empty;
    }
}
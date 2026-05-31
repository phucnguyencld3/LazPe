using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Models;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<AuthenticationController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IPermissionService _permissionService; 
        private readonly IEmailSender _emailSender;
        private readonly IMemoryCache _memoryCache;
        private const int ResetOtpExpiredSeconds = 60;
        private const int ResetPasswordSessionExpiredMinutes = 10;
        private const int ResetOtpMaxAttempts = 5;

        public AuthenticationController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<AuthenticationController> logger,
            IConfiguration configuration,
            IPermissionService permissionService,
            IEmailSender emailSender,
            IMemoryCache memoryCache) 
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
            _configuration = configuration;
            _permissionService = permissionService; 
            _emailSender = emailSender;
            _memoryCache = memoryCache;
        }

        private sealed class PasswordResetOtpInfo
        {
            public string Code { get; set; } = string.Empty;
            public DateTime ExpiredAtUtc { get; set; }
            public int FailedAttempts { get; set; }
        }

        private sealed class PasswordResetSessionInfo
        {
            public string UserId { get; set; } = string.Empty;
            public string ResetToken { get; set; } = string.Empty;
            public DateTime ExpiredAtUtc { get; set; }
        }

        /// <summary>
        /// Đăng nhập tài khoản
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    // Thử tìm theo username cho trường hợp admin
                    user = await _userManager.FindByNameAsync(model.Email);
                    if (user == null)
                    {
                        return Unauthorized(new { success = false, message = "Email/Username hoặc mật khẩu không đúng" });
                    }
                }

                // Kiểm tra lockout
                var isLockedOut = await _userManager.IsLockedOutAsync(user);
                if (isLockedOut)
                {
                    var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
                    var timeRemaining = lockoutEnd?.DateTime.Subtract(DateTime.UtcNow);
                    
                    if (timeRemaining?.TotalMinutes > 0)
                    {
                        var message = $"Tài khoản đã bị khóa đến {lockoutEnd?.ToString("dd/MM/yyyy HH:mm")}. ";
                        if (timeRemaining?.TotalHours < 1)
                        {
                            message += $"Còn lại {timeRemaining?.Minutes} phút.";
                        }
                        else if (timeRemaining?.TotalDays < 1)
                        {
                            message += $"Còn lại {timeRemaining?.Hours} giờ {timeRemaining?.Minutes} phút.";
                        }
                        else
                        {
                            message += $"Còn lại {timeRemaining?.Days} ngày.";
                        }
                        
                        return Unauthorized(new { success = false, message = message });
                    }
                }

                //Kiểm tra tài khoản có bị disable không
                if (!user.Status)
                {
                    return Unauthorized(new { success = false, message = "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên." });
                }

                var passwordValid = await _userManager.CheckPasswordAsync(user, model.Password);
                if (!passwordValid)
                {
                    //Tăng failed attempt count khi sai password
                    await _userManager.AccessFailedAsync(user);
                    return Unauthorized(new { success = false, message = "Email/Username hoặc mật khẩu không đúng" });
                }

                //Reset failed attempt count khi đăng nhập thành công
                await _userManager.ResetAccessFailedCountAsync(user);

                // Lấy roles và permissions của user
                var userRoles = await _userManager.GetRolesAsync(user);
        
                //Load permissions của user
                var userPermissions = await _permissionService.GetUserPermissionsAsync(user.Id);

                // Tạo JWT token với permissions
                var token = await GenerateJwtTokenAsync(user, userRoles, userPermissions);
                var isAdmin = userRoles.Contains("Admin");

                _logger.LogInformation("Đăng nhập thành công cho: {Email} với roles: {Roles} và {PermissionCount} permissions",
                    user.Email ?? user.UserName, string.Join(", ", userRoles), userPermissions.Count);

                return Ok(new
                {
                    success = true,
                    message = "Đăng nhập thành công",
                    token = token ?? string.Empty,
                    user = new
                    {
                        id = user.Id ?? string.Empty,
                        email = user.Email ?? string.Empty,
                        userName = user.UserName ?? string.Empty,
                        fullName = user.FullName ?? string.Empty,
                        phoneNumber = user.PhoneNumber ?? string.Empty,
                        avatar = user.Avatar ?? "/assets/img/avatars/1.png",
                        roles = userRoles ?? new List<string>(),
                        permissions = userPermissions.Select(p => p.Name).ToList(), // ✅ THÊM permissions
                        isAdmin = isAdmin
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đăng nhập");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi đăng nhập" });
            }
        }

        /// <summary>
        /// Đăng nhập admin bằng username
        /// </summary>
        [HttpPost("admin-login")]
        public async Task<IActionResult> AdminLogin([FromBody] AdminLoginDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var user = await _userManager.FindByNameAsync(model.Username);
                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "Username hoặc mật khẩu không đúng" });
                }

                var passwordValid = await _userManager.CheckPasswordAsync(user, model.Password);
                if (!passwordValid)
                {
                    return Unauthorized(new { success = false, message = "Username hoặc mật khẩu không đúng" });
                }

                // Kiểm tra xem user có phải admin không
                var userRoles = await _userManager.GetRolesAsync(user);
                if (!userRoles.Contains("Admin"))
                {
                    return Unauthorized(new { success = false, message = "Không có quyền admin" });
                }

                // ✅ THÊM: Load permissions cho admin
                var userPermissions = await _permissionService.GetUserPermissionsAsync(user.Id);

                // Tạo JWT token với permissions
                var token = await GenerateJwtTokenAsync(user, userRoles, userPermissions);

                _logger.LogInformation("Admin đăng nhập thành công: {Username}", model.Username);

                return Ok(new
                {
                    success = true,
                    message = "Đăng nhập admin thành công",
                    token = token ?? string.Empty,
                    user = new
                    {
                        id = user.Id ?? string.Empty,
                        email = user.Email ?? string.Empty,
                        userName = user.UserName ?? string.Empty,
                        fullName = user.FullName ?? string.Empty,
                        phoneNumber = user.PhoneNumber ?? string.Empty,
                        avatar = user.Avatar ?? "/assets/img/avatars/1.png",
                        roles = userRoles ?? new List<string>(),
                        permissions = userPermissions.Select(p => p.Name).ToList(), // ✅ THÊM permissions
                        isAdmin = true
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình đăng nhập admin");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra trong quá trình đăng nhập admin" });
            }
        }


        /// <summary>
        /// Đăng ký tài khoản mới
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                if (model.DateOfBirth.HasValue)
                {
                    var today = DateTime.Today;
                    var age = today.Year - model.DateOfBirth.Value.Year;
                    if (model.DateOfBirth.Value.Date > today.AddYears(-age)) age--;

                    if (age < 16)
                    {
                        return BadRequest(new { success = false, message = "Bạn phải từ 16 tuổi trở lên để đăng ký tài khoản." });
                    }
                }

                var existingUser = await _userManager.FindByEmailAsync(model.Email);
                if (existingUser != null)
                {
                    return BadRequest(new { success = false, message = "Email này đã được sử dụng." });
                }

                var user = new ApplicationUser
                {
                    UserName = model.Email,
                    Email = model.Email,
                    FullName = model.FullName,
                    PhoneNumber = model.PhoneNumber,
                    DateOfBirth = model.DateOfBirth,
                    RegisterDate = DateTime.Now,
                    Status = true,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    // Gán role mặc định cho user mới
                    await AssignDefaultRoleAsync(user);

                    // ✅ THÊM: Load permissions cho user mới (có thể rỗng)
                    var userRoles = await _userManager.GetRolesAsync(user);
                    var userPermissions = await _permissionService.GetUserPermissionsAsync(user.Id);

                    // Tạo JWT token để user có thể đăng nhập ngay
                    var token = await GenerateJwtTokenAsync(user, userRoles, userPermissions);

                    _logger.LogInformation("Đăng ký thành công cho: {Email}, Email đã được xác nhận tự động", model.Email);

                    return Ok(new
                    {
                        success = true,
                        message = "Đăng ký thành công! Bạn đã được đăng nhập tự động.",
                        userId = user.Id,
                        emailConfirmationRequired = false,
                        token = token ?? string.Empty,
                        user = new
                        {
                            id = user.Id ?? string.Empty,
                            email = user.Email ?? string.Empty,
                            userName = user.UserName ?? string.Empty,
                            fullName = user.FullName ?? string.Empty,
                            phoneNumber = user.PhoneNumber ?? string.Empty,
                            avatar = user.Avatar ?? "/assets/img/avatars/1.png",
                            roles = userRoles ?? new List<string>(),
                            permissions = userPermissions.Select(p => p.Name).ToList(), // ✅ THÊM permissions
                            isAdmin = userRoles?.Contains("Admin") ?? false
                        }
                    });
                }

                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new { success = false, message = "Có lỗi xảy ra trong quá trình đăng ký.", errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình đăng ký");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra trong quá trình đăng ký." });
            }
        }


        /// <summary>
        /// Đăng xuất (chủ yếu để invalidate token ở client-side)
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                _logger.LogInformation("Người dùng đã đăng xuất");
                return Ok(new { success = true, message = "Đăng xuất thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình đăng xuất");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra trong quá trình đăng xuất" });
            }
        }

        /// <summary>
        /// Lấy thông tin user hiện tại
        /// </summary>
        [HttpGet("current-user")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Token không hợp lệ" });
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Người dùng không tồn tại" });
                }

                var roles = await _userManager.GetRolesAsync(user);
                var userPermissions = await _permissionService.GetUserPermissionsAsync(user.Id);

                return Ok(new
                {
                    success = true,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        userName = user.UserName,
                        fullName = user.FullName,
                        phoneNumber = user.PhoneNumber,
                        avatar = user.Avatar,
                        registerDate = user.RegisterDate,
                        roles = roles,
                        permissions = userPermissions.Select(p => p.Name).ToList(),
                        isAdmin = roles.Contains("Admin")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin user hiện tại");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Kiểm tra email có tồn tại không
        /// </summary>
        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user != null)
                {
                    return Ok(new
                    {
                        success = true,
                        userExists = true,
                        userId = user.Id,
                        message = "Email tồn tại trong hệ thống"
                    });
                }

                return Ok(new
                {
                    success = false,
                    userExists = false,
                    message = "Email không tồn tại trong hệ thống"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kiểm tra email");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi kiểm tra email" });
            }
        }

        /// <summary>
        /// Đặt lại mật khẩu trực tiếp
        /// </summary>
        [HttpPost("reset-password-direct")]
        public async Task<IActionResult> ResetPasswordDirect([FromBody] ResetPasswordDirectDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var user = await _userManager.FindByIdAsync(model.UserId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "Người dùng không tồn tại." });
                }

                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var result = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Mật khẩu đã được đặt lại trực tiếp cho user: {UserId}", model.UserId);
                    return Ok(new { success = true, message = "Mật khẩu đã được đặt lại thành công!" });
                }

                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new { success = false, message = "Có lỗi xảy ra khi đặt lại mật khẩu.", errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đặt lại mật khẩu trực tiếp");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi đặt lại mật khẩu." });
            }
        }

        /// <summary>
        /// Gửi email quên mật khẩu
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    return Ok(new { success = true, message = "Nếu email này tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu." });
                }

                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                // TODO: Gửi email với token reset password

                _logger.LogInformation("Token đặt lại mật khẩu đã được tạo cho: {Email}", model.Email);
                return Ok(new { success = true, message = "Nếu email này tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo token reset password");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra. Vui lòng thử lại." });
            }
        }

        [HttpPost("send-reset-otp")]
        public async Task<IActionResult> SendResetOtp([FromBody] ForgotPasswordDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "Email không tồn tại trong hệ thống" });
                }

                var otpCode = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
                var expiredAtUtc = DateTime.UtcNow.AddSeconds(ResetOtpExpiredSeconds);

                _memoryCache.Set(
                    $"pwd-reset-otp:{user.Id}",
                    new PasswordResetOtpInfo
                    {
                        Code = otpCode,
                        ExpiredAtUtc = expiredAtUtc,
                        FailedAttempts = 0
                    },
                    TimeSpan.FromSeconds(ResetOtpExpiredSeconds));

                var subject = "Mã OTP đặt lại mật khẩu - PolyBaby";
                var htmlBody = $@"
                    <div style='font-family: Arial, sans-serif; color: #333;'>
                        <h3 style='margin-bottom: 12px;'>Xác thực đặt lại mật khẩu</h3>
                        <p>Xin chào {WebUtility.HtmlEncode(user.FullName ?? user.Email)},</p>
                        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản PolyBaby.</p>
                        <p>Mã OTP của bạn là:</p>
                        <div style='font-size: 28px; font-weight: 700; color: #696cff; letter-spacing: 4px; margin: 8px 0 16px 0;'>{otpCode}</div>
                        <p>Mã có hiệu lực trong <strong>{ResetOtpExpiredSeconds} giây</strong>.</p>
                        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                    </div>";

                await _emailSender.SendEmailAsync(user.Email!, subject, htmlBody);

                return Ok(new
                {
                    success = true,
                    message = "Mã OTP đã được gửi đến email của bạn.",
                    userId = user.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi OTP đặt lại mật khẩu");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi gửi mã OTP." });
            }
        }

        [HttpPost("verify-reset-otp")]
        public async Task<IActionResult> VerifyResetOtp([FromBody] VerifyResetOtpDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var user = await _userManager.FindByIdAsync(model.UserId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "Người dùng không tồn tại." });
                }

                var cacheKey = $"pwd-reset-otp:{user.Id}";
                if (!_memoryCache.TryGetValue(cacheKey, out PasswordResetOtpInfo? otpInfo) || otpInfo == null)
                {
                    return BadRequest(new { success = false, message = "Mã OTP không hợp lệ hoặc đã hết hạn." });
                }

                if (DateTime.UtcNow > otpInfo.ExpiredAtUtc)
                {
                    _memoryCache.Remove(cacheKey);
                    return BadRequest(new { success = false, message = "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới." });
                }

                if (!string.Equals(otpInfo.Code, model.Otp, StringComparison.Ordinal))
                {
                    otpInfo.FailedAttempts++;
                    if (otpInfo.FailedAttempts >= ResetOtpMaxAttempts)
                    {
                        _memoryCache.Remove(cacheKey);
                        return BadRequest(new { success = false, message = "Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới." });
                    }

                    var remainingTtl = otpInfo.ExpiredAtUtc - DateTime.UtcNow;
                    if (remainingTtl <= TimeSpan.Zero)
                    {
                        _memoryCache.Remove(cacheKey);
                        return BadRequest(new { success = false, message = "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới." });
                    }

                    _memoryCache.Set(cacheKey, otpInfo, remainingTtl);
                    return BadRequest(new { success = false, message = "Mã OTP không chính xác." });
                }

                _memoryCache.Remove(cacheKey);

                var identityResetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                var resetSessionToken = Guid.NewGuid().ToString("N");
                var resetSessionKey = $"pwd-reset-session:{resetSessionToken}";

                _memoryCache.Set(
                    resetSessionKey,
                    new PasswordResetSessionInfo
                    {
                        UserId = user.Id,
                        ResetToken = identityResetToken,
                        ExpiredAtUtc = DateTime.UtcNow.AddMinutes(ResetPasswordSessionExpiredMinutes)
                    },
                    TimeSpan.FromMinutes(ResetPasswordSessionExpiredMinutes));

                _logger.LogInformation("Xác thực OTP thành công cho user {UserId}", user.Id);
                return Ok(new
                {
                    success = true,
                    message = "Xác thực OTP thành công.",
                    resetSessionToken,
                    userId = user.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xác thực OTP đặt lại mật khẩu");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xác thực OTP." });
            }
        }

        [HttpPost("reset-password-by-session")]
        public async Task<IActionResult> ResetPasswordBySession([FromBody] ResetPasswordBySessionDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var user = await _userManager.FindByIdAsync(model.UserId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "Người dùng không tồn tại." });
                }

                var sessionCacheKey = $"pwd-reset-session:{model.ResetSessionToken}";
                if (!_memoryCache.TryGetValue(sessionCacheKey, out PasswordResetSessionInfo? sessionInfo) || sessionInfo == null)
                {
                    return BadRequest(new { success = false, message = "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng xác thực OTP lại." });
                }

                if (!string.Equals(sessionInfo.UserId, model.UserId, StringComparison.Ordinal) || DateTime.UtcNow > sessionInfo.ExpiredAtUtc)
                {
                    _memoryCache.Remove(sessionCacheKey);
                    return BadRequest(new { success = false, message = "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
                }

                var result = await _userManager.ResetPasswordAsync(user, sessionInfo.ResetToken, model.NewPassword);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description).ToList();
                    return BadRequest(new { success = false, message = "Có lỗi xảy ra khi đặt lại mật khẩu.", errors });
                }

                _memoryCache.Remove(sessionCacheKey);
                _logger.LogInformation("Đặt lại mật khẩu bằng session token thành công cho user {UserId}", user.Id);
                return Ok(new { success = true, message = "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi đặt lại mật khẩu bằng session token");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi đặt lại mật khẩu." });
            }
        }

        /// <summary>
        /// Đặt lại mật khẩu
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var user = await _userManager.FindByIdAsync(model.UserId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "Người dùng không tồn tại." });
                }

                var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Mật khẩu đã được đặt lại thành công cho user: {UserId}", model.UserId);
                    return Ok(new { success = true, message = "Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới." });
                }

                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new { success = false, message = "Có lỗi xảy ra khi đặt lại mật khẩu. Token có thể đã hết hạn.", errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đặt lại mật khẩu");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi đặt lại mật khẩu." });
            }
        }

        /// <summary>
        /// Xác nhận email
        /// </summary>
        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string userId, [FromQuery] string token)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
            {
                return BadRequest(new { success = false, message = "Liên kết không hợp lệ" });
            }

            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "Người dùng không tồn tại." });
                }

                var result = await _userManager.ConfirmEmailAsync(user, token);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Email đã được xác nhận cho user: {UserId}", userId);
                    return Ok(new { success = true, message = "Email đã được xác nhận thành công!" });
                }

                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new { success = false, message = "Có lỗi xảy ra khi xác nhận email.", errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xác nhận email");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xác nhận email." });
            }
        }

        #region Helper Methods

        private async Task<string> GenerateJwtTokenAsync(ApplicationUser user, IList<string> roles, List<Permission> permissions)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            
            // ✅ Đọc từ JwtSettings section
            var secretKey = _configuration["JwtSettings:SecretKey"];
            
            // ✅ Validate SecretKey
            if (string.IsNullOrEmpty(secretKey) || secretKey.Length < 32)
            {
                throw new InvalidOperationException("JWT SecretKey must be at least 32 characters long.");
            }
            
            var key = Encoding.UTF8.GetBytes(secretKey);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id ?? string.Empty),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim("FullName", user.FullName ?? string.Empty),
                new Claim("Avatar", user.Avatar ?? "/assets/img/avatars/1.png"),
                new Claim("UserId", user.Id ?? string.Empty)
            };

            // Add role claims
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // Add permission claims
            foreach (var permission in permissions)
            {
                claims.Add(new Claim("Permission", permission.Name));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(24),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["JwtSettings:Issuer"],
                Audience = _configuration["JwtSettings:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }


        private async Task AssignDefaultRoleAsync(ApplicationUser user)
        {
            const string defaultRole = "User";

            if (!await _roleManager.RoleExistsAsync(defaultRole))
            {
                await _roleManager.CreateAsync(new IdentityRole(defaultRole));
            }

            await _userManager.AddToRoleAsync(user, defaultRole);
        }

        #endregion
    }
}

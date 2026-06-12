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
        private const int RegisterOtpExpiredSeconds = 180;
        private const int RegisterOtpMaxAttempts = 5;

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

        private sealed class RegisterOtpInfo
        {
            public RegisterDto Dto { get; set; } = null!;
            public string Code { get; set; } = string.Empty;
            public DateTime ExpiredAtUtc { get; set; }
            public int FailedAttempts { get; set; }
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

                // Kiểm tra 2FA
                var is2faEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
                if (is2faEnabled)
                {
                    var validProviders = await _userManager.GetValidTwoFactorProvidersAsync(user);
                    _logger.LogInformation("Yêu cầu xác thực 2 bước cho user: {Email}", user.Email ?? user.UserName);
                    return Ok(new
                    {
                        success = true,
                        requiresTwoFactor = true,
                        userId = user.Id,
                        providers = validProviders
                    });
                }

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
                        permissions = userPermissions.Select(p => p.Name).ToList(), // THÊM permissions
                        isAdmin = isAdmin,
                        isOnboarded = user.IsOnboarded
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

                // Kiểm tra 2FA cho Admin
                var is2faEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
                if (is2faEnabled)
                {
                    var validProviders = await _userManager.GetValidTwoFactorProvidersAsync(user);
                    _logger.LogInformation("Yêu cầu xác thực 2 bước cho Admin: {Username}", user.UserName);
                    return Ok(new
                    {
                        success = true,
                        requiresTwoFactor = true,
                        userId = user.Id,
                        providers = validProviders
                    });
                }

                // THÊM: Load permissions cho admin
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
                        permissions = userPermissions.Select(p => p.Name).ToList(), // THÊM permissions
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
        /// Đăng ký tài khoản mới (Legacy - Đã chuyển sang dùng OTP)
        /// </summary>
        [HttpPost("register")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public IActionResult Register()
        {
            return BadRequest(new { success = false, message = "Đăng ký trực tiếp đã bị vô hiệu hóa. Vui lòng sử dụng luồng đăng ký qua OTP." });
        }

        /// <summary>
        /// Gửi OTP xác thực đăng ký tài khoản mới
        /// </summary>
        [HttpPost("register-send-otp")]
        public async Task<IActionResult> RegisterSendOtp([FromBody] RegisterDto model)
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

                var cacheKey = $"register-otp:{model.Email.Trim().ToLower()}";
                
                // Cooldown check (60 seconds)
                if (_memoryCache.TryGetValue(cacheKey, out RegisterOtpInfo? existingOtp) && existingOtp != null)
                {
                    var remainingSeconds = (existingOtp.ExpiredAtUtc - DateTime.UtcNow).TotalSeconds;
                    // Expire time is 180s, if remainingSeconds > 120s, it means it's been less than 60s since generation.
                    if (remainingSeconds > (RegisterOtpExpiredSeconds - 60))
                    {
                        var cooldownRemaining = (int)Math.Ceiling(remainingSeconds - (RegisterOtpExpiredSeconds - 60));
                        return BadRequest(new { success = false, message = $"Vui lòng đợi {cooldownRemaining} giây trước khi yêu cầu gửi lại mã." });
                    }
                }

                var otpCode = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
                var expiredAtUtc = DateTime.UtcNow.AddSeconds(RegisterOtpExpiredSeconds);

                var otpInfo = new RegisterOtpInfo
                {
                    Dto = model,
                    Code = otpCode,
                    ExpiredAtUtc = expiredAtUtc,
                    FailedAttempts = 0
                };

                _memoryCache.Set(cacheKey, otpInfo, TimeSpan.FromSeconds(RegisterOtpExpiredSeconds));

                var subject = "Mã OTP xác thực đăng ký tài khoản - LazPe";
                var htmlBody = $@"
                    <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                        <h2 style='color: #696cff; text-align: center;'>Xác Thực Đăng Ký LazPe</h2>
                        <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
                        <p>Xin chào <strong>{WebUtility.HtmlEncode(model.FullName)}</strong>,</p>
                        <p>Cảm ơn bạn đã lựa chọn đăng ký tài khoản tại cửa hàng LazPe của chúng tôi.</p>
                        <p>Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã xác thực OTP dưới đây:</p>
                        <div style='text-align: center; margin: 30px 0;'>
                            <span style='font-size: 32px; font-weight: bold; color: #696cff; letter-spacing: 5px; padding: 10px 20px; background-color: #f0f1ff; border-radius: 6px; border: 1px dashed #696cff;'>{otpCode}</span>
                        </div>
                        <p>Mã OTP này có hiệu lực trong <strong>{RegisterOtpExpiredSeconds / 60} phút</strong>.</p>
                        <p style='color: #ff3e1d;'><strong>Lưu ý:</strong> Vui lòng không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>
                        <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
                        <p style='font-size: 12px; color: #999; text-align: center;'>Email này được gửi tự động từ hệ thống LazPe. Vui lòng không phản hồi trực tiếp email này.</p>
                    </div>";

                _logger.LogInformation("Mã OTP đăng ký cho email {Email} là: {Otp}", model.Email, otpCode);

                try
                {
                    await _emailSender.SendEmailAsync(model.Email, subject, htmlBody);
                    return Ok(new
                    {
                        success = true,
                        message = "Mã OTP đã được gửi đến email của bạn."
                    });
                }
                catch (Exception mailEx)
                {
                    _logger.LogWarning(mailEx, "Không gửi được email OTP đăng ký đến {Email} qua SMTP. Mã OTP vẫn được lưu nháp: {Otp}", model.Email, otpCode);
                    
                    return Ok(new
                    {
                        success = true,
                        message = "Mã OTP đã được tạo (Lưu ý: Không gửi được email qua SMTP. Vui lòng kiểm tra Log Server của Render để lấy mã OTP)."
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi OTP đăng ký");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi gửi mã OTP." });
            }
        }

        /// <summary>
        /// Xác thực OTP và hoàn tất đăng ký tài khoản
        /// </summary>
        [HttpPost("register-verify-otp")]
        public async Task<IActionResult> RegisterVerifyOtp([FromBody] VerifyRegisterOtpDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var emailNormalized = model.Email.Trim().ToLower();
                var cacheKey = $"register-otp:{emailNormalized}";

                if (!_memoryCache.TryGetValue(cacheKey, out RegisterOtpInfo? otpInfo) || otpInfo == null)
                {
                    return BadRequest(new { success = false, message = "Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới." });
                }

                if (DateTime.UtcNow > otpInfo.ExpiredAtUtc)
                {
                    _memoryCache.Remove(cacheKey);
                    return BadRequest(new { success = false, message = "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới." });
                }

                if (!string.Equals(otpInfo.Code, model.Otp.Trim(), StringComparison.Ordinal))
                {
                    otpInfo.FailedAttempts++;
                    if (otpInfo.FailedAttempts >= RegisterOtpMaxAttempts)
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
                    return BadRequest(new { success = false, message = $"Mã OTP không chính xác. Bạn còn {RegisterOtpMaxAttempts - otpInfo.FailedAttempts} lần thử." });
                }

                // OTP is correct! Now create the user.
                var registerDto = otpInfo.Dto;
                
                // Double check if email got registered in the meantime
                var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
                if (existingUser != null)
                {
                    _memoryCache.Remove(cacheKey);
                    return BadRequest(new { success = false, message = "Email này đã được sử dụng." });
                }

                var user = new ApplicationUser
                {
                    UserName = registerDto.Email,
                    Email = registerDto.Email,
                    FullName = registerDto.FullName,
                    PhoneNumber = registerDto.PhoneNumber,
                    DateOfBirth = registerDto.DateOfBirth,
                    RegisterDate = DateTime.Now,
                    Status = true,
                    EmailConfirmed = true // Confirm email immediately since they verified with OTP
                };

                var result = await _userManager.CreateAsync(user, registerDto.Password);

                if (result.Succeeded)
                {
                    _memoryCache.Remove(cacheKey);

                    // Assign default role
                    await AssignDefaultRoleAsync(user);

                    // Load roles and permissions
                    var userRoles = await _userManager.GetRolesAsync(user);
                    var userPermissions = await _permissionService.GetUserPermissionsAsync(user.Id);

                    // Generate JWT token
                    var token = await GenerateJwtTokenAsync(user, userRoles, userPermissions);

                    _logger.LogInformation("Đăng ký thành công qua xác thực OTP cho: {Email}", user.Email);

                    return Ok(new
                    {
                        success = true,
                        message = "Xác thực thành công và đăng ký tài khoản hoàn tất!",
                        userId = user.Id,
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
                            permissions = userPermissions.Select(p => p.Name).ToList(),
                            isAdmin = userRoles?.Contains("Admin") ?? false,
                            isOnboarded = user.IsOnboarded
                        }
                    });
                }

                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new { success = false, message = "Có lỗi xảy ra trong quá trình tạo tài khoản.", errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình xác thực OTP đăng ký");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra trong quá trình xác thực OTP." });
            }
        }

        /// <summary>
        /// Test thử nghiệm gửi email hệ thống
        /// </summary>
        [HttpGet("test-send-email")]
        public async Task<IActionResult> TestSendEmail([FromQuery] string email)
        {
            try
            {
                var subject = "Thử nghiệm gửi email hệ thống - LazPe";
                var htmlBody = "<h3>Kết nối email hoạt động thành công!</h3><p>Đây là email tự động gửi từ hệ thống API LazPe.</p>";
                await _emailSender.SendEmailAsync(email, subject, htmlBody);
                return Ok(new { success = true, message = "Email đã được gửi đi thành công!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi chạy thử nghiệm gửi email");
                return BadRequest(new { success = false, message = "Lỗi gửi email: " + ex.Message, details = ex.ToString() });
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
                        isAdmin = roles.Contains("Admin"),
                        isOnboarded = user.IsOnboarded
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

                var subject = "Mã OTP đặt lại mật khẩu - LazPe";
                var htmlBody = $@"
                    <div style='font-family: Arial, sans-serif; color: #333;'>
                        <h3 style='margin-bottom: 12px;'>Xác thực đặt lại mật khẩu</h3>
                        <p>Xin chào {WebUtility.HtmlEncode(user.FullName ?? user.Email)},</p>
                        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản LazPe.</p>
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

        /// <summary>
        /// Lấy trạng thái 2FA của người dùng
        /// </summary>
        [HttpGet("2fa-status")]
        [Authorize]
        public async Task<IActionResult> Get2FaStatus()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            var isEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
            var providers = new List<string>();
            if (isEnabled)
            {
                providers = (await _userManager.GetValidTwoFactorProvidersAsync(user)).ToList();
            }

            return Ok(new
            {
                success = true,
                isEnabled = isEnabled,
                providers = providers
            });
        }

        /// <summary>
        /// Tạo khoá cấu hình Authenticator App (quét QR code)
        /// </summary>
        [HttpPost("2fa-setup-authenticator")]
        [Authorize]
        public async Task<IActionResult> SetupAuthenticator()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            var unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
            if (string.IsNullOrEmpty(unformattedKey))
            {
                await _userManager.ResetAuthenticatorKeyAsync(user);
                unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
            }

            var email = await _userManager.GetEmailAsync(user);
            var qrCodeUri = string.Format(
                "otpauth://totp/{0}:{1}?secret={2}&issuer={0}&digits=6",
                System.Net.WebUtility.UrlEncode("LazPe"),
                System.Net.WebUtility.UrlEncode(email),
                unformattedKey);

            return Ok(new
            {
                success = true,
                sharedKey = unformattedKey,
                qrCodeUri = qrCodeUri
            });
        }

        /// <summary>
        /// Bật Authenticator App bằng cách xác minh mã 6 số
        /// </summary>
        [HttpPost("2fa-enable-authenticator")]
        [Authorize]
        public async Task<IActionResult> EnableAuthenticator([FromBody] EnableAuthenticatorDto model)
        {
            if (!ModelState.IsValid) return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            var user = await _userManager.GetUserAsync(User);
            if (user == null) return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            var cleanCode = model.Code.Replace(" ", "").Replace("-", "");
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(
                user, _userManager.Options.Tokens.AuthenticatorTokenProvider, cleanCode);

            if (isValid)
            {
                await _userManager.SetTwoFactorEnabledAsync(user, true);
                _logger.LogInformation("Đã bật Authenticator App 2FA cho user: {Email}", user.Email);
                return Ok(new { success = true, message = "Bật xác thực qua Authenticator App thành công!" });
            }

            return BadRequest(new { success = false, message = "Mã xác thực không chính xác" });
        }

        /// <summary>
        /// Tạo và gửi OTP xác minh cấu hình Email 2FA
        /// </summary>
        [HttpPost("2fa-setup-email")]
        [Authorize]
        public async Task<IActionResult> SetupEmail2Fa()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            var code = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");
            var emailBody = $@"
                <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                    <h2 style='color: #db2777; text-align: center;'>Thiết lập Xác thực 2 bước (2FA) - LazPe</h2>
                    <p>Xin chào <strong>{user.FullName}</strong>,</p>
                    <p>Bạn đang yêu cầu thiết lập xác thực 2 bước qua Email cho tài khoản quản trị của mình. Dưới đây là mã xác thực OTP của bạn:</p>
                    <div style='background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;'>
                        <span style='font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b;'>{code}</span>
                    </div>
                    <p style='font-size: 12px; color: #64748b;'>Mã này có hiệu lực trong vòng 3 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                </div>";

            await _emailSender.SendEmailAsync(user.Email, "Mã xác thực cấu hình 2FA - LazPe", emailBody);
            return Ok(new { success = true, message = "Đã gửi mã xác nhận đến email của bạn" });
        }

        /// <summary>
        /// Bật Email 2FA bằng cách xác minh mã OTP gửi qua mail
        /// </summary>
        [HttpPost("2fa-enable-email")]
        [Authorize]
        public async Task<IActionResult> EnableEmail2Fa([FromBody] EnableEmail2FaDto model)
        {
            if (!ModelState.IsValid) return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            var user = await _userManager.GetUserAsync(User);
            if (user == null) return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", model.Code);
            if (isValid)
            {
                await _userManager.SetTwoFactorEnabledAsync(user, true);
                _logger.LogInformation("Đã bật Email 2FA cho user: {Email}", user.Email);
                return Ok(new { success = true, message = "Bật xác thực qua Email thành công!" });
            }

            return BadRequest(new { success = false, message = "Mã xác thực không chính xác hoặc đã hết hạn" });
        }

        /// <summary>
        /// Tắt xác thực 2 bước hoàn toàn
        /// </summary>
        [HttpPost("2fa-disable")]
        [Authorize]
        public async Task<IActionResult> Disable2Fa()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            var result = await _userManager.SetTwoFactorEnabledAsync(user, false);
            if (result.Succeeded)
            {
                _logger.LogInformation("Đã tắt 2FA cho user: {Email}", user.Email);
                return Ok(new { success = true, message = "Tắt xác thực 2 bước thành công!" });
            }

            return BadRequest(new { success = false, message = "Không thể tắt xác thực 2 bước" });
        }

        /// <summary>
        /// Gửi OTP qua email phục vụ đăng nhập 2FA (khi chưa đăng nhập)
        /// </summary>
        [HttpPost("2fa-send-email-login-otp")]
        public async Task<IActionResult> SendEmailLoginOtp([FromBody] Send2FaEmailDto model)
        {
            if (!ModelState.IsValid) return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null) return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            var is2faEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
            if (!is2faEnabled)
            {
                return BadRequest(new { success = false, message = "Tài khoản chưa bật xác thực 2 bước" });
            }

            var code = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");
            var emailBody = $@"
                <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                    <h2 style='color: #db2777; text-align: center;'>Mã Xác thực Đăng nhập (2FA) - LazPe</h2>
                    <p>Xin chào <strong>{user.FullName}</strong>,</p>
                    <p>Có một yêu cầu đăng nhập vào tài khoản của bạn. Đây là mã xác nhận OTP đăng nhập của bạn:</p>
                    <div style='background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;'>
                        <span style='font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b;'>{code}</span>
                    </div>
                    <p style='font-size: 12px; color: #64748b;'>Mã này có hiệu lực trong vòng 3 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng đổi mật khẩu ngay để bảo mật tài khoản.</p>
                </div>";

            await _emailSender.SendEmailAsync(user.Email, "Mã xác thực đăng nhập 2FA - LazPe", emailBody);
            return Ok(new { success = true, message = "Mã xác thực đăng nhập đã được gửi đến email của bạn!" });
        }

        /// <summary>
        /// Xác thực OTP / Code để cấp JWT Token đăng nhập
        /// </summary>
        [HttpPost("2fa-verify-login")]
        public async Task<IActionResult> VerifyTwoFactorLogin([FromBody] Verify2FaLoginDto model)
        {
            if (!ModelState.IsValid) return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null) return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            // Kiểm tra lockout
            var isLockedOut = await _userManager.IsLockedOutAsync(user);
            if (isLockedOut)
            {
                return Unauthorized(new { success = false, message = "Tài khoản đang bị khóa do nhập sai nhiều lần" });
            }

            bool isValid = false;
            var cleanCode = model.Code.Replace(" ", "").Replace("-", "");

            if (model.Provider == "Email")
            {
                isValid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", cleanCode);
            }
            else if (model.Provider == "Authenticator")
            {
                isValid = await _userManager.VerifyTwoFactorTokenAsync(user, _userManager.Options.Tokens.AuthenticatorTokenProvider, cleanCode);
            }

            if (isValid)
            {
                // Reset số lần xác thực thất bại
                await _userManager.ResetAccessFailedCountAsync(user);

                var userRoles = await _userManager.GetRolesAsync(user);
                var userPermissions = await _permissionService.GetUserPermissionsAsync(user.Id);
                var token = await GenerateJwtTokenAsync(user, userRoles, userPermissions);
                var isAdmin = userRoles.Contains("Admin");

                _logger.LogInformation("Xác thực 2FA thành công cho: {Email}", user.Email ?? user.UserName);

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
                        permissions = userPermissions.Select(p => p.Name).ToList(),
                        isAdmin = isAdmin
                    }
                });
            }

            // Tăng số lần xác thực thất bại
            await _userManager.AccessFailedAsync(user);
            return BadRequest(new { success = false, message = "Mã xác thực không hợp lệ hoặc đã hết hạn" });
        }

        #region Helper Methods

        private async Task<string> GenerateJwtTokenAsync(ApplicationUser user, IList<string> roles, List<Permission> permissions)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            
            // Đọc từ JwtSettings section
            var secretKey = _configuration["JwtSettings:SecretKey"];
            
            // Validate SecretKey
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

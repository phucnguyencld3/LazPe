using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Filters;
using System.Security.Claims;
using PolyBabyAPI.Interface;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileApiController : ControllerBase 
    {
        private readonly IProfileService _profileService;
        private readonly ILogger<ProfileApiController> _logger;

        public ProfileApiController(IProfileService profileService, ILogger<ProfileApiController> logger)
        {
            _profileService = profileService;
            _logger = logger;
        }

        /// <summary>
        /// Test endpoint
        /// </summary>
        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test()
        {
            return Ok(new { message = "Profile API Controller works!", timestamp = DateTime.Now });
        }

        /// <summary>
        /// Lấy thông tin profile theo UserId
        /// </summary>
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetProfile(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { success = false, message = "UserId không được để trống" });
            }

            try
            {
                if (!CanAccessUser(userId, "User.Read"))
                    return Forbid();

                var profile = await _profileService.GetProfileAsync(userId);
                if (profile == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }
                return Ok(profile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting profile for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin profile" });
            }
        }

        /// <summary>
        /// Lấy thông tin profile theo Email
        /// </summary>
        [HttpGet("by-email")]
        [Permission("User.Read")]
        public async Task<IActionResult> GetProfileByEmail([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest(new { success = false, message = "Email không được để trống" });
            }

            try
            {
                var profile = await _profileService.GetProfileByEmailAsync(email);
                if (profile == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }
                return Ok(profile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting profile by email {Email}", email);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin profile" });
            }
        }

        /// <summary>
        /// Cập nhật thông tin profile
        /// </summary>
        [HttpPut("update")]
        public async Task<IActionResult> UpdateProfile([FromQuery] string userId, [FromBody] UpdateProfileDto updateDto)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { success = false, message = "UserId không được để trống" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                if (!CanAccessUser(userId, "User.Update"))
                    return Forbid();

                var result = await _profileService.UpdateProfileAsync(userId, updateDto);
                if (result)
                {
                    _logger.LogInformation("Profile updated successfully for user {UserId}", userId);
                    return Ok(new { success = true, message = "Cập nhật thông tin thành công!" });
                }

                return BadRequest(new { success = false, message = "Không thể cập nhật thông tin" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật thông tin" });
            }
        }

        /// <summary>
        /// Đổi mật khẩu
        /// </summary>
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromQuery] string userId, [FromBody] ChangePasswordDto changePasswordDto)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { success = false, message = "UserId không được để trống" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                if (!CanAccessUser(userId, "User.Update"))
                    return Forbid();

                var result = await _profileService.ChangePasswordAsync(userId, changePasswordDto);
                if (result)
                {
                    _logger.LogInformation("Password changed successfully for user {UserId}", userId);
                    return Ok(new { success = true, message = "Đổi mật khẩu thành công!" });
                }

                return BadRequest(new { success = false, message = "Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi đổi mật khẩu" });
            }
        }

        /// <summary>
        /// Upload avatar lên Cloudinary
        /// </summary>
        [HttpPost("upload-avatar")]
        [Consumes("multipart/form-data")] // ✅ THÊM: Explicit content type cho Swagger
        public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarRequest request) 
        {
            if (string.IsNullOrEmpty(request.UserId))
            {
                return BadRequest(new { success = false, message = "UserId không được để trống" });
            }

            if (request.Avatar == null || request.Avatar.Length == 0)
            {
                return BadRequest(new { success = false, message = "Vui lòng chọn file ảnh" });
            }

            // Kiểm tra định dạng file
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
            if (!allowedTypes.Contains(request.Avatar.ContentType.ToLower()))
            {
                return BadRequest(new { success = false, message = "Chỉ chấp nhận file ảnh (JPG, PNG, GIF)" });
            }

            // Kiểm tra kích thước file (max 2MB)
            if (request.Avatar.Length > 2 * 1024 * 1024)
            {
                return BadRequest(new { success = false, message = "File ảnh không được vượt quá 2MB" });
            }

            try
            {
                if (!CanAccessUser(request.UserId, "User.Update"))
                    return Forbid();

                var result = await _profileService.UploadAvatarAsync(request.UserId, request.Avatar);

                if (result.Success)
                {
                    _logger.LogInformation("Avatar uploaded successfully for user {UserId}", request.UserId);
                    return Ok(new { success = true, message = result.Message, data = result.AvatarUrl });
                }
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar for user {UserId}", request.UserId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi upload avatar" });
            }
        }

        private bool CanAccessUser(string targetUserId, string requiredPermission)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(currentUserId) && string.Equals(currentUserId, targetUserId, StringComparison.Ordinal))
                return true;

            if (User.IsInRole("Admin"))
                return true;

            var hasPermissionClaim = User.FindAll("Permission")
                .Any(c => string.Equals(c.Value, requiredPermission, StringComparison.OrdinalIgnoreCase));

            return hasPermissionClaim;
        }


    }
}

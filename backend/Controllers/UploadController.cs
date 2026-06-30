using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Interface;
using System.Security.Claims;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IImageModerationService _imageModerationService;
        private readonly ILogger<UploadController> _logger;

        public UploadController(ICloudinaryService cloudinaryService, IImageModerationService imageModerationService, ILogger<UploadController> logger)
        {
            _cloudinaryService = cloudinaryService;
            _imageModerationService = imageModerationService;
            _logger = logger;
        }

        /// <summary>
        /// Upload avatar lên Cloudinary
        /// </summary>
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file, [FromForm] string userId, [FromForm] string folder = "avatars")
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var canManageOthers = User.IsInRole("Admin") || User.FindAll("Permission")
                    .Any(c => string.Equals(c.Value, "User.Update", StringComparison.OrdinalIgnoreCase));

                if (!string.Equals(currentUserId, userId, StringComparison.Ordinal) && !canManageOthers)
                    return Forbid();

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Không có file được chọn" });
                }

                // Kiểm tra loại file
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { success = false, message = "Chỉ hỗ trợ file JPG, PNG, GIF" });
                }

                // Kiểm tra kích thước file (5MB)
                const long maxFileSize = 5 * 1024 * 1024;
                if (file.Length > maxFileSize)
                {
                    return BadRequest(new { success = false, message = "File không được vượt quá 5MB" });
                }

                // AI Moderation: Kiểm duyệt hình ảnh phản cảm
                var moderationResult = await _imageModerationService.IsImageSafeAsync(file);
                if (!moderationResult.IsSafe)
                {
                    _logger.LogWarning("Avatar upload rejected by AI Moderation for user {UserId}. Reason: {Reason}", userId, moderationResult.Message);
                    return BadRequest(new { success = false, message = moderationResult.Message });
                }

                // ✅ Sửa: Sử dụng method UploadAvatarAsync có sẵn
                var uploadResult = await _cloudinaryService.UploadAvatarAsync(file, userId);

                if (!string.IsNullOrEmpty(uploadResult))
                {
                    _logger.LogInformation("Avatar uploaded successfully for user {UserId}. URL: {Url}", userId, uploadResult);
                    
                    return Ok(new 
                    { 
                        success = true, 
                        url = uploadResult,
                        message = "Upload thành công!" 
                    });
                }

                _logger.LogWarning("Cloudinary upload failed for user {UserId}", userId);
                return BadRequest(new { success = false, message = "Không thể upload file lên Cloudinary" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi upload file" });
            }
        }

        /// <summary>
        /// Upload ảnh thông thường lên Cloudinary
        /// </summary>
        /// <summary>
        /// Upload ảnh thông thường lên Cloudinary
        /// </summary>
        [HttpPost("image")]
        [Permission("Product.Update")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file, [FromForm] string folder = "polystation/variants", [FromForm] string? oldImageUrl = null)
        {
            try
            {
                _logger.LogInformation("=== Upload Image Request ===");
                _logger.LogInformation("File: {FileName}, Size: {Size}, Folder: {Folder}, OldImageUrl: {OldImageUrl}",
                    file?.FileName ?? "null", file?.Length ?? 0, folder, oldImageUrl ?? "null");

                if (file == null || file.Length == 0)
                {
                    _logger.LogWarning("No file selected");
                    return BadRequest(new { success = false, message = "Không có file được chọn" });
                }

                // Kiểm tra loại file
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(fileExtension))
                {
                    _logger.LogWarning("Invalid file extension: {Extension}", fileExtension);
                    return BadRequest(new { success = false, message = "Chỉ hỗ trợ file ảnh JPG, PNG, GIF, WebP" });
                }

                // Kiểm tra kích thước file (10MB cho ảnh thông thường)
                const long maxFileSize = 10 * 1024 * 1024;
                if (file.Length > maxFileSize)
                {
                    _logger.LogWarning("File too large: {Size} bytes", file.Length);
                    return BadRequest(new { success = false, message = "File không được vượt quá 10MB" });
                }

                // Sử dụng method ReplaceImageAsync dùng chung
                _logger.LogInformation("Calling CloudinaryService.ReplaceImageAsync...");
                var uploadResult = await _cloudinaryService.ReplaceImageAsync(oldImageUrl, file, folder);

                _logger.LogInformation("Upload result: {Result}", uploadResult ?? "NULL");

                if (!string.IsNullOrEmpty(uploadResult))
                {
                    _logger.LogInformation("Image uploaded successfully to folder {Folder}. URL: {Url}", folder, uploadResult);

                    return Ok(new
                    {
                        success = true,
                        url = uploadResult,
                        message = "Upload thành công!"
                    });
                }

                _logger.LogWarning("Cloudinary upload failed for folder {Folder}", folder);
                return BadRequest(new { success = false, message = "Không thể upload file lên Cloudinary" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image to folder {Folder}", folder);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi upload file: " + ex.Message });
            }
        }

        [HttpPost("chat-image")]
        public async Task<IActionResult> UploadChatImage([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Không có file được chọn" });
                }

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { success = false, message = "Chỉ hỗ trợ file ảnh JPG, PNG, GIF, WebP" });
                }

                const long maxFileSize = 10 * 1024 * 1024;
                if (file.Length > maxFileSize)
                {
                    return BadRequest(new { success = false, message = "File không được vượt quá 10MB" });
                }

                // AI Moderation: Kiểm duyệt hình ảnh phản cảm
                var moderationResult = await _imageModerationService.IsImageSafeAsync(file);
                if (!moderationResult.IsSafe)
                {
                    _logger.LogWarning("Chat image upload rejected by AI Moderation. Reason: {Reason}", moderationResult.Message);
                    return BadRequest(new { success = false, message = moderationResult.Message });
                }

                var uploadResult = await _cloudinaryService.ReplaceImageAsync(null, file, "chat_images");

                if (!string.IsNullOrEmpty(uploadResult))
                {
                    return Ok(new
                    {
                        success = true,
                        url = uploadResult,
                        message = "Upload ảnh chat thành công!"
                    });
                }

                return BadRequest(new { success = false, message = "Không thể upload file lên Cloudinary" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading chat image");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi upload ảnh chat" });
            }
        }

        /// <summary>
        /// Xóa ảnh trên Cloudinary
        /// </summary>
        [HttpDelete("delete")]
        [Permission("Product.Update")]
        public async Task<IActionResult> DeleteImage([FromQuery] string imageUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(imageUrl))
                {
                    return BadRequest(new { success = false, message = "URL ảnh không được để trống" });
                }

                var result = await _cloudinaryService.DeleteImageAsync(imageUrl);

                if (result)
                {
                    _logger.LogInformation("Image deleted successfully: {ImageUrl}", imageUrl);
                    return Ok(new { success = true, message = "Xóa ảnh thành công!" });
                }

                return BadRequest(new { success = false, message = "Không thể xóa ảnh" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image {ImageUrl}", imageUrl);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa ảnh" });
            }
        }

        /// <summary>
        /// Upload review media (hình ảnh/video) lên Cloudinary
        /// </summary>
        [HttpPost("review-media")]
        public async Task<IActionResult> UploadReviewMedia([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Không có file được chọn" });
                }

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".avi", ".mkv" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { success = false, message = "Chỉ hỗ trợ file ảnh hoặc video" });
                }

                const long maxFileSize = 20 * 1024 * 1024;
                if (file.Length > maxFileSize)
                {
                    return BadRequest(new { success = false, message = "File không được vượt quá 20MB" });
                }

                var mediaType = new[] { ".mp4", ".mov", ".avi", ".mkv" }.Contains(fileExtension) ? "VIDEO" : "IMAGE";

                // AI Moderation: Nếu là hình ảnh, kiểm duyệt nội dung phản cảm
                if (mediaType == "IMAGE")
                {
                    var moderationResult = await _imageModerationService.IsImageSafeAsync(file);
                    if (!moderationResult.IsSafe)
                    {
                        _logger.LogWarning("Review media upload rejected by AI Moderation. Reason: {Reason}", moderationResult.Message);
                        return BadRequest(new { success = false, message = moderationResult.Message });
                    }
                }
                var uploadResult = await _cloudinaryService.UploadImageAsync(file, "Reviews");

                if (!string.IsNullOrEmpty(uploadResult))
                {
                    return Ok(new
                    {
                        success = true,
                        url = uploadResult,
                        mediaType = mediaType,
                        message = "Upload thành công!"
                    });
                }

                return BadRequest(new { success = false, message = "Không thể upload file lên Cloudinary" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading review media");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi upload file: " + ex.Message });
            }
        }
    }
}
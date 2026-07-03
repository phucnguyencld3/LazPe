using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(INotificationService notificationService, ILogger<NotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách thông báo của người dùng hiện tại
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyNotifications([FromQuery] string? type, [FromQuery] bool? isRead, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Không xác định được danh tính người dùng" });
            }

            try
            {
                var list = await _notificationService.GetUserNotificationsAsync(userId, type, isRead, page, pageSize);
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải danh sách thông báo" });
            }
        }

        /// <summary>
        /// Lấy số lượng thông báo chưa đọc
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Không xác định được danh tính người dùng" });
            }

            try
            {
                var count = await _notificationService.GetUnreadCountAsync(userId);
                return Ok(new { success = true, data = count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread notification count for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy số lượng thông báo chưa đọc" });
            }
        }

        /// <summary>
        /// Đánh dấu đã đọc một thông báo
        /// </summary>
        [HttpPost("read/{id}")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Không xác định được danh tính người dùng" });
            }

            try
            {
                var result = await _notificationService.MarkAsReadAsync(userId, id);
                if (result)
                {
                    return Ok(new { success = true, message = "Đã đánh dấu đã đọc" });
                }
                return BadRequest(new { success = false, message = "Không thể cập nhật trạng thái thông báo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {Id} as read for user {UserId}", id, userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Đánh dấu đã đọc tất cả thông báo
        /// </summary>
        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Không xác định được danh tính người dùng" });
            }

            try
            {
                var result = await _notificationService.MarkAllAsReadAsync(userId);
                if (result)
                {
                    return Ok(new { success = true, message = "Đã đánh dấu đọc tất cả thông báo" });
                }
                return BadRequest(new { success = false, message = "Không thể cập nhật" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Xóa mềm thông báo của người dùng hiện tại
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteNotification(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Không xác định được danh tính người dùng" });
            }

            try
            {
                var result = await _notificationService.SoftDeleteUserNotificationAsync(userId, id);
                if (result)
                {
                    return Ok(new { success = true, message = "Đã xóa thông báo" });
                }
                return BadRequest(new { success = false, message = "Không thể xóa thông báo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification {Id} for user {UserId}", id, userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa thông báo" });
            }
        }
    }
}

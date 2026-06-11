using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminNotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<AdminNotificationController> _logger;

        public AdminNotificationController(INotificationService notificationService, ILogger<AdminNotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        #region Campaigns Management

        [HttpGet("campaigns")]
        public async Task<IActionResult> GetAllCampaigns([FromQuery] string? searchTerm)
        {
            try
            {
                var list = await _notificationService.GetAllNotificationsAsync(searchTerm);
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing notification campaigns");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách chiến dịch" });
            }
        }

        [HttpGet("campaigns/{id}")]
        public async Task<IActionResult> GetCampaignById(int id)
        {
            try
            {
                var campaign = await _notificationService.GetNotificationByIdAsync(id);
                if (campaign == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy chiến dịch thông báo" });
                }
                return Ok(new { success = true, data = campaign });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting campaign ID {Id}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("campaigns")]
        public async Task<IActionResult> CreateCampaign([FromBody] CreateNotificationDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Admin";

            try
            {
                var campaign = await _notificationService.CreateNotificationAsync(dto, userId);
                return CreatedAtAction(nameof(GetCampaignById), new { id = campaign.Id }, new { success = true, data = campaign });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification campaign");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo chiến dịch thông báo" });
            }
        }

        [HttpPut("campaigns/{id}")]
        public async Task<IActionResult> UpdateCampaign(int id, [FromBody] UpdateNotificationDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var campaign = await _notificationService.UpdateNotificationAsync(id, dto);
                if (campaign == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy chiến dịch cần cập nhật" });
                }
                return Ok(new { success = true, data = campaign });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating campaign ID {Id}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật chiến dịch" });
            }
        }

        [HttpDelete("campaigns/{id}")]
        public async Task<IActionResult> DeleteCampaign(int id)
        {
            try
            {
                var result = await _notificationService.DeleteNotificationAsync(id);
                if (result)
                {
                    return Ok(new { success = true, message = "Đã xóa chiến dịch thông báo thành công" });
                }
                return NotFound(new { success = false, message = "Không tìm thấy chiến dịch thông báo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting campaign ID {Id}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa chiến dịch" });
            }
        }

        [HttpPost("campaigns/{id}/send-now")]
        public async Task<IActionResult> SendCampaignNow(int id)
        {
            try
            {
                var result = await _notificationService.SendNotificationNowAsync(id);
                if (result)
                {
                    return Ok(new { success = true, message = "Đang gửi thông báo ngay lập tức" });
                }
                return BadRequest(new { success = false, message = "Không thể gửi thông báo. Chiến dịch đã gửi hoặc không tìm thấy." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending campaign ID {Id} now", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi gửi thông báo" });
            }
        }

        [HttpPost("campaigns/{id}/cancel")]
        public async Task<IActionResult> CancelCampaignSchedule(int id)
        {
            try
            {
                var result = await _notificationService.CancelScheduledNotificationAsync(id);
                if (result)
                {
                    return Ok(new { success = true, message = "Đã hủy lịch gửi thông báo thành công" });
                }
                return BadRequest(new { success = false, message = "Không thể hủy lịch gửi. Có thể chiến dịch không có lịch gửi hoặc đã gửi rồi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling schedule for campaign ID {Id}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var stats = await _notificationService.GetAdminStatisticsAsync();
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting admin statistics");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải báo cáo thống kê" });
            }
        }

        #endregion

        #region Templates Management

        [HttpGet("templates")]
        public async Task<IActionResult> GetAllTemplates()
        {
            try
            {
                var list = await _notificationService.GetAllTemplatesAsync();
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing templates");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpGet("templates/{id}")]
        public async Task<IActionResult> GetTemplateById(int id)
        {
            try
            {
                var temp = await _notificationService.GetTemplateByIdAsync(id);
                if (temp == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy mẫu thông báo" });
                }
                return Ok(new { success = true, data = temp });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting template ID {Id}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        [HttpPost("templates")]
        public async Task<IActionResult> CreateTemplate([FromBody] NotificationTemplateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var temp = await _notificationService.CreateTemplateAsync(dto);
                return CreatedAtAction(nameof(GetTemplateById), new { id = temp.Id }, new { success = true, data = temp });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating template");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo mẫu thông báo" });
            }
        }

        [HttpPut("templates/{id}")]
        public async Task<IActionResult> UpdateTemplate(int id, [FromBody] NotificationTemplateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var temp = await _notificationService.UpdateTemplateAsync(id, dto);
                if (temp == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy mẫu thông báo cần cập nhật" });
                }
                return Ok(new { success = true, data = temp });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating template ID {Id}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật mẫu thông báo" });
            }
        }

        [HttpDelete("templates/{id}")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            try
            {
                var result = await _notificationService.DeleteTemplateAsync(id);
                if (result)
                {
                    return Ok(new { success = true, message = "Đã xóa mẫu thông báo thành công" });
                }
                return NotFound(new { success = false, message = "Không tìm thấy mẫu" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting template ID {Id}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa mẫu" });
            }
        }

        #endregion
    }
}

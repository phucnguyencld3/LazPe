using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubscriptionsController : ControllerBase
    {
        private readonly ISubscriptionService _subscriptionService;

        public SubscriptionsController(ISubscriptionService subscriptionService)
        {
            _subscriptionService = subscriptionService;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSubscriptionDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            try
            {
                var result = await _subscriptionService.CreateSubscriptionAsync(userId, dto);
                return Ok(new { Success = true, Data = result, Message = "Tạo đơn hàng định kỳ thành công." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMySubscriptions()
        {
            var userId = GetUserId();
            var result = await _subscriptionService.GetUserSubscriptionsAsync(userId);
            return Ok(new { Success = true, Data = result });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            var result = await _subscriptionService.GetSubscriptionByIdAsync(userId, id);
            if (result == null) return NotFound(new { Success = false, Message = "Không tìm thấy đăng ký" });
            
            return Ok(new { Success = true, Data = result });
        }

        [HttpPatch("{id}/pause")]
        public async Task<IActionResult> Pause(int id)
        {
            var userId = GetUserId();
            var success = await _subscriptionService.PauseSubscriptionAsync(userId, id);
            if (!success) return BadRequest(new { Success = false, Message = "Không thể tạm dừng (có thể đăng ký không tồn tại hoặc đã tạm dừng)" });
            
            return Ok(new { Success = true, Message = "Đã tạm dừng đăng ký mua định kỳ" });
        }

        [HttpPatch("{id}/resume")]
        public async Task<IActionResult> Resume(int id)
        {
            var userId = GetUserId();
            var success = await _subscriptionService.ResumeSubscriptionAsync(userId, id);
            if (!success) return BadRequest(new { Success = false, Message = "Không thể tiếp tục (có thể đăng ký đang hoạt động)" });
            
            return Ok(new { Success = true, Message = "Đã tiếp tục mua định kỳ" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancel(int id)
        {
            var userId = GetUserId();
            var success = await _subscriptionService.CancelSubscriptionAsync(userId, id);
            if (!success) return BadRequest(new { Success = false, Message = "Hủy thất bại" });
            
            return Ok(new { Success = true, Message = "Đã hủy đăng ký mua định kỳ" });
        }
    }
}

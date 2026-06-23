using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs.ProductAlert;
using PolyBabyAPI.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProductAlertController : ControllerBase
    {
        private readonly IProductAlertService _productAlertService;

        public ProductAlertController(IProductAlertService productAlertService)
        {
            _productAlertService = productAlertService;
        }

        [HttpPost("subscribe")]
        public async Task<IActionResult> Subscribe([FromBody] CreateProductAlertDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var result = await _productAlertService.SubscribeAlertAsync(userId, dto);
            if (!result)
            {
                return BadRequest(new { message = "Bạn đã đăng ký nhận thông báo cho sản phẩm này." });
            }

            return Ok(new { message = "Đăng ký nhận thông báo thành công." });
        }

        [HttpDelete("unsubscribe/{id}")]
        public async Task<IActionResult> Unsubscribe(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var result = await _productAlertService.UnsubscribeAlertAsync(id, userId);
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy đăng ký này." });
            }

            return Ok(new { message = "Đã hủy đăng ký nhận thông báo." });
        }

        [HttpGet("my-alerts")]
        public async Task<IActionResult> GetMyAlerts()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var alerts = await _productAlertService.GetUserAlertsAsync(userId);
            return Ok(alerts);
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/upsell")]
    [ApiController]
    [Authorize]
    public class UpsellController : ControllerBase
    {
        private readonly IUpsellService _upsellService;

        public UpsellController(IUpsellService upsellService)
        {
            _upsellService = upsellService;
        }

        [HttpGet("checkout-suggestions")]
        public async Task<IActionResult> GetCheckoutUpsell()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { Message = "User not found." });
            }

            var recommendations = await _upsellService.GetCheckoutUpsellAsync(userId);
            
            // Giả sử dự án chưa có một standard ApiResponse thống nhất hoàn toàn, ta trả về dạng JSON trực tiếp 
            // Nếu có ApiResponse<T>, có thể bọc lại. Ở đây dùng chuẩn Ok với dữ liệu mảng DTOs.
            return Ok(recommendations);
        }
    }
}

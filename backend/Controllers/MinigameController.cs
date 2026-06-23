using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MinigameController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILoyaltyService _loyaltyService;

        public MinigameController(ApplicationDbContext context, ILoyaltyService loyaltyService)
        {
            _context = context;
            _loyaltyService = loyaltyService;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        [HttpGet("lucky-wheel/status")]
        public async Task<IActionResult> GetLuckyWheelStatus()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var todayStart = DateTime.Today;
            var hasSpunToday = await _context.LoyaltyPointHistories
                .AnyAsync(h => h.UserID == userId && h.TransactionType == "LUCKY_WHEEL" && h.CreatedAt >= todayStart);

            return Ok(new {
                success = true,
                hasSpunToday = hasSpunToday,
                spinsRemaining = hasSpunToday ? 0 : 1
            });
        }

        [HttpPost("lucky-wheel/spin")]
        public async Task<IActionResult> SpinLuckyWheel()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // Kiểm tra xem đã quay hôm nay chưa
            var todayStart = DateTime.Today;
            var hasSpunToday = await _context.LoyaltyPointHistories
                .AnyAsync(h => h.UserID == userId && h.TransactionType == "LUCKY_WHEEL" && h.CreatedAt >= todayStart);

            if (hasSpunToday)
            {
                return BadRequest(new { success = false, message = "Bạn đã sử dụng hết lượt quay hôm nay. Hãy quay lại vào ngày mai!" });
            }

            // Thuật toán quay thưởng
            // Không trúng: 10%
            // 100 Xu: 50%
            // 200 Xu: 25%
            // 300 Xu: 12%
            // 500 Xu: 2.9%
            // 1000 Xu: 0.1%

            var random = new Random();
            double roll = random.NextDouble() * 100; // 0.0 to 100.0
            int wonPoints = 0;
            string rewardName = "Chúc bạn may mắn lần sau";

            if (roll < 0.1) // 0.1%
            {
                wonPoints = 1000;
                rewardName = "1000 Xu";
            }
            else if (roll < 3.0) // 0.1 + 2.9 = 3.0
            {
                wonPoints = 500;
                rewardName = "500 Xu";
            }
            else if (roll < 15.0) // 3.0 + 12.0 = 15.0
            {
                wonPoints = 300;
                rewardName = "300 Xu";
            }
            else if (roll < 40.0) // 15.0 + 25.0 = 40.0
            {
                wonPoints = 200;
                rewardName = "200 Xu";
            }
            else if (roll < 90.0) // 40.0 + 50.0 = 90.0
            {
                wonPoints = 100;
                rewardName = "100 Xu";
            }
            else // Remaining 10.0%
            {
                wonPoints = 0;
            }

            // Xử lý cộng thưởng
            if (wonPoints > 0)
            {
                await _loyaltyService.AddPointsAsync(userId, wonPoints, "LUCKY_WHEEL", $"Trúng thưởng Vòng Quay May Mắn: {wonPoints} Xu");
            }
            else
            {
                // Nếu không trúng, tạo record lịch sử để đánh dấu đã quay hôm nay
                var history = new LoyaltyPointHistory
                {
                    UserID = userId,
                    TransactionType = "LUCKY_WHEEL",
                    Amount = 0,
                    Description = "Vòng Quay May Mắn: Không trúng thưởng",
                    CreatedAt = DateTime.Now
                };
                _context.LoyaltyPointHistories.Add(history);
                await _context.SaveChangesAsync();
            }

            return Ok(new {
                success = true,
                wonPoints = wonPoints,
                rewardName = rewardName,
                message = wonPoints > 0 ? $"Chúc mừng! Bạn đã quay trúng {wonPoints} Xu." : "Rất tiếc! Chúc bạn may mắn lần sau."
            });
        }
    }
}

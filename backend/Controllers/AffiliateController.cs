using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interface;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AffiliateController : ControllerBase
    {
        private readonly IAffiliateService _affiliateService;

        public AffiliateController(IAffiliateService affiliateService)
        {
            _affiliateService = affiliateService;
        }

        [HttpPost("register")]
        [Authorize]
        public async Task<IActionResult> RegisterAffiliate([FromBody] RegisterAffiliateDto dto)
        {
            if (!dto.AgreeToTerms) return BadRequest(new { message = "You must agree to the terms to register as an affiliate." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var success = await _affiliateService.RegisterAffiliateAsync(userId);
            if (!success) return BadRequest(new { message = "Failed to register affiliate or user not found." });

            return Ok(new { message = "Affiliate registered successfully." });
        }

        [HttpPost("generate-link/{productId}")]
        [Authorize]
        public async Task<IActionResult> GenerateLink(int productId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var link = await _affiliateService.GenerateAffiliateLinkAsync(userId, productId);
                return Ok(link);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("links")]
        [Authorize]
        public async Task<IActionResult> GetUserLinks()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var links = await _affiliateService.GetUserAffiliateLinksAsync(userId);
            return Ok(links);
        }

        [HttpDelete("links/{code}")]
        [Authorize]
        public async Task<IActionResult> DeleteLink(string code)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var success = await _affiliateService.DeleteAffiliateLinkAsync(userId, code);
            if (!success) return NotFound(new { message = "Link không tồn tại hoặc không thuộc về bạn." });

            return Ok(new { success = true, message = "Xóa link tiếp thị thành công." });
        }

        [HttpGet("dashboard")]
        [Authorize]
        public async Task<IActionResult> GetDashboardStats()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var stats = await _affiliateService.GetDashboardStatsAsync(userId);
            if (stats == null) return BadRequest(new { message = "User is not a registered affiliate." });

            return Ok(stats);
        }

        [HttpPost("track-click")]
        public async Task<IActionResult> TrackClick([FromBody] TrackClickDto dto)
        {
            if (string.IsNullOrEmpty(dto.Code)) return BadRequest();

            var success = await _affiliateService.RecordClickAsync(dto.Code);
            return Ok(new { success });
        }

        [HttpPost("redeem-points")]
        [Authorize]
        public async Task<IActionResult> RedeemPoints([FromBody] RedeemAffiliatePointDto dto)
        {
            if (!ModelState.IsValid)
            {
                var error = ModelState.Values.SelectMany(v => v.Errors).FirstOrDefault()?.ErrorMessage;
                return BadRequest(new RedeemAffiliatePointResponseDto { Success = false, Message = error ?? "Dữ liệu không hợp lệ." });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _affiliateService.RedeemPointsToWalletAsync(userId, dto.PointsToRedeem, dto.PaymentPin);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }

    public class TrackClickDto
    {
        public string Code { get; set; } = string.Empty;
    }
}

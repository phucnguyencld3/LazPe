using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using System.Security.Claims;

namespace PolyBabyAPI.Controllers.Admin
{
    // Cần có Authorize Role Admin hoặc permission tương ứng.
    [Route("api/admin/[controller]")]
    [ApiController]
    [Authorize] // Có thể thêm [Authorize(Roles = "Admin")] tùy thuộc vào hệ thống
    public class BannersController : ControllerBase
    {
        private readonly IBannerService _bannerService;

        public BannersController(IBannerService bannerService)
        {
            _bannerService = bannerService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BannerDto>>> GetAllBanners()
        {
            var banners = await _bannerService.GetAllBannersAsync(clientOnly: false);
            return Ok(banners);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BannerDto>> GetBanner(int id)
        {
            var banner = await _bannerService.GetBannerByIdAsync(id);
            if (banner == null) return NotFound();
            return Ok(banner);
        }

        [HttpPost("draft")]
        public async Task<ActionResult<BannerDto>> CreateDraft([FromBody] CreateOrUpdateBannerRequest request)
        {
            var banner = await _bannerService.SaveDraftAsync(request);
            return CreatedAtAction(nameof(GetBanner), new { id = banner.Id }, banner);
        }

        [HttpPut("draft/{id}")]
        public async Task<ActionResult<BannerDto>> UpdateDraft(int id, [FromBody] CreateOrUpdateBannerRequest request)
        {
            try
            {
                var banner = await _bannerService.UpdateDraftAsync(id, request);
                return Ok(banner);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBanner(int id)
        {
            var success = await _bannerService.DeleteBannerAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpPost("publish")]
        public async Task<IActionResult> PublishBanner([FromBody] PublishBannerRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _bannerService.PublishBannerAsync(request, userId);
                return Ok(new { message = "Banner published successfully" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPost("rollback")]
        public async Task<IActionResult> RollbackBanner([FromBody] RollbackBannerRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _bannerService.RollbackBannerAsync(request, userId);
                return Ok(new { message = "Banner rolled back successfully" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpGet("{id}/versions")]
        public async Task<ActionResult<IEnumerable<BannerVersionDto>>> GetBannerVersions(int id)
        {
            var versions = await _bannerService.GetBannerVersionsAsync(id);
            return Ok(versions);
        }
    }
}

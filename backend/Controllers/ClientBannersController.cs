using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientBannersController : ControllerBase
    {
        private readonly IBannerService _bannerService;

        public ClientBannersController(IBannerService bannerService)
        {
            _bannerService = bannerService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BannerDto>>> GetBanners()
        {
            // Only published banners
            var banners = await _bannerService.GetAllBannersAsync(clientOnly: true);
            return Ok(banners);
        }

        [HttpGet("position/{position}")]
        public async Task<ActionResult<IEnumerable<BannerDto>>> GetBannersByPosition(string position, [FromQuery] string page = "global")
        {
            var banners = await _bannerService.GetBannersByPositionAsync(position, page);
            return Ok(banners);
        }
    }
}

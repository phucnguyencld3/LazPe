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
        [AllowAnonymous]
        public async Task<IActionResult> GetCheckoutUpsell()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var recommendations = await _upsellService.GetCheckoutUpsellAsync(userId ?? string.Empty);
            return Ok(recommendations);
        }
    }
}

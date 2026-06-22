using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize(Roles = "Admin")]
    public class IpBlockController : ControllerBase
    {
        private readonly IIpBlockService _ipBlockService;

        public IpBlockController(IIpBlockService ipBlockService)
        {
            _ipBlockService = ipBlockService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var ips = await _ipBlockService.GetAllBlockedIpsAsync();
            return Ok(new { success = true, data = ips });
        }

        [HttpPost("block")]
        public async Task<IActionResult> Block([FromBody] BlockIpRequest request)
        {
            if (string.IsNullOrEmpty(request.IpAddress))
                return BadRequest(new { success = false, message = "IP không hợp lệ" });

            await _ipBlockService.BlockIpAsync(request.IpAddress, request.Reason, request.DurationDays);
            return Ok(new { success = true, message = $"Đã chặn IP {request.IpAddress} thành công" });
        }

        [HttpPost("unblock")]
        public async Task<IActionResult> Unblock([FromBody] UnblockIpRequest request)
        {
            if (string.IsNullOrEmpty(request.IpAddress))
                return BadRequest(new { success = false, message = "IP không hợp lệ" });

            await _ipBlockService.UnblockIpAsync(request.IpAddress);
            return Ok(new { success = true, message = $"Đã mở khóa IP {request.IpAddress} thành công" });
        }
    }

    public class BlockIpRequest
    {
        public string IpAddress { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public int DurationDays { get; set; } = 30;
    }

    public class UnblockIpRequest
    {
        public string IpAddress { get; set; } = string.Empty;
    }
}

using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Services.Shipping;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using System.Linq;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ShippingController : ControllerBase
    {
        private readonly IShippingProvider _shippingProvider;
        private readonly ILogger<ShippingController> _logger;
        private readonly ApplicationDbContext _context;

        public ShippingController(IShippingProvider shippingProvider, ILogger<ShippingController> logger, ApplicationDbContext context)
        {
            _shippingProvider = shippingProvider;
            _logger = logger;
            _context = context;
        }

        public class CalculateFeeRequest
        {
            public int AddressId { get; set; }
            public int Weight { get; set; } // in grams
            public int Length { get; set; } // in cm
            public int Width { get; set; } // in cm
            public int Height { get; set; } // in cm
        }

        [HttpPost("calculate-fee")]
        public async Task<IActionResult> CalculateFee([FromBody] CalculateFeeRequest req)
        {
            try
            {
                var address = await _context.UserAddresses
                    .Include(a => a.Province)
                    .Include(a => a.District)
                    .Include(a => a.Ward)
                    .FirstOrDefaultAsync(a => a.AddressID == req.AddressId);

                if (address == null) return NotFound(new { success = false, message = "Không tìm thấy địa chỉ" });

                int ghnDistrictId = 0;
                string ghnWardCode = "";

                if (address.MappedDistrictID.HasValue)
                {
                    // Fallback to directly stored mapped district ID if available
                    ghnDistrictId = address.MappedDistrictID.Value;
                    ghnWardCode = ""; // we might not store ward code yet
                }
                else
                {
                    // Map dynamically (Can be optimized to store in DB on address creation)
                    if (_shippingProvider is GHNShippingService ghnService)
                    {
                        var provName = address.Province?.Name ?? "";
                        var distName = address.District?.Name ?? "";
                        var wardName = address.Ward?.Name ?? "";

                        var mapping = await ghnService.MapAddressToGHNAsync(provName, distName, wardName);
                        if (mapping != null)
                        {
                            ghnDistrictId = mapping.Value.districtId;
                            ghnWardCode = mapping.Value.wardCode;
                            
                            // Save mapping back to database
                            address.MappedDistrictID = ghnDistrictId;
                            await _context.SaveChangesAsync();
                        }
                        else
                        {
                            return BadRequest(new { success = false, message = "Không thể ánh xạ địa chỉ sang GHN" });
                        }
                    }
                }

                if (ghnDistrictId == 0)
                {
                    return BadRequest(new { success = false, message = "Địa chỉ thiếu mã quận/huyện GHN" });
                }

                var fee = await _shippingProvider.CalculateFeeAsync(ghnDistrictId, ghnWardCode, req.Weight, req.Length, req.Width, req.Height);
                var expectedDelivery = await _shippingProvider.GetExpectedDeliveryTimeAsync(ghnDistrictId, ghnWardCode);

                return Ok(new
                {
                    success = true,
                    fee = fee,
                    expectedDelivery = expectedDelivery
                });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "CalculateFee error");
                return StatusCode(500, new { success = false, message = "Lỗi khi tính phí ship" });
            }
        }
    }
}

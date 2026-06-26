using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SimpleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SimpleController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { message = "Simple API works!" });
        }

        [HttpPost("seed-test-vouchers")]
        public async Task<IActionResult> SeedTestVouchers()
        {
            var now = DateTime.Now;
            var startDate = now.AddDays(-1);
            var endDate = now.AddDays(30);

            var existingVouchers = await _context.Vouchers.ToListAsync();
            var added = new List<string>();

            if (!existingVouchers.Any(v => v.Code == "TESTPROD50"))
            {
                var prodVoucher = new Voucher
                {
                    VoucherType = VoucherType.ProductDiscount,
                    Code = "TESTPROD50",
                    Name = "Giảm giá sản phẩm thử nghiệm 50%",
                    DiscountType = 1, // Percentage
                    DiscountValue = 50,
                    MinOrderValue = 50000,
                    MaxDiscount = 100000,
                    StartDate = startDate,
                    EndDate = endDate,
                    TotalQuantity = 1000,
                    UsedQuantity = 0,
                    Status = true,
                    VisibilityType = VoucherVisibilityType.Public,
                    ExclusiveType = ExclusiveDistributionType.None,
                    UsageLimitPerUser = 5
                };
                _context.Vouchers.Add(prodVoucher);
                added.Add("TESTPROD50");
            }

            if (!existingVouchers.Any(v => v.Code == "TESTSHIP30"))
            {
                var shipVoucher = new Voucher
                {
                    VoucherType = VoucherType.ShippingDiscount,
                    Code = "TESTSHIP30",
                    Name = "Freeship thử nghiệm tối đa 30K",
                    DiscountType = 2, // Fixed amount
                    DiscountValue = 30000,
                    MinOrderValue = 30000,
                    IsFreeShipping = true,
                    MaxShippingDiscount = 30000,
                    StartDate = startDate,
                    EndDate = endDate,
                    TotalQuantity = 1000,
                    UsedQuantity = 0,
                    Status = true,
                    VisibilityType = VoucherVisibilityType.Public,
                    ExclusiveType = ExclusiveDistributionType.None,
                    UsageLimitPerUser = 5
                };
                _context.Vouchers.Add(shipVoucher);
                added.Add("TESTSHIP30");
            }

            if (added.Any())
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Đã tạo các voucher thử nghiệm: {string.Join(", ", added)}" });
            }

            return Ok(new { message = "Các voucher thử nghiệm đã tồn tại sẵn trong cơ sở dữ liệu." });
        }
    }
}

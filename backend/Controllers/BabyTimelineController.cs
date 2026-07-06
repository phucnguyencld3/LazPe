using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BabyTimelineController : ControllerBase
    {
        private readonly IBabyTimelineService _timelineService;

        public BabyTimelineController(IBabyTimelineService timelineService)
        {
            _timelineService = timelineService;
        }

        [HttpGet("{babyProfileId}")]
        public async Task<IActionResult> GetBabyTimeline(int babyProfileId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("Người dùng chưa đăng nhập.");
                }

                var timeline = await _timelineService.GetBabyTimelineAsync(userId, babyProfileId);
                return Ok(new { success = true, data = timeline });
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi hệ thống: " + ex.Message });
            }
        }

        [HttpPost("SeedDemoData")]
        public async Task<IActionResult> SeedDemoData([FromServices] PolyBabyAPI.Data.ApplicationDbContext context)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var baby = new PolyBabyAPI.Models.BabyProfile
            {
                UserID = userId,
                Name = "Bé Demo",
                Gender = "Boy",
                DateOfBirth = DateTime.Now.AddMonths(-18),
                Relationship = "Con trai",
                WeightKg = 12.5,
                HeightCm = 85.0
            };
            
            // Thêm Growth
            baby.GrowthRecords.Add(new PolyBabyAPI.Models.BabyGrowthRecord
            {
                RecordedDate = DateTime.Now.AddMonths(-10),
                WeightKg = 9.0,
                HeightCm = 75.0,
                Notes = "Bé mọc răng cửa"
            });

            // Thêm Vaccine
            baby.VaccinationRecords.Add(new PolyBabyAPI.Models.VaccinationRecord
            {
                VaccineName = "Vắc-xin 6 trong 1",
                AdministeredDate = DateTime.Now.AddMonths(-16),
                Status = "Completed",
                Notes = "Bé tiêm rất ngoan, không khóc"
            });

            context.BabyProfiles.Add(baby);
            await context.SaveChangesAsync();

            // Thêm Shopping
            var invoice = new PolyBabyAPI.Models.Invoice
            {
                UserID = userId,
                InvoiceCode = "DEMO-" + DateTime.Now.Ticks,
                Status = PolyBabyAPI.Models.OrderStatus.Completed,
                TotalPrice = 1500000,
                CreatedAt = DateTime.Now.AddMonths(-5),
                PayMethod = PolyBabyAPI.Models.PayMethod.CreditCard
            };
            context.Invoices.Add(invoice);
            await context.SaveChangesAsync();

            var firstVariant = context.Variants.FirstOrDefault();
            if (firstVariant != null)
            {
                context.InvoiceDetails.Add(new PolyBabyAPI.Models.InvoiceDetail
                {
                    InvoiceID = invoice.InvoiceID,
                    VariantID = firstVariant.VariantID,
                    Quantity = 2,
                    UnitPrice = 750000
                });
                await context.SaveChangesAsync();
            }

            return Ok(new { success = true, message = "Đã tạo dữ liệu demo", babyProfileId = baby.BabyProfileID });
        }
    }
}

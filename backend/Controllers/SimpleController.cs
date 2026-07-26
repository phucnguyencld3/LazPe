using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Services;
using PolyBabyAPI.Interface;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SimpleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILoyaltyService _loyaltyService;

        public SimpleController(ApplicationDbContext context, ILoyaltyService loyaltyService)
        {
            _context = context;
            _loyaltyService = loyaltyService;
        }

        [HttpGet("fix-loyalty")]
        public async Task<IActionResult> FixLoyalty()
        {
            try
            {
                // Find completed invoices that don't have a corresponding Earn transaction in LoyaltyPointHistories
                var invoicesWithoutLoyalty = await _context.Invoices
                    .Where(i => i.Status == PolyBabyAPI.Models.OrderStatus.Completed 
                             && !_context.LoyaltyPointHistories.Any(h => h.InvoiceID == i.InvoiceID && h.TransactionType == "EARN"))
                    .ToListAsync();

                int count = 0;
                foreach (var invoice in invoicesWithoutLoyalty)
                {
                    await _loyaltyService.EarnPointsAsync(invoice.UserID, invoice.InvoiceID, invoice.SubTotal);
                    count++;
                }

                return Ok(new { message = $"Fixed loyalty points for {count} invoices.", data = invoicesWithoutLoyalty.Select(i => i.InvoiceID) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
            }
        }
    }
}

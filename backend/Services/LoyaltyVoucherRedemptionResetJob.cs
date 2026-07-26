using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class LoyaltyVoucherRedemptionResetJob
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LoyaltyVoucherRedemptionResetJob> _logger;

        public LoyaltyVoucherRedemptionResetJob(ApplicationDbContext context, ILogger<LoyaltyVoucherRedemptionResetJob> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            var now = DateTime.Now;
            var periodKey = $"{now.Year}-{now.Month:D2}";
            
            _logger.LogInformation($"[LoyaltyVoucherRedemptionResetJob] Bắt đầu chu kỳ đổi voucher mới: {periodKey}");
            
            // Log for audit purposes
            var audit = new LoyaltyAuditLog
            {
                Action = "SYSTEM_RESET_REDEMPTION",
                EntityName = "LoyaltyVoucherRedemptionHistory",
                EntityID = "SYSTEM",
                ActorID = "SYSTEM",
                ActorEmail = "system@lazpe.com",
                Notes = "Monthly Reset",
                Timestamp = DateTime.Now
            };       
            _context.LoyaltyAuditLogs.Add(audit);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"[LoyaltyVoucherRedemptionResetJob] Hoàn thành.");
        }
    }
}

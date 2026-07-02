using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Jobs
{
    public class WithdrawDailyReportJob
    {
        private readonly ApplicationDbContext _context;
        private readonly IWithdrawEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<WithdrawDailyReportJob> _logger;

        public WithdrawDailyReportJob(
            ApplicationDbContext context,
            IWithdrawEmailService emailService,
            IConfiguration configuration,
            ILogger<WithdrawDailyReportJob> logger)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            try
            {
                var today = DateTime.Now.Date;
                var cutoffTime = today.AddHours(9).AddMinutes(59); // 09:59 AM today

                var pendingCount = await _context.WithdrawRequests
                    .Where(w => w.Status == "Pending" && w.CreatedAt <= cutoffTime)
                    .CountAsync();

                if (pendingCount > 0)
                {
                    string adminEmail = _configuration["EmailSettings:AdminEmail"] ?? "admin@lazpe.com";
                    await _emailService.SendDailyAdminReportEmailAsync(adminEmail, pendingCount, DateTime.Now);
                    _logger.LogInformation($"Sent daily admin report for {pendingCount} pending withdraw requests.");
                }
                else
                {
                    _logger.LogInformation("No pending withdraw requests to report today.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while executing WithdrawDailyReportJob");
            }
        }
    }
}

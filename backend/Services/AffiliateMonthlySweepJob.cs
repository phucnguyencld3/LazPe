using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class AffiliateMonthlySweepJob
    {
        private readonly ApplicationDbContext _context;
        private readonly IWalletSecurityService _walletSecurityService;
        private readonly ILogger<AffiliateMonthlySweepJob> _logger;

        public AffiliateMonthlySweepJob(
            ApplicationDbContext context,
            IWalletSecurityService walletSecurityService,
            ILogger<AffiliateMonthlySweepJob> logger)
        {
            _context = context;
            _walletSecurityService = walletSecurityService;
            _logger = logger;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ExecuteAsync()
        {
            _logger.LogInformation("Bắt đầu Job tự động quy đổi xu tiếp thị cuối tháng sang số dư Ví LazPe...");

            var usersToSweep = await _context.Users
                .Where(u => u.IsAffiliate && u.AffiliatePoint > 0)
                .ToListAsync();

            if (!usersToSweep.Any())
            {
                _logger.LogInformation("Không có người dùng tiếp thị nào còn dư xu để quét.");
                return;
            }

            int count = 0;
            foreach (var user in usersToSweep)
            {
                int pointsToSweep = user.AffiliatePoint;
                if (pointsToSweep <= 0) continue;

                user.AffiliatePoint = 0;
                user.WalletBalance += pointsToSweep;
                user.WalletSignature = _walletSecurityService.GenerateSignature(user.Id, user.WalletBalance, user.CoinsBalance);

                _context.BalanceTransactions.Add(new BalanceTransaction
                {
                    UserID = user.Id,
                    Amount = pointsToSweep,
                    Direction = BalanceTransactionDirection.Credit,
                    SourceType = BalanceSourceType.Wallet,
                    Reason = $"Tự động quy đổi {pointsToSweep:N0} xu tiếp thị dư cuối tháng sang số dư Ví LazPe",
                    CreatedAt = DateTime.Now
                });

                count++;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Đã hoàn tất quét và chuyển xu tiếp thị thành công cho {count} người dùng.");
        }
    }
}

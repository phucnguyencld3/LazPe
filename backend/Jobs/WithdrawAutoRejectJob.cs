using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Jobs
{
    public class WithdrawAutoRejectJob
    {
        private readonly ApplicationDbContext _context;
        private readonly IWithdrawEmailService _emailService;
        private readonly IWalletSecurityService _walletSecurityService;
        private readonly ILogger<WithdrawAutoRejectJob> _logger;

        public WithdrawAutoRejectJob(
            ApplicationDbContext context,
            IWithdrawEmailService emailService,
            IWalletSecurityService walletSecurityService,
            ILogger<WithdrawAutoRejectJob> logger)
        {
            _context = context;
            _emailService = emailService;
            _walletSecurityService = walletSecurityService;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            try
            {
                var cutoffTime = DateTime.Now.AddDays(-3);

                var expiredRequests = await _context.WithdrawRequests
                    .Include(w => w.User)
                    .Where(w => w.Status == "Pending" && w.CreatedAt <= cutoffTime)
                    .ToListAsync();

                if (!expiredRequests.Any())
                {
                    _logger.LogInformation("No expired withdraw requests found to auto-reject.");
                    return;
                }

                _logger.LogInformation($"Found {expiredRequests.Count} expired withdraw requests to auto-reject.");

                foreach (var withdraw in expiredRequests)
                {
                    using var tx = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        withdraw.Status = "Rejected";
                        withdraw.AdminNote = "Hệ thống tự động hủy do quá hạn 3 ngày chưa xử lý.";
                        withdraw.ProcessedAt = DateTime.Now;

                        if (withdraw.User != null)
                        {
                            // Refund the wallet balance
                            withdraw.User.WalletBalance += withdraw.Amount;

                            string idempotencyKey = $"WITHDRAW_AUTOREJ_{withdraw.RequestID}";
                            _context.BalanceTransactions.Add(new BalanceTransaction
                            {
                                UserID = withdraw.UserID,
                                Amount = withdraw.Amount,
                                Direction = BalanceTransactionDirection.Credit,
                                SourceType = BalanceSourceType.Wallet,
                                Reason = $"Hoàn tiền do hệ thống tự động Hủy Yêu cầu Rút tiền #{withdraw.RequestID} (Quá hạn)",
                                IdempotencyKey = idempotencyKey,
                                HashSignature = "" // HMAC to be added later if needed by other services
                            });

                            // Re-sign wallet to prevent security lockout
                            withdraw.User.WalletSignature = _walletSecurityService.GenerateSignature(withdraw.User.Id, withdraw.User.WalletBalance, withdraw.User.CoinsBalance);
                        }

                        await _context.SaveChangesAsync();
                        await tx.CommitAsync();

                        // Send email
                        if (withdraw.User != null && !string.IsNullOrEmpty(withdraw.User.Email))
                        {
                            await _emailService.SendAutoRejectUserEmailAsync(
                                withdraw.User.Email,
                                withdraw.User.FullName ?? "Quý khách",
                                withdraw.Amount,
                                withdraw.ProcessedAt.Value
                            );
                        }
                    }
                    catch (Exception ex)
                    {
                        await tx.RollbackAsync();
                        _logger.LogError(ex, $"Failed to auto-reject withdraw request {withdraw.RequestID}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while executing WithdrawAutoRejectJob");
            }
        }
    }
}

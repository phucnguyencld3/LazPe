using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class VnPayPendingPaymentCleanupService : BackgroundService
    {
        private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(10);
        private static readonly TimeSpan PaymentTimeout = TimeSpan.FromHours(24);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<VnPayPendingPaymentCleanupService> _logger;

        public VnPayPendingPaymentCleanupService(
            IServiceScopeFactory scopeFactory,
            ILogger<VnPayPendingPaymentCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await ProcessExpiredPaymentsAsync(stoppingToken);

            using var timer = new PeriodicTimer(CheckInterval);
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ProcessExpiredPaymentsAsync(stoppingToken);
            }
        }

        private async Task ProcessExpiredPaymentsAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var invoiceService = scope.ServiceProvider.GetRequiredService<IInvoiceService>();

                var expiredBefore = DateTime.Now.Subtract(PaymentTimeout);

                var expiredInvoiceIds = await context.PaymentTransactions
                    .Where(pt => pt.Status == PaymentTransactionStatus.Pending
                                 && pt.CreatedAt <= expiredBefore
                                 && pt.Invoice != null
                                 && !pt.Invoice.IsDeleted
                                 && (pt.Invoice.PayMethod == PayMethod.MobilePayment || pt.Invoice.PayMethod == PayMethod.ZaloPay)
                                 && pt.Invoice.Status == OrderStatus.Pending)
                    .Select(pt => pt.InvoiceID)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                if (expiredInvoiceIds.Count == 0)
                {
                    return;
                }

                foreach (var invoiceId in expiredInvoiceIds)
                {
                    var hasSuccessPayment = await context.PaymentTransactions
                        .AnyAsync(pt => pt.InvoiceID == invoiceId && pt.Status == PaymentTransactionStatus.Success, cancellationToken);

                    if (hasSuccessPayment)
                    {
                        continue;
                    }

                    var cancelled = await invoiceService.AdminCancelAsync(invoiceId, "Quá 24 gi? ch?a hoàn t?t thanh toán VNPay.");
                    if (!cancelled)
                    {
                        continue;
                    }

                    var pendingTransactions = await context.PaymentTransactions
                        .Where(pt => pt.InvoiceID == invoiceId && pt.Status == PaymentTransactionStatus.Pending)
                        .ToListAsync(cancellationToken);

                    foreach (var transaction in pendingTransactions)
                    {
                        transaction.Status = PaymentTransactionStatus.Failed;
                        transaction.ResponseCode = string.IsNullOrWhiteSpace(transaction.ResponseCode)
                            ? "EXPIRED"
                            : transaction.ResponseCode;
                    }

                    await context.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation(
                        "Invoice {InvoiceId} was auto-cancelled due to VNPay payment timeout. Marked {Count} transactions as Failed.",
                        invoiceId,
                        pendingTransactions.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while cleaning up expired VNPay pending payments.");
            }
        }
    }
}


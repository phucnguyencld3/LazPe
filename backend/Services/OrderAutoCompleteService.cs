using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class OrderAutoCompleteService : BackgroundService
    {
        private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(1); // Chạy kiểm tra mỗi 1 giờ

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<OrderAutoCompleteService> _logger;

        public OrderAutoCompleteService(
            IServiceScopeFactory scopeFactory,
            ILogger<OrderAutoCompleteService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("OrderAutoCompleteService background service starting.");

            // Chạy kiểm tra lần đầu tiên khi khởi động ứng dụng
            await ProcessAutoCompleteOrdersAsync(stoppingToken);

            using var timer = new PeriodicTimer(CheckInterval);
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ProcessAutoCompleteOrdersAsync(stoppingToken);
            }
        }

        private async Task ProcessAutoCompleteOrdersAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Bắt đầu tiến trình kiểm tra và tự động hoàn tất đơn hàng đang giao...");
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var invoiceService = scope.ServiceProvider.GetRequiredService<IInvoiceService>();
                await invoiceService.AutoCompleteShippedOrdersAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong quá trình tự động hoàn tất đơn hàng giao quá hạn.");
            }
        }
    }
}

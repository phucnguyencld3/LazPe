using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Services
{
    public class TrendModelTrainingJob
    {
        private readonly ITrendForecastingService _trendService;
        private readonly ILogger<TrendModelTrainingJob> _logger;

        public TrendModelTrainingJob(ITrendForecastingService trendService, ILogger<TrendModelTrainingJob> logger)
        {
            _trendService = trendService;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            _logger.LogInformation($"[{DateTime.Now}] Bắt đầu chạy Job huấn luyện AI mô hình Trend...");
            try
            {
                await _trendService.TrainTrendModelAsync();
                _logger.LogInformation($"[{DateTime.Now}] Hoàn thành Job huấn luyện AI mô hình Trend.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[{DateTime.Now}] Lỗi khi chạy Job huấn luyện AI mô hình Trend.");
            }
        }
    }
}

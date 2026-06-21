using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.ML;
using Microsoft.ML.Transforms.TimeSeries;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Services
{
    public class TrendForecastingService : ITrendForecastingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TrendForecastingService> _logger;
        private readonly string _modelPath;

        // Forecast parameters
        private const int WindowSize = 7;      // Tuần
        private const int SeriesLength = 30;   // Tháng
        private const int Horizon = 14;        // Số ngày dự đoán tương lai (2 tuần)

        public TrendForecastingService(ApplicationDbContext context, ILogger<TrendForecastingService> logger)
        {
            _context = context;
            _logger = logger;
            _modelPath = Path.Combine(Directory.GetCurrentDirectory(), "TrendModel.zip");
        }

        public async Task TrainTrendModelAsync()
        {
            _logger.LogInformation("Bắt đầu huấn luyện mô hình AI dự báo xu hướng...");

            try
            {
                // 1. Thu thập dữ liệu thực tế: Tổng số sản phẩm bán ra mỗi ngày trong 1 năm qua
                var startDate = DateTime.Now.AddYears(-1).Date;
                var rawData = await _context.InvoiceDetails
                    .Include(od => od.Invoice)
                    .Where(od => od.Invoice.CreatedAt >= startDate && od.Invoice.Status == PolyBabyAPI.Models.OrderStatus.Completed && od.Invoice.CreatedAt.HasValue)
                    .GroupBy(od => od.Invoice.CreatedAt.Value.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Quantity = (float)g.Sum(od => od.Quantity)
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                // Fill missing days with 0 quantity to ensure continuous time series
                var filledData = new List<TrendData>();
                if (rawData.Any())
                {
                    var currentDate = rawData.First().Date;
                    var endDate = rawData.Last().Date;

                    var rawDict = rawData.ToDictionary(x => x.Date, x => x.Quantity);

                    while (currentDate <= endDate)
                    {
                        filledData.Add(new TrendData
                        {
                            Quantity = rawDict.ContainsKey(currentDate) ? rawDict[currentDate] : 0f
                        });
                        currentDate = currentDate.AddDays(1);
                    }
                }

                if (filledData.Count < SeriesLength)
                {
                    _logger.LogWarning("Dữ liệu không đủ để huấn luyện AI (Yêu cầu ít nhất 30 ngày liên tục).");
                    return;
                }

                // 2. Thiết lập ML.NET
                MLContext mlContext = new MLContext();
                IDataView dataView = mlContext.Data.LoadFromEnumerable(filledData);

                // 3. Xây dựng Pipeline SSA Time Series Forecasting
                var pipeline = mlContext.Forecasting.ForecastBySsa(
                    outputColumnName: nameof(TrendPrediction.ForecastedQuantities),
                    inputColumnName: nameof(TrendData.Quantity),
                    windowSize: WindowSize,
                    seriesLength: SeriesLength,
                    trainSize: filledData.Count,
                    horizon: Horizon,
                    confidenceLevel: 0.95f,
                    confidenceLowerBoundColumn: nameof(TrendPrediction.LowerBoundQuantities),
                    confidenceUpperBoundColumn: nameof(TrendPrediction.UpperBoundQuantities)
                );

                // 4. Huấn luyện mô hình
                var model = pipeline.Fit(dataView);

                // 5. Lưu mô hình
                mlContext.Model.Save(model, dataView.Schema, _modelPath);

                _logger.LogInformation($"Huấn luyện thành công. Đã lưu model tại: {_modelPath}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi huấn luyện mô hình AI dự báo.");
            }
        }

        public async Task<AITrendResponseDto> GetTrendForecastAsync(StatisticsFilterDto filter)
        {
            var response = new AITrendResponseDto();

            try
            {
                // 1. Trả về dữ liệu quá khứ gần nhất (mặc định lấy 30 ngày)
                var endDate = DateTime.Now.Date;
                var startDate = endDate.AddDays(-30);

                var rawData = await _context.InvoiceDetails
                    .Include(od => od.Invoice)
                    .Where(od => od.Invoice.CreatedAt >= startDate && od.Invoice.Status == PolyBabyAPI.Models.OrderStatus.Completed && od.Invoice.CreatedAt.HasValue)
                    .GroupBy(od => od.Invoice.CreatedAt.Value.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Quantity = g.Sum(od => od.Quantity)
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                var rawDict = rawData.ToDictionary(x => x.Date, x => x.Quantity);
                var currentDate = startDate;
                while (currentDate <= endDate)
                {
                    response.HistoricalData.Add(new AITimeSeriesStatDto
                    {
                        TimeLabel = currentDate.ToString("dd/MM/yyyy"),
                        ProductsSoldCount = rawDict.ContainsKey(currentDate) ? rawDict[currentDate] : 0,
                        IsForecast = false
                    });
                    currentDate = currentDate.AddDays(1);
                }

                // 2. Sử dụng Model để dự đoán tương lai
                if (File.Exists(_modelPath))
                {
                    MLContext mlContext = new MLContext();
                    ITransformer trainedModel = mlContext.Model.Load(_modelPath, out var schema);
                    
                    // Create prediction engine
                    var forecastEngine = trainedModel.CreateTimeSeriesEngine<TrendData, TrendPrediction>(mlContext);
                    
                    // Predict
                    var forecast = forecastEngine.Predict();

                    if (forecast != null && forecast.ForecastedQuantities != null)
                    {
                        var predictDate = endDate.AddDays(1);
                        for (int i = 0; i < forecast.ForecastedQuantities.Length; i++)
                        {
                            var predictedQty = Math.Max(0, (int)Math.Round(forecast.ForecastedQuantities[i]));
                            var lower = Math.Max(0, (int)Math.Round(forecast.LowerBoundQuantities[i]));
                            var upper = Math.Max(0, (int)Math.Round(forecast.UpperBoundQuantities[i]));

                            response.ForecastData.Add(new AITimeSeriesStatDto
                            {
                                TimeLabel = predictDate.ToString("dd/MM/yyyy"),
                                ProductsSoldCount = predictedQty,
                                IsForecast = true,
                                LowerBoundProducts = lower,
                                UpperBoundProducts = upper
                            });
                            predictDate = predictDate.AddDays(1);
                        }
                    }
                }

                // 3. Tính toán các sản phẩm dự báo sẽ bán chạy (Momentum Score)
                // Lấy 7 ngày gần nhất (L7) và 7 ngày trước đó (P7)
                var l7Start = endDate.AddDays(-7);
                var p7Start = endDate.AddDays(-14);

                var recentSales = await _context.InvoiceDetails
                    .Include(od => od.Invoice)
                    .Include(od => od.Variant)
                    .ThenInclude(v => v.Product)
                    .Where(od => od.Invoice.CreatedAt >= p7Start && od.Invoice.Status == PolyBabyAPI.Models.OrderStatus.Completed && od.Invoice.CreatedAt.HasValue && od.Variant != null && od.Variant.Product != null)
                    .Select(od => new
                    {
                        od.Variant.Product.ProductID,
                        od.Variant.Product.ProductName,
                        od.Variant.Product.Code,
                        od.Quantity,
                        Date = od.Invoice.CreatedAt.Value.Date
                    })
                    .ToListAsync();

                var productGroup = recentSales.GroupBy(x => new { x.ProductID, x.ProductName, x.Code });
                
                foreach (var g in productGroup)
                {
                    var l7Sales = g.Where(x => x.Date >= l7Start).Sum(x => x.Quantity);
                    var p7Sales = g.Where(x => x.Date >= p7Start && x.Date < l7Start).Sum(x => x.Quantity);

                    if (l7Sales == 0 && p7Sales == 0) continue;

                    // Tính tỷ lệ tăng trưởng (Growth Rate)
                    decimal growthRate = 0;
                    if (p7Sales > 0)
                    {
                        growthRate = Math.Round(((decimal)(l7Sales - p7Sales) / p7Sales) * 100, 2);
                    }
                    else if (l7Sales > 0)
                    {
                        growthRate = 100; // Tăng trưởng 100% nếu kỳ trước không bán được
                    }

                    // Tính điểm Xu hướng (Trend Score) = (L7 * 0.7) + (GrowthRate * 0.3)
                    // Công thức ưu tiên khối lượng bán thực tế gần đây kết hợp với gia tốc tăng trưởng
                    decimal trendScore = (l7Sales * 0.7m) + (growthRate * 0.3m);

                    response.TrendingProducts.Add(new TrendingProductDto
                    {
                        ProductID = g.Key.ProductID,
                        ProductName = g.Key.ProductName,
                        ProductCode = g.Key.Code,
                        CurrentPeriodSales = l7Sales,
                        PreviousPeriodSales = p7Sales,
                        GrowthRate = growthRate,
                        TrendScore = trendScore
                    });
                }

                // Sắp xếp theo TrendScore giảm dần và lấy Top 5
                response.TrendingProducts = response.TrendingProducts
                    .Where(x => x.TrendScore > 0)
                    .OrderByDescending(x => x.TrendScore)
                    .Take(5)
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy dữ liệu dự đoán AI.");
            }

            return response;
        }
    }
}

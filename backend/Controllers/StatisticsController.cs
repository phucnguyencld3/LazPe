using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statisticsService;
        private readonly ITrendForecastingService _trendService;
        private readonly ILogger<StatisticsController> _logger;

        public StatisticsController(IStatisticsService statisticsService, ITrendForecastingService trendService, ILogger<StatisticsController> logger)
        {
            _statisticsService = statisticsService;
            _trendService = trendService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy báo cáo thống kê doanh thu tổng hợp (Dashboard KPI, Charts, Tops)
        /// </summary>
        [HttpGet("summary")]
        [Permission("Report.Read")]
        public async Task<IActionResult> GetSummary([FromQuery] StatisticsFilterDto filter)
        {
            try
            {
                _logger.LogInformation("Getting statistics summary report...");
                var report = await _statisticsService.GetRevenueReportAsync(filter);
                return Ok(new
                {
                    success = true,
                    data = report,
                    message = "Lấy dữ liệu thống kê thành công"
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error in statistics query");
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting statistics summary");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tính toán số liệu thống kê."
                });
            }
        }

        /// <summary>
        /// Lấy bảng thống kê chi tiết sản phẩm bán ra có phân trang
        /// </summary>
        [HttpGet("products-paginated")]
        [Permission("Report.Read")]
        public async Task<IActionResult> GetProductsPaginated(
            [FromQuery] StatisticsFilterDto filter,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string searchTerm = "")
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;

                var result = await _statisticsService.GetProductBreakdownPaginatedAsync(filter, page, pageSize, searchTerm);
                return Ok(new
                {
                    success = true,
                    data = result,
                    message = "Lấy danh sách chi tiết sản phẩm thành công"
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error in paginated statistics query");
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting paginated product statistics");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy danh sách chi tiết sản phẩm."
                });
            }
        }

        /// <summary>
        /// Xuất file Excel báo cáo thống kê doanh thu
        /// </summary>
        [HttpGet("export-excel")]
        [Authorize(Roles = "Admin")]
        [Permission("Report.Read")]
        public async Task<IActionResult> ExportExcel([FromQuery] StatisticsFilterDto filter)
        {
            try
            {
                _logger.LogInformation("Exporting statistics report to Excel...");
                var fileContents = await _statisticsService.ExportExcelAsync(filter);
                
                var fromStr = filter.FromDate?.ToString("yyyyMMdd") ?? DateTime.Today.AddMonths(-1).ToString("yyyyMMdd");
                var toStr = filter.ToDate?.ToString("yyyyMMdd") ?? DateTime.Today.ToString("yyyyMMdd");
                var fileName = $"BaoCaoDoanhThu_{fromStr}_to_{toStr}.xlsx";

                return File(
                    fileContents,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fileName
                );
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error in Excel export");
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error exporting statistics to Excel");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi xuất báo cáo Excel."
                });
            }
        }

        /// <summary>
        /// Lấy dữ liệu dự đoán AI Trend (Thực tế + Forecast)
        /// </summary>
        [HttpGet("ai-trends")]
        [Permission("Report.Read")]
        public async Task<IActionResult> GetAITrends([FromQuery] StatisticsFilterDto filter)
        {
            try
            {
                _logger.LogInformation("Getting AI trend forecast data...");
                var report = await _trendService.GetTrendForecastAsync(filter);
                return Ok(new
                {
                    success = true,
                    data = report,
                    message = "Lấy dữ liệu dự đoán AI thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting AI trends");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tính toán AI."
                });
            }
        }

        /// <summary>
        /// Huấn luyện lại mô hình AI Trend bằng tay
        /// </summary>
        [HttpPost("train-ai")]
        [Permission("Report.Read")]
        public async Task<IActionResult> TrainAITrendModel()
        {
            try
            {
                _logger.LogInformation("Manually triggering AI trend model training...");
                await _trendService.TrainTrendModelAsync();
                return Ok(new
                {
                    success = true,
                    message = "Đã huấn luyện lại mô hình AI thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi huấn luyện AI trend model.");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi huấn luyện AI."
                });
            }
        }
    }
}

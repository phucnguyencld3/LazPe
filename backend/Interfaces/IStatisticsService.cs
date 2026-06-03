using System.Threading.Tasks;
using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    public interface IStatisticsService
    {
        Task<RevenueReportResponseDto> GetRevenueReportAsync(StatisticsFilterDto filter);
        Task<PaginatedListDto<ProductStatDto>> GetProductBreakdownPaginatedAsync(StatisticsFilterDto filter, int page, int pageSize, string searchTerm);
        Task<byte[]> ExportExcelAsync(StatisticsFilterDto filter);
    }
}

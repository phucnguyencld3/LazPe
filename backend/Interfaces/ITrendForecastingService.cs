using System.Collections.Generic;
using System.Threading.Tasks;
using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    public interface ITrendForecastingService
    {
        Task TrainTrendModelAsync();
        Task<AITrendResponseDto> GetTrendForecastAsync(StatisticsFilterDto filter);
    }
}

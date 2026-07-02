using PolyBabyAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PolyBabyAPI.Interfaces
{
    public interface IBabyTrackerService
    {
        Task<BabyProfile?> GetTrackerDataAsync(int babyId);
        Task<bool> AddGrowthRecordAsync(int babyId, BabyGrowthRecord record);
        Task<bool> AddVaccinationRecordAsync(int babyId, VaccinationRecord record);
        Task<string> GetGrowthStatusAsync(int babyId);
        Task<List<Product>> GetRecommendedProductsAsync(int babyId);
    }
}

using System.Collections.Generic;
using System.Threading.Tasks;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface IBabyProfileService
    {
        Task<IEnumerable<BabyProfile>> GetByUserIdAsync(string userId);
        Task<BabyProfile?> GetByIdAsync(int id);
        Task<BabyProfile> AddAsync(BabyProfile baby);
        Task UpdateAsync(BabyProfile baby);
        Task DeleteAsync(int id);
    }
}

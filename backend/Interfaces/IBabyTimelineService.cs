using System.Threading.Tasks;
using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    public interface IBabyTimelineService
    {
        Task<TimelineResponseDto> GetBabyTimelineAsync(string userId, int babyProfileId);
    }
}

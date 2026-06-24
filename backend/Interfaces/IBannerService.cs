using PolyBabyAPI.DTOs;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface IBannerService
    {
        Task<IEnumerable<BannerDto>> GetAllBannersAsync(bool clientOnly = false);
        Task<BannerDto?> GetBannerByIdAsync(int id);
        Task<IEnumerable<BannerDto>> GetBannersByPositionAsync(string position, string page = "global");
        Task<BannerDto> SaveDraftAsync(CreateOrUpdateBannerRequest request);
        Task<BannerDto> UpdateDraftAsync(int id, CreateOrUpdateBannerRequest request);
        Task<bool> DeleteBannerAsync(int id);
        Task<bool> PublishBannerAsync(PublishBannerRequest request, string? userId);
        Task<bool> RollbackBannerAsync(RollbackBannerRequest request, string? userId);
        Task<IEnumerable<BannerVersionDto>> GetBannerVersionsAsync(int bannerId);
    }
}

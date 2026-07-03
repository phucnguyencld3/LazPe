using System.Threading.Tasks;
using PolyBabyAPI.DTOs;
using System.Collections.Generic;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interface
{
    public interface IAffiliateService
    {
        Task<bool> RegisterAffiliateAsync(string userId);
        Task<AffiliateLinkResponseDto> GenerateAffiliateLinkAsync(string userId, int productId);
        Task<bool> RecordClickAsync(string affiliateLinkCode);
        Task<AffiliateDashboardStatsDto?> GetDashboardStatsAsync(string userId);
        Task<List<AffiliateLinkResponseDto>> GetUserAffiliateLinksAsync(string userId);
        Task<bool> ProcessAffiliateRevenueAsync(string affiliateUserId, int invoiceId, decimal revenue);
    }
}

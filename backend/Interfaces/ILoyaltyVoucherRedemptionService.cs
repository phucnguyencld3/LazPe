using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    public interface ILoyaltyVoucherRedemptionService
    {
        Task<IEnumerable<LoyaltyVoucherRedemptionItemDto>> GetAvailableRedemptionVouchersAsync(string userId);
        Task<RedeemVoucherResultDto> RedeemVoucherAsync(string userId, int redemptionId);
    }
}

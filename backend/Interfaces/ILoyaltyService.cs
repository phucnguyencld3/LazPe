using PolyBabyAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PolyBabyAPI.Interface
{
    public interface ILoyaltyService
    {
        Task<LoyaltyProfile?> GetProfileAsync(string userId);
        Task<(IEnumerable<LoyaltyPointHistory> Items, int TotalCount)> GetPointsHistoryAsync(
            string userId, 
            string transactionType, 
            string filterPeriod, 
            int pageNumber, 
            int pageSize);
        
        Task<bool> EarnPointsAsync(string userId, int invoiceId, decimal totalPrice);
        Task<bool> EarnPendingPointsAsync(string userId, int invoiceId, decimal totalPrice, int holdDays = 7);
        Task<bool> UnlockExpiredPendingPointsAsync();
        Task<bool> CancelPendingPointsAsync(string userId, int invoiceId);
        Task<bool> RevokePointsAsync(string userId, int invoiceId);
        
        Task<bool> ValidatePointsRedemptionAsync(string userId, int pointsToUse, decimal cartSubtotal);
        Task<bool> ApplyPointsRedemptionAsync(string userId, int pointsToUse, int invoiceId);
        Task<bool> RefundPointsAsync(string userId, int pointsToUse, int invoiceId);
        Task<bool> AddPointsAsync(string userId, int amount, string transactionType, string description, int? invoiceId = null, bool addToTotalPoints = true);
        Task<decimal> CalculateRedemptionDiscountAsync(string userId, int pointsToUse);

        Task<PolyBabyAPI.DTOs.Loyaltydtos.DailyCheckInStatusResponse> GetCheckInStatusAsync(string userId);
        Task<PolyBabyAPI.DTOs.Loyaltydtos.DailyCheckInResultResponse> PerformDailyCheckInAsync(string userId);
    }
}

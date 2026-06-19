using System;

namespace PolyBabyAPI.DTOs
{
    public class Loyaltydtos
    {
        public class LoyaltyProfileResponse
        {
            public string UserID { get; set; } = string.Empty;
            public string FullName { get; set; } = string.Empty;
            public int AvailablePoints { get; set; }
            public int TotalPoints { get; set; }
            public int PointsToNextTier { get; set; }
            public int CurrentTierID { get; set; }
            public string CurrentTierName { get; set; } = string.Empty;
            public string CurrentTierDescription { get; set; } = string.Empty;
            public double ProgressPercentage { get; set; }
            public int RankAdjustmentOffset { get; set; }
            public DateTime LastUpdated { get; set; }
        }

        public class LoyaltyPointHistoryResponse
        {
            public long HistoryID { get; set; }
            public string TransactionType { get; set; } = string.Empty; // EARN, SPEND, REFUND, REVOKE, BONUS, RESET
            public int Amount { get; set; }
            public int? InvoiceID { get; set; }
            public string Description { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
        }

        public class ApplyPointsRedemptionRequest
        {
            public int PointsToUse { get; set; }
            public decimal CartSubtotal { get; set; }
        }

        public class ApplyPointsRedemptionResponse
        {
            public bool IsApplied { get; set; }
            public int PointsUsed { get; set; }
            public decimal DiscountAmount { get; set; }
            public string Message { get; set; } = string.Empty;
        }

        public class LoyaltyEarnPolicySummary
        {
            public int PolicyID { get; set; }
            public string Name { get; set; } = string.Empty;
            public decimal VndAmount { get; set; }
            public int PointsEarned { get; set; }
            public decimal Multiplier { get; set; }
            public bool IsCampaign { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? EndDate { get; set; }
            public bool IsFallback { get; set; }
        }

        public class LoyaltyRedeemPolicySummary
        {
            public int PolicyID { get; set; }
            public string Name { get; set; } = string.Empty;
            public int PointsToRedeem { get; set; }
            public decimal DiscountVnd { get; set; }
            public int? TierID { get; set; }
            public string TierName { get; set; } = string.Empty;
            public DateTime? StartDate { get; set; }
            public DateTime? EndDate { get; set; }
            public bool IsFallback { get; set; }
        }

        public class LoyaltyPolicySummaryResponse
        {
            public LoyaltyEarnPolicySummary EarnPolicy { get; set; } = new LoyaltyEarnPolicySummary();
            public LoyaltyRedeemPolicySummary RedeemPolicy { get; set; } = new LoyaltyRedeemPolicySummary();
        }

        public class DailyCheckInStatusResponse
        {
            public bool HasCheckedInToday { get; set; }
            public int CurrentStreak { get; set; }
            public int PointsForNextCheckIn { get; set; }
            public int[] RewardSequence { get; set; } = new int[7];
        }

        public class DailyCheckInResultResponse
        {
            public bool Success { get; set; }
            public string Message { get; set; } = string.Empty;
            public int PointsEarned { get; set; }
            public int NewStreak { get; set; }
            public int TotalPoints { get; set; }
        }
    }
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class RegisterAffiliateDto
    {
        // Add any specific fields if needed for registration, e.g. agrees to terms
        public bool AgreeToTerms { get; set; } = true;
    }

    public class AffiliateLinkResponseDto
    {
        public string AffiliateLinkCode { get; set; } = string.Empty;
        public string FullUrl { get; set; } = string.Empty;
        public int ProductId { get; set; }
        public string? ProductSlug { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductImage { get; set; } = string.Empty;
        public int ClickCount { get; set; }
        public int ConversionCount { get; set; }
        public decimal Revenue { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AffiliateDashboardStatsDto
    {
        public decimal MonthlyRevenue { get; set; }
        public decimal LifetimeRevenue { get; set; }
        public int AffiliatePoint { get; set; }
        public int TotalClicks { get; set; }
        public int TotalConversions { get; set; }
        public int RemainingRedeemCountThisMonth { get; set; } = 3;
        public bool HasPaymentPin { get; set; } = false;
        
        public List<AffiliateMilestoneProgressDto> Milestones { get; set; } = new();
    }

    public class AffiliateMilestoneProgressDto
    {
        public int MilestoneId { get; set; }
        public decimal RequiredRevenue { get; set; }
        public bool IsAchieved { get; set; }
        public DateTime? AchievedAt { get; set; }
        public string VoucherName { get; set; } = string.Empty;
    }

    public class AffiliateOrderDto
    {
        public string InvoiceCode { get; set; } = string.Empty;
        public DateTime CompletedAt { get; set; }
        public decimal Revenue { get; set; }
        public int PointsEarned { get; set; }
        public string ProductName { get; set; } = string.Empty;
    }

    public class RedeemAffiliatePointDto
    {
        [Required(ErrorMessage = "Số xu quy đổi không được để trống")]
        [Range(1000, 9999999, ErrorMessage = "Số xu rút từ 1.000 đến 9.999.999 xu")]
        public int PointsToRedeem { get; set; }

        [Required(ErrorMessage = "Mã PIN thanh toán không được để trống")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã PIN ví phải gồm đúng 6 chữ số")]
        public string PaymentPin { get; set; } = string.Empty;
    }

    public class RedeemAffiliatePointResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal NewWalletBalance { get; set; }
        public int RemainingPoints { get; set; }
        public int RemainingRedeemCountThisMonth { get; set; }
        public bool RequiresPinSetup { get; set; } = false;
        public bool IsLocked { get; set; } = false;
        public int FailedCount { get; set; } = 0;
    }
}

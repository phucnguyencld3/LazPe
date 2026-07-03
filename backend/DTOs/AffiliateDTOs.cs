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
}

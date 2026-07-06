namespace PolyBabyAPI.DTOs
{
    public class LoyaltyVoucherRedemptionItemDto
    {
        public int RedemptionId { get; set; }
        public int VoucherID { get; set; }
        public string VoucherCode { get; set; } = string.Empty;
        public string VoucherName { get; set; } = string.Empty;
        public decimal? DiscountAmount { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public int PointCost { get; set; }
        public int? TierID { get; set; }
        public string PeriodKey { get; set; } = string.Empty;
        public int? LimitPerUserPerPeriod { get; set; }
        public int RedeemedThisPeriod { get; set; }
        public int? RemainingQuota { get; set; }
        public bool CanRedeem { get; set; }
        public string? Reason { get; set; }
        public string ResetCycle { get; set; } = string.Empty;
    }

    public class RedeemVoucherResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int AvailablePoints { get; set; }
        public UserVoucherDto? UserVoucher { get; set; }
    }

    public class UserVoucherDto
    {
        public int UserVoucherID { get; set; }
        public int VoucherID { get; set; }
        public string IssuedCode { get; set; } = string.Empty;
    }
}

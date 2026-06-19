using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    // 1. LoyaltyProfile
    public class LoyaltyProfile
    {
        [Key]
        [ForeignKey(nameof(User))]
        public string UserID { get; set; } = string.Empty;

        public int CurrentTierID { get; set; } = 1;

        [ForeignKey(nameof(CurrentTierID))]
        [ValidateNever]
        public virtual LoyaltyTier? Tier { get; set; }

        public int AvailablePoints { get; set; } = 0;

        public int TotalPoints { get; set; } = 0;

        public int PointsToNextTier { get; set; } = 30000;

        public int RankAdjustmentOffset { get; set; } = 0;

        public int CurrentCheckInStreak { get; set; } = 0;

        public DateTime? LastCheckInDate { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.Now;

        [ValidateNever]
        public virtual ApplicationUser? User { get; set; }
    }

    // 2. LoyaltyTier
    public class LoyaltyTier
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TierID { get; set; }

        [Required]
        [MaxLength(100)]
        public string TierName { get; set; } = string.Empty;

        [Required]
        public int MinPoints { get; set; } = 0;

        [Required]
        [MaxLength(50)]
        public string ColorHex { get; set; } = "#64748b";

        [Required]
        [MaxLength(200)]
        public string BadgeIcon { get; set; } = "default-badge";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }

    // 3. LoyaltyTierPrivilege
    public class LoyaltyTierPrivilege
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PrivilegeID { get; set; }

        [Required]
        public int TierID { get; set; }

        [ForeignKey(nameof(TierID))]
        public virtual LoyaltyTier? Tier { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string PrivilegeType { get; set; } = string.Empty; // VOUCHER, FREESHIP, DISCOUNT, CASHBACK, SUPPORT, BIRTHDAY_GIFT

        [MaxLength(500)]
        public string? Value { get; set; }

        public bool IsActive { get; set; } = true;

        [Required]
        [MaxLength(256)]
        public string CreatedBy { get; set; } = "System";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // 4. LoyaltyEarnPolicy
    public class LoyaltyEarnPolicy
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PolicyID { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal VndAmount { get; set; } = 1000.00m;

        public int PointsEarned { get; set; } = 10;

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsCampaign { get; set; } = false;

        [Column(TypeName = "decimal(5,2)")]
        public decimal Multiplier { get; set; } = 1.00m;

        [Required]
        [MaxLength(256)]
        public string CreatedBy { get; set; } = "System";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // 5. LoyaltyRedeemPolicy
    public class LoyaltyRedeemPolicy
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PolicyID { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public int PointsToRedeem { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountVnd { get; set; } = 1.00m;

        public int? TierID { get; set; }

        [ForeignKey(nameof(TierID))]
        public virtual LoyaltyTier? Tier { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public bool IsActive { get; set; } = true;

        [Required]
        [MaxLength(256)]
        public string CreatedBy { get; set; } = "System";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // 6. LoyaltyPointHistory
    public class LoyaltyPointHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long HistoryID { get; set; }

        [Required]
        public string UserID { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string TransactionType { get; set; } = string.Empty; // EARN, SPEND, REFUND, REVOKE, BONUS, RESET

        public int Amount { get; set; }

        public int? InvoiceID { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey(nameof(UserID))]
        [ValidateNever]
        public virtual LoyaltyProfile? Profile { get; set; }

        [ForeignKey(nameof(InvoiceID))]
        [ValidateNever]
        public virtual Invoice? Invoice { get; set; }
    }

    // 7. LoyaltyMonthlyVoucher
    public class LoyaltyMonthlyVoucher
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int VoucherConfigID { get; set; }

        [Required]
        public int TierID { get; set; }

        [ForeignKey(nameof(TierID))]
        public virtual LoyaltyTier? Tier { get; set; }

        [Required]
        public int VoucherCount { get; set; } = 1;

        [Required]
        public int DiscountType { get; set; } = 1; // 1: Percent, 2: Fixed VND

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountValue { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal MinOrderValue { get; set; } = 0m;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal MaxDiscount { get; set; } = 0m;

        [Required]
        public int ValidityDays { get; set; } = 30;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // 8. LoyaltyManualRevocation
    public class LoyaltyManualRevocation
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RevocationID { get; set; }

        [Required]
        public string UserID { get; set; } = string.Empty;

        [ForeignKey(nameof(UserID))]
        public virtual ApplicationUser? User { get; set; }

        [Required]
        public int Amount { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [MaxLength(450)]
        public string AuditorID { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // 9. LoyaltyAuditLog
    public class LoyaltyAuditLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long LogID { get; set; }

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty; // CREATE_TIER, UPDATE_TIER, UPDATE_POLICY, REVOKE_POINTS, etc.

        [Required]
        [MaxLength(450)]
        public string ActorID { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string ActorEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string EntityName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string EntityID { get; set; } = string.Empty;

        public string? OldValue { get; set; }

        public string? NewValue { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.Now;
    }

    // 10. LoyaltyBirthdayGiftLog
    public class LoyaltyBirthdayGiftLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int GiftLogID { get; set; }

        [Required]
        [MaxLength(450)]
        public string UserID { get; set; } = string.Empty;

        [ForeignKey(nameof(UserID))]
        public virtual ApplicationUser? User { get; set; }

        [Required]
        public int Year { get; set; }

        [Required]
        [MaxLength(50)]
        public string GiftType { get; set; } = string.Empty; // VOUCHER, POINTS, COINS, PHYSICAL

        [Required]
        [MaxLength(200)]
        public string GiftValue { get; set; } = string.Empty; // Voucher Code, Points amount, Coins, or Gift Name

        [Required]
        [MaxLength(256)]
        public string IssuedBy { get; set; } = "System";

        public DateTime ReceivedAt { get; set; } = DateTime.Now;
    }

    // 11. LoyaltySetting
    public class LoyaltySetting
    {
        [Key]
        public int Id { get; set; } = 1;

        public bool EnableReviewReward { get; set; } = true;
        public int ReviewRewardPoints { get; set; } = 200;
        public int MinimumReviewWords { get; set; } = 50;
        public int RequiredRatingForReward { get; set; } = 5;
        public bool AllowMultipleRewardsPerProduct { get; set; } = false;

        public int ReviewWithImageRewardPoints { get; set; } = 300;
        public int ReviewWithVideoRewardPoints { get; set; } = 500;
        public int MinimumReviewChars { get; set; } = 100;
        public int AllowEditReviewTimeLimitMinutes { get; set; } = 30;
        public int MaxReviewDaysAfterReceipt { get; set; } = 30;
        public bool RequireDeliveryToReview { get; set; } = true;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}


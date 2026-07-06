using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public enum RedemptionResetCycle
    {
        None = 0,
        Monthly = 1
    }

    public class LoyaltyVoucherRedemption
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int VoucherID { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int PointCost { get; set; }

        public int? TierID { get; set; }

        public int? LimitPerUserPerPeriod { get; set; }

        public int? TotalQuotaPerPeriod { get; set; }

        public RedemptionResetCycle ResetCycle { get; set; } = RedemptionResetCycle.None;
        
        public int? ResetDayOfMonth { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(VoucherID))]
        [ValidateNever]
        public virtual Voucher? Voucher { get; set; }

        [ForeignKey(nameof(TierID))]
        [ValidateNever]
        public virtual LoyaltyTier? Tier { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public class LoyaltyVoucherRedemptionHistory
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string UserID { get; set; } = string.Empty;

        [Required]
        public int VoucherID { get; set; }

        public int? UserVoucherID { get; set; }

        [Required]
        public int PointCost { get; set; }

        [Required]
        [MaxLength(20)]
        public string PeriodKey { get; set; } = string.Empty;

        public DateTime RedeemedAt { get; set; } = DateTime.Now;

        [ForeignKey(nameof(UserID))]
        [ValidateNever]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey(nameof(VoucherID))]
        [ValidateNever]
        public virtual Voucher? Voucher { get; set; }

        [ForeignKey(nameof(UserVoucherID))]
        [ValidateNever]
        public virtual UserVoucher? UserVoucher { get; set; }
    }
}

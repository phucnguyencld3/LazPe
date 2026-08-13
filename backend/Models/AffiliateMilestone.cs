using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public class AffiliateMilestone
    {
        [Key]
        public int MilestoneId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal RequiredRevenue { get; set; }

        public int VoucherId { get; set; }

        [ForeignKey(nameof(VoucherId))]
        [ValidateNever]
        public virtual Voucher? RewardVoucher { get; set; }

        public bool IsActive { get; set; } = true;
    }
}

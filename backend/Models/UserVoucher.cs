using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public enum UserVoucherStatus
    {
        Unused = 0,
        Used = 1,
        Expired = 2
    }

    public enum UserVoucherSource
    {
        PublicSaved = 1,
        ExclusiveCode = 2,
        DirectAssigned = 3
    }

    public class UserVoucher
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UserVoucherID { get; set; }

        public string UserID { get; set; } = string.Empty;
        public int VoucherID { get; set; }
        public int? InvoiceID { get; set; }

        public UserVoucherStatus Status { get; set; } = UserVoucherStatus.Unused;
        public UserVoucherSource SourceType { get; set; }

        public DateTime CollectedAt { get; set; } = DateTime.Now;
        public DateTime? UsedAt { get; set; }

        [ForeignKey(nameof(UserID))]
        [ValidateNever]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey(nameof(VoucherID))]
        [ValidateNever]
        public virtual Voucher? Voucher { get; set; }

        [ForeignKey(nameof(InvoiceID))]
        [ValidateNever]
        public virtual Invoice? Invoice { get; set; }
    }
}

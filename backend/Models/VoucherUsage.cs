using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class VoucherUsage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int VoucherID { get; set; }
        public string UserID { get; set; }
        public int? InvoiceID { get; set; }
        public int? CartID { get; set; }

        [Display(Name = "Ngày sử dụng")]
        public DateTime UsedAt { get; set; } = DateTime.Now;

        // Thêm số tiền giảm thực tế khi áp dụng voucher
        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Số tiền giảm")]
        public decimal DiscountAmount { get; set; }

        // Thêm giá trị đơn hàng tại thời điểm sử dụng (để lưu lịch sử)
        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Giá trị đơn hàng")]
        public decimal OrderValue { get; set; }

        // Navigation
        [ForeignKey(nameof(VoucherID))]
        [ValidateNever]
        public virtual Voucher Voucher { get; set; }

        [ForeignKey(nameof(UserID))]
        [ValidateNever]
        public virtual ApplicationUser User { get; set; }

        [ForeignKey(nameof(InvoiceID))]
        [ValidateNever]
        public virtual Invoice? Invoice { get; set; }

        [ForeignKey(nameof(CartID))]
        [ValidateNever]
        public virtual Cart? Cart { get; set; }
    }
}
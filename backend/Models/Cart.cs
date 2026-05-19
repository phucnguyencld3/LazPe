using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class Cart
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CartID { get; set; }

        public string UserID { get; set; }

        public int? VoucherID { get; set; }

        [Display(Name = "Ngày tạo")]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tạm tính")]
        public decimal SubTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tiền giảm")]
        public decimal DiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tổng tiền")]
        public decimal TotalAmount { get; set; }

        [Display(Name = "Trạng thái")]
        public bool Status { get; set; }

        [ForeignKey(nameof(UserID))]
        public virtual ApplicationUser User { get; set; }

        [ForeignKey(nameof(VoucherID))]
        [ValidateNever]
        public virtual Voucher? Voucher { get; set; }

        public virtual ICollection<CartDetail> CartDetails { get; set; } = new List<CartDetail>();
    }
}
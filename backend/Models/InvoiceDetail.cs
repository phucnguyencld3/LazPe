using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class InvoiceDetail
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InvoiceDetailID { get; set; }

        [Required(ErrorMessage = "Mã hóa đơn không được để trống")]
        public int InvoiceID { get; set; }

        [ForeignKey(nameof(InvoiceID))]
        [ValidateNever]
        public Invoice Invoice { get; set; }

        public int? BundleID { get; set; }

        [ForeignKey(nameof(BundleID))]
        [ValidateNever]
        public Bundle Bundle { get; set; }

        public int? VariantID { get; set; }

        [ForeignKey(nameof(VariantID))]
        [ValidateNever]
        public Variant Variant { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá không hợp lệ")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        public string? FromWishlistUserID { get; set; }
    }
}

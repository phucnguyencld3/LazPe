using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public class Variant
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int VariantID { get; set; }

        [Required(ErrorMessage = "Mã sản phẩm không được để trống")]
        public int ProductID { get; set; }

        [ForeignKey(nameof(ProductID))]
        [ValidateNever]
        public Product Product { get; set; }

        [Required(ErrorMessage = "Tên biến thể không được để trống")]
        [MaxLength(300, ErrorMessage = "Tên biến thể tối đa 300 ký tự")]
        public string VariantName { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá không hợp lệ")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        [Range(0, 100, ErrorMessage = "Giảm giá biến thể phải từ 0 đến 100")]
        public decimal VariantDiscountPercent { get; set; } = 0;

        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho không hợp lệ")]
        public int Stock { get; set; }

        [MaxLength(100, ErrorMessage = "SKU tối đa 100 ký tự")]
        public string SKU { get; set; }

        public string? ImageUrl { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập mô tả")]
        [MaxLength(500, ErrorMessage = "Mô tả tối đa 1000 ký tự")]
        public string Description { get; set; }

        // ✅ SỬA: CreatedAt thay vì CreateDate
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [MaxLength(100, ErrorMessage = "Người tạo tối đa 100 ký tự")]
        public string CreatedBy { get; set; }

        public bool Status { get; set; } = true;

        public virtual ICollection<VariantOptionValue> VariantOptionValues { get; set; } = new List<VariantOptionValue>();
        public virtual ICollection<BundleItem> BundleItems { get; set; } = new List<BundleItem>();
        public virtual ICollection<CartDetail> CartDetails { get; set; } = new List<CartDetail>();

        [ValidateNever]
        public virtual ICollection<InvoiceDetail> InvoiceDetails { get; set; } = new List<InvoiceDetail>();
    }
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public class ProductOptionValue
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProductOptionValueID { get; set; }
        public int ProductOptionID { get; set; }

        [ForeignKey(nameof(ProductOptionID))]
        [ValidateNever]
        public ProductOption ProductOption { get; set; }

        [Required(ErrorMessage = "Giá trị thuộc tính không được để trống")]
        [MaxLength(50, ErrorMessage = "Giá trị tối đa 50 ký tự")]
        [Display(Name = "Tên thuộc tính")]
        public string Value { get; set; }

        // ✅ THÊM: DisplayOrder property
        [Range(1, int.MaxValue, ErrorMessage = "Thứ tự phải lớn hơn 0")]
        [Display(Name = "Thứ tự hiển thị")]
        public int DisplayOrder { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue, ErrorMessage = "Giá không hợp lệ")]
        [Display(Name = "Giá thêm")]
        public decimal Price { get; set; } = 0;

        [Display(Name = "Ngày tạo")]
        public DateTime? CreatedAt { get; set; } = DateTime.Now;

        [MaxLength(100, ErrorMessage = "Người tạo tối đa 100 ký tự")]
        [Display(Name = "Người tạo")]
        public string CreatedBy { get; set; }

        [ValidateNever]
        public virtual ICollection<VariantOptionValue> VariantOptionValues { get; set; } = new List<VariantOptionValue>();
    }
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public class ProductOption
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProductOptionID { get; set; }
        public int ProductID { get; set; }

        [Required(ErrorMessage = "Tên tùy chọn là bắt buộc")]
        [StringLength(100)]
        [Display(Name = "Tên tùy chọn")]
        public string Name { get; set; }

        // ✅ THÊM: DisplayOrder property
        [Range(1, int.MaxValue, ErrorMessage = "Thứ tự phải lớn hơn 0")]
        [Display(Name = "Thứ tự hiển thị")]
        public int DisplayOrder { get; set; } = 1;

        [Display(Name = "Ngày tạo")]
        public DateTime? CreatedAt { get; set; } = DateTime.Now;

        [StringLength(100)]
        [Display(Name = "Người tạo")]
        public string CreatedBy { get; set; }

        // Navigation
        [ForeignKey(nameof(ProductID))]
        [ValidateNever]
        public virtual Product Product { get; set; }

        public virtual ICollection<ProductOptionValue> ProductOptionValues { get; set; } = new List<ProductOptionValue>();
    }
}



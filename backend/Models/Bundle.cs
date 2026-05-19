using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class Bundle
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int BundleID { get; set; }

        [Required(ErrorMessage = "Tên combo không được để trống")]
        [MaxLength(300, ErrorMessage = "Tên combo tối đa 300 ký tự")]
        [Display(Name = "Tên combo")]
        public string Name { get; set; }

        [MaxLength(10, ErrorMessage = "Mã nội bộ tối đa 100 ký tự")]
        public string? Code { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập mô tả cho combo")]
        [MaxLength(500, ErrorMessage = "Mô tả tối đa 1000 ký tự")]
        [Display(Name = "Mô tả")]
        public string? Description { get; set; }

        /// <summary>
        /// Giá bán thực tế (sau giảm giá). Tự động tính = OriginalPrice * (1 - DiscountPercent/100)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Giá")]
        public decimal? Price { get; set; }

        /// <summary>
        /// Giá gốc = tổng (variant.UnitPrice * quantity) của tất cả BundleItems
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Giá gốc")]
        public decimal? OriginalPrice { get; set; }

        /// <summary>
        /// % giảm giá (0-100). Giá bán = OriginalPrice * (1 - DiscountPercent / 100)
        /// </summary>
        [Range(0, 100, ErrorMessage = "Phần trăm giảm giá phải từ 0 đến 100")]
        [Column(TypeName = "decimal(5,2)")]
        [Display(Name = "% giảm giá")]
        public decimal DiscountPercent { get; set; } = 0;

        [Display(Name = "Hình ảnh đại diện")]
        public string? ImageUrl { get; set; }

        [Display(Name = "Trạng thái")]
        public bool Status { get; set; } = true;

        [Display(Name = "Ngày tạo")]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [Display(Name = "Ngày cập nhật")]
        public DateTime? UpdatedDate { get; set; }

        [Display(Name = "Người tạo")]
        [MaxLength(450)]
        public string? CreatedBy { get; set; }

        [Display(Name = "Người cập nhật")]
        [MaxLength(450)]
        public string? UpdatedBy { get; set; }

        [ValidateNever]
        public virtual ICollection<BundleItem> BundleItems { get; set; } = new List<BundleItem>();

        [ValidateNever]
        public virtual ICollection<InvoiceDetail> InvoiceDetails { get; set; } = new List<InvoiceDetail>();

        [ValidateNever]
        public virtual ICollection<CartDetail> CartDetails { get; set; } = new List<CartDetail>();
    }
}
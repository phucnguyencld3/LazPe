using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace PolyBabyAPI.Models
{
    [Index(nameof(Slug), IsUnique = true)]
    public class Product
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProductID { get; set; }

        public int CategoryID { get; set; }
        public int SupplierID { get; set; }

        [StringLength(50)]
        public string Code { get; set; }

        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
        [StringLength(200)]
        [Display(Name = "Tên sản phẩm")]
        public string ProductName { get; set; }

        [Required(ErrorMessage = "Mô tả sản phẩm là bắt buộc")]
        [Display(Name = "Mô tả")]
        public string Description { get; set; } = string.Empty;

        [Display(Name = "Thông số kỹ thuật (JSON)")]
        public string? Specifications { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Giá")]
        public decimal Price { get; set; } = 0;

        [Column(TypeName = "decimal(5,2)")]
        [Range(0, 100, ErrorMessage = "Giảm giá sản phẩm phải từ 0 đến 100")]
        [Display(Name = "Giảm giá sản phẩm (%)")]
        public decimal ProductDiscountPercent { get; set; } = 0;

        [Display(Name = "Tồn kho")]
        public int Stock { get; set; } = 0;

        [Display(Name = "Trạng thái")]
        public bool Status { get; set; } = true;

        [Display(Name = "Ngày tạo")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string CreatedBy { get; set; }

        // SEO Optimization
        [StringLength(255)]
        [Display(Name = "Đường dẫn thân thiện (Slug)")]
        public string? Slug { get; set; }

        [StringLength(255)]
        [Display(Name = "Tiêu đề SEO")]
        public string? MetaTitle { get; set; }

        [StringLength(500)]
        [Display(Name = "Mô tả SEO")]
        public string? MetaDescription { get; set; }

        // Rating Cache
        [Display(Name = "Điểm đánh giá trung bình")]
        public double AverageRating { get; set; } = 0;

        [Display(Name = "Số lượng đánh giá")]
        public int ReviewCount { get; set; } = 0;

        // Soft Delete
        [Display(Name = "Đã xóa")]
        public bool IsDeleted { get; set; } = false;

        // Navigation
        [ForeignKey(nameof(CategoryID))]
        public virtual Categories? Category { get; set; }

        [ForeignKey(nameof(SupplierID))]
        public virtual Supplier? Supplier { get; set; }


        // ✅ Thêm navigation property thiếu
        public virtual ICollection<Variant>? Variants { get; set; } = new List<Variant>();
        public virtual ICollection<ProductOption> ProductOptions { get; set; } = new List<ProductOption>();
        public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    }
}
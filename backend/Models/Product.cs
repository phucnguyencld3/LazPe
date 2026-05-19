using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
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
        [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        [Display(Name = "Mô tả")]
        public string Description { get; set; } = string.Empty;

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

        // Navigation
        [ForeignKey(nameof(CategoryID))]
        public virtual Categories? Category { get; set; }

        [ForeignKey(nameof(SupplierID))]
        public virtual Supplier? Supplier { get; set; }

        [NotMapped]
        public int TotalStock => Variants?.Sum(v => v.Stock) ?? 0;

        [NotMapped]
        public decimal MinPrice
        {
            get
            {
                var activeVariants = Variants?.Where(v => v.Status).ToList();
                return activeVariants?.Any() == true ? activeVariants.Min(v => v.UnitPrice) : 0;
            }
        }

        [NotMapped]
        public decimal MaxPrice
        {
            get
            {
                var activeVariants = Variants?.Where(v => v.Status).ToList();
                return activeVariants?.Any() == true ? activeVariants.Max(v => v.UnitPrice) : 0;
            }
        }


        // ✅ Thêm navigation property thiếu
        public virtual ICollection<Variant>? Variants { get; set; } = new List<Variant>();
        public virtual ICollection<ProductOption> ProductOptions { get; set; } = new List<ProductOption>();
    }
}
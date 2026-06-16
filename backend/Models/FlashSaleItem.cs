using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public enum FlashSaleItemType
    {
        Product = 1,
        Variant = 2,
        Bundle = 3
    }

    public enum DiscountType
    {
        FixedPrice = 0,
        Percentage = 1,
        FreeGift = 2
    }

    public class FlashSaleItem
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int FlashSaleId { get; set; }

        [ForeignKey(nameof(FlashSaleId))]
        [ValidateNever]
        public virtual FlashSale FlashSale { get; set; }

        [Required]
        [Display(Name = "Loại đối tượng giảm giá")]
        public FlashSaleItemType ItemType { get; set; }

        [Required]
        [Display(Name = "ID đối tượng")]
        public int ReferenceId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Giá/Mức khuyến mãi")]
        public decimal DiscountPrice { get; set; }

        [Display(Name = "Loại khuyến mãi")]
        public DiscountType DiscountType { get; set; } = DiscountType.FixedPrice;

        [Display(Name = "Số lượng yêu cầu (Mua X)")]
        public int RequiredQuantity { get; set; } = 1;

        [Display(Name = "Danh sách ID quà tặng (Nếu có)")]
        public string? GiftVariantIds { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        [Display(Name = "Tổng số lượng dành cho Flash Sale")]
        public int TotalQuantity { get; set; }

        [Display(Name = "Số lượng đã bán")]
        public int SoldQuantity { get; set; } = 0;

        [Display(Name = "Giới hạn mua tối đa mỗi khách (0 = không giới hạn)")]
        public int MaxQuantityPerUser { get; set; } = 0;
    }
}

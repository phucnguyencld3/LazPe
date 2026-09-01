using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.DTOs
{
    public class CreateFlashSaleDto
    {
        [Required(ErrorMessage = "Tên chiến dịch là bắt buộc")]
        [MaxLength(200, ErrorMessage = "Tên chiến dịch tối đa 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Thời gian bắt đầu là bắt buộc")]
        public DateTime StartTime { get; set; }

        [Required(ErrorMessage = "Thời gian kết thúc là bắt buộc")]
        public DateTime EndTime { get; set; }

        public CampaignType Type { get; set; } = CampaignType.FlashSale;

        public string? BannerUrl { get; set; }

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public List<CreateFlashSaleItemDto> FlashSaleItems { get; set; } = new();
    }

    public class CreateFlashSaleItemDto
    {
        [Required(ErrorMessage = "Loại đối tượng giảm giá là bắt buộc")]
        public FlashSaleItemType ItemType { get; set; }

        [Required(ErrorMessage = "ID đối tượng là bắt buộc")]
        public int ReferenceId { get; set; }

        [Required(ErrorMessage = "Giá/Mức khuyến mãi là bắt buộc")]
        [Range(0, double.MaxValue, ErrorMessage = "Mức khuyến mãi phải lớn hơn hoặc bằng 0")]
        public decimal DiscountPrice { get; set; }

        public DiscountType DiscountType { get; set; } = DiscountType.FixedPrice;

        public int RequiredQuantity { get; set; } = 1;

        public List<int>? GiftVariantIds { get; set; }

        [Required(ErrorMessage = "Tổng số lượng sản phẩm Sale là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Tổng số lượng phải lớn hơn 0")]
        public int TotalQuantity { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số lượng giới hạn mua phải lớn hơn hoặc bằng 0")]
        public int MaxQuantityPerUser { get; set; } = 0;
    }

    public class UpdateFlashSaleDto
    {
        [Required(ErrorMessage = "Tên chiến dịch là bắt buộc")]
        [MaxLength(200, ErrorMessage = "Tên chiến dịch tối đa 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Thời gian bắt đầu là bắt buộc")]
        public DateTime StartTime { get; set; }

        [Required(ErrorMessage = "Thời gian kết thúc là bắt buộc")]
        public DateTime EndTime { get; set; }

        public CampaignType Type { get; set; } = CampaignType.FlashSale;

        public string? BannerUrl { get; set; }

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public List<CreateFlashSaleItemDto> FlashSaleItems { get; set; } = new();
    }

    public class FlashSaleResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public CampaignType Type { get; set; }
        public string? BannerUrl { get; set; }
        public string? Description { get; set; }
        public FlashSaleStatus Status { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public List<FlashSaleItemResponseDto> FlashSaleItems { get; set; } = new();
    }

    public class FlashSaleItemResponseDto
    {
        public int Id { get; set; }
        public int FlashSaleId { get; set; }
        public FlashSaleItemType ItemType { get; set; }
        public int ReferenceId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? SKU { get; set; }
        public string? ImageUrl { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal DiscountPrice { get; set; }
        public DiscountType DiscountType { get; set; }
        public int RequiredQuantity { get; set; }
        public List<int>? GiftVariantIds { get; set; }
        public List<string>? GiftNames { get; set; }
        public List<string>? GiftImageUrls { get; set; }
        public int TotalQuantity { get; set; }
        public int SoldQuantity { get; set; }
        public int MaxQuantityPerUser { get; set; }
        public int UserPurchasedQuantity { get; set; }
        public int? ProductId { get; set; }
        public double? Rating { get; set; }
        public int? ReviewCount { get; set; }
    }
}

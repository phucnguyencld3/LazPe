using System;
using System.ComponentModel.DataAnnotations;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.DTOs.ProductAlert
{
    public class CreateProductAlertDto
    {
        [Required]
        public int ProductId { get; set; }
        
        public int? VariantId { get; set; }

        [Required]
        public ProductAlertType AlertType { get; set; }

        public decimal? TargetPrice { get; set; }
    }

    public class ProductAlertDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public int? VariantId { get; set; }
        public string? VariantName { get; set; }
        public ProductAlertType AlertType { get; set; }
        public decimal? TargetPrice { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastNotifiedAt { get; set; }
    }
}

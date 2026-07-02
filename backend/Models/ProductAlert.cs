using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public enum ProductAlertType
    {
        PriceDrop,
        BackInStock
    }

    public class ProductAlert
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public int ProductId { get; set; }

        public int? VariantId { get; set; }

        [Required]
        public ProductAlertType AlertType { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? TargetPrice { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? LastNotifiedAt { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; } = null!;

        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;

        [ForeignKey("VariantId")]
        public virtual Variant? Variant { get; set; }
    }
}

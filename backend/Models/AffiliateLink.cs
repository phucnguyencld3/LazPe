using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public class AffiliateLink
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string AffiliateLinkCode { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        [ValidateNever]
        public virtual ApplicationUser? User { get; set; }

        [Required]
        public int ProductId { get; set; }

        [ForeignKey(nameof(ProductId))]
        [ValidateNever]
        public virtual Product? Product { get; set; }

        public int ClickCount { get; set; } = 0;

        public int ConversionCount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Revenue { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? LastClickedAt { get; set; }

        public bool IsActive { get; set; } = true;
    }
}

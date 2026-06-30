using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class Wishlist
    {
        [Required]
        public string UserID { get; set; }

        [ForeignKey("UserID")]
        public virtual ApplicationUser User { get; set; }

        [Required]
        public int ProductID { get; set; }

        [ForeignKey("ProductID")]
        public virtual Product Product { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public int QuantityNeeded { get; set; } = 1;
        public int QuantityPurchased { get; set; } = 0;
        public string? Note { get; set; }
        public string? Priority { get; set; } = "Medium";
    }
}

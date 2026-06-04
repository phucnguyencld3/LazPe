using PolyBabyAPI.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class Review
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ReviewID { get; set; }

        public string UserID { get; set; }
        public int VariantID { get; set; }
        public int? BundleID { get; set; }

        [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao")]
        [Display(Name = "Đánh giá")]
        public int Rating { get; set; } = 0; // Default to 0 stars

        [StringLength(500)]
        [Display(Name = "Nội dung đánh giá")]
        public string Content { get; set; }
        
        [Display(Name = "Ngày tạo")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public bool IsHidden { get; set; }

        public bool HasEarnedRewardPoints { get; set; } = false;
        public int LoyaltyPointsEarned { get; set; } = 0;

        // Navigation
        public virtual ApplicationUser User { get; set; }
        public virtual Variant Variant { get; set; }
        public virtual Bundle Bundle { get; set; }
        public virtual ICollection<ReviewLike> ReviewLikes { get; set; }
        public virtual ICollection<ReviewComment> ReviewComments { get; set; }
    }
}

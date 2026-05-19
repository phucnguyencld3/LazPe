using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class ReviewLike
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int LikeID { get; set; }

        public int ReviewID { get; set; }
        public string UserID { get; set; }
        [Display(Name = "Ngày tạo")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation
        public virtual Review Review { get; set; }
        public virtual ApplicationUser User { get; set; }
    }
}

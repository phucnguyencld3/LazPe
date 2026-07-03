using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class ReviewMedia
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MediaID { get; set; }

        [Required]
        public int ReviewID { get; set; }

        [ForeignKey(nameof(ReviewID))]
        public virtual Review? Review { get; set; }

        [Required]
        [MaxLength(2048)]
        public string Url { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string MediaType { get; set; } = "IMAGE"; // IMAGE, VIDEO

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class ReviewCensorshipLog
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int LogID { get; set; }

        [Required]
        public int ReviewID { get; set; }

        [ForeignKey(nameof(ReviewID))]
        public virtual Review? Review { get; set; }

        [Required]
        [MaxLength(450)]
        public string ActorID { get; set; } = string.Empty;

        [ForeignKey(nameof(ActorID))]
        public virtual ApplicationUser? Actor { get; set; }

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty; // HIDE, RESTORE

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.Now;
    }
}

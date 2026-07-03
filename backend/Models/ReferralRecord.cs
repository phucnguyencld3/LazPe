using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class ReferralRecord
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ReferrerId { get; set; } = string.Empty;

        [Required]
        public string ReferredUserId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public bool IsPermanentlyActive { get; set; } = false;

        public bool HasCompletedFirstOrder { get; set; } = false;

        [ForeignKey("ReferrerId")]
        public virtual ApplicationUser? Referrer { get; set; }

        [ForeignKey("ReferredUserId")]
        public virtual ApplicationUser? ReferredUser { get; set; }
    }
}

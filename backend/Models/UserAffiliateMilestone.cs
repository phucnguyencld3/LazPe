using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public class UserAffiliateMilestone
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        [ValidateNever]
        public virtual ApplicationUser? User { get; set; }

        [Required]
        public int MilestoneId { get; set; }

        [ForeignKey(nameof(MilestoneId))]
        [ValidateNever]
        public virtual AffiliateMilestone? Milestone { get; set; }

        [Required]
        public int Month { get; set; }

        [Required]
        public int Year { get; set; }

        public DateTime AchievedAt { get; set; } = DateTime.Now;
    }
}

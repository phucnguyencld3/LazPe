using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ChatSessionId { get; set; } = string.Empty;

        public string? SenderId { get; set; }

        [Required]
        [StringLength(100)]
        public string SenderName { get; set; } = string.Empty;

        public bool IsFromAdmin { get; set; }

        public string? MessageText { get; set; }

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation Properties
        [ForeignKey("ChatSessionId")]
        public virtual ChatSession? ChatSession { get; set; }

        [ForeignKey("SenderId")]
        public virtual ApplicationUser? Sender { get; set; }
    }
}

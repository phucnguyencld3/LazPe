using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class ChatSession
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string? UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = "Khách vãng lai";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public bool IsClosed { get; set; } = false;

        public bool IsWaitingForSupport { get; set; } = false;

        [StringLength(500)]
        public string? LastMessageText { get; set; }

        public int UnreadByAdmin { get; set; } = 0;

        public int UnreadByCustomer { get; set; } = 0;

        public string? AdminId { get; set; }

        [StringLength(100)]
        public string? AdminName { get; set; }

        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey("AdminId")]
        public virtual ApplicationUser? Admin { get; set; }

        public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}

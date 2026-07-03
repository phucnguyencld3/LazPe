using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class ReviewSensitiveKeyword
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int KeywordID { get; set; }

        [Required]
        [StringLength(100)]
        public string Word { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Severity { get; set; } = "Warning"; // Warning, Medium, Critical

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = "Abuse"; // Vulgarity, Abuse, Spam, Phone, Link, Scam, Violations

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}

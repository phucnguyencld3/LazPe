using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.Models
{
    public class NotificationTemplate
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string TemplateName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string TemplateCode { get; set; } = string.Empty;

        [Required]
        public string TemplateContent { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }
}

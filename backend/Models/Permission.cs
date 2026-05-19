using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.Models
{
    public class Permission
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty; 

        [StringLength(255)]
        public string Description { get; set; } = string.Empty;

        [StringLength(50)]
        public string Resource { get; set; } = string.Empty; 

        [StringLength(50)]
        public string Action { get; set; } = string.Empty; 

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
    }
}
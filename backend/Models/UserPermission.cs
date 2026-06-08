using Microsoft.AspNetCore.Identity;

namespace PolyBabyAPI.Models
{
    public class UserPermission
    {
        public string UserId { get; set; } = string.Empty;
        public int PermissionId { get; set; }
        public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
        public string? GrantedBy { get; set; } // UserId của admin cấp quyền
        public bool IsGranted { get; set; } = true; // true = Override Add, false = Override Deny

        // Navigation properties
        public virtual ApplicationUser User { get; set; } = null!;
        public virtual Permission Permission { get; set; } = null!;
    }
}
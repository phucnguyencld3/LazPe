namespace PolyBabyAPI.Models
{
    public class TemplatePermission
    {
        public int TemplateId { get; set; }
        public int PermissionId { get; set; }

        // Navigation properties
        public virtual RoleTemplate RoleTemplate { get; set; } = null!;
        public virtual Permission Permission { get; set; } = null!;
    }
}

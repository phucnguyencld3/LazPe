using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface IPermissionService
    {
        Task<List<Permission>> GetAllPermissionsAsync();
        Task<List<Permission>> GetUserPermissionsAsync(string userId);
        
        // Effective permissions for UI
        Task<object> GetUserEffectivePermissionsAsync(string userId);

        Task<bool> HasPermissionAsync(string userId, string permissionName);
        Task<bool> GrantPermissionAsync(string userId, int permissionId, string grantedBy, bool isGranted = true);
        Task<bool> RevokePermissionAsync(string userId, int permissionId); // This removes the override entirely
        
        Task<Permission> CreatePermissionAsync(string name, string description, string resource, string action);
        Task<bool> DeletePermissionAsync(int permissionId);

        // Role Template Methods
        Task<List<RoleTemplate>> GetAllRoleTemplatesAsync();
        Task<RoleTemplate?> GetRoleTemplateByIdAsync(int id);
        Task<RoleTemplate> CreateRoleTemplateAsync(string name, string description, List<int> permissionIds);
        Task<RoleTemplate?> UpdateRoleTemplateAsync(int id, string name, string description, List<int> permissionIds);
        Task<bool> DeleteRoleTemplateAsync(int id);
        Task<bool> AssignRoleTemplateToUserAsync(string userId, int? templateId);
    }
}
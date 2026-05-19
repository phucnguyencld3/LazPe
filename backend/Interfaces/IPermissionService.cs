using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface IPermissionService
    {
        Task<List<Permission>> GetAllPermissionsAsync();
        Task<List<Permission>> GetUserPermissionsAsync(string userId);
        Task<bool> HasPermissionAsync(string userId, string permissionName);
        Task<bool> GrantPermissionAsync(string userId, int permissionId, string grantedBy);
        Task<bool> RevokePermissionAsync(string userId, int permissionId);
        Task<Permission> CreatePermissionAsync(string name, string description, string resource, string action);
        Task<bool> DeletePermissionAsync(int permissionId);
    }
}
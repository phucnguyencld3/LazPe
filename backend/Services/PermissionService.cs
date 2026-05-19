using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Helpers;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PermissionService> _logger;

        public PermissionService(ApplicationDbContext context, ILogger<PermissionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Permission>> GetAllPermissionsAsync()
        {
            return await _context.Permissions
                .Where(p => p.IsActive)
                .OrderBy(p => p.Resource)
                .ThenBy(p => p.Action)
                .ToListAsync();
        }

        public async Task<List<Permission>> GetUserPermissionsAsync(string userId)
        {
            return await _context.UserPermissions
                .Where(up => up.UserId == userId)
                .Include(up => up.Permission)
                .Where(up => up.Permission.IsActive)
                .Select(up => up.Permission)
                .ToListAsync();
        }

        public async Task<bool> HasPermissionAsync(string userId, string permissionName)
        {
            var grantedPermissions = await _context.UserPermissions
                .Where(up => up.UserId == userId && up.Permission.IsActive)
                .Select(up => up.Permission.Name)
                .ToListAsync();

            return PermissionHierarchyHelper.HasPermission(grantedPermissions, permissionName);
        }

        public async Task<bool> GrantPermissionAsync(string userId, int permissionId, string grantedBy)
        {
            try
            {
                var existing = await _context.UserPermissions
                    .FirstOrDefaultAsync(up => up.UserId == userId && up.PermissionId == permissionId);

                if (existing != null)
                    return true; // Already granted

                var userPermission = new UserPermission
                {
                    UserId = userId,
                    PermissionId = permissionId,
                    GrantedAt = DateTime.UtcNow,
                    GrantedBy = grantedBy
                };

                _context.UserPermissions.Add(userPermission);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Permission {PermissionId} granted to user {UserId} by {GrantedBy}", 
                    permissionId, userId, grantedBy);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error granting permission {PermissionId} to user {UserId}", 
                    permissionId, userId);
                return false;
            }
        }

        public async Task<bool> RevokePermissionAsync(string userId, int permissionId)
        {
            try
            {
                var userPermission = await _context.UserPermissions
                    .FirstOrDefaultAsync(up => up.UserId == userId && up.PermissionId == permissionId);

                if (userPermission == null)
                    return true; // Already revoked

                _context.UserPermissions.Remove(userPermission);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Permission {PermissionId} revoked from user {UserId}", 
                    permissionId, userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking permission {PermissionId} from user {UserId}", 
                    permissionId, userId);
                return false;
            }
        }

        public async Task<Permission> CreatePermissionAsync(string name, string description, string resource, string action)
        {
            var permission = new Permission
            {
                Name = $"{resource}.{action}",
                Description = description,
                Resource = resource,
                Action = action,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Permissions.Add(permission);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Permission created: {PermissionName}", permission.Name);

            return permission;
        }

        public async Task<bool> DeletePermissionAsync(int permissionId)
        {
            try
            {
                var permission = await _context.Permissions.FindAsync(permissionId);
                if (permission == null)
                    return false;

                // Soft delete
                permission.IsActive = false;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Permission deactivated: {PermissionId}", permissionId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting permission {PermissionId}", permissionId);
                return false;
            }
        }
    }
}
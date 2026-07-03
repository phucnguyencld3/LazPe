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
                .Where(up => up.UserId == userId && up.IsGranted)
                .Include(up => up.Permission)
                .Where(up => up.Permission.IsActive)
                .Select(up => up.Permission)
                .ToListAsync();
        }

        public async Task<object> GetUserEffectivePermissionsAsync(string userId)
        {
            var user = await _context.Users
                .Include(u => u.RoleTemplate)
                .ThenInclude(rt => rt.TemplatePermissions)
                .ThenInclude(tp => tp.Permission)
                .FirstOrDefaultAsync(u => u.Id == userId);

            var overrides = await _context.UserPermissions
                .Where(up => up.UserId == userId)
                .Include(up => up.Permission)
                .ToListAsync();

            var templatePermissions = user?.RoleTemplate?.TemplatePermissions
                .Select(tp => tp.Permission)
                .Where(p => p.IsActive)
                .ToList() ?? new List<Permission>();

            var overrideAdds = overrides.Where(o => o.IsGranted && o.Permission.IsActive).Select(o => o.Permission).ToList();
            var overrideDenies = overrides.Where(o => !o.IsGranted).Select(o => o.PermissionId).ToList();

            var effective = templatePermissions
                .Concat(overrideAdds)
                .Where(p => !overrideDenies.Contains(p.Id))
                .GroupBy(p => p.Id)
                .Select(g => g.First())
                .ToList();

            return new
            {
                RoleTemplate = user?.RoleTemplate != null ? new { user.RoleTemplate.Id, user.RoleTemplate.Name } : null,
                TemplatePermissions = templatePermissions.Select(p => new { p.Id, p.Name, p.Description }),
                OverrideAdds = overrideAdds.Select(p => new { p.Id, p.Name, p.Description }),
                OverrideDenies = overrides.Where(o => !o.IsGranted).Select(o => new { o.Permission.Id, o.Permission.Name, o.Permission.Description }),
                EffectivePermissions = effective.Select(p => new { p.Id, p.Name, p.Description })
            };
        }

        public async Task<bool> HasPermissionAsync(string userId, string permissionName)
        {
            var user = await _context.Users
                .Include(u => u.RoleTemplate)
                .ThenInclude(rt => rt.TemplatePermissions)
                .ThenInclude(tp => tp.Permission)
                .FirstOrDefaultAsync(u => u.Id == userId);

            var overrides = await _context.UserPermissions
                .Where(up => up.UserId == userId)
                .Include(up => up.Permission)
                .Where(up => up.Permission.IsActive)
                .ToListAsync();

            var templatePermissionNames = user?.RoleTemplate?.TemplatePermissions
                .Select(tp => tp.Permission.Name)
                .ToList() ?? new List<string>();

            var overrideAdds = overrides.Where(o => o.IsGranted).Select(o => o.Permission.Name).ToList();
            var overrideDenies = overrides.Where(o => !o.IsGranted).Select(o => o.Permission.Name).ToList();

            var effectivePermissions = templatePermissionNames
                .Concat(overrideAdds)
                .Except(overrideDenies)
                .Distinct()
                .ToList();

            return PermissionHierarchyHelper.HasPermission(effectivePermissions, permissionName);
        }

        public async Task<bool> GrantPermissionAsync(string userId, int permissionId, string grantedBy, bool isGranted = true)
        {
            try
            {
                var existing = await _context.UserPermissions
                    .FirstOrDefaultAsync(up => up.UserId == userId && up.PermissionId == permissionId);

                if (existing != null)
                {
                    existing.IsGranted = isGranted;
                    existing.GrantedAt = DateTime.Now;
                    existing.GrantedBy = grantedBy;
                    await _context.SaveChangesAsync();
                    return true;
                }

                var userPermission = new UserPermission
                {
                    UserId = userId,
                    PermissionId = permissionId,
                    GrantedAt = DateTime.Now,
                    GrantedBy = grantedBy,
                    IsGranted = isGranted
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
                CreatedAt = DateTime.Now,
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

        // --- ROLE TEMPLATE IMPLEMENTATION ---

        public async Task<List<RoleTemplate>> GetAllRoleTemplatesAsync()
        {
            return await _context.RoleTemplates
                .Include(rt => rt.TemplatePermissions)
                .ThenInclude(tp => tp.Permission)
                .ToListAsync();
        }

        public async Task<RoleTemplate?> GetRoleTemplateByIdAsync(int id)
        {
            return await _context.RoleTemplates
                .Include(rt => rt.TemplatePermissions)
                .ThenInclude(tp => tp.Permission)
                .FirstOrDefaultAsync(rt => rt.Id == id);
        }

        public async Task<RoleTemplate> CreateRoleTemplateAsync(string name, string description, List<int> permissionIds)
        {
            var template = new RoleTemplate
            {
                Name = name,
                Description = description,
                CreatedAt = DateTime.Now,
                IsActive = true
            };

            if (permissionIds != null && permissionIds.Any())
            {
                foreach (var pid in permissionIds)
                {
                    template.TemplatePermissions.Add(new TemplatePermission { PermissionId = pid });
                }
            }

            _context.RoleTemplates.Add(template);
            await _context.SaveChangesAsync();
            return template;
        }

        public async Task<RoleTemplate?> UpdateRoleTemplateAsync(int id, string name, string description, List<int> permissionIds)
        {
            var template = await _context.RoleTemplates
                .Include(rt => rt.TemplatePermissions)
                .FirstOrDefaultAsync(rt => rt.Id == id);

            if (template == null) return null;

            template.Name = name;
            template.Description = description;

            // Update permissions
            _context.TemplatePermissions.RemoveRange(template.TemplatePermissions);
            if (permissionIds != null && permissionIds.Any())
            {
                foreach (var pid in permissionIds)
                {
                    template.TemplatePermissions.Add(new TemplatePermission { PermissionId = pid, TemplateId = id });
                }
            }

            await _context.SaveChangesAsync();
            return template;
        }

        public async Task<bool> DeleteRoleTemplateAsync(int id)
        {
            var template = await _context.RoleTemplates.FindAsync(id);
            if (template == null) return false;

            _context.RoleTemplates.Remove(template);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AssignRoleTemplateToUserAsync(string userId, int? templateId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.RoleTemplateId = templateId;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

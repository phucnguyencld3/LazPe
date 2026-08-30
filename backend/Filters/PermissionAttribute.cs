using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using PolyBabyAPI.Helpers;
using PolyBabyAPI.Interfaces;
using System.Security.Claims;

namespace PolyBabyAPI.Filters
{
    /// <summary>
    /// API-level Permission Authorization Attribute
    /// Kiểm tra permission từ JWT token hoặc DB Effective Permissions
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class PermissionAttribute : Attribute, IAsyncAuthorizationFilter
    {
        private readonly string _requiredPermission;
        private readonly bool _allowAdminBypass;

        public PermissionAttribute(string permission, bool allowAdminBypass = true)
        {
            _requiredPermission = permission;
            _allowAdminBypass = allowAdminBypass;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            // 1. Kiểm tra authenticated
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // 2. Admin bypass
            if (_allowAdminBypass && user.IsInRole("Admin"))
            {
                return;
            }

            // 3. Kiểm tra permission từ JWT Token claims trước
            var hasPermission = PermissionHierarchyHelper.HasPermission(user, _requiredPermission);

            // 4. Nếu JWT claims chưa chứa, tra cứu DB Effective Permissions (RoleTemplate + UserPermissions)
            if (!hasPermission)
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    var permissionService = context.HttpContext.RequestServices.GetService<IPermissionService>();
                    if (permissionService != null)
                    {
                        hasPermission = await permissionService.HasPermissionAsync(userId, _requiredPermission);
                    }
                }
            }

            if (!hasPermission)
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILogger<PermissionAttribute>>();

                logger.LogWarning(
                    "Permission denied: User {UserId} attempted {Method} {Path} requiring {Permission}",
                    user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown",
                    context.HttpContext.Request.Method,
                    context.HttpContext.Request.Path,
                    _requiredPermission);

                context.Result = new ForbidResult();
            }
        }
    }
}
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PolyBabyAPI.Helpers;
using System.Security.Claims;

namespace PolyBabyAPI.Filters
{
    /// <summary>
    /// API-level Permission Authorization Attribute
    /// Kiểm tra permission từ JWT token
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

        public Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            // 1. Kiểm tra authenticated
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return Task.CompletedTask;
            }

            // 2. Admin bypass
            if (_allowAdminBypass && user.IsInRole("Admin"))
            {
                return Task.CompletedTask;
            }

            // 3. Kiểm tra permission (có hỗ trợ hierarchy, VD: Delete => Read)
            var hasPermission = PermissionHierarchyHelper.HasPermission(user, _requiredPermission);

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

            return Task.CompletedTask;
        }
    }
}
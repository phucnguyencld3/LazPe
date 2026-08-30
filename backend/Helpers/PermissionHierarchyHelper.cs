using System.Security.Claims;

namespace PolyBabyAPI.Helpers
{
    public static class PermissionHierarchyHelper
    {
        public static bool HasPermission(ClaimsPrincipal user, string requiredPermission)
        {
            var grantedPermissions = user.FindAll("Permission").Select(c => c.Value);
            return HasPermission(grantedPermissions, requiredPermission);
        }

        public static bool HasPermission(IEnumerable<string> grantedPermissions, string requiredPermission)
        {
            var grantedSet = grantedPermissions
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (grantedSet.Contains(requiredPermission))
                return true;

            if (!TrySplitPermission(requiredPermission, out var requiredResource, out var requiredAction))
                return false;

            // Cross-resource implications for dropdowns and reference data
            if (string.Equals(requiredAction, "Read", StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(requiredResource, "Product", StringComparison.OrdinalIgnoreCase))
                {
                    if (grantedSet.Any(p => p.StartsWith("Bundle.", StringComparison.OrdinalIgnoreCase) ||
                                            p.StartsWith("FlashSale.", StringComparison.OrdinalIgnoreCase) ||
                                            p.StartsWith("Voucher.", StringComparison.OrdinalIgnoreCase) ||
                                            p.StartsWith("Order.", StringComparison.OrdinalIgnoreCase)))
                    {
                        return true;
                    }
                }
                else if (string.Equals(requiredResource, "Category", StringComparison.OrdinalIgnoreCase))
                {
                    if (grantedSet.Any(p => p.StartsWith("Bundle.", StringComparison.OrdinalIgnoreCase) ||
                                            p.StartsWith("Product.", StringComparison.OrdinalIgnoreCase) ||
                                            p.StartsWith("FlashSale.", StringComparison.OrdinalIgnoreCase) ||
                                            p.StartsWith("Voucher.", StringComparison.OrdinalIgnoreCase)))
                    {
                        return true;
                    }
                }
                else if (string.Equals(requiredResource, "Supplier", StringComparison.OrdinalIgnoreCase))
                {
                    if (grantedSet.Any(p => p.StartsWith("Product.", StringComparison.OrdinalIgnoreCase)))
                    {
                        return true;
                    }
                }
            }

            foreach (var grantedPermission in grantedSet)
            {
                if (!TrySplitPermission(grantedPermission, out var grantedResource, out var grantedAction))
                    continue;

                if (!string.Equals(grantedResource, requiredResource, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (Implies(grantedAction, requiredAction))
                    return true;
            }

            return false;
        }

        private static bool TrySplitPermission(string permission, out string resource, out string action)
        {
            resource = string.Empty;
            action = string.Empty;

            var parts = permission.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length != 2)
                return false;

            resource = parts[0];
            action = NormalizeAction(parts[1]);
            return true;
        }

        private static bool Implies(string grantedAction, string requiredAction)
        {
            grantedAction = NormalizeAction(grantedAction);
            requiredAction = NormalizeAction(requiredAction);

            if (string.Equals(grantedAction, requiredAction, StringComparison.OrdinalIgnoreCase))
                return true;

            return requiredAction switch
            {
                "Read" => grantedAction is "Create" or "Update" or "Delete",
                "Create" => grantedAction is "Update" or "Delete",
                "Update" => grantedAction is "Delete",
                _ => false
            };
        }

        private static string NormalizeAction(string action)
        {
            return action.ToLowerInvariant() switch
            {
                "view" or "list" => "Read",
                "add" => "Create",
                "edit" => "Update",
                "remove" => "Delete",
                _ => action
            };
        }
    }
}

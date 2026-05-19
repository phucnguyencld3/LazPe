using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.Services;

namespace PolyBabyAPI.Data
{
    public static class IdentitySeeder
    {
        private const string AdminUserName = "admin";
        private const string AdminPassword = "123456";
        private const string AdminEmail = "admin@polybaby.com";
        private const string AdminFullName = "Administrator";

        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var permissionService = serviceProvider.GetRequiredService<IPermissionService>();

            logger.LogInformation("Starting Identity Seeder...");

            // 1) Seed Roles
            await SeedRolesAsync(roleManager, logger);

            // 2) Seed Permissions
            await SeedPermissionsAsync(permissionService, logger);

            // 3) Seed Admin User
            var adminUser = await SeedAdminUserAsync(userManager, logger);

            // 4) Grant all permissions to Admin
            if (adminUser != null)
            {
                await GrantAllPermissionsToAdminAsync(permissionService, adminUser.Id, logger);
            }

            logger.LogInformation("Identity Seeder completed successfully.");
        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager, ILogger logger)
        {
            string[] roles = { "Admin", "User", "Staff" };
            
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    var result = await roleManager.CreateAsync(new IdentityRole(role));
                    if (result.Succeeded)
                    {
                        logger.LogInformation("Created role: {Role}", role);
                    }
                    else
                    {
                        logger.LogError("Failed to create role {Role}: {Errors}", role,
                            string.Join("; ", result.Errors.Select(e => e.Description)));
                    }
                }
            }
        }

        private static async Task SeedPermissionsAsync(IPermissionService permissionService, ILogger logger)
        {
            logger.LogInformation("Seeding default permissions...");

            var defaultPermissions = new[]
            {
                // ✅ THÊM: Admin Access Permission
                new { Resource = "Admin", Action = "Access", Description = "Truy cập vào Admin Dashboard" },
                new { Resource = "Admin", Action = "ViewUsers", Description = "Xem danh sách người dùng trong Admin" },
                new { Resource = "Admin", Action = "ManagePermissions", Description = "Quản lý phân quyền hệ thống" },

                // User Management
                new { Resource = "User", Action = "Create", Description = "Tạo tài khoản người dùng mới" },
                new { Resource = "User", Action = "Read", Description = "Xem thông tin người dùng" },
                new { Resource = "User", Action = "Update", Description = "Cập nhật thông tin người dùng" },
                new { Resource = "User", Action = "Delete", Description = "Xóa tài khoản người dùng" },
                new { Resource = "User", Action = "Lock", Description = "Khóa/mở khóa tài khoản người dùng" },

                // Product Management
                new { Resource = "Product", Action = "Create", Description = "Tạo sản phẩm mới" },
                new { Resource = "Product", Action = "Read", Description = "Xem thông tin sản phẩm" },
                new { Resource = "Product", Action = "Update", Description = "Cập nhật thông tin sản phẩm" },
                new { Resource = "Product", Action = "Delete", Description = "Xóa sản phẩm" },

                // Category Management
                new { Resource = "Category", Action = "Create", Description = "Tạo danh mục mới" },
                new { Resource = "Category", Action = "Read", Description = "Xem danh mục" },
                new { Resource = "Category", Action = "Update", Description = "Cập nhật danh mục" },
                new { Resource = "Category", Action = "Delete", Description = "Xóa danh mục" },

                // Order Management
                new { Resource = "Order", Action = "Create", Description = "Tạo đơn hàng" },
                new { Resource = "Order", Action = "Read", Description = "Xem đơn hàng" },
                new { Resource = "Order", Action = "Update", Description = "Cập nhật trạng thái đơn hàng" },
                new { Resource = "Order", Action = "Delete", Description = "Hủy/xóa đơn hàng" },

                // Bundle Management
                new { Resource = "Bundle", Action = "Create", Description = "Tạo gói sản phẩm" },
                new { Resource = "Bundle", Action = "Read", Description = "Xem gói sản phẩm" },
                new { Resource = "Bundle", Action = "Update", Description = "Cập nhật gói sản phẩm" },
                new { Resource = "Bundle", Action = "Delete", Description = "Xóa gói sản phẩm" },

                // Supplier Management
                new { Resource = "Supplier", Action = "Create", Description = "Tạo nhà cung cấp mới" },
                new { Resource = "Supplier", Action = "Read", Description = "Xem thông tin nhà cung cấp" },
                new { Resource = "Supplier", Action = "Update", Description = "Cập nhật thông tin nhà cung cấp" },
                new { Resource = "Supplier", Action = "Delete", Description = "Xóa nhà cung cấp" },

                // Permission Management
                new { Resource = "Permission", Action = "Create", Description = "Tạo quyền mới" },
                new { Resource = "Permission", Action = "Read", Description = "Xem danh sách quyền" },
                new { Resource = "Permission", Action = "Update", Description = "Cập nhật quyền" },
                new { Resource = "Permission", Action = "Delete", Description = "Xóa quyền" },
                new { Resource = "Permission", Action = "Assign", Description = "Gán quyền cho người dùng" },

                // Report & Analytics
                new { Resource = "Report", Action = "Read", Description = "Xem báo cáo" },
                new { Resource = "Analytics", Action = "Read", Description = "Xem thống kê phân tích" },

                // System Management
                new { Resource = "System", Action = "Config", Description = "Cấu hình hệ thống" },
                new { Resource = "System", Action = "Backup", Description = "Sao lưu dữ liệu" },

                // Review Management
                new { Resource = "Review", Action = "Create", Description = "Tạo đánh giá" },
                new { Resource = "Review", Action = "Read", Description = "Xem đánh giá" },
                new { Resource = "Review", Action = "Update", Description = "Cập nhật đánh giá" },
                new { Resource = "Review", Action = "Delete", Description = "Xóa đánh giá" },

                // Address Management
                new { Resource = "Address", Action = "Create", Description = "Tạo địa chỉ mới" },
                new { Resource = "Address", Action = "Read", Description = "Xem địa chỉ" },
                new { Resource = "Address", Action = "Update", Description = "Cập nhật địa chỉ" },
                new { Resource = "Address", Action = "Delete", Description = "Xóa địa chỉ" }
            };

            var existingPermissions = await permissionService.GetAllPermissionsAsync();
            var createdCount = 0;

            foreach (var perm in defaultPermissions)
            {
                var permissionName = $"{perm.Resource}.{perm.Action}";
                
                // Kiểm tra xem permission đã tồn tại chưa
                if (!existingPermissions.Any(p => p.Name == permissionName))
                {
                    try
                    {
                        await permissionService.CreatePermissionAsync(permissionName, perm.Description, perm.Resource, perm.Action);
                        createdCount++;
                        logger.LogInformation("Created permission: {PermissionName}", permissionName);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Failed to create permission: {PermissionName}", permissionName);
                    }
                }
            }

            logger.LogInformation("Permissions seeded successfully. Created: {Count}", createdCount);
        }

        private static async Task<ApplicationUser?> SeedAdminUserAsync(UserManager<ApplicationUser> userManager, ILogger logger)
        {
            var adminUser = await userManager.FindByNameAsync(AdminUserName);
            
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = AdminUserName,
                    Email = AdminEmail,
                    EmailConfirmed = true,
                    FullName = AdminFullName,
                    Status = true,
                    RegisterDate = DateTime.Now
                };

                var createResult = await userManager.CreateAsync(adminUser, AdminPassword);
                if (createResult.Succeeded)
                {
                    logger.LogInformation("Created admin user: {UserName}", AdminUserName);

                    // Thêm role Admin
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                    logger.LogInformation("Added Admin role to user: {UserName}", AdminUserName);
                }
                else
                {
                    var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                    logger.LogError("Failed to create admin user: {Errors}", errors);
                    return null;
                }
            }
            else
            {
                logger.LogInformation("Admin user already exists: {UserName}", AdminUserName);

                // Đảm bảo admin có role Admin
                if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                    logger.LogInformation("Added Admin role to existing user: {UserName}", AdminUserName);
                }
            }

            return adminUser;
        }

        private static async Task GrantAllPermissionsToAdminAsync(IPermissionService permissionService, string adminUserId, ILogger logger)
        {
            logger.LogInformation("Granting all permissions to admin user...");

            try
            {
                var allPermissions = await permissionService.GetAllPermissionsAsync();
                var grantedCount = 0;

                foreach (var permission in allPermissions)
                {
                    var hasPermission = await permissionService.HasPermissionAsync(adminUserId, permission.Name);
                    if (!hasPermission)
                    {
                        var granted = await permissionService.GrantPermissionAsync(adminUserId, permission.Id, "System");
                        if (granted)
                        {
                            grantedCount++;
                        }
                    }
                }

                logger.LogInformation("Admin granted {Count} permissions out of {Total}", grantedCount, allPermissions.Count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error granting permissions to admin");
            }
        }
    }
}
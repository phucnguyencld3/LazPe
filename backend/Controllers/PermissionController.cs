using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.Services;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PermissionController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly ILogger<PermissionController> _logger;

        public PermissionController(IPermissionService permissionService, ILogger<PermissionController> logger)
        {
            _permissionService = permissionService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tất cả permissions
        /// </summary>
        [HttpGet]
        [Permission("Permission.Read")]
        public async Task<IActionResult> GetAllPermissions()
        {
            try
            {
                var permissions = await _permissionService.GetAllPermissionsAsync();
                
                return Ok(new
                {
                    success = true,
                    data = permissions.Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        description = p.Description,
                        resource = p.Resource,
                        action = p.Action,
                        isActive = p.IsActive,
                        createdAt = p.CreatedAt
                    }).ToList(),
                    message = "Lấy danh sách permissions thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all permissions");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách permissions" });
            }
        }

        /// <summary>
        /// Lấy permissions của user
        /// </summary>
        [HttpGet("user/{userId}")]
        [Permission("Permission.Read")]
        public async Task<IActionResult> GetUserPermissions(string userId)
        {
            try
            {
                var permissions = await _permissionService.GetUserPermissionsAsync(userId);
                
                return Ok(new
                {
                    success = true,
                    data = permissions.Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        description = p.Description,
                        resource = p.Resource,
                        action = p.Action
                    }).ToList(),
                    message = "Lấy permissions của user thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user permissions for {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy permissions của user" });
            }
        }

        /// <summary>
        /// Lấy Effective Permissions của user (bao gồm từ Template và Override)
        /// </summary>
        [HttpGet("effective-user/{userId}")]
        [Permission("Permission.Read")]
        public async Task<IActionResult> GetUserEffectivePermissions(string userId)
        {
            try
            {
                var data = await _permissionService.GetUserEffectivePermissionsAsync(userId);
                return Ok(new
                {
                    success = true,
                    data = data,
                    message = "Lấy effective permissions của user thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting effective user permissions for {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy permissions của user" });
            }
        }

        /// <summary>
        /// Tạo permission mới
        /// </summary>
        [HttpPost]
        [Permission("Permission.Create")]
        public async Task<IActionResult> CreatePermission([FromBody] CreatePermissionDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var permission = await _permissionService.CreatePermissionAsync(
                    dto.Name, dto.Description, dto.Resource, dto.Action);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        id = permission.Id,
                        name = permission.Name,
                        description = permission.Description,
                        resource = permission.Resource,
                        action = permission.Action,
                        createdAt = permission.CreatedAt
                    },
                    message = "Tạo permission thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating permission");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo permission" });
            }
        }

        /// <summary>
        /// Gán permission cho user
        /// </summary>
        [HttpPost("grant")]
        [Permission("Permission.Assign")]
        public async Task<IActionResult> GrantPermission([FromBody] GrantPermissionDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var currentUserId = User.FindFirst("UserId")?.Value ?? "";
                var result = await _permissionService.GrantPermissionAsync(dto.UserId, dto.PermissionId, currentUserId, dto.IsGranted);

                if (result)
                {
                    return Ok(new { success = true, message = "Gán permission thành công" });
                }

                return BadRequest(new { success = false, message = "Không thể gán permission" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error granting permission");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi gán permission" });
            }
        }

        /// <summary>
        /// Thu hồi permission từ user
        /// </summary>
        [HttpPost("revoke")]
        [Permission("Permission.Assign")]
        public async Task<IActionResult> RevokePermission([FromBody] RevokePermissionDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }

                var result = await _permissionService.RevokePermissionAsync(dto.UserId, dto.PermissionId);

                if (result)
                {
                    return Ok(new { success = true, message = "Thu hồi permission thành công" });
                }

                return BadRequest(new { success = false, message = "Không thể thu hồi permission" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking permission");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi thu hồi permission" });
            }
        }

        /// <summary>
        /// Xóa permission
        /// </summary>
        [HttpDelete("{id}")]
        [Permission("Permission.Delete")]
        public async Task<IActionResult> DeletePermission(int id)
        {
            try
            {
                var result = await _permissionService.DeletePermissionAsync(id);

                if (result)
                {
                    return Ok(new { success = true, message = "Xóa permission thành công" });
                }

                return NotFound(new { success = false, message = "Không tìm thấy permission" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting permission {PermissionId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa permission" });
            }
        }

        /// <summary>
        /// Đồng bộ quyền hạn của user (Cập nhật Role Template và Overrides)
        /// </summary>
        [HttpPost("sync")]
        [Permission("Permission.Assign")]
        public async Task<IActionResult> SyncUserPermissions([FromBody] SyncPermissionDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

                var currentUserId = User.FindFirst("UserId")?.Value ?? "";

                // 1. Cập nhật Role Template
                await _permissionService.AssignRoleTemplateToUserAsync(dto.UserId, dto.TemplateId);

                // 2. Tính toán Overrides
                // Xóa toàn bộ overrides cũ
                var oldOverrides = await _permissionService.GetUserPermissionsAsync(dto.UserId);
                // Vì ta cần xóa toàn bộ UserPermission cho userId này (cả add và deny), ta làm thủ công bằng context hoặc service.
                // Để nhanh chóng, ta dùng service loop:
                foreach(var up in oldOverrides) {
                    await _permissionService.RevokePermissionAsync(dto.UserId, up.Id);
                }

                // Lấy quyền của template
                var template = dto.TemplateId.HasValue ? await _permissionService.GetRoleTemplateByIdAsync(dto.TemplateId.Value) : null;
                var templatePermIds = template?.TemplatePermissions.Select(tp => tp.PermissionId).ToList() ?? new List<int>();

                // Tính toán Overrides mới dựa trên Effective Ids truyền từ client
                var newAdds = dto.EffectivePermissionIds.Except(templatePermIds).ToList();
                var newDenies = templatePermIds.Except(dto.EffectivePermissionIds).ToList();

                foreach (var id in newAdds)
                {
                    await _permissionService.GrantPermissionAsync(dto.UserId, id, currentUserId, true);
                }

                foreach (var id in newDenies)
                {
                    await _permissionService.GrantPermissionAsync(dto.UserId, id, currentUserId, false);
                }

                return Ok(new { success = true, message = "Đồng bộ quyền hạn thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing permissions for user {UserId}", dto.UserId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi đồng bộ quyền" });
            }
        }

        /// <summary>
        /// Kiểm tra user có permission không
        /// </summary>
        [HttpGet("check/{userId}/{permissionName}")]
        [Permission("Permission.Read")]
        public async Task<IActionResult> CheckPermission(string userId, string permissionName)
        {
            try
            {
                var hasPermission = await _permissionService.HasPermissionAsync(userId, permissionName);
                
                return Ok(new
                {
                    success = true,
                    hasPermission = hasPermission,
                    message = hasPermission ? "User có permission" : "User không có permission"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking permission for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi kiểm tra permission" });
            }
        }

        #region DTOs
        public class CreatePermissionDto
        {
            public string Name { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string Resource { get; set; } = string.Empty;
            public string Action { get; set; } = string.Empty;
        }

        public class GrantPermissionDto
        {
            public string UserId { get; set; } = string.Empty;
            public int PermissionId { get; set; }
            public bool IsGranted { get; set; } = true;
        }

        public class RevokePermissionDto
        {
            public string UserId { get; set; } = string.Empty;
            public int PermissionId { get; set; }
        }

        public class SyncPermissionDto
        {
            public string UserId { get; set; } = string.Empty;
            public int? TemplateId { get; set; }
            public List<int> EffectivePermissionIds { get; set; } = new List<int>();
        }
        #endregion
    }
}
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
                var result = await _permissionService.GrantPermissionAsync(dto.UserId, dto.PermissionId, currentUserId);

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
        }

        public class RevokePermissionDto
        {
            public string UserId { get; set; } = string.Empty;
            public int PermissionId { get; set; }
        }
        #endregion
    }
}
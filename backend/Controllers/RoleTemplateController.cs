using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RoleTemplateController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly ILogger<RoleTemplateController> _logger;

        public RoleTemplateController(IPermissionService permissionService, ILogger<RoleTemplateController> logger)
        {
            _permissionService = permissionService;
            _logger = logger;
        }

        [HttpGet]
        [Permission("Permission.Read")]
        public async Task<IActionResult> GetAllTemplates()
        {
            try
            {
                var templates = await _permissionService.GetAllRoleTemplatesAsync();
                return Ok(new
                {
                    success = true,
                    data = templates.Select(t => new
                    {
                        t.Id,
                        t.Name,
                        t.Description,
                        t.IsActive,
                        t.CreatedAt,
                        Permissions = t.TemplatePermissions.Select(tp => new { tp.PermissionId, tp.Permission.Name, tp.Permission.Description })
                    }),
                    message = "Lấy danh sách gói quyền thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting role templates");
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy gói quyền" });
            }
        }

        [HttpGet("{id}")]
        [Permission("Permission.Read")]
        public async Task<IActionResult> GetTemplateById(int id)
        {
            try
            {
                var t = await _permissionService.GetRoleTemplateByIdAsync(id);
                if (t == null) return NotFound(new { success = false, message = "Không tìm thấy gói quyền" });

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        t.Id,
                        t.Name,
                        t.Description,
                        t.IsActive,
                        t.CreatedAt,
                        Permissions = t.TemplatePermissions.Select(tp => new { tp.PermissionId, tp.Permission.Name, tp.Permission.Description })
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting role template {Id}", id);
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy gói quyền" });
            }
        }

        [HttpPost]
        [Permission("Permission.Create")]
        public async Task<IActionResult> CreateTemplate([FromBody] CreateRoleTemplateDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var template = await _permissionService.CreateRoleTemplateAsync(dto.Name, dto.Description, dto.PermissionIds);
                return Ok(new { success = true, data = new { template.Id, template.Name }, message = "Tạo gói quyền thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating role template");
                return StatusCode(500, new { success = false, message = "Lỗi khi tạo gói quyền" });
            }
        }

        [HttpPut("{id}")]
        [Permission("Permission.Update")]
        public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateRoleTemplateDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var template = await _permissionService.UpdateRoleTemplateAsync(id, dto.Name, dto.Description, dto.PermissionIds);
                if (template == null) return NotFound(new { success = false, message = "Không tìm thấy gói quyền" });

                return Ok(new { success = true, message = "Cập nhật gói quyền thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating role template {Id}", id);
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật gói quyền" });
            }
        }

        [HttpDelete("{id}")]
        [Permission("Permission.Delete")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            try
            {
                var result = await _permissionService.DeleteRoleTemplateAsync(id);
                if (!result) return NotFound(new { success = false, message = "Không tìm thấy gói quyền" });

                return Ok(new { success = true, message = "Xóa gói quyền thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting role template {Id}", id);
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa gói quyền" });
            }
        }

        [HttpPost("assign")]
        [Permission("Permission.Assign")]
        public async Task<IActionResult> AssignTemplateToUser([FromBody] AssignTemplateDto dto)
        {
            try
            {
                var result = await _permissionService.AssignRoleTemplateToUserAsync(dto.UserId, dto.TemplateId);
                if (!result) return BadRequest(new { success = false, message = "Gán gói quyền thất bại (có thể user không tồn tại)" });

                return Ok(new { success = true, message = "Gán gói quyền thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning template to user");
                return StatusCode(500, new { success = false, message = "Lỗi khi gán gói quyền" });
            }
        }

        #region DTOs
        public class CreateRoleTemplateDto
        {
            public string Name { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public List<int> PermissionIds { get; set; } = new List<int>();
        }

        public class UpdateRoleTemplateDto
        {
            public string Name { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public List<int> PermissionIds { get; set; } = new List<int>();
        }

        public class AssignTemplateDto
        {
            public string UserId { get; set; } = string.Empty;
            public int? TemplateId { get; set; }
        }
        #endregion
    }
}

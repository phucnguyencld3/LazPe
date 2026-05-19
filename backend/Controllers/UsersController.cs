using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.DTOs;
using System.Security.Claims;
using PolyBabyAPI.Filters;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            IUserService userService,
            IPermissionService permissionService,
            ILogger<UsersController> logger)
        {
            _userService = userService;
            _permissionService = permissionService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách users - Yêu cầu quyền User.Read
        /// </summary>
        [HttpGet]
        [Permission("User.Read")] 
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation("User {UserId} accessing users list", userId);

                var (users, totalCount) = await _userService.GetUsersPagedAsync(search, page, pageSize);

                return Ok(new
                {
                    success = true,
                    data = users,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = pageSize,
                        totalCount = totalCount,
                        totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                    },
                    message = "Lấy danh sách users thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy danh sách users"
                });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết user - Yêu cầu quyền User.Read
        /// </summary>
        [HttpGet("{id}")]
        [Permission("User.Read")] // ✅ QUYỀN THỰC ở đây!
        public async Task<IActionResult> GetUser(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "User ID không hợp lệ"
                    });
                }

                var user = await _userService.GetUserByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy user"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = user,
                    message = "Lấy thông tin user thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user {UserId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy thông tin user"
                });
            }
        }

        /// <summary>
        /// Khóa user - Yêu cầu quyền User.Lock
        /// </summary>
        [HttpPost("{id}/lock")]
        [Permission("User.Lock")] 
        public async Task<IActionResult> LockUser(string id, [FromBody] LockUserDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "User ID không hợp lệ"
                    });
                }

                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var success = await _userService.LockUserAsync(id, dto.Reason, dto.LockoutDays, adminId);

                if (success)
                {
                    _logger.LogInformation("User {UserId} locked by admin {AdminId}",
                        id, adminId);

                    return Ok(new
                    {
                        success = true,
                        message = "Khóa user thành công"
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể khóa user"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error locking user {UserId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi khóa user"
                });
            }
        }

        /// <summary>
        /// Mở khóa user - Yêu cầu quyền User.Lock
        /// </summary>
        [HttpPost("{id}/unlock")]
        [Permission("User.Lock")] // ✅ QUYỀN THỰC ở đây!
        public async Task<IActionResult> UnlockUser(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "User ID không hợp lệ"
                    });
                }

                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var success = await _userService.UnlockUserAsync(id, adminId);

                if (success)
                {
                    _logger.LogInformation("User {UserId} unlocked by admin {AdminId}",
                        id, adminId);

                    return Ok(new
                    {
                        success = true,
                        message = "Mở khóa user thành công"
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể mở khóa user"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unlocking user {UserId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi mở khóa user"
                });
            }
        }

        /// <summary>
        /// Toggle status user - Yêu cầu quyền User.Update
        /// </summary>
        [HttpPost("{id}/toggle-status")]
        [Permission("User.Update")] // ✅ QUYỀN THỰC ở đây!
        public async Task<IActionResult> ToggleUserStatus(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "User ID không hợp lệ"
                    });
                }

                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var success = await _userService.ToggleUserStatusAsync(id, adminId);

                if (success)
                {
                    _logger.LogInformation("User {UserId} status toggled by admin {AdminId}",
                        id, adminId);

                    return Ok(new
                    {
                        success = true,
                        message = "Cập nhật trạng thái user thành công"
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể cập nhật trạng thái user"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling user status {UserId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi cập nhật trạng thái user"
                });
            }
        }

        /// <summary>
        /// Lấy thống kê users - Yêu cầu quyền User.Read
        /// </summary>
        [HttpGet("statistics")]
        [Permission("User.Read")] 
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var stats = await _userService.GetUserStatisticsAsync();

                return Ok(new
                {
                    success = true,
                    totalUsers = stats.TotalUsers,
                    activeUsers = stats.ActiveUsers,
                    lockedUsers = stats.LockedUsers,
                    newUsersThisMonth = stats.NewUsersThisMonth,
                    message = "Lấy thống kê thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user statistics");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy thống kê"
                });
            }
        }
    }
}


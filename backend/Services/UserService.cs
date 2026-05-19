using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace PolyBabyAPI.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<UserService> _logger;

        public UserService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            IEmailSender emailSender,
            ILogger<UserService> logger)
        {
            _context = context;
            _userManager = userManager;
            _emailSender = emailSender;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách users có phân trang
        /// </summary>
        public async Task<(List<UserDto> users, int totalCount)> GetUsersPagedAsync(
            string? search = null,
            int page = 1,
            int pageSize = 10)
        {
            try
            {
                var query = _context.Users.AsQueryable();

                // Filter by search
                if (!string.IsNullOrEmpty(search))
                {
                    var keyword = search.Trim();
                    query = query.Where(u =>
                        u.Id.Contains(keyword) ||
                        (u.UserName != null && u.UserName.Contains(keyword)) ||
                        (u.FullName != null && u.FullName.Contains(keyword)) ||
                        (u.Email != null && u.Email.Contains(keyword)) ||
                        (u.PhoneNumber != null && u.PhoneNumber.Contains(keyword)));
                }

                var totalCount = await query.CountAsync();

                var users = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        UserName = u.UserName,
                        FullName = u.FullName,
                        Email = u.Email,
                        PhoneNumber = u.PhoneNumber,
                        Avatar = u.Avatar,
                        Status = u.Status,
                        EmailConfirmed = u.EmailConfirmed,
                        IsLocked = u.LockoutEnd.HasValue && u.LockoutEnd > DateTime.UtcNow,
                        LockoutEnd = u.LockoutEnd.HasValue ? u.LockoutEnd.Value.DateTime : (DateTime?)null, // ✅ SỬA: Convert DateTimeOffset to DateTime
                        RegisterDate = u.RegisterDate, 
                        Roles = new List<string>() // TODO: Load roles
                    })
                    .ToListAsync();

                return (users, totalCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users paged");
                throw;
            }
        }

        /// <summary>
        /// Lấy thông tin user theo ID
        /// </summary>
        public async Task<UserDto?> GetUserByIdAsync(string id)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                    return null;

                return new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    FullName = user.FullName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    Avatar = user.Avatar,
                    Status = user.Status,
                    EmailConfirmed = user.EmailConfirmed,
                    IsLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow,
                    LockoutEnd = user.LockoutEnd.HasValue ? user.LockoutEnd.Value.DateTime : (DateTime?)null, // ✅ SỬA: Convert DateTimeOffset to DateTime
                    DateOfBirth = user.DateOfBirth,
                    AccessFailedCount = user.AccessFailedCount,
                    RegisterDate = user.RegisterDate,
                    Roles = new List<string>() // TODO: Load roles
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by ID: {UserId}", id);
                throw;
            }
        }

        /// <summary>
        /// Khóa user
        /// </summary>
        public async Task<bool> LockUserAsync(string userId, string reason, int? lockoutDays, string adminId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return false;

                // Ngăn khóa tài khoản Admin
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("Admin"))
                {
                    _logger.LogWarning("Attempt to lock Admin user {UserId} by {AdminId}", userId, adminId);
                    return false;
                }

                // ✅ SỬA: Sử dụng DateTimeOffset thay vì DateTime
                if (lockoutDays.HasValue && lockoutDays > 0)
                {
                    user.LockoutEnd = DateTimeOffset.UtcNow.AddDays(lockoutDays.Value);
                }
                else
                {
                    // Khóa vĩnh viễn
                    user.LockoutEnd = DateTimeOffset.MaxValue;
                }

                var result = await _userManager.UpdateAsync(user);
                
                if (result.Succeeded)
                {
                    await SendLockNotificationEmailAsync(user, reason);

                    _logger.LogInformation("User {UserId} locked by admin {AdminId} for reason: {Reason}",
                        userId, adminId, reason);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error locking user {UserId}", userId);
                throw;
            }
        }

        private async Task SendLockNotificationEmailAsync(ApplicationUser user, string reason)
        {
            if (string.IsNullOrWhiteSpace(user.Email))
            {
                _logger.LogWarning("Cannot send lock notification because user {UserId} has no email", user.Id);
                return;
            }

            try
            {
                var lockReason = string.IsNullOrWhiteSpace(reason)
                    ? "Vi phạm quy định hệ thống"
                    : reason.Trim();

                var isPermanentLock = user.LockoutEnd.HasValue && user.LockoutEnd.Value == DateTimeOffset.MaxValue;
                var lockUntilText = isPermanentLock
                    ? "Vĩnh viễn"
                    : user.LockoutEnd?.ToLocalTime().ToString("dd/MM/yyyy HH:mm") ?? "Không xác định";

                var htmlMessage = $@"
                    <p>Xin chào <strong>{WebUtility.HtmlEncode(user.FullName ?? user.Email)}</strong>,</p>
                    <p>Tài khoản LazPe của bạn đã bị khóa.</p>
                    <ul>
                        <li><strong>Lý do khóa:</strong> {WebUtility.HtmlEncode(lockReason)}</li>
                        <li><strong>Thời điểm khóa:</strong> {DateTime.Now:dd/MM/yyyy HH:mm}</li>
                        <li><strong>Thời gian mở khóa:</strong> {WebUtility.HtmlEncode(lockUntilText)}</li>
                    </ul>
                    <p>Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ để được xử lý.</p>";

                await _emailSender.SendEmailAsync(
                    user.Email,
                    "[LazPe] Thông báo khóa tài khoản",
                    htmlMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send lock notification email to user {UserId}", user.Id);
            }
        }

        /// <summary>
        /// Mở khóa user
        /// </summary>
        public async Task<bool> UnlockUserAsync(string userId, string adminId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return false;

                // Set LockoutEnd về null
                user.LockoutEnd = null;
                user.AccessFailedCount = 0;

                var result = await _userManager.UpdateAsync(user);
                
                if (result.Succeeded)
                {
                    _logger.LogInformation("User {UserId} unlocked by admin {AdminId}",
                        userId, adminId);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unlocking user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Toggle trạng thái user
        /// </summary>
        public async Task<bool> ToggleUserStatusAsync(string userId, string adminId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return false;

                user.Status = !user.Status;
                var result = await _userManager.UpdateAsync(user);

                if (result.Succeeded)
                {
                    _logger.LogInformation("User {UserId} status toggled by admin {AdminId}",
                        userId, adminId);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling user status {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Lấy thống kê users
        /// </summary>
        public async Task<UserStatisticsDto> GetUserStatisticsAsync()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var activeUsers = await _context.Users
                    .Where(u => u.Status && !(u.LockoutEnd.HasValue && u.LockoutEnd > DateTimeOffset.UtcNow))
                    .CountAsync();
                var lockedUsers = await _context.Users
                    .Where(u => u.LockoutEnd.HasValue && u.LockoutEnd > DateTimeOffset.UtcNow)
                    .CountAsync();
                var newUsersThisMonth = await _context.Users
                    .Where(u => u.RegisterDate >= DateTime.UtcNow.AddDays(-30))
                    .CountAsync();

                return new UserStatisticsDto
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    LockedUsers = lockedUsers,
                    NewUsersThisMonth = newUsersThisMonth
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user statistics");
                throw;
            }
        }
    }
}
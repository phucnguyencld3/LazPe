using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    /// <summary>
    /// User service interface
    /// </summary>
    public interface IUserService
    {
        /// <summary>
        /// Lấy danh sách users có phân trang
        /// </summary>
        Task<(List<UserDto> users, int totalCount)> GetUsersPagedAsync(
            string? search = null,
            int page = 1,
            int pageSize = 10);

        /// <summary>
        /// Lấy thông tin user theo ID
        /// </summary>
        Task<UserDto?> GetUserByIdAsync(string id);

        /// <summary>
        /// Khóa user
        /// </summary>
        Task<bool> LockUserAsync(string userId, string reason, int? lockoutDays, string adminId);

        /// <summary>
        /// Mở khóa user
        /// </summary>
        Task<bool> UnlockUserAsync(string userId, string adminId);

        /// <summary>
        /// Toggle trạng thái user
        /// </summary>
        Task<bool> ToggleUserStatusAsync(string userId, string adminId);

        /// <summary>
        /// Lấy thống kê users
        /// </summary>
        Task<UserStatisticsDto> GetUserStatisticsAsync();
    }
}
using PolyBabyAPI.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PolyBabyAPI.Interfaces
{
    public interface INotificationService
    {
        // Admin - Campaign CRUD
        Task<NotificationDto?> GetNotificationByIdAsync(int id);
        Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto, string createdBy);
        Task<NotificationDto?> UpdateNotificationAsync(int id, UpdateNotificationDto dto);
        Task<bool> DeleteNotificationAsync(int id);
        Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync(string? searchTerm = null);

        // Admin - Template CRUD
        Task<NotificationTemplateDto?> GetTemplateByIdAsync(int id);
        Task<NotificationTemplateDto> CreateTemplateAsync(NotificationTemplateDto dto);
        Task<NotificationTemplateDto?> UpdateTemplateAsync(int id, NotificationTemplateDto dto);
        Task<bool> DeleteTemplateAsync(int id);
        Task<IEnumerable<NotificationTemplateDto>> GetAllTemplatesAsync();

        // Dispatch & Scheduling
        Task<bool> SendNotificationNowAsync(int notificationId);
        Task<bool> PublishNotificationAsync(int notificationId); // Hangfire or Immediate
        Task<bool> CancelScheduledNotificationAsync(int notificationId);
        Task<bool> SendSystemNotificationAsync(string userId, string title, string message);

        // Client - Operations
        Task<IEnumerable<UserNotificationDto>> GetUserNotificationsAsync(string userId, string? type = null, bool? isRead = null, int page = 1, int pageSize = 20);
        Task<int> GetUnreadCountAsync(string userId);
        Task<bool> MarkAsReadAsync(string userId, int userNotificationId);
        Task<bool> MarkAllAsReadAsync(string userId);
        Task<bool> SoftDeleteUserNotificationAsync(string userId, int userNotificationId);

        // Admin - Dashboard Statistics
        Task<NotificationStatisticsDto> GetAdminStatisticsAsync();
    }
}

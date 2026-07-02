using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Hubs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            IHubContext<NotificationHub> hubContext,
            IBackgroundJobClient backgroundJobClient,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _userManager = userManager;
            _hubContext = hubContext;
            _backgroundJobClient = backgroundJobClient;
            _logger = logger;
        }

        #region Admin - Campaign CRUD

        public async Task<NotificationDto?> GetNotificationByIdAsync(int id)
        {
            var notif = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);
            if (notif == null) return null;

            var recipientsCount = await _context.UserNotifications.CountAsync(un => un.NotificationId == id);
            var readCount = await _context.UserNotifications.CountAsync(un => un.NotificationId == id && un.IsRead);

            return MapToDto(notif, recipientsCount, readCount);
        }

        public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto, string createdBy)
        {
            var notif = new Notification
            {
                Code = "NOTIF-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper(),
                Title = dto.Title,
                ShortDescription = dto.ShortDescription,
                Content = dto.Content,
                ThumbnailImage = dto.ThumbnailImage,
                BannerImage = dto.BannerImage,
                Type = dto.Type,
                CustomTypeName = dto.CustomTypeName,
                Priority = dto.Priority,
                ActionType = dto.ActionType,
                ActionUrl = dto.ActionUrl,
                TargetType = dto.TargetType,
                TargetValue = dto.TargetValue,
                IsPinned = dto.IsPinned,
                CreatedBy = createdBy,
                CreatedAt = DateTime.Now,
                PublishedAt = dto.PublishedAt,
                ExpiredAt = dto.ExpiredAt,
                Status = NotificationStatus.Draft
            };

            // Xác định trạng thái ban đầu dựa trên PublishedAt
            if (dto.PublishedAt.HasValue && dto.PublishedAt.Value > DateTime.Now)
            {
                notif.Status = NotificationStatus.Scheduled;
            }

            _context.Notifications.Add(notif);
            await _context.SaveChangesAsync();

            // Nếu là Scheduled, đăng ký Hangfire Job
            if (notif.Status == NotificationStatus.Scheduled && notif.PublishedAt.HasValue)
            {
                var delay = notif.PublishedAt.Value - DateTime.Now;
                var jobId = _backgroundJobClient.Schedule<INotificationService>(
                    service => service.PublishNotificationAsync(notif.Id),
                    delay
                );
                notif.HangfireJobId = jobId;
                await _context.SaveChangesAsync();
            }
            else if (!dto.PublishedAt.HasValue || dto.PublishedAt.Value <= DateTime.Now)
            {
                // Gửi ngay lập tức
                await PublishNotificationAsync(notif.Id);
            }

            return MapToDto(notif, 0, 0);
        }

        public async Task<NotificationDto?> UpdateNotificationAsync(int id, UpdateNotificationDto dto)
        {
            var notif = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);
            if (notif == null) return null;

            if (notif.Status == NotificationStatus.Sent)
            {
                throw new InvalidOperationException("Không thể chỉnh sửa thông báo đã được gửi.");
            }

            notif.Title = dto.Title;
            notif.ShortDescription = dto.ShortDescription;
            notif.Content = dto.Content;
            notif.ThumbnailImage = dto.ThumbnailImage;
            notif.BannerImage = dto.BannerImage;
            notif.Type = dto.Type;
            notif.CustomTypeName = dto.CustomTypeName;
            notif.Priority = dto.Priority;
            notif.ActionType = dto.ActionType;
            notif.ActionUrl = dto.ActionUrl;
            notif.TargetType = dto.TargetType;
            notif.TargetValue = dto.TargetValue;
            notif.IsPinned = dto.IsPinned;
            notif.ExpiredAt = dto.ExpiredAt;
            notif.UpdatedAt = DateTime.Now;

            // Xử lý lại lịch gửi Hangfire
            if (dto.PublishedAt.HasValue && dto.PublishedAt.Value > DateTime.Now)
            {
                // Hủy job cũ nếu có
                if (!string.IsNullOrEmpty(notif.HangfireJobId))
                {
                    _backgroundJobClient.Delete(notif.HangfireJobId);
                }

                notif.PublishedAt = dto.PublishedAt;
                notif.Status = NotificationStatus.Scheduled;

                var delay = dto.PublishedAt.Value - DateTime.Now;
                var jobId = _backgroundJobClient.Schedule<INotificationService>(
                    service => service.PublishNotificationAsync(notif.Id),
                    delay
                );
                notif.HangfireJobId = jobId;
            }
            else
            {
                // Nếu đổi thành gửi ngay lập tức
                if (!string.IsNullOrEmpty(notif.HangfireJobId))
                {
                    _backgroundJobClient.Delete(notif.HangfireJobId);
                    notif.HangfireJobId = null;
                }
                notif.PublishedAt = DateTime.Now;
                await PublishNotificationAsync(notif.Id);
            }

            await _context.SaveChangesAsync();

            var recipientsCount = await _context.UserNotifications.CountAsync(un => un.NotificationId == id);
            var readCount = await _context.UserNotifications.CountAsync(un => un.NotificationId == id && un.IsRead);
            return MapToDto(notif, recipientsCount, readCount);
        }

        public async Task<bool> DeleteNotificationAsync(int id)
        {
            var notif = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);
            if (notif == null) return false;

            // Hủy Job nếu chưa gửi
            if (notif.Status == NotificationStatus.Scheduled && !string.IsNullOrEmpty(notif.HangfireJobId))
            {
                _backgroundJobClient.Delete(notif.HangfireJobId);
            }

            notif.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync(string? searchTerm = null)
        {
            var query = _context.Notifications.Where(n => !n.IsDeleted);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(n => n.Title.Contains(searchTerm) || n.ShortDescription.Contains(searchTerm) || n.Code.Contains(searchTerm));
            }

            var list = await query.OrderByDescending(n => n.CreatedAt).ToListAsync();
            var dtoList = new List<NotificationDto>();

            foreach (var notif in list)
            {
                var recipientsCount = await _context.UserNotifications.CountAsync(un => un.NotificationId == notif.Id);
                var readCount = await _context.UserNotifications.CountAsync(un => un.NotificationId == notif.Id && un.IsRead);
                dtoList.Add(MapToDto(notif, recipientsCount, readCount));
            }

            return dtoList;
        }

        #endregion

        #region Admin - Template CRUD

        public async Task<NotificationTemplateDto?> GetTemplateByIdAsync(int id)
        {
            var temp = await _context.NotificationTemplates.FindAsync(id);
            if (temp == null) return null;
            return MapToDto(temp);
        }

        public async Task<NotificationTemplateDto> CreateTemplateAsync(NotificationTemplateDto dto)
        {
            var temp = new NotificationTemplate
            {
                TemplateName = dto.TemplateName,
                TemplateCode = dto.TemplateCode,
                TemplateContent = dto.TemplateContent,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.Now
            };

            _context.NotificationTemplates.Add(temp);
            await _context.SaveChangesAsync();
            return MapToDto(temp);
        }

        public async Task<NotificationTemplateDto?> UpdateTemplateAsync(int id, NotificationTemplateDto dto)
        {
            var temp = await _context.NotificationTemplates.FindAsync(id);
            if (temp == null) return null;

            temp.TemplateName = dto.TemplateName;
            temp.TemplateCode = dto.TemplateCode;
            temp.TemplateContent = dto.TemplateContent;
            temp.IsActive = dto.IsActive;
            temp.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return MapToDto(temp);
        }

        public async Task<bool> DeleteTemplateAsync(int id)
        {
            var temp = await _context.NotificationTemplates.FindAsync(id);
            if (temp == null) return false;

            _context.NotificationTemplates.Remove(temp);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<NotificationTemplateDto>> GetAllTemplatesAsync()
        {
            var list = await _context.NotificationTemplates
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
            return list.Select(MapToDto);
        }

        #endregion

        #region Dispatch & Scheduling

        public async Task<bool> SendNotificationNowAsync(int notificationId)
        {
            var notif = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && !n.IsDeleted);
            if (notif == null) return false;

            if (notif.Status == NotificationStatus.Sent) return true;

            // Hủy job cũ nếu đang scheduled
            if (notif.Status == NotificationStatus.Scheduled && !string.IsNullOrEmpty(notif.HangfireJobId))
            {
                _backgroundJobClient.Delete(notif.HangfireJobId);
                notif.HangfireJobId = null;
            }

            notif.PublishedAt = DateTime.Now;
            return await PublishNotificationAsync(notificationId);
        }

        public async Task<bool> CancelScheduledNotificationAsync(int notificationId)
        {
            var notif = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && !n.IsDeleted);
            if (notif == null) return false;

            if (notif.Status != NotificationStatus.Scheduled) return false;

            if (!string.IsNullOrEmpty(notif.HangfireJobId))
            {
                _backgroundJobClient.Delete(notif.HangfireJobId);
                notif.HangfireJobId = null;
            }

            notif.Status = NotificationStatus.Cancelled;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> PublishNotificationAsync(int notificationId)
        {
            var notif = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && !n.IsDeleted);
            if (notif == null)
            {
                _logger.LogWarning("PublishNotificationAsync: Không tìm thấy thông báo ID {Id}", notificationId);
                return false;
            }

            _logger.LogInformation("Bắt đầu xử lý phát thông báo ID {Id}: '{Title}'", notificationId, notif.Title);

            // 1. Phân giải danh sách User nhận
            var targetUserIds = await ResolveTargetUserIdsAsync(notif.TargetType, notif.TargetValue, notif.Type);
            if (!targetUserIds.Any())
            {
                _logger.LogWarning("Không có khách hàng nào thỏa mãn điều kiện nhận thông báo ID {Id}", notificationId);
                notif.Status = NotificationStatus.Sent;
                await _context.SaveChangesAsync();
                return true;
            }

            // 2. Tạo UserNotifications bulk
            var userNotifications = new List<UserNotification>();
            var now = DateTime.Now;

            foreach (var userId in targetUserIds)
            {
                userNotifications.Add(new UserNotification
                {
                    UserId = userId,
                    NotificationId = notificationId,
                    IsRead = false,
                    CreatedAt = now
                });
            }

            // Bulk insert using EF Core
            _context.UserNotifications.AddRange(userNotifications);

            // Cập nhật trạng thái thông báo
            notif.Status = NotificationStatus.Sent;
            notif.PublishedAt = notif.PublishedAt ?? now;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Đã lưu {Count} bản ghi UserNotification cho thông báo ID {Id}", userNotifications.Count, notificationId);

            // 3. Đẩy realtime qua SignalR tới từng người dùng
            foreach (var userNotif in userNotifications)
            {
                var clientDto = new UserNotificationDto
                {
                    Id = userNotif.Id,
                    UserId = userNotif.UserId,
                    NotificationId = notificationId,
                    IsRead = false,
                    CreatedAt = userNotif.CreatedAt,
                    Code = notif.Code,
                    Title = notif.Title,
                    ShortDescription = notif.ShortDescription,
                    Content = notif.Content,
                    ThumbnailImage = notif.ThumbnailImage,
                    BannerImage = notif.BannerImage,
                    Type = notif.Type.ToString(),
                    Priority = notif.Priority.ToString(),
                    ActionType = notif.ActionType.ToString(),
                    ActionUrl = notif.ActionUrl,
                    IsPinned = notif.IsPinned
                };

                // Gửi trực tiếp tới user-group thông qua connection đã kết nối
                await _hubContext.Clients.Group($"User_{userNotif.UserId}").SendAsync("ReceiveNotification", clientDto);
            }

            _logger.LogInformation("Đã phát thông báo ID {Id} realtime qua SignalR", notificationId);
            return true;
        }

        private async Task<List<string>> ResolveTargetUserIdsAsync(TargetType targetType, string? targetValue, NotificationType notifType)
        {
            var userQuery = _context.Users.Where(u => u.Status);

            // Áp dụng bộ lọc preferences cài đặt nhận thông báo của user
            if (notifType == NotificationType.Promotion)
            {
                userQuery = userQuery.Where(u => u.ReceivePromotions);
            }
            else if (notifType == NotificationType.Order)
            {
                userQuery = userQuery.Where(u => u.ReceiveOrderUpdates);
            }

            List<string> candidateUserIds;

            switch (targetType)
            {
                case TargetType.All:
                    candidateUserIds = await userQuery.Select(u => u.Id).ToListAsync();
                    break;

                case TargetType.Role:
                    var roles = (targetValue ?? "").Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                                                  .Select(r => r.Trim())
                                                  .ToList();
                    candidateUserIds = new List<string>();
                    foreach (var role in roles)
                    {
                        var usersInRole = await _userManager.GetUsersInRoleAsync(role);
                        var filteredRoleUserIds = usersInRole.Where(u => u.Status).Select(u => u.Id);
                        candidateUserIds.AddRange(filteredRoleUserIds);
                    }
                    candidateUserIds = candidateUserIds.Distinct().ToList();
                    
                    // Filter candidates based on preferences too
                    var candidateSet = candidateUserIds.ToHashSet();
                    candidateUserIds = await userQuery.Where(u => candidateSet.Contains(u.Id)).Select(u => u.Id).ToListAsync();
                    break;

                case TargetType.LoyaltyTier:
                    var tiers = (targetValue ?? "").Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                                                  .Select(t => t.Trim().ToLower())
                                                  .ToList();
                    
                    candidateUserIds = await userQuery
                        .Join(_context.LoyaltyProfiles, u => u.Id, lp => lp.UserID, (u, lp) => new { u.Id, lp.Tier.TierName })
                        .Where(x => tiers.Contains(x.TierName.ToLower()))
                        .Select(x => x.Id)
                        .ToListAsync();
                    break;

                case TargetType.SpecificUsers:
                    var specIds = (targetValue ?? "").Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                                                     .Select(id => id.Trim())
                                                     .ToList();
                    candidateUserIds = await userQuery.Where(u => specIds.Contains(u.Id)).Select(u => u.Id).ToListAsync();
                    break;

                case TargetType.Condition:
                    var condition = (targetValue ?? "").Trim().ToLower();
                    if (condition == "noorders") // Chưa mua hàng
                    {
                        candidateUserIds = await userQuery
                            .GroupJoin(_context.Invoices.Where(i => !i.IsDeleted), u => u.Id, i => i.UserID, (u, invoices) => new { u.Id, InvoiceCount = invoices.Count() })
                            .Where(x => x.InvoiceCount == 0)
                            .Select(x => x.Id)
                            .ToListAsync();
                    }
                    else if (condition == "hasorders") // Người có đơn hàng
                    {
                        candidateUserIds = await userQuery
                            .Join(_context.Invoices.Where(i => !i.IsDeleted), u => u.Id, i => i.UserID, (u, i) => u.Id)
                            .Distinct()
                            .ToListAsync();
                    }
                    else if (condition == "haspoints") // Có điểm thưởng
                    {
                        candidateUserIds = await userQuery
                            .Join(_context.LoyaltyProfiles, u => u.Id, lp => lp.UserID, (u, lp) => new { u.Id, Points = lp.AvailablePoints })
                            .Where(x => x.Points > 0)
                            .Select(x => x.Id)
                            .ToListAsync();
                    }
                    else if (condition == "tierexpiring") // Sắp hết hạn hạng thành viên
                    {
                        var expiryThreshold = DateTime.Now.AddDays(-170);
                        candidateUserIds = await userQuery
                            .Join(_context.LoyaltyProfiles, u => u.Id, lp => lp.UserID, (u, lp) => new { u.Id, lp.LastUpdated })
                            .Where(x => x.LastUpdated <= expiryThreshold)
                            .Select(x => x.Id)
                            .ToListAsync();
                    }
                    else
                    {
                        candidateUserIds = new List<string>();
                    }
                    break;

                default:
                    candidateUserIds = new List<string>();
                    break;
            }

            return candidateUserIds;
        }

        #endregion

        #region Client - Operations

        public async Task<IEnumerable<UserNotificationDto>> GetUserNotificationsAsync(string userId, string? type = null, bool? isRead = null, int page = 1, int pageSize = 20)
        {
            var query = _context.UserNotifications
                .Include(un => un.Notification)
                .Where(un => un.UserId == userId && !un.IsDeleted && !un.Notification!.IsDeleted && un.Notification.Status == NotificationStatus.Sent);

            if (isRead.HasValue)
            {
                query = query.Where(un => un.IsRead == isRead.Value);
            }

            if (!string.IsNullOrEmpty(type))
            {
                if (Enum.TryParse<NotificationType>(type, true, out var parsedType))
                {
                    query = query.Where(un => un.Notification!.Type == parsedType);
                }
            }

            var list = await query
                .OrderByDescending(un => un.Notification!.IsPinned)
                .ThenByDescending(un => un.Notification!.PublishedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return list.Select(un => new UserNotificationDto
            {
                Id = un.Id,
                UserId = un.UserId,
                NotificationId = un.NotificationId,
                IsRead = un.IsRead,
                ReadAt = un.ReadAt,
                CreatedAt = un.CreatedAt,
                Code = un.Notification!.Code,
                Title = un.Notification.Title,
                ShortDescription = un.Notification.ShortDescription,
                Content = un.Notification.Content,
                ThumbnailImage = un.Notification.ThumbnailImage,
                BannerImage = un.Notification.BannerImage,
                Type = un.Notification.Type == NotificationType.Custom ? (un.Notification.CustomTypeName ?? "Custom") : un.Notification.Type.ToString(),
                Priority = un.Notification.Priority.ToString(),
                ActionType = un.Notification.ActionType.ToString(),
                ActionUrl = un.Notification.ActionUrl,
                IsPinned = un.Notification.IsPinned
            });
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _context.UserNotifications
                .Where(un => un.UserId == userId && !un.IsRead && !un.IsDeleted && !un.Notification!.IsDeleted && un.Notification.Status == NotificationStatus.Sent)
                .CountAsync();
        }

        public async Task<bool> MarkAsReadAsync(string userId, int userNotificationId)
        {
            var userNotif = await _context.UserNotifications
                .FirstOrDefaultAsync(un => un.Id == userNotificationId && un.UserId == userId && !un.IsDeleted);

            if (userNotif == null) return false;
            if (userNotif.IsRead) return true;

            userNotif.IsRead = true;
            userNotif.ReadAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkAllAsReadAsync(string userId)
        {
            var unreadList = await _context.UserNotifications
                .Where(un => un.UserId == userId && !un.IsRead && !un.IsDeleted)
                .ToListAsync();

            if (!unreadList.Any()) return true;

            var now = DateTime.Now;
            foreach (var un in unreadList)
            {
                un.IsRead = true;
                un.ReadAt = now;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteUserNotificationAsync(string userId, int userNotificationId)
        {
            var userNotif = await _context.UserNotifications
                .FirstOrDefaultAsync(un => un.Id == userNotificationId && un.UserId == userId && !un.IsDeleted);

            if (userNotif == null) return false;

            userNotif.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        #region Admin - Dashboard Statistics

        public async Task<NotificationStatisticsDto> GetAdminStatisticsAsync()
        {
            var totalNotifications = await _context.Notifications.CountAsync(n => !n.IsDeleted);
            var totalSent = await _context.Notifications.CountAsync(n => !n.IsDeleted && n.Status == NotificationStatus.Sent);
            
            var totalRecipients = await _context.UserNotifications.CountAsync(un => !un.IsDeleted);
            var totalRead = await _context.UserNotifications.CountAsync(un => !un.IsDeleted && un.IsRead);

            // Tính tỷ lệ đọc theo Loại thông báo
            var readRatesByType = new List<NotificationTypeStatDto>();
            var types = Enum.GetValues<NotificationType>();

            foreach (var type in types)
            {
                var typeSentCount = await _context.UserNotifications
                    .CountAsync(un => !un.IsDeleted && un.Notification!.Type == type);
                
                var typeReadCount = await _context.UserNotifications
                    .CountAsync(un => !un.IsDeleted && un.IsRead && un.Notification!.Type == type);

                readRatesByType.Add(new NotificationTypeStatDto
                {
                    TypeName = type.ToString(),
                    SentCount = typeSentCount,
                    ReadCount = typeReadCount
                });
            }

            // Tính số lượng gửi theo thời gian (7 ngày qua)
            var sentOverTime = new List<NotificationTimeSeriesStatDto>();
            var now = DateTime.Now.Date;

            for (int i = 6; i >= 0; i--)
            {
                var targetDate = now.AddDays(-i);
                var nextDate = targetDate.AddDays(1);

                var daySentCount = await _context.UserNotifications
                    .CountAsync(un => !un.IsDeleted && un.CreatedAt >= targetDate && un.CreatedAt < nextDate);

                var dayReadCount = await _context.UserNotifications
                    .CountAsync(un => !un.IsDeleted && un.IsRead && un.CreatedAt >= targetDate && un.CreatedAt < nextDate);

                sentOverTime.Add(new NotificationTimeSeriesStatDto
                {
                    Date = targetDate.ToString("yyyy-MM-dd"),
                    SentCount = daySentCount,
                    ReadCount = dayReadCount
                });
            }

            // Lấy Top 5 Chiến dịch có tỷ lệ đọc cao nhất
            var listNotifications = await _context.Notifications.Where(n => !n.IsDeleted && n.Status == NotificationStatus.Sent).ToListAsync();
            var topCampaigns = new List<NotificationDto>();

            foreach (var notif in listNotifications)
            {
                var rec = await _context.UserNotifications.CountAsync(un => un.NotificationId == notif.Id);
                var rd = await _context.UserNotifications.CountAsync(un => un.NotificationId == notif.Id && un.IsRead);
                if (rec > 0)
                {
                    topCampaigns.Add(MapToDto(notif, rec, rd));
                }
            }

            topCampaigns = topCampaigns
                .OrderByDescending(c => c.ReadRate)
                .ThenByDescending(c => c.RecipientsCount)
                .Take(5)
                .ToList();

            // Giả lập tỷ lệ tương tác (engagement) = click trên link action
            var engagementRate = totalRead > 0 ? Math.Round((double)totalRead * 0.45 / totalRecipients * 100, 2) : 0; 
            if (engagementRate > 100) engagementRate = 100;

            return new NotificationStatisticsDto
            {
                TotalNotifications = totalNotifications,
                TotalSent = totalSent,
                TotalRecipients = totalRecipients,
                TotalRead = totalRead,
                EngagementRate = engagementRate,
                ReadRatesByType = readRatesByType,
                SentOverTime = sentOverTime,
                TopCampaigns = topCampaigns
            };
        }

        #endregion

        #region Mappers

        private NotificationDto MapToDto(Notification entity, int recipientsCount, int readCount)
        {
            return new NotificationDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Title = entity.Title,
                ShortDescription = entity.ShortDescription,
                Content = entity.Content,
                ThumbnailImage = entity.ThumbnailImage,
                BannerImage = entity.BannerImage,
                Type = entity.Type,
                CustomTypeName = entity.CustomTypeName,
                Priority = entity.Priority,
                ActionType = entity.ActionType,
                ActionUrl = entity.ActionUrl,
                TargetType = entity.TargetType,
                TargetValue = entity.TargetValue,
                Status = entity.Status,
                PublishedAt = entity.PublishedAt,
                ExpiredAt = entity.ExpiredAt,
                CreatedBy = entity.CreatedBy,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                IsPinned = entity.IsPinned,
                RecipientsCount = recipientsCount,
                ReadCount = readCount
            };
        }

        private NotificationTemplateDto MapToDto(NotificationTemplate entity)
        {
            return new NotificationTemplateDto
            {
                Id = entity.Id,
                TemplateName = entity.TemplateName,
                TemplateCode = entity.TemplateCode,
                TemplateContent = entity.TemplateContent,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt
            };
        }

        #endregion
    }
}

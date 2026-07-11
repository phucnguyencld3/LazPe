using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Hubs;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Jobs
{
    public class BabyWeightReminderJob
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<BabyWeightReminderJob> _logger;

        public BabyWeightReminderJob(
            ApplicationDbContext context,
            IHubContext<NotificationHub> hubContext,
            ILogger<BabyWeightReminderJob> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            _logger.LogInformation("Bắt đầu chạy BabyWeightReminderJob...");

            var babies = await _context.BabyProfiles
                .Include(b => b.GrowthRecords)
                .Include(b => b.User)
                .ToListAsync();

            int notificationCount = 0;
            var now = DateTime.Now;

            foreach (var baby in babies)
            {
                if (baby.User == null || !baby.User.Status) continue;

                var lastRecord = baby.GrowthRecords.OrderByDescending(r => r.RecordedDate).FirstOrDefault();
                
                bool needsUpdate = false;

                if (lastRecord == null) {
                    needsUpdate = true;
                } else {
                    var monthsSinceLast = (now.Year - lastRecord.RecordedDate.Year) * 12 + now.Month - lastRecord.RecordedDate.Month;
                    if (now.Day < lastRecord.RecordedDate.Day) {
                        monthsSinceLast--;
                    }
                    if (monthsSinceLast >= 1) needsUpdate = true;
                }

                if (needsUpdate)
                {
                    string title = "Nhắc nhở cập nhật cân nặng";
                    string message = $"Đã đến lúc cập nhật chỉ số phát triển tháng này cho bé {baby.Name}. Cập nhật ngay để LazPe đưa ra những phân tích và gợi ý dinh dưỡng chính xác nhất nhé!";
                    string actionUrl = "/profile?tab=profile";

                    // Check if we already sent this specific notification today to avoid spamming in testing mode
                    var alreadySentToday = await _context.UserNotifications
                        .Include(un => un.Notification)
                        .AnyAsync(un => un.UserId == baby.UserID 
                            && un.Notification!.ActionUrl == actionUrl 
                            && un.Notification.Title == title 
                            && un.CreatedAt.Date == now.Date);

                    if (alreadySentToday) continue;

                    // Create Notification
                    var notif = new Notification
                    {
                        Code = "BABY-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper(),
                        Title = title,
                        ShortDescription = message,
                        Content = message,
                        Type = NotificationType.Custom,
                        CustomTypeName = "BabyReminder",
                        Priority = NotificationPriority.Medium,
                        ActionType = ActionType.CustomUrl,
                        ActionUrl = actionUrl,
                        CreatedBy = "System",
                        CreatedAt = now,
                        PublishedAt = now,
                        Status = NotificationStatus.Sent
                    };

                    _context.Notifications.Add(notif);
                    await _context.SaveChangesAsync();

                    // Create UserNotification
                    var userNotif = new UserNotification
                    {
                        UserId = baby.UserID,
                        NotificationId = notif.Id,
                        IsRead = false,
                        CreatedAt = now
                    };
                    
                    _context.UserNotifications.Add(userNotif);
                    await _context.SaveChangesAsync();

                    // Send SignalR real-time notification
                    var userNotifDto = new UserNotificationDto
                    {
                        Id = userNotif.Id,
                        NotificationId = notif.Id,
                        Title = notif.Title,
                        ShortDescription = notif.ShortDescription,
                        ThumbnailImage = notif.ThumbnailImage,
                        Type = notif.CustomTypeName,
                        IsRead = false,
                        CreatedAt = userNotif.CreatedAt,
                        ActionUrl = notif.ActionUrl
                    };

                    await _hubContext.Clients.User(baby.UserID).SendAsync("ReceiveNotification", userNotifDto);
                    
                    notificationCount++;
                }
            }

            _logger.LogInformation($"BabyWeightReminderJob hoàn tất. Đã gửi {notificationCount} thông báo.");
        }
    }
}

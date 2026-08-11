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
using Microsoft.AspNetCore.Identity.UI.Services;

namespace PolyBabyAPI.Jobs
{
    public class BabyWeightReminderJob
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<BabyWeightReminderJob> _logger;
        private readonly IEmailSender _emailSender;

        public BabyWeightReminderJob(
            ApplicationDbContext context,
            IHubContext<NotificationHub> hubContext,
            ILogger<BabyWeightReminderJob> logger,
            IEmailSender emailSender)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
            _emailSender = emailSender;
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

                    // Gửi Email nếu là mùng 1 đầu tháng
                    if (now.Day == 1 && !string.IsNullOrEmpty(baby.User.Email))
                    {
                        string emailSubject = $"Nhắc nhở: Cập nhật cân nặng cho bé {baby.Name}";
                        string htmlBody = $@"
                            <html>
                            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                                <div style='max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                                    <div style='background-color: #ff914d; color: white; padding: 20px; text-align: center;'>
                                        <h2 style='margin: 0;'>LazPe - Hành trình cùng bé</h2>
                                    </div>
                                    <div style='padding: 20px;'>
                                        <p>Chào ba mẹ bé <strong>{baby.Name}</strong>,</p>
                                        <p>Đã đến lúc cập nhật chỉ số phát triển tháng này cho bé {baby.Name}. Cập nhật ngay để LazPe đưa ra những phân tích và gợi ý dinh dưỡng chính xác nhất nhé!</p>
                                        <div style='text-align: center; margin: 30px 0;'>
                                            <a href='https://lazpe.com{actionUrl}' style='background-color: #ff914d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;'>Cập Nhật Cân Nặng Ngay</a>
                                        </div>
                                    </div>
                                    <div style='background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888;'>
                                        <p style='margin: 0;'>Đây là email tự động từ hệ thống LazPe. Bạn có thể thay đổi tùy chọn nhận email tại <a href='https://lazpe.com/settings' style='color: #ff914d;'>Cài đặt thông báo</a>.</p>
                                    </div>
                                </div>
                            </body>
                            </html>";

                        try
                        {
                            await _emailSender.SendEmailAsync(baby.User.Email, emailSubject, htmlBody);
                            _logger.LogInformation($"Đã gửi email nhắc nhở cập nhật cân nặng cho user {baby.UserID} (bé {baby.Name})");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Lỗi khi gửi email nhắc nhở cân nặng cho user {baby.UserID}");
                        }
                    }

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

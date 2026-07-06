using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Jobs
{
    public class BabyTimelineYearEndJob
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ILogger<BabyTimelineYearEndJob> _logger;

        public BabyTimelineYearEndJob(
            ApplicationDbContext context, 
            INotificationService notificationService,
            ILogger<BabyTimelineYearEndJob> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            _logger.LogInformation("Starting BabyTimelineYearEndJob to send Year-in-Review notifications...");

            // Lấy tất cả hồ sơ bé
            var activeBabies = await _context.BabyProfiles.ToListAsync();

            int count = 0;

            foreach (var baby in activeBabies)
            {
                if (string.IsNullOrEmpty(baby.UserID)) continue;

                var notifDto = new CreateNotificationDto
                {
                    Title = $"Nhìn lại năm qua của bé {baby.Name}! 🌟",
                    ShortDescription = "Hành trình khôn lớn năm qua của con đã sẵn sàng. Cùng khám phá nhé!",
                    Content = $"<p>Hành trình năm nay của bé <strong>{baby.Name}</strong> đã sẵn sàng. Bố mẹ nhấp vào để xem ngay những khoảnh khắc đáng nhớ nhất nhé!</p>",
                    Type = NotificationType.System,
                    Priority = NotificationPriority.High,
                    ActionType = ActionType.CustomUrl,
                    ActionUrl = $"/baby-timeline/{baby.BabyProfileID}",
                    TargetType = TargetType.SpecificUsers,
                    TargetValue = baby.UserID,
                    IsPinned = false,
                    PublishedAt = DateTime.Now // Gửi ngay
                };

                try
                {
                    await _notificationService.CreateNotificationAsync(notifDto, "SystemJob");
                    count++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to send Year-in-Review notification to user {baby.UserID} for baby {baby.BabyProfileID}");
                }
            }

            _logger.LogInformation($"BabyTimelineYearEndJob finished successfully. Sent {count} notifications.");
        }
    }
}

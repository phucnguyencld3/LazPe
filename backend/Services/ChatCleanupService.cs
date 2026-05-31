using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class ChatCleanupService : BackgroundService
    {
        private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(24);
        private static readonly int ExpirationDays = 30;

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ChatCleanupService> _logger;

        public ChatCleanupService(
            IServiceScopeFactory scopeFactory,
            ILogger<ChatCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ChatCleanupService background service starting.");
            
            // Run a cleanup on startup
            await CleanupExpiredChatsAsync(stoppingToken);

            using var timer = new PeriodicTimer(CheckInterval);
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await CleanupExpiredChatsAsync(stoppingToken);
            }
        }

        private async Task CleanupExpiredChatsAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting automated chat cleanup (older than {Days} days)...", ExpirationDays);
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var cloudinaryService = scope.ServiceProvider.GetRequiredService<ICloudinaryService>();

                var cutoffDate = DateTime.Now.AddDays(-ExpirationDays);

                var expiredSessions = await context.ChatSessions
                    .Include(cs => cs.Messages)
                    .Where(cs => cs.UpdatedAt <= cutoffDate)
                    .ToListAsync(cancellationToken);

                if (expiredSessions.Count == 0)
                {
                    _logger.LogInformation("No expired chat sessions found.");
                    return;
                }

                _logger.LogInformation("Found {Count} expired chat sessions to delete.", expiredSessions.Count);

                int deletedImagesCount = 0;
                foreach (var session in expiredSessions)
                {
                    foreach (var msg in session.Messages)
                    {
                        if (!string.IsNullOrEmpty(msg.ImageUrl))
                        {
                            try
                            {
                                var success = await cloudinaryService.DeleteImageAsync(msg.ImageUrl);
                                if (success)
                                {
                                    deletedImagesCount++;
                                }
                                else
                                {
                                    _logger.LogWarning("Failed to delete image {Url} from Cloudinary", msg.ImageUrl);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error deleting image {Url} from Cloudinary", msg.ImageUrl);
                            }
                        }
                    }

                    context.ChatSessions.Remove(session);
                }

                await context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Successfully deleted {SessionCount} chat sessions and {ImageCount} images from Cloudinary.", 
                    expiredSessions.Count, deletedImagesCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while cleaning up expired chats.");
            }
        }
    }
}

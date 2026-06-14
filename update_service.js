const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/Services/ChatCleanupService.cs');
const code = `using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Hubs;
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
        private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(1);
        private static readonly int ExpirationDays = 30;
        private static readonly int InactiveMinutes = 15;

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ChatCleanupService> _logger;
        private int _minutesPassed = 0;

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
            
            // Run cleanup on startup
            await AutoCloseInactiveChatsAsync(stoppingToken);
            await CleanupExpiredChatsAsync(stoppingToken);

            using var timer = new PeriodicTimer(CheckInterval);
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await AutoCloseInactiveChatsAsync(stoppingToken);
                
                _minutesPassed++;
                // Check expired chats every 24 hours (1440 minutes)
                if (_minutesPassed >= 1440)
                {
                    await CleanupExpiredChatsAsync(stoppingToken);
                    _minutesPassed = 0;
                }
            }
        }

        private async Task AutoCloseInactiveChatsAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<ChatHub>>();

                var cutoffTime = DateTime.Now.AddMinutes(-InactiveMinutes);

                // Find sessions that haven't been updated in 15 mins and are not closed yet
                var inactiveSessions = await context.ChatSessions
                    .Where(cs => !cs.IsClosed && cs.UpdatedAt <= cutoffTime)
                    .ToListAsync(cancellationToken);

                if (inactiveSessions.Count == 0) return;

                _logger.LogInformation("Found {Count} inactive chat sessions to auto-close.", inactiveSessions.Count);

                foreach (var session in inactiveSessions)
                {
                    session.IsClosed = true;
                    // Send signalR event to close for client and admin
                    await hubContext.Clients.Group(session.Id).SendAsync("SessionClosed", session.Id);
                }

                await context.SaveChangesAsync(cancellationToken);
                
                // Update admins list
                await hubContext.Clients.All.SendAsync("UpdateAdminSessions");
                
                _logger.LogInformation("Successfully auto-closed {Count} inactive chat sessions.", inactiveSessions.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while auto-closing inactive chats.");
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
`;

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated ChatCleanupService.cs');

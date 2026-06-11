using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                _logger.LogInformation("User {UserId} connected to NotificationHub. ConnectionId: {ConnectionId}", userId, Context.ConnectionId);
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                _logger.LogInformation("User {UserId} disconnected from NotificationHub. ConnectionId: {ConnectionId}", userId, Context.ConnectionId);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}

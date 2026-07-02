using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace PolyBabyAPI.Hubs
{
    public class DirectMessageHub : Hub
    {
        public async Task JoinRoom(string userId)
        {
            var roomId = $"DM_{userId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
        }

        public async Task LeaveRoom(string userId)
        {
            var roomId = $"DM_{userId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        }

        public async Task SendTypingStatus(string userId, string senderName, bool isTyping)
        {
            var roomId = $"DM_{userId}";
            await Clients.Group(roomId).SendAsync("ReceiveTypingStatus", senderName, isTyping);
        }
    }
}

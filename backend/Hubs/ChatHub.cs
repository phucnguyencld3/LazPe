using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace PolyBabyAPI.Hubs
{
    public class ChatHub : Hub
    {
        public async Task JoinRoom(string sessionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        }

        public async Task LeaveRoom(string sessionId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
        }

        public async Task SendTypingStatus(string sessionId, string senderName, bool isTyping)
        {
            await Clients.Group(sessionId).SendAsync("ReceiveTypingStatus", senderName, isTyping);
        }
    }
}

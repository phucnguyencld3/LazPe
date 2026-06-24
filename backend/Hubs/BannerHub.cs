using Microsoft.AspNetCore.SignalR;

namespace PolyBabyAPI.Hubs
{
    // Cần mở AllowAnonymous để các client nặc danh (khách chưa đăng nhập) vẫn nhận được sự kiện cập nhật banner.
    // Xóa tag [Authorize]
    public class BannerHub : Hub
    {
        private readonly ILogger<BannerHub> _logger;

        public BannerHub(ILogger<BannerHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("Client connected to BannerHub. ConnectionId: {ConnectionId}", Context.ConnectionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, "ClientBanners");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("Client disconnected from BannerHub. ConnectionId: {ConnectionId}", Context.ConnectionId);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "ClientBanners");
            await base.OnDisconnectedAsync(exception);
        }
    }
}

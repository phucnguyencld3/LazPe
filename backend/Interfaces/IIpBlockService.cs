using PolyBabyAPI.Models.Mongo;

namespace PolyBabyAPI.Interfaces
{
    public interface IIpBlockService
    {
        Task<bool> IsIpBlockedAsync(string ipAddress);
        Task BlockIpAsync(string ipAddress, string reason, int durationDays = 30, string? userId = null, string? userEmail = null, List<string>? recentInvoices = null);
        Task UnblockIpAsync(string ipAddress);
        Task<List<BlockedIp>> GetAllBlockedIpsAsync();
    }
}

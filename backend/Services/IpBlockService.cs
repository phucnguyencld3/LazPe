using Microsoft.Extensions.Caching.Memory;
using MongoDB.Driver;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models.Mongo;

namespace PolyBabyAPI.Services
{
    public class IpBlockService : IIpBlockService
    {
        private readonly IMongoDbService _mongoDbService;
        private readonly IMemoryCache _cache;
        private readonly ILogger<IpBlockService> _logger;
        private const string CacheKey = "BlockedIpsCache";

        public IpBlockService(IMongoDbService mongoDbService, IMemoryCache cache, ILogger<IpBlockService> logger)
        {
            _mongoDbService = mongoDbService;
            _cache = cache;
            _logger = logger;
        }

        public async Task<bool> IsIpBlockedAsync(string ipAddress)
        {
            if (string.IsNullOrEmpty(ipAddress)) return false;

            // Kiểm tra trong Cache trước
            if (!_cache.TryGetValue(CacheKey, out HashSet<string> blockedIps))
            {
                // Nếu chưa có cache, lấy từ DB và cache lại
                blockedIps = await RefreshCacheAsync();
            }

            return blockedIps.Contains(ipAddress);
        }

        public async Task BlockIpAsync(string ipAddress, string reason, int durationDays = 30, string? userId = null, string? userEmail = null, List<string>? recentInvoices = null, int durationMinutes = 0)
        {
            if (string.IsNullOrEmpty(ipAddress)) return;

            var expiresAt = durationMinutes > 0 ? DateTime.UtcNow.AddMinutes(durationMinutes) : DateTime.UtcNow.AddDays(durationDays);

            var existing = await _mongoDbService.BlockedIps.Find(x => x.IpAddress == ipAddress).FirstOrDefaultAsync();
            if (existing != null)
            {
                // Cập nhật
                var update = Builders<BlockedIp>.Update
                    .Set(x => x.Reason, reason)
                    .Set(x => x.BlockedAt, DateTime.UtcNow)
                    .Set(x => x.ExpiresAt, expiresAt)
                    .Set(x => x.IsActive, true);
                if (userId != null) update = update.Set(x => x.UserId, userId);
                if (userEmail != null) update = update.Set(x => x.UserEmail, userEmail);
                if (recentInvoices != null && recentInvoices.Any()) update = update.Set(x => x.RecentInvoices, recentInvoices);
                
                await _mongoDbService.BlockedIps.UpdateOneAsync(x => x.Id == existing.Id, update);
            }
            else
            {
                // Thêm mới
                var newBlock = new BlockedIp
                {
                    IpAddress = ipAddress,
                    Reason = reason,
                    BlockedAt = DateTime.UtcNow,
                    ExpiresAt = expiresAt,
                    IsActive = true,
                    UserId = userId,
                    UserEmail = userEmail,
                    RecentInvoices = recentInvoices ?? new List<string>()
                };
                await _mongoDbService.BlockedIps.InsertOneAsync(newBlock);
            }

            _logger.LogWarning("IP {IpAddress} has been blocked. Reason: {Reason}", ipAddress, reason);
            
            // Xóa cache để tự động lấy lại từ DB ở request sau
            _cache.Remove(CacheKey);
        }

        public async Task UnblockIpAsync(string ipAddress)
        {
            if (string.IsNullOrEmpty(ipAddress)) return;

            var update = Builders<BlockedIp>.Update.Set(x => x.IsActive, false);
            await _mongoDbService.BlockedIps.UpdateManyAsync(x => x.IpAddress == ipAddress, update);

            _logger.LogInformation("IP {IpAddress} has been unblocked.", ipAddress);
            _cache.Remove(CacheKey);
        }

        public async Task<List<BlockedIp>> GetAllBlockedIpsAsync()
        {
            return await _mongoDbService.BlockedIps
                .Find(x => true)
                .SortByDescending(x => x.BlockedAt)
                .ToListAsync();
        }

        private async Task<HashSet<string>> RefreshCacheAsync()
        {
            var activeBlocks = await _mongoDbService.BlockedIps
                .Find(x => x.IsActive && (x.ExpiresAt == null || x.ExpiresAt > DateTime.UtcNow))
                .ToListAsync();

            var blockedIps = new HashSet<string>(activeBlocks.Select(x => x.IpAddress));

            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(10));

            _cache.Set(CacheKey, blockedIps, cacheEntryOptions);

            return blockedIps;
        }
    }
}

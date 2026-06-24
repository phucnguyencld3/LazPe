using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Hubs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class BannerService : IBannerService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<BannerHub> _hubContext;
        private readonly ILogger<BannerService> _logger;

        public BannerService(ApplicationDbContext context, IHubContext<BannerHub> hubContext, ILogger<BannerService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task<IEnumerable<BannerDto>> GetAllBannersAsync(bool clientOnly = false)
        {
            var query = _context.Banners.AsQueryable();
            
            if (clientOnly)
            {
                query = query.Where(b => b.Status == "Published");
            }

            var banners = await query.OrderByDescending(b => b.UpdatedAt).ToListAsync();
            return banners.Select(MapToDto);
        }

        public async Task<BannerDto?> GetBannerByIdAsync(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return null;
            return MapToDto(banner);
        }

        public async Task<IEnumerable<BannerDto>> GetBannersByPositionAsync(string position, string page = "global")
        {
            var banners = await _context.Banners
                .Where(b => b.Position == position && b.Status == "Published" && (b.Page == page || b.Page == "global"))
                .OrderByDescending(b => b.PublishedAt)
                .ToListAsync();

            return banners.Select(MapToDto);
        }

        public async Task<BannerDto> SaveDraftAsync(CreateOrUpdateBannerRequest request)
        {
            var banner = new Banner
            {
                Name = request.Name,
                Position = request.Position,
                Type = request.Type,
                Page = request.Page,
                Status = "Draft",
                LayoutConfig = new BannerLayoutConfig(),
                DraftConfig = request.LayoutConfig,
                HasUnpublishedChanges = true,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Version = "1.0.0"
            };

            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();
            return MapToDto(banner);
        }

        public async Task<BannerDto> UpdateDraftAsync(int id, CreateOrUpdateBannerRequest request)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) throw new KeyNotFoundException("Banner not found");

            banner.Name = request.Name;
            banner.Position = request.Position;
            banner.Type = request.Type;
            banner.Page = request.Page;
            banner.DraftConfig = request.LayoutConfig;
            banner.HasUnpublishedChanges = true;
            banner.UpdatedAt = DateTime.Now;

            // Do NOT change status back to Draft if it's already Published
            if (banner.Status != "Published")
            {
                banner.Status = "Draft";
            }

            _context.Update(banner); // Force EF to track the updated JSON payload
            await _context.SaveChangesAsync();
            return MapToDto(banner);
        }

        public async Task<bool> DeleteBannerAsync(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return false;

            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();

            if (banner.Status == "Published")
            {
                await NotifyClientsAsync(banner.Position);
            }

            return true;
        }

        public async Task<bool> PublishBannerAsync(PublishBannerRequest request, string? userId)
        {
            var banner = await _context.Banners.FindAsync(request.BannerId);
            if (banner == null) throw new KeyNotFoundException("Banner not found");

            // Create a new version string
            var newVersion = Guid.NewGuid().ToString("N").Substring(0, 8); // simple short version hash
            
            // Save current state to history before changing
            var versionHistory = new BannerVersion
            {
                BannerId = banner.Id,
                Version = banner.Version,
                LayoutConfig = banner.LayoutConfig,
                CreatedBy = userId,
                CreatedAt = DateTime.Now
            };
            _context.BannerVersions.Add(versionHistory);

            banner.Status = "Published";
            banner.Version = newVersion;
            banner.LayoutConfig = banner.DraftConfig ?? banner.LayoutConfig; // Merge draft to published
            banner.DraftConfig = null; // Clear draft
            banner.HasUnpublishedChanges = false;
            banner.PublishedAt = DateTime.Now;
            banner.UpdatedAt = DateTime.Now;

            _context.Update(banner); // Force EF to track JSON updates
            await _context.SaveChangesAsync();

            // Notify real-time clients
            await NotifyClientsAsync(banner.Position);

            return true;
        }

        public async Task<bool> RollbackBannerAsync(RollbackBannerRequest request, string? userId)
        {
            var banner = await _context.Banners.FindAsync(request.BannerId);
            var version = await _context.BannerVersions.FindAsync(request.VersionId);

            if (banner == null || version == null || version.BannerId != banner.Id)
            {
                throw new KeyNotFoundException("Banner or Version not found");
            }

            // Save current as a version just in case
            var currentVersionBackup = new BannerVersion
            {
                BannerId = banner.Id,
                Version = banner.Version,
                LayoutConfig = banner.LayoutConfig,
                CreatedBy = userId,
                CreatedAt = DateTime.Now
            };
            _context.BannerVersions.Add(currentVersionBackup);

            // Restore
            banner.LayoutConfig = version.LayoutConfig;
            banner.DraftConfig = null;
            banner.HasUnpublishedChanges = false;
            banner.Version = Guid.NewGuid().ToString("N").Substring(0, 8); // new version hash
            banner.UpdatedAt = DateTime.Now;
            // Assuming rollback implies it is published immediately
            banner.Status = "Published";
            banner.PublishedAt = DateTime.Now;

            _context.Update(banner);
            await _context.SaveChangesAsync();

            await NotifyClientsAsync(banner.Position);

            return true;
        }

        public async Task<IEnumerable<BannerVersionDto>> GetBannerVersionsAsync(int bannerId)
        {
            var versions = await _context.BannerVersions
                .Where(v => v.BannerId == bannerId)
                .OrderByDescending(v => v.CreatedAt)
                .ToListAsync();

            return versions.Select(v => new BannerVersionDto
            {
                Id = v.Id,
                BannerId = v.BannerId,
                Version = v.Version,
                LayoutConfig = v.LayoutConfig,
                CreatedAt = v.CreatedAt,
                CreatedBy = v.CreatedBy
            });
        }

        private BannerDto MapToDto(Banner banner)
        {
            return new BannerDto
            {
                Id = banner.Id,
                Name = banner.Name,
                Position = banner.Position,
                Type = banner.Type,
                Status = banner.Status,
                Version = banner.Version,
                LayoutConfig = banner.LayoutConfig,
                DraftConfig = banner.DraftConfig,
                HasUnpublishedChanges = banner.HasUnpublishedChanges,
                PublishedAt = banner.PublishedAt,
                CreatedAt = banner.CreatedAt,
                UpdatedAt = banner.UpdatedAt
            };
        }

        private async Task NotifyClientsAsync(string position)
        {
            try
            {
                // Push event "BannerUpdated" to group "ClientBanners"
                await _hubContext.Clients.Group("ClientBanners").SendAsync("BannerUpdated", position);
                _logger.LogInformation($"Notified clients about banner update at position: {position}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error pushing BannerUpdated event via SignalR");
            }
        }
    }
}

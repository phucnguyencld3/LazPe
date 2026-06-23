using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs.ProductAlert;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class ProductAlertService : IProductAlertService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly Microsoft.AspNetCore.Identity.UI.Services.IEmailSender _emailSender;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

        public ProductAlertService(
            ApplicationDbContext context, 
            INotificationService notificationService,
            Microsoft.AspNetCore.Identity.UI.Services.IEmailSender emailSender,
            Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            _context = context;
            _notificationService = notificationService;
            _emailSender = emailSender;
            _configuration = configuration;
        }

        public async Task<bool> SubscribeAlertAsync(string userId, CreateProductAlertDto dto)
        {
            var exists = await _context.ProductAlerts.AnyAsync(x => 
                x.UserId == userId && 
                x.ProductId == dto.ProductId && 
                x.VariantId == dto.VariantId && 
                x.AlertType == dto.AlertType &&
                x.IsActive);

            if (exists)
                return false;

            var alert = new ProductAlert
            {
                UserId = userId,
                ProductId = dto.ProductId,
                VariantId = dto.VariantId,
                AlertType = dto.AlertType,
                TargetPrice = dto.TargetPrice,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductAlerts.Add(alert);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnsubscribeAlertAsync(int alertId, string userId)
        {
            var alert = await _context.ProductAlerts.FirstOrDefaultAsync(x => x.Id == alertId && x.UserId == userId);
            if (alert == null) return false;

            _context.ProductAlerts.Remove(alert);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<ProductAlertDto>> GetUserAlertsAsync(string userId)
        {
            return await _context.ProductAlerts
                .Where(x => x.UserId == userId && x.IsActive)
                .Include(x => x.Product)
                    .ThenInclude(p => p.Images)
                .Include(x => x.Variant)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new ProductAlertDto
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    ProductId = x.ProductId,
                    ProductName = x.Product.ProductName,
                    ProductImage = x.Product.Images.FirstOrDefault() != null ? x.Product.Images.FirstOrDefault()!.ImageUrl : null,
                    VariantId = x.VariantId,
                    VariantName = x.Variant != null ? x.Variant.VariantName : null,
                    AlertType = x.AlertType,
                    TargetPrice = x.TargetPrice,
                    IsActive = x.IsActive,
                    CreatedAt = x.CreatedAt,
                    LastNotifiedAt = x.LastNotifiedAt
                })
                .ToListAsync();
        }

        public async Task ProcessPriceDropAlertsAsync(int productId, int? variantId, decimal newPrice)
        {
            var query = _context.ProductAlerts
                .Where(x => x.ProductId == productId && x.AlertType == ProductAlertType.PriceDrop && x.IsActive);

            if (variantId.HasValue)
            {
                query = query.Where(x => x.VariantId == null || x.VariantId == variantId.Value);
            }

            var alerts = await query.ToListAsync();
            var matchedAlerts = alerts.Where(a => !a.TargetPrice.HasValue || newPrice <= a.TargetPrice.Value).ToList();

            if (!matchedAlerts.Any()) return;

            var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductID == productId);
            if (product == null) return;
            
            var productName = product.ProductName;
            if (variantId.HasValue)
            {
                var variant = await _context.Variants.FirstOrDefaultAsync(v => v.VariantID == variantId.Value);
                if (variant != null) productName += $" - {variant.VariantName}";
            }

            var userIds = matchedAlerts.Select(x => x.UserId).Distinct().ToList();
            if (userIds.Any())
            {
                var targetValue = string.Join(",", userIds);
                var notifDto = new CreateNotificationDto
                {
                    Title = "Sản phẩm bạn quan tâm đã giảm giá!",
                    ShortDescription = $"{productName} đang có giá rất tốt, nhanh tay mua sắm!",
                    Content = $"<p>Sản phẩm <strong>{productName}</strong> mà bạn đang theo dõi đã giảm giá xuống còn <strong>{newPrice:N0}đ</strong>. Nhanh tay click để xem ngay!</p>",
                    Type = NotificationType.Promotion,
                    Priority = NotificationPriority.Medium,
                    ActionType = ActionType.Product,
                    ActionUrl = $"/products/{productId}",
                    TargetType = TargetType.SpecificUsers,
                    TargetValue = targetValue,
                    PublishedAt = DateTime.UtcNow
                };
                
                // Gửi thông báo trong hệ thống
                await _notificationService.CreateNotificationAsync(notifDto, "System");

                // Gửi email cho người dùng
                var users = await _context.Users.Where(u => userIds.Contains(u.Id)).ToListAsync();
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
                foreach (var user in users)
                {
                    if (!string.IsNullOrEmpty(user.Email))
                    {
                        var emailBody = $@"
                            <h2>LazPe - Thông báo giảm giá</h2>
                            <p>Xin chào {user.FullName},</p>
                            <p>Sản phẩm <strong>{productName}</strong> mà bạn đang theo dõi đã giảm giá xuống còn <strong>{newPrice:N0}đ</strong>.</p>
                            <p>Hãy nhanh tay truy cập LazPe để xem chi tiết và đặt hàng: <a href='{frontendUrl}/products/{productId}'>Xem sản phẩm</a></p>
                            <p>Trân trọng,<br/>Đội ngũ LazPe</p>
                        ";
                        await _emailSender.SendEmailAsync(user.Email, "LazPe - Sản phẩm bạn theo dõi đã giảm giá!", emailBody);
                    }
                }
            }

            foreach(var alert in matchedAlerts)
            {
                alert.IsActive = false; // Disable after sending
                alert.LastNotifiedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public async Task ProcessBackInStockAlertsAsync(int productId, int? variantId)
        {
            var query = _context.ProductAlerts
                .Where(x => x.ProductId == productId && x.AlertType == ProductAlertType.BackInStock && x.IsActive);

            if (variantId.HasValue)
            {
                query = query.Where(x => x.VariantId == null || x.VariantId == variantId.Value);
            }

            var alerts = await query.ToListAsync();
            if (!alerts.Any()) return;

            var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductID == productId);
            if (product == null) return;

            var productName = product.ProductName;
            if (variantId.HasValue)
            {
                var variant = await _context.Variants.FirstOrDefaultAsync(v => v.VariantID == variantId.Value);
                if (variant != null) productName += $" - {variant.VariantName}";
            }

            var userIds = alerts.Select(x => x.UserId).Distinct().ToList();
            if (userIds.Any())
            {
                var targetValue = string.Join(",", userIds);
                var notifDto = new CreateNotificationDto
                {
                    Title = "Sản phẩm bạn quan tâm đã có hàng trở lại!",
                    ShortDescription = $"{productName} đã có hàng trở lại, nhanh tay mua sắm!",
                    Content = $"<p>Sản phẩm <strong>{productName}</strong> mà bạn đang theo dõi đã được bổ sung hàng. Nhanh tay click để xem ngay trước khi hết hàng!</p>",
                    Type = NotificationType.Promotion,
                    Priority = NotificationPriority.Medium,
                    ActionType = ActionType.Product,
                    ActionUrl = $"/products/{productId}",
                    TargetType = TargetType.SpecificUsers,
                    TargetValue = targetValue,
                    PublishedAt = DateTime.UtcNow
                };
                
                // Gửi thông báo trong hệ thống
                await _notificationService.CreateNotificationAsync(notifDto, "System");

                // Gửi email cho người dùng
                var users = await _context.Users.Where(u => userIds.Contains(u.Id)).ToListAsync();
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
                foreach (var user in users)
                {
                    if (!string.IsNullOrEmpty(user.Email))
                    {
                        var emailBody = $@"
                            <h2>LazPe - Thông báo hàng về</h2>
                            <p>Xin chào {user.FullName},</p>
                            <p>Sản phẩm <strong>{productName}</strong> mà bạn đang theo dõi đã có hàng trở lại.</p>
                            <p>Hãy nhanh tay truy cập LazPe để xem chi tiết và đặt hàng: <a href='{frontendUrl}/products/{productId}'>Xem sản phẩm</a></p>
                            <p>Trân trọng,<br/>Đội ngũ LazPe</p>
                        ";
                        await _emailSender.SendEmailAsync(user.Email, "LazPe - Sản phẩm bạn theo dõi đã có hàng trở lại!", emailBody);
                    }
                }
            }

            foreach(var alert in alerts)
            {
                alert.IsActive = false; // Disable after sending
                alert.LastNotifiedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
    }
}

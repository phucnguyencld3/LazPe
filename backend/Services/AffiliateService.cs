using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class AffiliateService : IAffiliateService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AffiliateService> _logger;
        private readonly IConfiguration _configuration;

        public AffiliateService(ApplicationDbContext context, ILogger<AffiliateService> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        private string GetFrontendBaseUrl()
        {
            var url = _configuration["VnPay:FrontendBaseUrl"] ?? _configuration["FrontendBaseUrl"];
            if (string.IsNullOrWhiteSpace(url))
            {
                url = "http://localhost:3000";
            }
            return url.TrimEnd('/');
        }

        public async Task<bool> RegisterAffiliateAsync(string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            if (user.IsAffiliate) return true;

            user.IsAffiliate = true;
            user.AffiliateCode = GenerateUniqueAffiliateCode();

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<AffiliateLinkResponseDto> GenerateAffiliateLinkAsync(string userId, int productId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.IsAffiliate)
                throw new InvalidOperationException("User is not a registered affiliate.");

            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.ProductID == productId);
            if (product == null)
                throw new InvalidOperationException("Product not found.");

            var existingLink = await _context.AffiliateLinks
                .FirstOrDefaultAsync(l => l.UserId == userId && l.ProductId == productId);

            if (existingLink == null)
            {
                existingLink = new AffiliateLink
                {
                    UserId = userId,
                    ProductId = productId,
                    AffiliateLinkCode = "AFF_" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.AffiliateLinks.Add(existingLink);
                await _context.SaveChangesAsync();
            }
            else if (!existingLink.IsActive)
            {
                existingLink.IsActive = true;
                await _context.SaveChangesAsync();
            }

            string baseUrl = GetFrontendBaseUrl();
            string productIdentifier = !string.IsNullOrWhiteSpace(product.Slug) ? product.Slug : productId.ToString();

            return new AffiliateLinkResponseDto
            {
                AffiliateLinkCode = existingLink.AffiliateLinkCode,
                FullUrl = $"{baseUrl}/products/{productIdentifier}?ref={existingLink.AffiliateLinkCode}",
                ProductId = productId,
                ProductSlug = product.Slug,
                ProductName = product.ProductName,
                ProductImage = product.Images?.FirstOrDefault()?.ImageUrl ?? "",
                ClickCount = existingLink.ClickCount,
                ConversionCount = existingLink.ConversionCount,
                Revenue = existingLink.Revenue,
                CreatedAt = existingLink.CreatedAt
            };
        }

        public async Task<List<AffiliateLinkResponseDto>> GetUserAffiliateLinksAsync(string userId)
        {
            var links = await _context.AffiliateLinks
                .Include(l => l.Product)
                .ThenInclude(p => p.Images)
                .Where(l => l.UserId == userId && l.IsActive)
                .ToListAsync();

            string baseUrl = GetFrontendBaseUrl();
            
            return links.Select(l =>
            {
                string productIdentifier = !string.IsNullOrWhiteSpace(l.Product?.Slug) ? l.Product.Slug : l.ProductId.ToString();
                return new AffiliateLinkResponseDto
                {
                    AffiliateLinkCode = l.AffiliateLinkCode,
                    FullUrl = $"{baseUrl}/products/{productIdentifier}?ref={l.AffiliateLinkCode}",
                    ProductId = l.ProductId,
                    ProductSlug = l.Product?.Slug,
                    ProductName = l.Product?.ProductName ?? "",
                    ProductImage = l.Product?.Images?.FirstOrDefault()?.ImageUrl ?? "",
                    ClickCount = l.ClickCount,
                    ConversionCount = l.ConversionCount,
                    Revenue = l.Revenue,
                    CreatedAt = l.CreatedAt
                };
            }).ToList();
        }

        public async Task<bool> DeleteAffiliateLinkAsync(string userId, string affiliateLinkCode)
        {
            var link = await _context.AffiliateLinks
                .FirstOrDefaultAsync(l => l.UserId == userId && l.AffiliateLinkCode == affiliateLinkCode);

            if (link == null) return false;

            link.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RecordClickAsync(string affiliateLinkCode)
        {
            var link = await _context.AffiliateLinks.FirstOrDefaultAsync(l => l.AffiliateLinkCode == affiliateLinkCode);
            if (link == null || !link.IsActive) return false;

            link.ClickCount++;
            link.LastClickedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<AffiliateDashboardStatsDto?> GetDashboardStatsAsync(string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.IsAffiliate) return null;

            await EnsureMonthlyRevenueResetAsync(user);

            var links = await _context.AffiliateLinks.Where(l => l.UserId == userId).ToListAsync();
            
            int currentMonth = DateTime.UtcNow.Month;
            int currentYear = DateTime.UtcNow.Year;

            var userMilestones = await _context.UserAffiliateMilestones
                .Where(uam => uam.UserId == userId && uam.Month == currentMonth && uam.Year == currentYear)
                .Select(uam => uam.MilestoneId)
                .ToListAsync();

            var allMilestones = await _context.AffiliateMilestones
                .Where(m => m.IsActive)
                .OrderBy(m => m.RequiredRevenue)
                .ToListAsync();

            var milestoneProgress = allMilestones.Select(m => new AffiliateMilestoneProgressDto
            {
                MilestoneId = m.MilestoneId,
                RequiredRevenue = m.RequiredRevenue,
                IsAchieved = userMilestones.Contains(m.MilestoneId),
                VoucherName = $"Voucher mốc {m.RequiredRevenue:N0}đ"
            }).ToList();

            return new AffiliateDashboardStatsDto
            {
                MonthlyRevenue = user.MonthlyAffiliateRevenue,
                LifetimeRevenue = user.LifetimeAffiliateRevenue,
                AffiliatePoint = user.AffiliatePoint,
                TotalClicks = links.Sum(l => l.ClickCount),
                TotalConversions = links.Sum(l => l.ConversionCount),
                Milestones = milestoneProgress
            };
        }

        public async Task<bool> ProcessAffiliateRevenueAsync(string affiliateUserId, int invoiceId, decimal revenue)
        {
            if (revenue <= 0) return false;

            var invoice = await _context.Invoices.FindAsync(invoiceId);
            if (invoice == null || invoice.IsAffiliateProcessed) return false;

            // Security Check: Cannot refer self
            if (invoice.UserID == affiliateUserId)
            {
                _logger.LogWarning($"User {invoice.UserID} attempted to earn affiliate revenue from their own order (InvoiceId: {invoiceId}).");
                return false;
            }

            var user = await _context.Users.FindAsync(affiliateUserId);
            if (user == null || !user.IsAffiliate) return false;

            await EnsureMonthlyRevenueResetAsync(user);

            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
            try
            {
                // Reload invoice to prevent concurrency issues
                var latestInvoice = await _context.Invoices.FindAsync(invoiceId);
                if (latestInvoice == null || latestInvoice.IsAffiliateProcessed)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                latestInvoice.IsAffiliateProcessed = true;

                // 1% point cap at 10000
                int pointsEarned = Math.Min((int)(revenue * 0.01m), 10000);
                
                user.AffiliatePoint += pointsEarned;
                user.MonthlyAffiliateRevenue += revenue;
                user.LifetimeAffiliateRevenue += revenue;

                // Update link stats
                AffiliateLink? link = null;
                if (latestInvoice.AffiliateLinkId.HasValue)
                {
                    link = await _context.AffiliateLinks.FindAsync(latestInvoice.AffiliateLinkId.Value);
                }
                else
                {
                    link = await _context.AffiliateLinks.FirstOrDefaultAsync(l => l.UserId == affiliateUserId && l.IsActive);
                }

                if (link != null)
                {
                    link.ConversionCount++;
                    link.Revenue += revenue;
                }

                // Update History
                int currentMonth = DateTime.UtcNow.Month;
                int currentYear = DateTime.UtcNow.Year;

                var history = await _context.AffiliateRevenueHistories
                    .FirstOrDefaultAsync(h => h.UserId == affiliateUserId && h.Month == currentMonth && h.Year == currentYear);
                
                if (history == null)
                {
                    history = new AffiliateRevenueHistory
                    {
                        UserId = affiliateUserId,
                        Month = currentMonth,
                        Year = currentYear,
                        Revenue = revenue
                    };
                    _context.AffiliateRevenueHistories.Add(history);
                }
                else
                {
                    history.Revenue += revenue;
                }

                // Milestones
                var activeMilestones = await _context.AffiliateMilestones
                    .Where(m => m.IsActive)
                    .OrderBy(m => m.RequiredRevenue)
                    .ToListAsync();

                var achievedMilestoneIds = await _context.UserAffiliateMilestones
                    .Where(m => m.UserId == affiliateUserId && m.Month == currentMonth && m.Year == currentYear)
                    .Select(m => m.MilestoneId)
                    .ToListAsync();

                foreach (var milestone in activeMilestones)
                {
                    if (user.MonthlyAffiliateRevenue >= milestone.RequiredRevenue && !achievedMilestoneIds.Contains(milestone.MilestoneId))
                    {
                        var userMilestone = new UserAffiliateMilestone
                        {
                            UserId = affiliateUserId,
                            MilestoneId = milestone.MilestoneId,
                            Month = currentMonth,
                            Year = currentYear,
                            AchievedAt = DateTime.UtcNow
                        };
                        _context.UserAffiliateMilestones.Add(userMilestone);

                        // Reward Voucher
                        var userVoucher = new UserVoucher
                        {
                            UserID = affiliateUserId,
                            VoucherID = milestone.VoucherId,
                            Status = UserVoucherStatus.Unused,
                            CollectedAt = DateTime.UtcNow
                        };
                        _context.UserVouchers.Add(userVoucher);
                        
                        // Gửi Email thông báo qua Background Job (Hangfire)
                        if (!string.IsNullOrEmpty(user.Email))
                        {
                            string userEmail = user.Email;
                            string userName = user.FullName ?? user.UserName ?? "Đối tác";
                            decimal requiredRev = milestone.RequiredRevenue;
                            string subject = $"[LazPe] Chúc mừng! Bạn đã đạt cột mốc doanh thu Affiliate {requiredRev:N0}đ";
                            string htmlBody = $@"
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                                <h2 style='color: #ff6600; text-align: center;'>🎉 Chúc mừng Cột mốc Affiliate mới! 🎉</h2>
                                <p>Xin chào <strong>{userName}</strong>,</p>
                                <p>Chúc mừng bạn đã xuất sắc đạt cột mốc doanh thu tiếp thị liên kết (Affiliate) <strong>{requiredRev:N0} VNĐ</strong> trong tháng này!</p>
                                <div style='background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6600; margin: 20px 0;'>
                                    <p style='margin: 0;'><strong>Phần thưởng:</strong> Voucher đặc quyền đã được tự động thêm vào Ví Voucher của bạn.</p>
                                </div>
                                <p>Hãy tiếp tục chia sẻ link giới thiệu và chinh phục các mốc doanh thu cao hơn cùng LazPe!</p>
                                <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
                                <p style='font-size: 12px; color: #777; text-align: center;'>Đây là email tự động từ hệ thống LazPe, vui lòng không trả lời email này.</p>
                            </div>";

                            Hangfire.BackgroundJob.Enqueue<Microsoft.AspNetCore.Identity.UI.Services.IEmailSender>(
                                sender => sender.SendEmailAsync(userEmail, subject, htmlBody));
                        }

                        _logger.LogInformation($"Affiliate {affiliateUserId} achieved milestone {milestone.RequiredRevenue}. Voucher awarded and notification email enqueued.");
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to process affiliate revenue for User: {affiliateUserId}, Invoice: {invoiceId}");
                await transaction.RollbackAsync();
                return false;
            }
        }

        private async Task EnsureMonthlyRevenueResetAsync(ApplicationUser user)
        {
            int currentMonth = DateTime.UtcNow.Month;
            int currentYear = DateTime.UtcNow.Year;

            // Check if latest history is from a previous month
            var latestHistory = await _context.AffiliateRevenueHistories
                .Where(h => h.UserId == user.Id)
                .OrderByDescending(h => h.Year).ThenByDescending(h => h.Month)
                .FirstOrDefaultAsync();

            if (latestHistory != null)
            {
                if (latestHistory.Year < currentYear || (latestHistory.Year == currentYear && latestHistory.Month < currentMonth))
                {
                    if (user.MonthlyAffiliateRevenue > 0)
                    {
                        user.MonthlyAffiliateRevenue = 0;
                        await _context.SaveChangesAsync();
                    }
                }
            }
            else if (user.MonthlyAffiliateRevenue > 0)
            {
                // Edge case: no history found but monthly revenue is > 0, we can reset if it's the first time processing in a new month
                // This usually only happens if history was purged. Let's assume it should be 0 if no current month history.
                var currentMonthHistory = await _context.AffiliateRevenueHistories
                    .AnyAsync(h => h.UserId == user.Id && h.Month == currentMonth && h.Year == currentYear);
                
                if (!currentMonthHistory)
                {
                     user.MonthlyAffiliateRevenue = 0;
                     await _context.SaveChangesAsync();
                }
            }
        }

        private string GenerateUniqueAffiliateCode()
        {
            return "REF_" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
        }
    }
}

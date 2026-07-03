using Microsoft.EntityFrameworkCore;
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

        public AffiliateService(ApplicationDbContext context, ILogger<AffiliateService> logger)
        {
            _context = context;
            _logger = logger;
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

            var product = await _context.Products.FindAsync(productId);
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
                    CreatedAt = DateTime.UtcNow
                };

                _context.AffiliateLinks.Add(existingLink);
                await _context.SaveChangesAsync();
            }

            // In real app, the Base URL should come from AppSettings
            string baseUrl = "https://lazpe.com";

            return new AffiliateLinkResponseDto
            {
                AffiliateLinkCode = existingLink.AffiliateLinkCode,
                FullUrl = $"{baseUrl}/product/{productId}?ref={existingLink.AffiliateLinkCode}",
                ProductId = productId,
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

            string baseUrl = "https://lazpe.com";
            
            return links.Select(l => new AffiliateLinkResponseDto
            {
                AffiliateLinkCode = l.AffiliateLinkCode,
                FullUrl = $"{baseUrl}/product/{l.ProductId}?ref={l.AffiliateLinkCode}",
                ProductId = l.ProductId,
                ProductName = l.Product.ProductName,
                ProductImage = l.Product.Images?.FirstOrDefault()?.ImageUrl ?? "",
                ClickCount = l.ClickCount,
                ConversionCount = l.ConversionCount,
                Revenue = l.Revenue,
                CreatedAt = l.CreatedAt
            }).ToList();
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
                if (latestInvoice.AffiliateLinkId.HasValue)
                {
                    var link = await _context.AffiliateLinks.FindAsync(latestInvoice.AffiliateLinkId.Value);
                    if (link != null)
                    {
                        link.ConversionCount++;
                        link.Revenue += revenue;
                    }
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
                        
                        // NOTE: Email sending should be enqueued here if background job is available
                        _logger.LogInformation($"Affiliate {affiliateUserId} achieved milestone {milestone.RequiredRevenue}. Voucher awarded.");
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

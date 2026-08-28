using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Interfaces;
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
        private readonly IWalletSecurityService _walletSecurityService;

        public AffiliateService(
            ApplicationDbContext context,
            ILogger<AffiliateService> logger,
            IConfiguration configuration,
            IWalletSecurityService walletSecurityService)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            _walletSecurityService = walletSecurityService;
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
                .AsSplitQuery()
                .Include(p => p.Images)
                .Include(p => p.Variants)
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

            string productImage = product.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault(i => !string.IsNullOrWhiteSpace(i.ImageUrl))?.ImageUrl
                ?? product.Variants?.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v.ImageUrl))?.ImageUrl
                ?? string.Empty;

            return new AffiliateLinkResponseDto
            {
                AffiliateLinkCode = existingLink.AffiliateLinkCode,
                FullUrl = $"{baseUrl}/products/{productIdentifier}?ref={existingLink.AffiliateLinkCode}",
                ProductId = productId,
                ProductSlug = product.Slug,
                ProductName = product.ProductName,
                ProductImage = productImage,
                ClickCount = existingLink.ClickCount,
                ConversionCount = existingLink.ConversionCount,
                Revenue = existingLink.Revenue,
                CreatedAt = existingLink.CreatedAt
            };
        }

        public async Task<List<AffiliateLinkResponseDto>> GetUserAffiliateLinksAsync(string userId)
        {
            var links = await _context.AffiliateLinks
                .AsSplitQuery()
                .Include(l => l.Product)
                    .ThenInclude(p => p.Images)
                .Include(l => l.Product)
                    .ThenInclude(p => p.Variants)
                .Where(l => l.UserId == userId && l.IsActive)
                .ToListAsync();

            string baseUrl = GetFrontendBaseUrl();
            
            return links.Select(l =>
            {
                string productIdentifier = !string.IsNullOrWhiteSpace(l.Product?.Slug) ? l.Product.Slug : l.ProductId.ToString();
                string productImage = l.Product?.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault(i => !string.IsNullOrWhiteSpace(i.ImageUrl))?.ImageUrl
                    ?? l.Product?.Variants?.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v.ImageUrl))?.ImageUrl
                    ?? string.Empty;

                return new AffiliateLinkResponseDto
                {
                    AffiliateLinkCode = l.AffiliateLinkCode,
                    FullUrl = $"{baseUrl}/products/{productIdentifier}?ref={l.AffiliateLinkCode}",
                    ProductId = l.ProductId,
                    ProductSlug = l.Product?.Slug,
                    ProductName = l.Product?.ProductName ?? "",
                    ProductImage = productImage,
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

            await EnsureAffiliateMilestonesSeededAsync();

            var allMilestones = await _context.AffiliateMilestones
                .Include(m => m.RewardVoucher)
                .Where(m => m.IsActive)
                .OrderBy(m => m.RequiredRevenue)
                .ToListAsync();

            // Auto-grant achieved milestone vouchers if not already granted
            bool milestoneChanged = false;
            foreach (var milestone in allMilestones)
            {
                if (user.MonthlyAffiliateRevenue >= milestone.RequiredRevenue)
                {
                    var userM = await _context.UserAffiliateMilestones
                        .FirstOrDefaultAsync(uam => uam.UserId == userId && uam.MilestoneId == milestone.MilestoneId && uam.Month == currentMonth && uam.Year == currentYear);

                    if (userM == null)
                    {
                        _context.UserAffiliateMilestones.Add(new UserAffiliateMilestone
                        {
                            UserId = userId,
                            MilestoneId = milestone.MilestoneId,
                            Month = currentMonth,
                            Year = currentYear,
                            AchievedAt = DateTime.Now
                        });
                        milestoneChanged = true;
                    }

                    // Check if UserVoucher exists for this milestone voucher
                    var existingVoucher = await _context.UserVouchers
                        .FirstOrDefaultAsync(uv => uv.UserID == userId && uv.VoucherID == milestone.VoucherId && uv.Status == UserVoucherStatus.Unused);

                    if (existingVoucher == null)
                    {
                        string uniqueCode = $"AFF-{(int)(milestone.RequiredRevenue / 1000)}K-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
                        _context.UserVouchers.Add(new UserVoucher
                        {
                            UserID = userId,
                            VoucherID = milestone.VoucherId,
                            IssuedCode = uniqueCode,
                            Status = UserVoucherStatus.Unused,
                            SourceType = UserVoucherSource.DirectAssigned,
                            CollectedAt = DateTime.Now
                        });
                        milestoneChanged = true;
                    }
                    else if (string.IsNullOrEmpty(existingVoucher.IssuedCode))
                    {
                        existingVoucher.IssuedCode = $"AFF-{(int)(milestone.RequiredRevenue / 1000)}K-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
                        milestoneChanged = true;
                    }
                }
            }

            if (milestoneChanged)
            {
                await _context.SaveChangesAsync();
            }

            var userMilestoneIds = await _context.UserAffiliateMilestones
                .Where(uam => uam.UserId == userId && uam.Month == currentMonth && uam.Year == currentYear)
                .Select(uam => uam.MilestoneId)
                .ToListAsync();

            var milestoneProgress = allMilestones.Select(m => new AffiliateMilestoneProgressDto
            {
                MilestoneId = m.MilestoneId,
                RequiredRevenue = m.RequiredRevenue,
                IsAchieved = userMilestoneIds.Contains(m.MilestoneId),
                VoucherName = m.RewardVoucher?.Name ?? $"Voucher mốc {m.RequiredRevenue:N0}đ"
            }).ToList();

            if (user.LastAffiliateRedeemMonth != currentMonth)
            {
                user.MonthlyAffiliateRedeemCount = 0;
                user.LastAffiliateRedeemMonth = currentMonth;
                await _context.SaveChangesAsync();
            }

            int remainingRedeemCount = Math.Max(0, 3 - user.MonthlyAffiliateRedeemCount);
            bool hasPaymentPin = !string.IsNullOrEmpty(user.PaymentPinHash);

            return new AffiliateDashboardStatsDto
            {
                MonthlyRevenue = user.MonthlyAffiliateRevenue,
                LifetimeRevenue = user.LifetimeAffiliateRevenue,
                AffiliatePoint = user.AffiliatePoint,
                TotalClicks = links.Sum(l => l.ClickCount),
                TotalConversions = links.Sum(l => l.ConversionCount),
                RemainingRedeemCountThisMonth = remainingRedeemCount,
                HasPaymentPin = hasPaymentPin,
                Milestones = milestoneProgress
            };
        }

        private async Task EnsureAffiliateMilestonesSeededAsync()
        {
            if (await _context.AffiliateMilestones.AnyAsync())
            {
                return;
            }

            var voucherConfigs = new[]
            {
                new { Code = "AFF500K", Name = "Voucher 20.000đ (Thưởng mốc Affiliate 500k)", Value = 20000m, MinOrder = 100000m, Rev = 500000m },
                new { Code = "AFF1M", Name = "Voucher 50.000đ (Thưởng mốc Affiliate 1M)", Value = 50000m, MinOrder = 200000m, Rev = 1000000m },
                new { Code = "AFF2M", Name = "Voucher 120.000đ (Thưởng mốc Affiliate 2M)", Value = 120000m, MinOrder = 500000m, Rev = 2000000m },
                new { Code = "AFF5M", Name = "Voucher 300.000đ (Thưởng mốc Affiliate 5M)", Value = 300000m, MinOrder = 1000000m, Rev = 5000000m },
                new { Code = "AFF10M", Name = "Voucher 700.000đ (Thưởng mốc Affiliate 10M)", Value = 700000m, MinOrder = 2000000m, Rev = 10000000m }
            };

            foreach (var cfg in voucherConfigs)
            {
                var existingVoucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == cfg.Code);
                if (existingVoucher == null)
                {
                    existingVoucher = new Voucher
                    {
                        Code = cfg.Code,
                        Name = cfg.Name,
                        DiscountType = 2,
                        DiscountValue = cfg.Value,
                        MinOrderValue = cfg.MinOrder,
                        MaxDiscount = cfg.Value,
                        StartDate = DateTime.UtcNow.AddDays(-30),
                        EndDate = DateTime.UtcNow.AddYears(10),
                        TotalQuantity = 999999,
                        UsedQuantity = 0,
                        Status = true,
                        VisibilityType = VoucherVisibilityType.Exclusive,
                        ExclusiveType = ExclusiveDistributionType.DirectAssign,
                        UsageLimitPerUser = 100
                    };
                    _context.Vouchers.Add(existingVoucher);
                    await _context.SaveChangesAsync();
                }

                var milestone = new AffiliateMilestone
                {
                    RequiredRevenue = cfg.Rev,
                    VoucherId = existingVoucher.VoucherID,
                    IsActive = true
                };
                _context.AffiliateMilestones.Add(milestone);
            }

            await _context.SaveChangesAsync();
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

                // Determine point tier rate based on Lifetime Affiliate Revenue:
                // < 10,000,000đ: 1%
                // 10,000,000đ - 30,000,000đ: 2%
                // >= 30,000,000đ: 3%
                decimal pointRate = 0.01m;
                if (user.LifetimeAffiliateRevenue >= 30000000m)
                {
                    pointRate = 0.03m;
                }
                else if (user.LifetimeAffiliateRevenue >= 10000000m)
                {
                    pointRate = 0.02m;
                }

                int maxPointCap = (int)(10000 * (pointRate / 0.01m));
                int pointsEarned = Math.Min((int)(revenue * pointRate), maxPointCap);
                
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

                        // Reward Voucher with unique IssuedCode
                        string uniqueCode = $"AFF-{(int)(milestone.RequiredRevenue / 1000)}K-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
                        var userVoucher = new UserVoucher
                        {
                            UserID = affiliateUserId,
                            VoucherID = milestone.VoucherId,
                            IssuedCode = uniqueCode,
                            Status = UserVoucherStatus.Unused,
                            SourceType = UserVoucherSource.DirectAssigned,
                            CollectedAt = DateTime.Now
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

        public async Task<RedeemAffiliatePointResponseDto> RedeemPointsToWalletAsync(string userId, int pointsToRedeem, string pin)
        {
            if (pointsToRedeem < 1000)
            {
                return new RedeemAffiliatePointResponseDto
                {
                    Success = false,
                    Message = "Số xu rút tối thiểu mỗi lần là 1.000 xu"
                };
            }

            if (pointsToRedeem > 9999999)
            {
                return new RedeemAffiliatePointResponseDto
                {
                    Success = false,
                    Message = "Số xu rút tối đa cho 1 lần giao dịch là 9.999.999 xu"
                };
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return new RedeemAffiliatePointResponseDto { Success = false, Message = "Không tìm thấy tài khoản" };
                }

                // 1. PIN Check
                if (string.IsNullOrEmpty(user.PaymentPinHash))
                {
                    return new RedeemAffiliatePointResponseDto
                    {
                        Success = false,
                        Message = "Bạn chưa tạo mã PIN thanh toán cho ví. Vui lòng thiết lập mã PIN để bảo mật tài khoản trước khi rút xu.",
                        RequiresPinSetup = true
                    };
                }

                var pinResult = await _walletSecurityService.ValidatePaymentPinWithLockoutAsync(user, pin);
                if (!pinResult.Success)
                {
                    return new RedeemAffiliatePointResponseDto
                    {
                        Success = false,
                        Message = pinResult.Message,
                        IsLocked = pinResult.IsLocked,
                        FailedCount = pinResult.FailedCount
                    };
                }

                // 2. Validate Wallet Signature Integrity (Auto-sync if outdated after valid PIN authentication)
                if (!_walletSecurityService.ValidateSignature(user))
                {
                    _logger.LogWarning($"User {userId} WalletSignature mismatch. Auto-syncing WalletSignature after valid 6-digit PIN check.");
                    user.WalletSignature = _walletSecurityService.GenerateSignature(user.Id, user.WalletBalance, user.CoinsBalance);
                }

                // 3. Monthly Redeem Count Limit (3 times per month)
                int currentMonth = DateTime.UtcNow.Month;
                if (user.LastAffiliateRedeemMonth != currentMonth)
                {
                    user.MonthlyAffiliateRedeemCount = 0;
                    user.LastAffiliateRedeemMonth = currentMonth;
                }

                if (user.MonthlyAffiliateRedeemCount >= 3)
                {
                    return new RedeemAffiliatePointResponseDto
                    {
                        Success = false,
                        Message = "Bạn đã dùng hết 3 lượt rút xu thủ công trong tháng này. Số xu còn lại sẽ được hệ thống tự động quét chuyển vào ví vào đêm cuối tháng.",
                        RemainingRedeemCountThisMonth = 0
                    };
                }

                // 4. Points Balance Check
                if (user.AffiliatePoint < pointsToRedeem)
                {
                    return new RedeemAffiliatePointResponseDto
                    {
                        Success = false,
                        Message = $"Số xu tiếp thị hiện có ({user.AffiliatePoint:N0} xu) không đủ để rút {pointsToRedeem:N0} xu."
                    };
                }

                // Perform Redemption: 1 Xu = 1 VNĐ
                user.AffiliatePoint -= pointsToRedeem;
                user.WalletBalance += pointsToRedeem;
                user.MonthlyAffiliateRedeemCount += 1;

                // Update Wallet Signature
                user.WalletSignature = _walletSecurityService.GenerateSignature(user.Id, user.WalletBalance, user.CoinsBalance);

                // Add Financial Transaction Record
                var balanceTx = new BalanceTransaction
                {
                    UserID = user.Id,
                    Amount = pointsToRedeem,
                    Direction = BalanceTransactionDirection.Credit,
                    SourceType = BalanceSourceType.Wallet,
                    Reason = $"Quy đổi {pointsToRedeem:N0} xu tiếp thị sang số dư Ví LazPe",
                    CreatedAt = DateTime.Now
                };
                _context.BalanceTransactions.Add(balanceTx);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                int remainingRedeemCount = Math.Max(0, 3 - user.MonthlyAffiliateRedeemCount);

                return new RedeemAffiliatePointResponseDto
                {
                    Success = true,
                    Message = $"Quy đổi thành công {pointsToRedeem:N0} xu thành +{pointsToRedeem:N0}đ vào Ví LazPe!",
                    NewWalletBalance = user.WalletBalance,
                    RemainingPoints = user.AffiliatePoint,
                    RemainingRedeemCountThisMonth = remainingRedeemCount
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error executing Affiliate RedeemPointsToWalletAsync for user {userId}");
                return new RedeemAffiliatePointResponseDto
                {
                    Success = false,
                    Message = "Có lỗi xảy ra trong quá trình quy đổi xu. Vui lòng thử lại sau."
                };
            }
        }
    }
}

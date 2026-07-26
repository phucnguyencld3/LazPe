using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System.Security.Cryptography;

namespace PolyBabyAPI.Services
{
    public class LoyaltyVoucherRedemptionService : ILoyaltyVoucherRedemptionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LoyaltyVoucherRedemptionService> _logger;

        public LoyaltyVoucherRedemptionService(ApplicationDbContext context, ILogger<LoyaltyVoucherRedemptionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetPeriodKey(RedemptionResetCycle cycle)
        {
            if (cycle == RedemptionResetCycle.Monthly)
            {
                var now = DateTime.Now;
                return $"{now.Year}-{now.Month:D2}";
            }
            return "LIFETIME";
        }

        public async Task<IEnumerable<LoyaltyVoucherRedemptionItemDto>> GetAvailableRedemptionVouchersAsync(string userId)
        {
            var now = DateTime.Now;
            
            // Get user's profile to check points and tier
            var profile = await _context.LoyaltyProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserID == userId);

            if (profile == null)
            {
                return Enumerable.Empty<LoyaltyVoucherRedemptionItemDto>();
            }

            var redemptions = await _context.LoyaltyVoucherRedemptions
                .Include(r => r.Voucher)
                .Where(r => r.IsActive 
                         && r.Voucher != null && r.Voucher.Status 
                         && r.Voucher.EndDate > now
                         && (!r.StartDate.HasValue || r.StartDate.Value <= now)
                         && (!r.EndDate.HasValue || r.EndDate.Value >= now))
                .ToListAsync();

            var result = new List<LoyaltyVoucherRedemptionItemDto>();

            foreach (var r in redemptions)
            {
                var periodKey = GetPeriodKey(r.ResetCycle);
                
                // Count redeemed by this user in this period
                var userRedeemedCount = await _context.LoyaltyVoucherRedemptionHistories
                    .CountAsync(h => h.UserID == userId && h.VoucherID == r.VoucherID && h.PeriodKey == periodKey);

                // Count total redeemed by everyone in this period
                var totalRedeemedCount = await _context.LoyaltyVoucherRedemptionHistories
                    .CountAsync(h => h.VoucherID == r.VoucherID && h.PeriodKey == periodKey);

                bool canRedeem = true;
                string? reason = null;

                if (profile.AvailablePoints < r.PointCost)
                {
                    canRedeem = false;
                    reason = "Không đủ điểm.";
                }
                else if (r.TierID.HasValue && profile.CurrentTierID != r.TierID.Value)
                {
                    canRedeem = false;
                    reason = "Không đúng hạng thành viên.";
                }
                else if (r.LimitPerUserPerPeriod.HasValue && userRedeemedCount >= r.LimitPerUserPerPeriod.Value)
                {
                    canRedeem = false;
                    reason = "Đã vượt quá giới hạn đổi của bạn.";
                }
                else if (r.TotalQuotaPerPeriod.HasValue && totalRedeemedCount >= r.TotalQuotaPerPeriod.Value)
                {
                    canRedeem = false;
                    reason = "Đã hết lượt đổi từ hệ thống.";
                }

                result.Add(new LoyaltyVoucherRedemptionItemDto
                {
                    RedemptionId = r.Id,
                    VoucherID = r.VoucherID,
                    VoucherCode = r.Voucher!.Code,
                    VoucherName = r.Voucher.Name,
                    DiscountAmount = r.Voucher.DiscountType == 2 ? r.Voucher.DiscountValue : 0,
                    DiscountPercentage = r.Voucher.DiscountType == 1 ? r.Voucher.DiscountValue : 0,
                    PointCost = r.PointCost,
                    TierID = r.TierID,
                    PeriodKey = periodKey,
                    LimitPerUserPerPeriod = r.LimitPerUserPerPeriod,
                    RedeemedThisPeriod = userRedeemedCount,
                    RemainingQuota = r.TotalQuotaPerPeriod.HasValue ? Math.Max(0, r.TotalQuotaPerPeriod.Value - totalRedeemedCount) : null,
                    CanRedeem = canRedeem,
                    Reason = reason,
                    ResetCycle = r.ResetCycle.ToString()
                });
            }

            return result;
        }

        public async Task<RedeemVoucherResultDto> RedeemVoucherAsync(string userId, int redemptionId)
        {
            var now = DateTime.Now;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Load configuration
                var redemption = await _context.LoyaltyVoucherRedemptions
                    .Include(r => r.Voucher)
                    .FirstOrDefaultAsync(r => r.Id == redemptionId);

                if (redemption == null || !redemption.IsActive)
                {
                    return new RedeemVoucherResultDto { Success = false, Message = "Cấu hình đổi voucher không tồn tại hoặc đã tắt." };
                }

                var voucher = redemption.Voucher;
                if (voucher == null || !voucher.Status || voucher.EndDate <= now)
                {
                    return new RedeemVoucherResultDto { Success = false, Message = "Voucher không khả dụng hoặc đã hết hạn." };
                }

                if ((redemption.StartDate.HasValue && redemption.StartDate.Value > now) ||
                    (redemption.EndDate.HasValue && redemption.EndDate.Value < now))
                {
                    return new RedeemVoucherResultDto { Success = false, Message = "Không trong thời gian áp dụng đổi voucher." };
                }

                // Use raw SQL to get and lock the loyalty profile to prevent race conditions on points
                var profile = await _context.LoyaltyProfiles
                    .FromSqlRaw("SELECT * FROM LoyaltyProfiles WITH (UPDLOCK, ROWLOCK) WHERE UserID = {0}", userId)
                    .FirstOrDefaultAsync();

                if (profile == null)
                {
                    return new RedeemVoucherResultDto { Success = false, Message = "Không tìm thấy hồ sơ Loyalty." };
                }

                if (profile.AvailablePoints < redemption.PointCost)
                {
                    return new RedeemVoucherResultDto { Success = false, Message = "Không đủ điểm để đổi." };
                }

                if (redemption.TierID.HasValue && profile.CurrentTierID != redemption.TierID.Value)
                {
                    return new RedeemVoucherResultDto { Success = false, Message = "Hạng thành viên của bạn không đủ điều kiện đổi voucher này." };
                }

                var periodKey = GetPeriodKey(redemption.ResetCycle);

                var userRedeemedCount = await _context.LoyaltyVoucherRedemptionHistories
                    .CountAsync(h => h.UserID == userId && h.VoucherID == redemption.VoucherID && h.PeriodKey == periodKey);

                if (redemption.LimitPerUserPerPeriod.HasValue && userRedeemedCount >= redemption.LimitPerUserPerPeriod.Value)
                {
                    return new RedeemVoucherResultDto { Success = false, Message = "Bạn đã vượt quá giới hạn đổi voucher này." };
                }

                var totalRedeemedCount = await _context.LoyaltyVoucherRedemptionHistories
                    .CountAsync(h => h.VoucherID == redemption.VoucherID && h.PeriodKey == periodKey);

                if (redemption.TotalQuotaPerPeriod.HasValue && totalRedeemedCount >= redemption.TotalQuotaPerPeriod.Value)
                {
                    return new RedeemVoucherResultDto { Success = false, Message = "Hệ thống đã hết số lượng voucher này." };
                }

                // 1. Deduct points
                profile.AvailablePoints -= redemption.PointCost;
                profile.LastUpdated = now;

                // 2. Add Point History
                var pointHistory = new LoyaltyPointHistory
                {
                    UserID = userId,
                    TransactionType = "SPEND",
                    Amount = -redemption.PointCost,
                    Description = $"Đổi voucher {voucher.Code} bằng {redemption.PointCost} điểm",
                    CreatedAt = now
                };
                _context.LoyaltyPointHistories.Add(pointHistory);

                // 3. Create UserVoucher with a unique code
                string randomStr = GenerateRandomString(8);
                string issuedCode = $"LOY-{voucher.Code}-{randomStr}".ToUpper();
                if (issuedCode.Length > 50)
                {
                    issuedCode = issuedCode.Substring(0, 50); // safety for DB limit
                }

                var userVoucher = new UserVoucher
                {
                    UserID = userId,
                    VoucherID = voucher.VoucherID,
                    IssuedCode = issuedCode,
                    Status = UserVoucherStatus.Unused,
                    SourceType = UserVoucherSource.LoyaltyRedeemed,
                    CollectedAt = now
                };
                _context.UserVouchers.Add(userVoucher);

                await _context.SaveChangesAsync(); // Save to get UserVoucherID

                // 4. Add Redemption History
                var redemptionHistory = new LoyaltyVoucherRedemptionHistory
                {
                    UserID = userId,
                    VoucherID = voucher.VoucherID,
                    UserVoucherID = userVoucher.UserVoucherID,
                    PointCost = redemption.PointCost,
                    PeriodKey = periodKey,
                    RedeemedAt = now
                };
                _context.LoyaltyVoucherRedemptionHistories.Add(redemptionHistory);

                // Save again for history
                await _context.SaveChangesAsync();
                
                await transaction.CommitAsync();

                return new RedeemVoucherResultDto
                {
                    Success = true,
                    Message = "Đổi voucher thành công.",
                    AvailablePoints = profile.AvailablePoints,
                    UserVoucher = new UserVoucherDto
                    {
                        UserVoucherID = userVoucher.UserVoucherID,
                        VoucherID = userVoucher.VoucherID,
                        IssuedCode = userVoucher.IssuedCode
                    }
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error redeeming voucher for user {UserId}", userId);
                return new RedeemVoucherResultDto { Success = false, Message = "Đã xảy ra lỗi hệ thống khi đổi voucher." };
            }
        }

        private string GenerateRandomString(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, length)
                .Select(s => s[RandomNumberGenerator.GetInt32(s.Length)]).ToArray());
        }
    }
}

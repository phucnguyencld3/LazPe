using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class LoyaltyService : ILoyaltyService
    {
        private readonly ApplicationDbContext _context;

        public LoyaltyService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<LoyaltyProfile?> GetProfileAsync(string userId)
        {
            var profile = await _context.LoyaltyProfiles
                .Include(p => p.Tier)
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserID == userId);

            // Tự động khởi tạo profile mặc định cho User nếu chưa tồn tại
            if (profile == null)
            {
                var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
                if (!userExists) return null;

                profile = new LoyaltyProfile
                {
                    UserID = userId,
                    CurrentTierID = 1,
                    AvailablePoints = 0,
                    TotalPoints = 0,
                    PointsToNextTier = 30000,
                    RankAdjustmentOffset = 0,
                    LastUpdated = DateTime.Now
                };

                _context.LoyaltyProfiles.Add(profile);
                await _context.SaveChangesAsync();
            }

            return profile;
        }

        public async Task<(IEnumerable<LoyaltyPointHistory> Items, int TotalCount)> GetPointsHistoryAsync(
            string userId,
            string transactionType,
            string filterPeriod,
            int pageNumber,
            int pageSize)
        {
            var query = _context.LoyaltyPointHistories.Include(h => h.Invoice).Where(h => h.UserID == userId);

            // 1. Lọc theo loại giao dịch
            if (!string.IsNullOrEmpty(transactionType) && transactionType != "ALL")
            {
                query = query.Where(h => h.TransactionType == transactionType);
            }

            // 2. Lọc theo khoảng thời gian
            var now = DateTime.Now;
            if (!string.IsNullOrEmpty(filterPeriod))
            {
                switch (filterPeriod.ToUpper())
                {
                    case "MONTH":
                        var startOfMonth = new DateTime(now.Year, now.Month, 1);
                        query = query.Where(h => h.CreatedAt >= startOfMonth);
                        break;

                    case "CURRENTCYCLE":
                        // Kỳ 1: 01/01 -> 30/06, Kỳ 2: 01/07 -> 31/12
                        DateTime cycleStart;
                        if (now.Month <= 6)
                        {
                            cycleStart = new DateTime(now.Year, 1, 1);
                        }
                        else
                        {
                            cycleStart = new DateTime(now.Year, 7, 1);
                        }
                        query = query.Where(h => h.CreatedAt >= cycleStart);
                        break;

                    case "YEAR":
                        var startOfYear = new DateTime(now.Year, 1, 1);
                        query = query.Where(h => h.CreatedAt >= startOfYear);
                        break;
                }
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(h => h.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<bool> EarnPointsAsync(string userId, int invoiceId, decimal totalPrice)
        {
            var userIdParam = new SqlParameter("@UserID", SqlDbType.NVarChar, 450) { Value = userId };
            var invoiceIdParam = new SqlParameter("@InvoiceID", SqlDbType.Int) { Value = invoiceId };
            var totalPriceParam = new SqlParameter("@TotalPrice", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = totalPrice };
            var resultCodeParam = new SqlParameter("@ResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };

            await _context.Database.ExecuteSqlRawAsync(
                "EXEC dbo.sp_EarnLoyaltyPoints @UserID, @InvoiceID, @TotalPrice, @ResultCode OUTPUT",
                userIdParam, invoiceIdParam, totalPriceParam, resultCodeParam);

            var result = (int)resultCodeParam.Value;
            return result == 1;
        }

        public async Task<bool> RevokePointsAsync(string userId, int invoiceId)
        {
            var userIdParam = new SqlParameter("@UserID", SqlDbType.NVarChar, 450) { Value = userId };
            var invoiceIdParam = new SqlParameter("@InvoiceID", SqlDbType.Int) { Value = invoiceId };
            var resultCodeParam = new SqlParameter("@ResultCode", SqlDbType.Int) { Direction = ParameterDirection.Output };

            await _context.Database.ExecuteSqlRawAsync(
                "EXEC dbo.sp_RevokeLoyaltyPoints @UserID, @InvoiceID, @ResultCode OUTPUT",
                userIdParam, invoiceIdParam, resultCodeParam);

            var result = (int)resultCodeParam.Value;
            return result == 1;
        }

        public async Task<bool> ValidatePointsRedemptionAsync(string userId, int pointsToUse, decimal cartSubtotal)
        {
            if (pointsToUse <= 0) return false;

            var profile = await GetProfileAsync(userId);
            if (profile == null) return false;

            // Kiểm tra số điểm khả dụng
            if (profile.AvailablePoints < pointsToUse) return false;

            // Tỷ lệ quy đổi động
            var discount = await CalculateRedemptionDiscountAsync(userId, pointsToUse);
            if (discount <= 0 || discount > cartSubtotal) return false;

            return true;
        }

        public async Task<decimal> CalculateRedemptionDiscountAsync(string userId, int pointsToUse)
        {
            if (pointsToUse <= 0) return 0m;

            var profile = await GetProfileAsync(userId);
            if (profile == null) return 0m;

            var tierId = profile.CurrentTierID;

            // Tìm chính sách quy đổi riêng cho hạng thành viên của user
            var policy = await _context.LoyaltyRedeemPolicies
                .Where(p => p.IsActive 
                    && p.TierID == tierId 
                    && (p.StartDate == null || p.StartDate <= DateTime.Now) 
                    && (p.EndDate == null || p.EndDate >= DateTime.Now))
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            // Nếu không có, tìm chính sách áp dụng chung toàn hệ thống (TierID == null)
            if (policy == null)
            {
                policy = await _context.LoyaltyRedeemPolicies
                    .Where(p => p.IsActive 
                        && p.TierID == null 
                        && (p.StartDate == null || p.StartDate <= DateTime.Now) 
                        && (p.EndDate == null || p.EndDate >= DateTime.Now))
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();
            }

            // Fallback: Mặc định 1 điểm = 1 VNĐ
            if (policy == null)
            {
                return pointsToUse;
            }

            // Tính toán số tiền quy đổi: (pointsToUse / PointsToRedeem) * DiscountVnd
            decimal discount = ((decimal)pointsToUse / policy.PointsToRedeem) * policy.DiscountVnd;
            return Math.Round(discount, 2);
        }

        public async Task<bool> ApplyPointsRedemptionAsync(string userId, int pointsToUse, int invoiceId)
        {
            if (pointsToUse <= 0) return false;

            var currentTransaction = _context.Database.CurrentTransaction;
            var transaction = currentTransaction == null 
                ? await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted) 
                : null;

            try
            {
                // Đọc khóa bản ghi profile để tránh Race Condition (Double Spending)
                var profile = await _context.LoyaltyProfiles
                    .FromSqlRaw("SELECT * FROM dbo.LoyaltyProfiles WITH (UPDLOCK, ROWLOCK) WHERE UserID = {0}", userId)
                    .FirstOrDefaultAsync();

                if (profile == null)
                {
                    if (transaction != null) await transaction.RollbackAsync();
                    return false;
                }

                if (profile.AvailablePoints < pointsToUse)
                {
                    if (transaction != null) await transaction.RollbackAsync();
                    return false;
                }

                // Khấu trừ AvailablePoints
                profile.AvailablePoints -= pointsToUse;
                profile.LastUpdated = DateTime.Now;

                _context.LoyaltyProfiles.Update(profile);

                // Ghi lịch sử điểm
                var history = new LoyaltyPointHistory
                {
                    UserID = userId,
                    TransactionType = "SPEND",
                    Amount = -pointsToUse,
                    InvoiceID = invoiceId,
                    Description = $"Sử dụng {pointsToUse:N0} điểm thanh toán đơn hàng #{invoiceId}",
                    CreatedAt = DateTime.Now
                };
                _context.LoyaltyPointHistories.Add(history);

                await _context.SaveChangesAsync();

                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }

                return true;
            }
            catch (Exception)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }
                throw;
            }
        }

        public async Task<bool> RefundPointsAsync(string userId, int pointsToUse, int invoiceId)
        {
            if (pointsToUse <= 0) return false;

            var currentTransaction = _context.Database.CurrentTransaction;
            var transaction = currentTransaction == null 
                ? await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted) 
                : null;

            try
            {
                var profile = await _context.LoyaltyProfiles
                    .FromSqlRaw("SELECT * FROM dbo.LoyaltyProfiles WITH (UPDLOCK, ROWLOCK) WHERE UserID = {0}", userId)
                    .FirstOrDefaultAsync();

                if (profile == null)
                {
                    if (transaction != null) await transaction.RollbackAsync();
                    return false;
                }

                // Hoàn lại điểm
                profile.AvailablePoints += pointsToUse;
                profile.LastUpdated = DateTime.Now;

                _context.LoyaltyProfiles.Update(profile);

                // Ghi lịch sử
                var history = new LoyaltyPointHistory
                {
                    UserID = userId,
                    TransactionType = "REFUND",
                    Amount = pointsToUse,
                    InvoiceID = invoiceId,
                    Description = $"Hoàn lại {pointsToUse:N0} điểm từ việc hủy/hoàn đơn hàng #{invoiceId}",
                    CreatedAt = DateTime.Now
                };
                _context.LoyaltyPointHistories.Add(history);

                await _context.SaveChangesAsync();

                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }

                return true;
            }
            catch (Exception)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }
                throw;
            }
        }

        public async Task<bool> AddPointsAsync(string userId, int amount, string transactionType, string description, int? invoiceId = null, bool addToTotalPoints = true)
        {
            if (amount <= 0) return false;

            var currentTransaction = _context.Database.CurrentTransaction;
            var transaction = currentTransaction == null 
                ? await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted) 
                : null;

            try
            {
                var profile = await _context.LoyaltyProfiles
                    .FromSqlRaw("SELECT * FROM dbo.LoyaltyProfiles WITH (UPDLOCK, ROWLOCK) WHERE UserID = {0}", userId)
                    .FirstOrDefaultAsync();

                if (profile == null)
                {
                    profile = new LoyaltyProfile
                    {
                        UserID = userId,
                        CurrentTierID = 1,
                        AvailablePoints = 0,
                        TotalPoints = 0,
                        PointsToNextTier = 30000,
                        RankAdjustmentOffset = 0,
                        LastUpdated = DateTime.Now
                    };
                    _context.LoyaltyProfiles.Add(profile);
                    await _context.SaveChangesAsync();
                }

                var oldTierID = profile.CurrentTierID;
                var offset = profile.RankAdjustmentOffset;

                profile.AvailablePoints += amount;

                int newTierID = oldTierID;
                if (addToTotalPoints)
                {
                    var newTotalPoints = profile.TotalPoints + amount;
                    profile.TotalPoints = newTotalPoints;

                    // Xác định Tier mới cao nhất mà khách hàng đạt điều kiện
                    var activeTiers = await _context.LoyaltyTiers
                        .Where(t => t.IsActive)
                        .OrderByDescending(t => t.MinPoints)
                        .ToListAsync();

                    var newTier = activeTiers.FirstOrDefault(t => newTotalPoints >= (t.MinPoints - offset));
                    newTierID = newTier?.TierID ?? 1;

                    profile.CurrentTierID = newTierID;

                    // Tính toán PointsToNextTier
                    var nextTier = activeTiers
                        .Where(t => t.MinPoints > (newTier?.MinPoints ?? 0))
                        .OrderBy(t => t.MinPoints)
                        .FirstOrDefault();

                    if (nextTier != null)
                    {
                        var pointsToNext = (nextTier.MinPoints - offset) - newTotalPoints;
                        profile.PointsToNextTier = pointsToNext < 0 ? 0 : pointsToNext;
                    }
                    else
                    {
                        profile.PointsToNextTier = 0;
                    }
                }

                profile.LastUpdated = DateTime.Now;
                _context.LoyaltyProfiles.Update(profile);

                // Lưu lịch sử biến động điểm
                var history = new LoyaltyPointHistory
                {
                    UserID = userId,
                    TransactionType = transactionType,
                    Amount = amount,
                    InvoiceID = invoiceId,
                    Description = description,
                    CreatedAt = DateTime.Now
                };
                _context.LoyaltyPointHistories.Add(history);

                // Ghi nhận thăng hạng nếu có
                if (newTierID > oldTierID)
                {
                    var tierName = await _context.LoyaltyTiers
                        .Where(t => t.TierID == newTierID)
                        .Select(t => t.TierName)
                        .FirstOrDefaultAsync() ?? "";

                    var upgradeHistory = new LoyaltyPointHistory
                    {
                        UserID = userId,
                        TransactionType = "BONUS",
                        Amount = 0,
                        InvoiceID = invoiceId,
                        Description = $"Thăng hạng lên thành viên {tierName}",
                        CreatedAt = DateTime.Now
                    };
                    _context.LoyaltyPointHistories.Add(upgradeHistory);
                }

                await _context.SaveChangesAsync();

                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }

                return true;
            }
            catch (Exception)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }
                throw;
            }
        }

        private readonly int[] _checkInRewards = new int[] { 100, 100, 200, 200, 250, 250, 300 };

        public async Task<PolyBabyAPI.DTOs.Loyaltydtos.DailyCheckInStatusResponse> GetCheckInStatusAsync(string userId)
        {
            var profile = await GetProfileAsync(userId);
            if (profile == null) return new PolyBabyAPI.DTOs.Loyaltydtos.DailyCheckInStatusResponse();

            var today = DateTime.Now.Date;
            bool hasCheckedInToday = profile.LastCheckInDate.HasValue && profile.LastCheckInDate.Value.Date == today;
            
            int currentStreak = profile.CurrentCheckInStreak;
            if (!hasCheckedInToday && (!profile.LastCheckInDate.HasValue || profile.LastCheckInDate.Value.Date < today.AddDays(-1)))
            {
                currentStreak = 0;
            }

            int pointsForNextCheckIn = currentStreak >= 6 ? 300 : _checkInRewards[currentStreak];

            return new PolyBabyAPI.DTOs.Loyaltydtos.DailyCheckInStatusResponse
            {
                HasCheckedInToday = hasCheckedInToday,
                CurrentStreak = currentStreak,
                PointsForNextCheckIn = pointsForNextCheckIn,
                RewardSequence = _checkInRewards
            };
        }

        public async Task<PolyBabyAPI.DTOs.Loyaltydtos.DailyCheckInResultResponse> PerformDailyCheckInAsync(string userId)
        {
            var currentTransaction = _context.Database.CurrentTransaction;
            var transaction = currentTransaction == null 
                ? await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted) 
                : null;

            try
            {
                var profile = await _context.LoyaltyProfiles
                        .FromSqlRaw("SELECT * FROM dbo.LoyaltyProfiles WITH (UPDLOCK, ROWLOCK) WHERE UserID = {0}", userId)
                        .FirstOrDefaultAsync();

                if (profile == null) 
                {
                    await AddPointsAsync(userId, 0, "INIT", "Khởi tạo Loyalty", null);
                    profile = await _context.LoyaltyProfiles.FirstOrDefaultAsync(p => p.UserID == userId);
                    if (profile == null) return new PolyBabyAPI.DTOs.Loyaltydtos.DailyCheckInResultResponse { Success = false, Message = "Lỗi khởi tạo hồ sơ." };
                }

                var today = DateTime.Now.Date;
                if (profile.LastCheckInDate.HasValue && profile.LastCheckInDate.Value.Date == today)
                {
                    if (transaction != null) await transaction.RollbackAsync();
                    return new PolyBabyAPI.DTOs.Loyaltydtos.DailyCheckInResultResponse { Success = false, Message = "Bạn đã điểm danh hôm nay rồi!" };
                }

                if (!profile.LastCheckInDate.HasValue || profile.LastCheckInDate.Value.Date < today.AddDays(-1))
                {
                    profile.CurrentCheckInStreak = 0;
                }

                int pointsEarned = profile.CurrentCheckInStreak >= 6 ? 300 : _checkInRewards[profile.CurrentCheckInStreak];
                
                profile.CurrentCheckInStreak += 1;
                profile.LastCheckInDate = DateTime.Now;

                _context.LoyaltyProfiles.Update(profile);
                await _context.SaveChangesAsync();

                if (transaction != null)
                {
                    await transaction.CommitAsync(); // Commit profile update before AddPointsAsync
                }

                // Add points (creates history record)
                await AddPointsAsync(userId, pointsEarned, "DAILY_CHECKIN", $"Điểm danh hàng ngày (Chuỗi {profile.CurrentCheckInStreak} ngày)", null);

                var updatedProfile = await GetProfileAsync(userId);

                return new PolyBabyAPI.DTOs.Loyaltydtos.DailyCheckInResultResponse
                {
                    Success = true,
                    Message = $"Điểm danh thành công! Nhận {pointsEarned} xu.",
                    PointsEarned = pointsEarned,
                    NewStreak = profile.CurrentCheckInStreak,
                    TotalPoints = updatedProfile?.TotalPoints ?? 0
                };
            }
            catch (Exception)
            {
                if (transaction != null) await transaction.RollbackAsync();
                throw;
            }
        }
    }
}

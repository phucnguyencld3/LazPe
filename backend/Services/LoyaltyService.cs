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
            var query = _context.LoyaltyPointHistories.Where(h => h.UserID == userId);

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
    }
}

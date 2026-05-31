using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class LoyaltyMonthlyVoucherJob
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LoyaltyMonthlyVoucherJob> _logger;

        public LoyaltyMonthlyVoucherJob(ApplicationDbContext context, ILogger<LoyaltyMonthlyVoucherJob> logger)
        {
            _context = context;
            _logger = logger;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ExecuteAsync()
        {
            _logger.LogInformation("Bắt đầu thực hiện Job phát voucher định kỳ hàng tháng cho thành viên...");

            // Lấy các cấu hình phát voucher tự động đang hoạt động
            var activeConfigs = await _context.LoyaltyMonthlyVouchers
                .Where(c => c.IsActive)
                .Include(c => c.Tier)
                .ToListAsync();

            if (!activeConfigs.Any())
            {
                _logger.LogInformation("Không có cấu hình phát voucher loyalty tự động nào đang hoạt động.");
                return;
            }

            var now = DateTime.Now;
            var yearMonthStr = now.ToString("yyyyMM");
            var monthYearLabel = now.ToString("MM/yyyy");
            int totalIssued = 0;

            foreach (var config in activeConfigs)
            {
                var tier = config.Tier;
                if (tier == null || !tier.IsActive)
                {
                    _logger.LogWarning("Bỏ qua cấu hình VoucherConfigID {Id} do Hạng thành viên không tồn tại hoặc bị vô hiệu hóa.", config.VoucherConfigID);
                    continue;
                }

                // Lấy tất cả thành viên thuộc hạng này
                var profiles = await _context.LoyaltyProfiles
                    .Where(p => p.CurrentTierID == config.TierID)
                    .ToListAsync();

                if (!profiles.Any())
                {
                    _logger.LogInformation("Không có thành viên nào đạt hạng {TierName} để nhận voucher.", tier.TierName);
                    continue;
                }

                // Tạo mã voucher duy nhất cho cấu hình và chu kỳ tháng này
                var voucherCode = $"LYL_{tier.TierName.ToUpper().Replace(" ", "")}_C{config.VoucherConfigID}_{yearMonthStr}";

                // Kiểm tra xem voucher mẫu cho chu kỳ tháng này đã được tạo chưa
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == voucherCode);
                if (voucher == null)
                {
                    voucher = new Voucher
                    {
                        Code = voucherCode,
                        Name = $"Voucher Đặc Quyền Hạng {tier.TierName} - Tháng {monthYearLabel}",
                        DiscountType = config.DiscountType,
                        DiscountValue = config.DiscountValue,
                        MinOrderValue = config.MinOrderValue,
                        MaxDiscount = config.MaxDiscount,
                        StartDate = new DateTime(now.Year, now.Month, 1),
                        EndDate = now.AddDays(config.ValidityDays),
                        TotalQuantity = config.VoucherCount * profiles.Count * 2, // Tạo dôi ra đề phòng có thành viên mới thăng hạng trong tháng
                        UsedQuantity = 0,
                        Status = true,
                        VisibilityType = VoucherVisibilityType.Exclusive,
                        ExclusiveType = ExclusiveDistributionType.DirectAssign
                    };

                    _context.Vouchers.Add(voucher);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Đã tạo mẫu voucher đặc quyền mới: {Code}", voucherCode);
                }

                // Phát voucher cho từng thành viên thuộc hạng
                foreach (var profile in profiles)
                {
                    // Kiểm tra xem thành viên này đã nhận voucher đặc quyền của chu kỳ tháng này chưa
                    // (Dựa trên số lượng voucher cùng loại đã cấp trong tháng này)
                    var alreadyReceived = await _context.UserVouchers
                        .CountAsync(uv => uv.UserID == profile.UserID 
                            && uv.VoucherID == voucher.VoucherID 
                            && uv.CollectedAt >= new DateTime(now.Year, now.Month, 1));

                    var remainingToIssue = config.VoucherCount - alreadyReceived;
                    if (remainingToIssue <= 0)
                    {
                        continue;
                    }

                    // Cấp voucher còn thiếu
                    for (int i = 0; i < remainingToIssue; i++)
                    {
                        var userVoucher = new UserVoucher
                        {
                            UserID = profile.UserID,
                            VoucherID = voucher.VoucherID,
                            Status = UserVoucherStatus.Unused,
                            SourceType = UserVoucherSource.DirectAssigned,
                            CollectedAt = now,
                            UsedAt = null,
                            InvoiceID = null
                        };
                        _context.UserVouchers.Add(userVoucher);
                        totalIssued++;
                    }

                    // Ghi log sự kiện nhận voucher vào Lịch sử Loyalty
                    var history = new LoyaltyPointHistory
                    {
                        UserID = profile.UserID,
                        TransactionType = "BONUS",
                        Amount = 0,
                        Description = $"Nhận {remainingToIssue} voucher đặc quyền tự động của hạng {tier.TierName} - Tháng {monthYearLabel}",
                        CreatedAt = now
                    };
                    _context.LoyaltyPointHistories.Add(history);
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Hoàn tất Job phát voucher hàng tháng. Tổng số voucher đã phát: {Count}", totalIssued);
        }
    }
}

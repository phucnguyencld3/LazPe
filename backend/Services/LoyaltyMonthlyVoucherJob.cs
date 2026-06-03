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

            // Lấy các đặc quyền phát voucher tháng đang hoạt động
            var activePrivileges = await _context.LoyaltyTierPrivileges
                .Where(p => p.PrivilegeType == "VOUCHER" && p.IsActive)
                .Include(p => p.Tier)
                .ToListAsync();

            if (!activePrivileges.Any())
            {
                _logger.LogInformation("Không có đặc quyền phát voucher loyalty tự động nào đang hoạt động.");
                return;
            }

            var now = DateTime.Now;
            var monthYearLabel = now.ToString("MM/yyyy");
            int totalIssued = 0;

            foreach (var privilege in activePrivileges)
            {
                var tier = privilege.Tier;
                if (tier == null || !tier.IsActive)
                {
                    _logger.LogWarning("Bỏ qua đặc quyền PrivilegeID {Id} do Hạng thành viên không tồn tại hoặc bị vô hiệu hóa.", privilege.PrivilegeID);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(privilege.Value))
                {
                    _logger.LogWarning("Bỏ qua đặc quyền PrivilegeID {Id} do Value rỗng.", privilege.PrivilegeID);
                    continue;
                }

                string voucherCode;
                int quantity = 0;
                int validityDays = 30;
                string mode = "EXISTING";

                try
                {
                    using var jsonDoc = System.Text.Json.JsonDocument.Parse(privilege.Value);
                    var root = jsonDoc.RootElement;
                    voucherCode = root.GetProperty("voucherCode").GetString() ?? string.Empty;
                    quantity = root.GetProperty("quantity").GetInt32();
                    
                    if (root.TryGetProperty("mode", out var modeProp))
                        mode = modeProp.GetString() ?? "EXISTING";
                    
                    if (root.TryGetProperty("validityDays", out var valDaysProp))
                        validityDays = valDaysProp.GetInt32();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi phân tích JSON cấu hình đặc quyền PrivilegeID {Id}", privilege.PrivilegeID);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(voucherCode) || quantity <= 0)
                {
                    _logger.LogWarning("Cấu hình đặc quyền PrivilegeID {Id} không hợp lệ: code='{Code}', qty={Qty}", privilege.PrivilegeID, voucherCode, quantity);
                    continue;
                }

                // Tạo mã voucher riêng cho tháng này
                string monthSpecificCode = $"{voucherCode}_M{now.Month:D2}{now.Year.ToString().Substring(2)}";

                // Kiểm tra xem voucher tháng này đã được tạo chưa
                var targetVoucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == monthSpecificCode);
                if (targetVoucher == null)
                {
                    if (mode.ToUpper() == "EXISTING")
                    {
                        var baseVoucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == voucherCode && v.Status);
                        if (baseVoucher == null)
                        {
                            _logger.LogWarning("Không tìm thấy voucher gốc hoạt động với mã '{Code}' cho đặc quyền PrivilegeID {Id}", voucherCode, privilege.PrivilegeID);
                            continue;
                        }

                        targetVoucher = new Voucher
                        {
                            Code = monthSpecificCode,
                            Name = $"{baseVoucher.Name} - Tháng {monthYearLabel}",
                            DiscountType = baseVoucher.DiscountType,
                            DiscountValue = baseVoucher.DiscountValue,
                            MinOrderValue = baseVoucher.MinOrderValue,
                            MaxDiscount = baseVoucher.MaxDiscount,
                            StartDate = now,
                            EndDate = now.AddDays(validityDays),
                            TotalQuantity = 999999,
                            UsedQuantity = 0,
                            Status = true,
                            VisibilityType = VoucherVisibilityType.Exclusive,
                            ExclusiveType = ExclusiveDistributionType.DirectAssign
                        };
                    }
                    else if (mode.ToUpper() == "CUSTOM")
                    {
                        string discountTypeStr = "PERCENT";
                        decimal discountValueVal = 0;
                        decimal minOrderValueVal = 0;
                        decimal maxDiscountVal = 0;

                        try
                        {
                            using var jsonDoc = System.Text.Json.JsonDocument.Parse(privilege.Value);
                            var root = jsonDoc.RootElement;
                            discountTypeStr = root.GetProperty("discountType").GetString() ?? "PERCENT";
                            discountValueVal = root.GetProperty("discountValue").GetDecimal();
                            minOrderValueVal = root.GetProperty("minOrderValue").GetDecimal();
                            if (root.TryGetProperty("maxDiscount", out var maxDProp))
                                maxDiscountVal = maxDProp.GetDecimal();
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Lỗi phân tích thông số Custom voucher cho PrivilegeID {Id}", privilege.PrivilegeID);
                            continue;
                        }

                        targetVoucher = new Voucher
                        {
                            Code = monthSpecificCode,
                            Name = $"Voucher Đặc quyền {tier.TierName} - Tháng {monthYearLabel}",
                            DiscountType = discountTypeStr.ToUpper() == "PERCENT" ? 1 : 2,
                            DiscountValue = discountValueVal,
                            MinOrderValue = minOrderValueVal,
                            MaxDiscount = maxDiscountVal,
                            StartDate = now,
                            EndDate = now.AddDays(validityDays),
                            TotalQuantity = 999999,
                            UsedQuantity = 0,
                            Status = true,
                            VisibilityType = VoucherVisibilityType.Exclusive,
                            ExclusiveType = ExclusiveDistributionType.DirectAssign
                        };
                    }
                    else
                    {
                        _logger.LogWarning("Chế độ phát voucher không hợp lệ '{Mode}' cho PrivilegeID {Id}", mode, privilege.PrivilegeID);
                        continue;
                    }

                    _context.Vouchers.Add(targetVoucher);
                    await _context.SaveChangesAsync(); // Lưu để có VoucherID
                }

                // Lấy tất cả thành viên thuộc hạng này
                var profiles = await _context.LoyaltyProfiles
                    .Where(p => p.CurrentTierID == privilege.TierID)
                    .ToListAsync();

                if (!profiles.Any())
                {
                    _logger.LogInformation("Không có thành viên nào đạt hạng {TierName} để nhận voucher.", tier.TierName);
                    continue;
                }

                // Phát voucher cho từng thành viên thuộc hạng
                foreach (var profile in profiles)
                {
                    // Kiểm tra xem thành viên này đã nhận voucher đặc quyền của chu kỳ tháng này chưa
                    // (Kiểm tra xem đã nhận voucher tháng này cụ thể chưa)
                    var alreadyReceived = await _context.UserVouchers
                        .CountAsync(uv => uv.UserID == profile.UserID 
                            && uv.VoucherID == targetVoucher.VoucherID 
                            && uv.CollectedAt >= new DateTime(now.Year, now.Month, 1));

                    var remainingToIssue = quantity - alreadyReceived;
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
                            VoucherID = targetVoucher.VoucherID,
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
                        Description = $"Nhận {remainingToIssue} voucher đặc quyền tự động {targetVoucher.Code} của hạng {tier.TierName} - Tháng {monthYearLabel}",
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

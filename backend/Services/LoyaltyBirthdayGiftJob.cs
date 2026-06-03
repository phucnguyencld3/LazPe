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
    public class LoyaltyBirthdayGiftJob
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LoyaltyBirthdayGiftJob> _logger;

        public LoyaltyBirthdayGiftJob(ApplicationDbContext context, ILogger<LoyaltyBirthdayGiftJob> logger)
        {
            _context = context;
            _logger = logger;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ExecuteAsync()
        {
            var today = DateTime.Today;
            _logger.LogInformation("Bắt đầu Job phát quà sinh nhật tự động ngày {Date}...", today.ToString("dd/MM/yyyy"));

            // Tìm những người dùng có ngày sinh nhật hôm nay
            var birthdayUsers = await _context.Users
                .Where(u => u.DateOfBirth != null && u.DateOfBirth.Value.Month == today.Month && u.DateOfBirth.Value.Day == today.Day)
                .ToListAsync();

            if (!birthdayUsers.Any())
            {
                _logger.LogInformation("Không có người dùng nào sinh nhật ngày hôm nay.");
                return;
            }

            int countIssued = 0;
            foreach (var user in birthdayUsers)
            {
                try
                {
                    var issued = await IssueBirthdayGiftForUserAsync(user.Id, today.Year, "System");
                    if (issued) countIssued++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi phát quà sinh nhật tự động cho user {UserId}", user.Id);
                }
            }

            _logger.LogInformation("Hoàn tất Job phát quà sinh nhật tự động. Tổng số quà đã phát: {Count}", countIssued);
        }

        public async Task<bool> IssueBirthdayGiftForUserAsync(string userId, int year, string issuer)
        {
            // 1. Kiểm tra profile loyalty
            var profile = await _context.LoyaltyProfiles
                .Include(p => p.Tier)
                .FirstOrDefaultAsync(p => p.UserID == userId);
            if (profile == null)
            {
                _logger.LogWarning("Không tìm thấy hồ sơ loyalty cho user {UserId}", userId);
                return false;
            }

            // 2. Tìm đặc quyền quà sinh nhật của hạng
            var privilege = await _context.LoyaltyTierPrivileges
                .FirstOrDefaultAsync(p => p.TierID == profile.CurrentTierID && p.PrivilegeType == "BIRTHDAY_GIFT" && p.IsActive);
            if (privilege == null || string.IsNullOrWhiteSpace(privilege.Value))
            {
                _logger.LogInformation("Hạng '{TierName}' của user {UserId} không có đặc quyền quà sinh nhật hoạt động", profile.Tier?.TierName ?? "Mặc định", userId);
                return false;
            }

            // 3. Phân tích cấu hình quà sinh nhật
            string giftType;
            string? voucherCode = null;
            int quantity = 0;
            int points = 0;
            int coins = 0;
            string? giftName = null;
            string? giftDesc = null;

            try
            {
                using var jsonDoc = System.Text.Json.JsonDocument.Parse(privilege.Value);
                var root = jsonDoc.RootElement;
                giftType = root.GetProperty("giftType").GetString() ?? string.Empty;
                
                if (giftType.ToUpper() == "VOUCHER")
                {
                    voucherCode = root.GetProperty("voucherCode").GetString();
                    quantity = root.GetProperty("quantity").GetInt32();
                }
                else if (giftType.ToUpper() == "POINTS")
                {
                    points = root.GetProperty("points").GetInt32();
                }
                else if (giftType.ToUpper() == "COINS")
                {
                    coins = root.GetProperty("coins").GetInt32();
                }
                else if (giftType.ToUpper() == "PHYSICAL")
                {
                    giftName = root.GetProperty("giftName").GetString();
                    giftDesc = root.TryGetProperty("giftDesc", out var dProp) ? dProp.GetString() : null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi phân tích JSON quà sinh nhật PrivilegeID {Id}", privilege.PrivilegeID);
                return false;
            }

            // 4. Kiểm tra xem người dùng đã nhận quà sinh nhật trong năm này chưa
            var alreadyReceived = await _context.LoyaltyBirthdayGiftLogs
                .AnyAsync(l => l.UserID == userId && l.Year == year);
            if (alreadyReceived)
            {
                _logger.LogInformation("Người dùng {UserId} đã nhận quà sinh nhật cho năm {Year} rồi", userId, year);
                return false;
            }

            // 5. Cấp phát quà tương ứng
            string giftValueLog = string.Empty;
            if (giftType.ToUpper() == "VOUCHER")
            {
                if (string.IsNullOrWhiteSpace(voucherCode) || quantity <= 0) return false;
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == voucherCode && v.Status);
                if (voucher == null)
                {
                    _logger.LogWarning("Không tìm thấy voucher sinh nhật mẫu '{Code}' hoạt động", voucherCode);
                    return false;
                }

                // Cấp voucher vào ví
                for (int i = 0; i < quantity; i++)
                {
                    var userVoucher = new UserVoucher
                    {
                        UserID = userId,
                        VoucherID = voucher.VoucherID,
                        Status = UserVoucherStatus.Unused,
                        SourceType = UserVoucherSource.DirectAssigned,
                        CollectedAt = DateTime.Now,
                        UsedAt = null,
                        InvoiceID = null
                    };
                    _context.UserVouchers.Add(userVoucher);
                }

                giftValueLog = voucherCode;

                // Ghi lịch sử loyalty
                _context.LoyaltyPointHistories.Add(new LoyaltyPointHistory
                {
                    UserID = userId,
                    TransactionType = "BONUS",
                    Amount = 0,
                    Description = $"Nhận quà sinh nhật đặc quyền: {quantity} voucher {voucherCode}",
                    CreatedAt = DateTime.Now
                });
            }
            else if (giftType.ToUpper() == "POINTS")
            {
                if (points <= 0) return false;
                profile.AvailablePoints += points;
                profile.TotalPoints += points; // Tăng cả tổng để nâng hạng nếu đạt
                profile.LastUpdated = DateTime.Now;

                _context.LoyaltyProfiles.Update(profile);

                giftValueLog = points.ToString();

                // Ghi lịch sử loyalty
                _context.LoyaltyPointHistories.Add(new LoyaltyPointHistory
                {
                    UserID = userId,
                    TransactionType = "BONUS",
                    Amount = points,
                    Description = $"Nhận quà sinh nhật đặc quyền: +{points} điểm thưởng",
                    CreatedAt = DateTime.Now
                });
            }
            else if (giftType.ToUpper() == "COINS")
            {
                if (coins <= 0) return false;
                giftValueLog = $"{coins} xu";

                // Ghi lịch sử loyalty
                _context.LoyaltyPointHistories.Add(new LoyaltyPointHistory
                {
                    UserID = userId,
                    TransactionType = "BONUS",
                    Amount = 0,
                    Description = $"Nhận quà sinh nhật đặc quyền: +{coins:N0} xu thưởng",
                    CreatedAt = DateTime.Now
                });
            }
            else if (giftType.ToUpper() == "PHYSICAL")
            {
                if (string.IsNullOrWhiteSpace(giftName)) return false;
                giftValueLog = $"{giftName} ({giftDesc ?? ""})";

                _context.LoyaltyPointHistories.Add(new LoyaltyPointHistory
                {
                    UserID = userId,
                    TransactionType = "BONUS",
                    Amount = 0,
                    Description = $"Đăng ký nhận quà sinh nhật vật lý: {giftName}",
                    CreatedAt = DateTime.Now
                });
            }
            else
            {
                return false;
            }

            // 6. Ghi log chống nhận trùng
            var giftLog = new LoyaltyBirthdayGiftLog
            {
                UserID = userId,
                Year = year,
                GiftType = giftType.ToUpper(),
                GiftValue = giftValueLog,
                IssuedBy = issuer,
                ReceivedAt = DateTime.Now
            };

            _context.LoyaltyBirthdayGiftLogs.Add(giftLog);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Phát thành công quà sinh nhật '{Type}' ({Val}) cho user {UserId}", giftType, giftValueLog, userId);
            return true;
        }
    }
}

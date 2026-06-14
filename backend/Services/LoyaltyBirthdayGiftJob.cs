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
            
            // Cấu hình riêng cho CUSTOM VOUCHER
            string voucherMode = "EXISTING";
            string discountTypeStr = "PERCENT";
            decimal discountValue = 0;
            decimal maxDiscount = 0;
            decimal minOrderValue = 0;
            int validityDays = 30;

            try
            {
                using var jsonDoc = System.Text.Json.JsonDocument.Parse(privilege.Value);
                var root = jsonDoc.RootElement;
                giftType = root.GetProperty("giftType").GetString() ?? string.Empty;
                
                if (giftType.ToUpper() == "VOUCHER")
                {
                    voucherMode = root.TryGetProperty("mode", out var mProp) ? mProp.GetString() ?? "EXISTING" : "EXISTING";
                    quantity = root.TryGetProperty("quantity", out var qProp) ? qProp.GetInt32() : 1;

                    if (voucherMode == "CUSTOM")
                    {
                        voucherCode = root.TryGetProperty("voucherCode", out var vcProp) ? vcProp.GetString() : "BDAY";
                        discountTypeStr = root.TryGetProperty("discountType", out var dtProp) ? dtProp.GetString() ?? "PERCENT" : "PERCENT";
                        discountValue = root.TryGetProperty("discountValue", out var dvProp) ? dvProp.GetDecimal() : 0;
                        maxDiscount = root.TryGetProperty("maxDiscount", out var mdProp) ? mdProp.GetDecimal() : 0;
                        minOrderValue = root.TryGetProperty("minOrderValue", out var moProp) ? moProp.GetDecimal() : 0;
                        validityDays = root.TryGetProperty("validityDays", out var vdProp) ? vdProp.GetInt32() : 30;
                    }
                    else
                    {
                        voucherCode = root.TryGetProperty("voucherCode", out var vcProp) ? vcProp.GetString() : null;
                    }
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

                int targetVoucherID = 0;
                string baseCode = voucherCode;

                if (voucherMode == "CUSTOM")
                {
                    // Tạo một Voucher Mẫu riêng biệt cho người này với thời hạn cụ thể
                    string uniqueCode = $"{voucherCode}_{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
                    var newVoucher = new Voucher
                    {
                        Code = uniqueCode,
                        Name = "Quà Tặng Sinh Nhật Tự Tạo",
                        DiscountType = discountTypeStr == "PERCENT" ? 1 : 2,
                        DiscountValue = discountValue,
                        MaxDiscount = maxDiscount,
                        MinOrderValue = minOrderValue,
                        StartDate = DateTime.Now,
                        EndDate = DateTime.Now.AddDays(validityDays),
                        TotalQuantity = quantity,
                        UsedQuantity = 0,
                        Status = true,
                        VisibilityType = (VoucherVisibilityType)3, // Hidden
                        ExclusiveType = (ExclusiveDistributionType)2, // DirectAssign
                        VoucherType = (VoucherType)1, // Product Discount
                        IsFreeShipping = false,
                        MaxShippingDiscount = null,
                        UsageLimitPerUser = 1
                    };
                    _context.Vouchers.Add(newVoucher);
                    await _context.SaveChangesAsync();
                    
                    targetVoucherID = newVoucher.VoucherID;
                    baseCode = uniqueCode;
                }
                else
                {
                    var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == voucherCode && v.Status);
                    if (voucher == null)
                    {
                        _logger.LogWarning("Không tìm thấy voucher sinh nhật mẫu '{Code}' hoạt động", voucherCode);
                        return false;
                    }
                    targetVoucherID = voucher.VoucherID;
                    baseCode = voucher.Code;
                }

                // Cấp voucher vào ví
                for (int i = 0; i < quantity; i++)
                {
                    var userVoucher = new UserVoucher
                    {
                        UserID = userId,
                        VoucherID = targetVoucherID,
                        IssuedCode = voucherMode == "CUSTOM" ? baseCode : $"{baseCode}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}",
                        Status = UserVoucherStatus.Unused,
                        SourceType = UserVoucherSource.DirectAssigned,
                        CollectedAt = DateTime.Now,
                        UsedAt = null,
                        InvoiceID = null
                    };
                    _context.UserVouchers.Add(userVoucher);
                }

                giftValueLog = baseCode;

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

            // Thêm thông báo chúc mừng sinh nhật
            var masterNotification = new Notification
            {
                Code = "BDAY_" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper(),
                Title = "🎂 Chúc Mừng Sinh Nhật!",
                ShortDescription = "Món quà sinh nhật đặc biệt dành cho bạn.",
                Content = $"LazPe kính chúc bạn một ngày sinh nhật thật ấm áp và hạnh phúc! Món quà sinh nhật đặc biệt ({giftType} - {giftValueLog}) đã được gửi đến bạn.",
                Type = NotificationType.Membership,
                Priority = NotificationPriority.High,
                Status = NotificationStatus.Sent,
                PublishedAt = DateTime.Now,
                CreatedBy = "System",
                TargetType = TargetType.SpecificUsers,
                TargetValue = userId
            };
            _context.Notifications.Add(masterNotification);
            await _context.SaveChangesAsync();

            var notification = new UserNotification
            {
                UserId = userId,
                NotificationId = masterNotification.Id,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserNotifications.Add(notification);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Phát thành công quà sinh nhật '{Type}' ({Val}) cho user {UserId}", giftType, giftValueLog, userId);
            return true;
        }
    }
}

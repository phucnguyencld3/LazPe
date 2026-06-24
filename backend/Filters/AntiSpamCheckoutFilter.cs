using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.Models.Mongo;

namespace PolyBabyAPI.Filters
{
    public class AntiSpamCheckoutFilter : IAsyncActionFilter
    {
        private readonly IMemoryCache _cache;
        private readonly IMongoDbService _mongoDbService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AntiSpamCheckoutFilter> _logger;

        public AntiSpamCheckoutFilter(
            IMemoryCache cache, 
            IMongoDbService mongoDbService,
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            ILogger<AntiSpamCheckoutFilter> logger)
        {
            _cache = cache;
            _mongoDbService = mongoDbService;
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var ipAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "UnknownIP";
            var userId = _userManager.GetUserId(context.HttpContext.User);
            var deviceId = context.HttpContext.Request.Headers["X-Device-Id"].FirstOrDefault() ?? "UnknownDevice";

            int riskScore = 0;

            // 0. Persistent Shadow Ban Check (Án tích 24h)
            var shadowBanDeviceKey = $"ShadowBan:Device:{deviceId}";
            var shadowBanUserKey = $"ShadowBan:User:{userId}";

            if (_cache.TryGetValue(shadowBanDeviceKey, out _) || 
               (!string.IsNullOrEmpty(userId) && _cache.TryGetValue(shadowBanUserKey, out _)))
            {
                riskScore += 100; // Án tử 24h đối với Thiết bị hoặc Tài khoản đã có tiền án
            }

            // 1. Device Fingerprinting Rule
            var deviceCountKey = $"CheckoutCount:Device:{deviceId}";
            var deviceCount = _cache.GetOrCreate(deviceCountKey, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
                return 0;
            });
            deviceCount++;
            _cache.Set(deviceCountKey, deviceCount, TimeSpan.FromMinutes(5));

            if (deviceCount > 3)
            {
                riskScore += 40; // High rate from same device
            }

            // 2. User Account Rule
            if (!string.IsNullOrEmpty(userId))
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    var accountAge = DateTime.UtcNow - user.RegisterDate;
                    if (accountAge.TotalDays <= 1) riskScore += 20;
                    else if (accountAge.TotalDays <= 3) riskScore += 10;

                    var userCountKey = $"CheckoutCount:User:{userId}";
                    var userCount = _cache.GetOrCreate(userCountKey, entry =>
                    {
                        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
                        return 0;
                    });
                    userCount++;
                    _cache.Set(userCountKey, userCount, TimeSpan.FromMinutes(1));

                    if (userCount > 2) riskScore += 30;
                    if (userCount > 5) riskScore += 60; // Extremely fast

                    // Lịch sử mua hàng thành công (Trust Score)
                    var dbContext = context.HttpContext.RequestServices.GetService(typeof(ApplicationDbContext)) as ApplicationDbContext;
                    if (dbContext != null)
                    {
                        var successCount = dbContext.Invoices.Count(i => i.UserID == userId && i.Status == OrderStatus.Completed);
                        if (successCount > 0)
                        {
                            // Giảm 15 điểm rủi ro cho mỗi đơn thành công (Tối đa giảm 60 điểm)
                            int trustBonus = Math.Min(60, successCount * 15);
                            riskScore -= trustBonus;
                            if (riskScore < 0) riskScore = 0;
                        }
                    }
                }
            }
            else
            {
                riskScore += 30; // Guest checkout is slightly riskier
            }

            // 3. Evaluate Risk and PayMethod
            var payMethodStr = context.HttpContext.Request.Query["payMethod"].FirstOrDefault();
            bool isCod = string.IsNullOrEmpty(payMethodStr) || payMethodStr == "0" || payMethodStr.Equals("COD", StringComparison.OrdinalIgnoreCase);

            // Save risk score to context so controller can shadow ban if needed
            context.HttpContext.Items["RiskScore"] = riskScore;
            context.HttpContext.Items["IsShadowBan"] = riskScore >= 90;

            // === LOG ĐỂ TEST ===
            _logger.LogInformation("[Anti-Spam] IP: {Ip}, Device: {DeviceId}, User: {UserId} => RiskScore: {Score}", 
                ipAddress, deviceId, userId ?? "Guest", riskScore);

            if (riskScore >= 50 && riskScore < 90)
            {
                // Threshold 1: Quota & Challenge (Force VNPay)
                if (isCod)
                {
                    string reason = $"RiskScore {riskScore}: Bắt buộc dùng VNPay cho IP {ipAddress}, Device {deviceId}.";
                    await LogViolationAsync(ipAddress, userId, "Challenge_ForceVNPay", reason, riskScore);
                    
                    context.Result = new ObjectResult(new { 
                        success = false, 
                        requireOnlinePayment = true,
                        message = "Hệ thống phát hiện dấu hiệu bất thường. Để bảo vệ tài khoản, tính năng Thanh toán khi nhận hàng (COD) tạm thời bị khóa. Vui lòng thanh toán trực tuyến qua VNPay để hoàn tất đơn hàng." 
                    })
                    {
                        StatusCode = StatusCodes.Status403Forbidden
                    };
                    return;
                }
            }

            if (riskScore >= 90)
            {
                // Threshold 2: Shadow Ban
                // Gia hạn án tích Shadow Ban thêm 24h kể từ lần cuối cố tình spam
                _cache.Set(shadowBanDeviceKey, true, TimeSpan.FromHours(24));
                if (!string.IsNullOrEmpty(userId))
                {
                    _cache.Set(shadowBanUserKey, true, TimeSpan.FromHours(24));
                }

                string reason = $"RiskScore {riskScore}: Shadow Ban IP {ipAddress}, Device {deviceId}.";
                await LogViolationAsync(ipAddress, userId, "ShadowBan", reason, riskScore);
                
                // Chỉ gửi email cảnh báo cho lần vi phạm đầu tiên để tránh spam hòm thư Admin
                var alertSentKey = $"AlertSent:{ipAddress}";
                if (!_cache.TryGetValue(alertSentKey, out _))
                {
                    SendAdminAlertEmail($"[CẢNH BÁO KHẨN] Shadow Ban kích hoạt", $"Hệ thống vừa Shadow Ban giao dịch từ IP {ipAddress}, Device {deviceId}. Điểm rủi ro: {riskScore}.");
                    _cache.Set(alertSentKey, true, TimeSpan.FromHours(1));
                }
            }

            await next();
        }

        private async Task LogViolationAsync(string ipAddress, string? userId, string actionType, string description, int score)
        {
            var log = new SecurityAuditLog
            {
                IpAddress = ipAddress,
                UserId = userId,
                ActionType = actionType,
                Description = description,
                RequestCount = score, // Re-using RequestCount for RiskScore
                CreatedAt = DateTime.UtcNow
            };
            await _mongoDbService.SecurityAuditLogs.InsertOneAsync(log);
        }

        private void SendAdminAlertEmail(string subject, string message)
        {
            // Lấy email admin từ cấu hình, nếu không có thì mặc định
            var adminEmail = _configuration["AdminEmail"] ?? "lazpevn@gmail.com";
            BackgroundJob.Enqueue<IEmailSender>(sender => sender.SendEmailAsync(adminEmail, subject, message));
        }
    }
}

using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.Models.Mongo;

namespace PolyBabyAPI.Filters
{
    public class AntiSpamCheckoutFilter : IAsyncActionFilter
    {
        private readonly IMemoryCache _cache;
        private readonly IIpBlockService _ipBlockService;
        private readonly IMongoDbService _mongoDbService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AntiSpamCheckoutFilter> _logger;

        public AntiSpamCheckoutFilter(
            IMemoryCache cache, 
            IIpBlockService ipBlockService, 
            IMongoDbService mongoDbService,
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            ILogger<AntiSpamCheckoutFilter> logger)
        {
            _cache = cache;
            _ipBlockService = ipBlockService;
            _mongoDbService = mongoDbService;
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var ipAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "UnknownIP";
            var userId = _userManager.GetUserId(context.HttpContext.User);

            // 1. Kiểm tra Rule IP (Áp dụng cho mọi đối tượng)
            var ipCountKey = $"CheckoutCount:IP:{ipAddress}";
            var ipCount = _cache.GetOrCreate(ipCountKey, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
                return 0;
            });
            ipCount++;
            _cache.Set(ipCountKey, ipCount, TimeSpan.FromMinutes(1));

            if (ipCount > 50)
            {
                // Hành vi bạo lực (Brute-force) - Chặn IP ngay lập tức trong 15 phút
                string reason = $"Phát hiện spam đơn hàng: {ipCount} requests/phút từ IP này.";
                await _ipBlockService.BlockIpAsync(ipAddress, reason, durationMinutes: 15);
                await LogViolationAsync(ipAddress, userId, "BlockIP", reason, ipCount);
                SendAdminAlertEmail($"[CẢNH BÁO KHẨN] Khóa IP {ipAddress}", $"Hệ thống vừa khóa IP {ipAddress} vì phát hiện {ipCount} lượt tạo đơn hàng trong 1 phút.");
                
                context.Result = new ObjectResult(new { success = false, message = "Lượt truy cập từ IP của bạn đã bị giới hạn do có dấu hiệu bất thường. Vui lòng thử lại sau 15 phút." })
                {
                    StatusCode = StatusCodes.Status429TooManyRequests
                };
                return;
            }

            // 2. Kiểm tra Rule Tài khoản (Chỉ áp dụng User đăng nhập)
            if (!string.IsNullOrEmpty(userId))
            {
                // Kiểm tra xem User này có đang bị tạm khóa Checkout không
                var blockUserKey = $"BlockCheckout:User:{userId}";
                if (_cache.TryGetValue(blockUserKey, out _))
                {
                    context.Result = new ObjectResult(new { success = false, message = "Tài khoản của bạn đã bị tạm khóa chức năng đặt hàng do dấu hiệu spam. Vui lòng liên hệ bộ phận CSKH." })
                    {
                        StatusCode = StatusCodes.Status403Forbidden
                    };
                    return;
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    var accountAge = DateTime.UtcNow - user.RegisterDate;
                    // Chỉ áp dụng luật chặt chẽ cho tài khoản mới (<= 3 ngày)
                    if (accountAge.TotalDays <= 3)
                    {
                        var userCountKey = $"CheckoutCount:User:{userId}";
                        var userCount = _cache.GetOrCreate(userCountKey, entry =>
                        {
                            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
                            return 0;
                        });
                        userCount++;
                        _cache.Set(userCountKey, userCount, TimeSpan.FromMinutes(1));

                        if (userCount >= 10)
                        {
                            // Rule 2: > 10 đơn/phút -> Khóa chức năng đặt hàng của tài khoản
                            _cache.Set(blockUserKey, true, TimeSpan.FromHours(24)); // Khóa 24h
                            string reason = $"Tài khoản mới tạo spam {userCount} đơn/phút.";
                            await LogViolationAsync(ipAddress, userId, "BlockAccount", reason, userCount);
                            SendAdminAlertEmail($"[CẢNH BÁO] Khóa tạo đơn tài khoản {user.Email}", $"Tài khoản mới {user.Email} (ID: {userId}) vừa bị khóa đặt hàng 24h vì tạo {userCount} đơn trong 1 phút.");
                            
                            context.Result = new ObjectResult(new { success = false, message = "Phát hiện dấu hiệu spam. Chức năng đặt hàng của bạn đã bị tạm khóa." })
                            {
                                StatusCode = StatusCodes.Status403Forbidden
                            };
                            return;
                        }
                        else if (userCount == 5) // Chỉ gửi đúng 1 lần khi chạm mốc 5
                        {
                            // Rule 3: > 5 đơn/phút -> Cảnh báo
                            string reason = $"Cảnh báo: Tài khoản mới tạo tạo 5 đơn/phút.";
                            await LogViolationAsync(ipAddress, userId, "Warning", reason, userCount);
                            
                            // Gửi email cho User
                            BackgroundJob.Enqueue<IEmailSender>(sender => 
                                sender.SendEmailAsync(user.Email, "[LazPe] Cảnh báo hoạt động bất thường", 
                                "Hệ thống ghi nhận bạn đã tạo quá nhiều đơn hàng trong thời gian ngắn. Vui lòng chậm lại, nếu tiếp tục tài khoản có thể bị khóa."));
                        }
                    }
                }
            }

            await next();
        }

        private async Task LogViolationAsync(string ipAddress, string? userId, string actionType, string description, int count)
        {
            var log = new SecurityAuditLog
            {
                IpAddress = ipAddress,
                UserId = userId,
                ActionType = actionType,
                Description = description,
                RequestCount = count,
                CreatedAt = DateTime.UtcNow
            };
            await _mongoDbService.SecurityAuditLogs.InsertOneAsync(log);
        }

        private void SendAdminAlertEmail(string subject, string message)
        {
            // Lấy email admin từ cấu hình, nếu không có thì mặc định
            var adminEmail = _configuration["AdminEmail"] ?? "admin@lazpe.store";
            BackgroundJob.Enqueue<IEmailSender>(sender => sender.SendEmailAsync(adminEmail, subject, message));
        }
    }
}

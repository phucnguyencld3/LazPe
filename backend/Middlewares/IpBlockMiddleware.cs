using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Middlewares
{
    public class IpBlockMiddleware
    {
        private readonly RequestDelegate _next;

        public IpBlockMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IIpBlockService ipBlockService)
        {
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            
            // Bỏ qua cho các route webhook hoặc public cần thiết nếu muốn
            // if (context.Request.Path.StartsWithSegments("/api/vnpay")) { await _next(context); return; }

            if (!string.IsNullOrEmpty(ipAddress) && await ipBlockService.IsIpBlockedAsync(ipAddress))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"success\": false, \"message\": \"Truy cập bị từ chối do phát hiện hành vi bất thường từ địa chỉ IP này. Vui lòng liên hệ bộ phận hỗ trợ.\"}");
                return;
            }

            await _next(context);
        }
    }

    public static class IpBlockMiddlewareExtensions
    {
        public static IApplicationBuilder UseIpBlock(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<IpBlockMiddleware>();
        }
    }
}

using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models.Mongo;

namespace PolyBabyAPI.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly IMongoDbService _mongoDbService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditLogService(IMongoDbService mongoDbService, IHttpContextAccessor httpContextAccessor)
        {
            _mongoDbService = mongoDbService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogAsync(string action, string? entityName, string? entityId, string? oldValues, string? newValues, string? description)
        {
            var context = _httpContextAccessor.HttpContext;
            var userId = context?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                         ?? context?.User.FindFirst("id")?.Value;
            var ipAddress = context?.Connection?.RemoteIpAddress?.ToString();

            var auditLog = new AuditLog
            {
                Action = action,
                UserId = userId,
                EntityName = entityName,
                EntityId = entityId,
                OldValues = oldValues,
                NewValues = newValues,
                Description = description,
                IpAddress = ipAddress
            };

            await _mongoDbService.AuditLogs.InsertOneAsync(auditLog);
        }
    }
}

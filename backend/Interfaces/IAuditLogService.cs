using System.Threading.Tasks;

namespace PolyBabyAPI.Interfaces
{
    public interface IAuditLogService
    {
        Task LogAsync(string action, string? entityName, string? entityId, string? oldValues, string? newValues, string? description);
    }
}

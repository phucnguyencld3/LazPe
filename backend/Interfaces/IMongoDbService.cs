using MongoDB.Driver;
using PolyBabyAPI.Models.Mongo;

namespace PolyBabyAPI.Interfaces
{
    public interface IMongoDbService
    {
        IMongoCollection<UserInteraction> UserInteractions { get; }
        IMongoCollection<KnowledgeArticle> KnowledgeArticles { get; }
        IMongoCollection<AuditLog> AuditLogs { get; }
        IMongoCollection<BlockedIp> BlockedIps { get; }
        IMongoCollection<SecurityAuditLog> SecurityAuditLogs { get; }
    }
}

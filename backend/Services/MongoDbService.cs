using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models.Mongo;
using PolyBabyAPI.Settings;

namespace PolyBabyAPI.Services
{
    public class MongoDbService : IMongoDbService
    {
        private readonly IMongoDatabase _database;

        public MongoDbService(IOptions<MongoDbSettings> mongoDbSettings)
        {
            var mongoClient = new MongoClient(mongoDbSettings.Value.ConnectionString);
            _database = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);
        }

        public IMongoCollection<UserInteraction> UserInteractions =>
            _database.GetCollection<UserInteraction>("UserInteractions");

        public IMongoCollection<KnowledgeArticle> KnowledgeArticles =>
            _database.GetCollection<KnowledgeArticle>("KnowledgeArticles");

        public IMongoCollection<AuditLog> AuditLogs =>
            _database.GetCollection<AuditLog>("AuditLogs");

        public IMongoCollection<BlockedIp> BlockedIps =>
            _database.GetCollection<BlockedIp>("BlockedIps");

        public IMongoCollection<SecurityAuditLog> SecurityAuditLogs =>
            _database.GetCollection<SecurityAuditLog>("SecurityAuditLogs");
    }
}

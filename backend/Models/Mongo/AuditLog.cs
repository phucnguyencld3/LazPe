using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PolyBabyAPI.Models.Mongo
{
    public class AuditLog
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string Action { get; set; } = null!;
        public string? UserId { get; set; }
        public string? EntityName { get; set; }
        public string? EntityId { get; set; }
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? Description { get; set; }
        public string? IpAddress { get; set; }
        
        [BsonRepresentation(BsonType.DateTime)]
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }
}

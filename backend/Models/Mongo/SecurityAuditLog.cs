using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PolyBabyAPI.Models.Mongo
{
    public class SecurityAuditLog
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;
        
        public string IpAddress { get; set; } = string.Empty;
        
        public string? UserId { get; set; }
        
        public string ActionType { get; set; } = string.Empty; // "Warning", "BlockAccount", "BlockIP"
        
        public string Description { get; set; } = string.Empty;
        
        public int RequestCount { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

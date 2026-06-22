using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PolyBabyAPI.Models.Mongo
{
    public class BlockedIp
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string IpAddress { get; set; } = string.Empty;
        
        public string Reason { get; set; } = string.Empty;
        
        public DateTime BlockedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ExpiresAt { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public string? UserId { get; set; }
        
        public string? UserEmail { get; set; }
        
        public List<string> RecentInvoices { get; set; } = new List<string>();
    }
}

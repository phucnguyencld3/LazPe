using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PolyBabyAPI.Models.Mongo
{
    public class UserInteraction
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("UserId")]
        public string UserId { get; set; } = null!;

        [BsonElement("ProductId")]
        public int ProductId { get; set; }

        [BsonElement("InteractionType")]
        [BsonRepresentation(BsonType.String)]
        public InteractionType InteractionType { get; set; }

        [BsonElement("Score")]
        public float Score { get; set; }

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public enum InteractionType
    {
        View,       // 1 point
        Wishlist,   // 2 points
        Cart,       // 3 points
        Review,     // 4 points
        Purchase    // 5 points
    }
}

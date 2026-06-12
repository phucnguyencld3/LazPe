using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PolyBabyAPI.Models.Mongo
{
    public class KnowledgeArticle
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public float[] Embedding { get; set; } = Array.Empty<float>();

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}

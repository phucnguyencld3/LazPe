using System.Text.Json.Serialization;
using System.Collections.Generic;

namespace PolyBabyAPI.Models.Gemini
{
    public class ImageSearchResponse
    {
        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("brand")]
        public string Brand { get; set; }

        [JsonPropertyName("product_name")]
        public string ProductName { get; set; }

        [JsonPropertyName("keywords")]
        public List<string> Keywords { get; set; }

        [JsonPropertyName("confidence")]
        public object Confidence { get; set; }
    }
}

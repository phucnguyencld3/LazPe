using System.Text.Json;
using System.Text.Json.Serialization;

namespace PolyBabyAPI.Models.Gemini
{
    public class GeminiRequest
    {
        [JsonPropertyName("systemInstruction")]
        public GeminiContent? SystemInstruction { get; set; }

        [JsonPropertyName("contents")]
        public List<GeminiContent> Contents { get; set; } = new();

        [JsonPropertyName("tools")]
        public List<GeminiTool>? Tools { get; set; }
    }

    public class GeminiContent
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = "user"; // "user" or "model"

        [JsonPropertyName("parts")]
        public List<GeminiPart> Parts { get; set; } = new();

        [JsonExtensionData]
        public Dictionary<string, JsonElement>? ExtensionData { get; set; }
    }

    public class GeminiPart
    {
        [JsonPropertyName("text")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Text { get; set; }

        [JsonPropertyName("functionCall")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public GeminiFunctionCall? FunctionCall { get; set; }

        [JsonPropertyName("functionResponse")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public GeminiFunctionResponse? FunctionResponse { get; set; }

        [JsonExtensionData]
        public Dictionary<string, JsonElement>? ExtensionData { get; set; }
    }

    public class GeminiFunctionCall
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("args")]
        public Dictionary<string, object> Args { get; set; } = new();

        [JsonExtensionData]
        public Dictionary<string, JsonElement>? ExtensionData { get; set; }
    }

    public class GeminiFunctionResponse
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("response")]
        public Dictionary<string, object> Response { get; set; } = new();
    }

    public class GeminiTool
    {
        [JsonPropertyName("functionDeclarations")]
        public List<GeminiFunctionDeclaration> FunctionDeclarations { get; set; } = new();
    }

    public class GeminiFunctionDeclaration
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("parameters")]
        public GeminiSchema? Parameters { get; set; }
    }

    public class GeminiSchema
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "OBJECT"; // TYPE_UNSPECIFIED, STRING, NUMBER, INTEGER, BOOLEAN, ARRAY, OBJECT

        [JsonPropertyName("properties")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, GeminiSchema>? Properties { get; set; }

        [JsonPropertyName("required")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? Required { get; set; }

        [JsonPropertyName("description")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Description { get; set; }
    }

    public class GeminiResponse
    {
        [JsonPropertyName("candidates")]
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    public class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }
    }
}

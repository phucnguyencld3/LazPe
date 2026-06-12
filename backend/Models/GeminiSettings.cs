namespace PolyBabyAPI.Models
{
    public class GeminiSettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public List<string> ApiKeys { get; set; } = new();
    }
}

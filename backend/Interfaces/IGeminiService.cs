namespace PolyBabyAPI.Interfaces
{
    public interface IGeminiService
    {
        Task<string> GenerateTextAsync(string sessionId, string prompt);
        IAsyncEnumerable<string> StreamTextAsync(string sessionId, string prompt);
        Task<float[]> GetEmbeddingAsync(string text);
        Task<string> AnalyzeImageForSearchAsync(IFormFile file);
        Task<PolyBabyAPI.Models.Gemini.ImageSearchResponse> AnalyzeImageAdvancedAsync(IFormFile file);
        Task<string> TranscribeAudioAsync(IFormFile audio);
    }
}

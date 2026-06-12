namespace PolyBabyAPI.Interfaces
{
    public interface IGeminiService
    {
        Task<string> GenerateTextAsync(string prompt);
        IAsyncEnumerable<string> StreamTextAsync(string prompt);
    }
}

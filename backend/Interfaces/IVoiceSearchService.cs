namespace PolyBabyAPI.Interfaces
{
    public interface IVoiceSearchService
    {
        Task<List<int>> SearchByVoiceAsync(string keyword);
        Task<string> TranscribeAudioAsync(IFormFile audio);
    }
}

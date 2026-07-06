using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Services
{
    public class VoiceSearchService : IVoiceSearchService
    {
        private readonly IGeminiService _geminiService;
        private readonly ISearchEngineService _searchEngineService;

        public VoiceSearchService(IGeminiService geminiService, ISearchEngineService searchEngineService)
        {
            _geminiService = geminiService;
            _searchEngineService = searchEngineService;
        }

        public async Task<List<int>> SearchByVoiceAsync(string keyword)
        {
            if (string.IsNullOrEmpty(keyword))
            {
                return new List<int>();
            }

            return await _searchEngineService.SearchProductsAsync(keyword);
        }

        public async Task<string> TranscribeAudioAsync(IFormFile audio)
        {
            return await _geminiService.TranscribeAudioAsync(audio);
        }
    }
}

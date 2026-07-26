using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Services
{
    public class ImageSearchService : IImageSearchService
    {
        private readonly IGeminiService _geminiService;
        private readonly ISearchEngineService _searchEngineService;

        public ImageSearchService(IGeminiService geminiService, ISearchEngineService searchEngineService)
        {
            _geminiService = geminiService;
            _searchEngineService = searchEngineService;
        }

        public async Task<List<int>> SearchByImageAsync(string keyword)
        {
            if (string.IsNullOrEmpty(keyword))
            {
                return new List<int>();
            }

            return await _searchEngineService.SearchProductsAsync(keyword);
        }

        public async Task<string> ExtractKeywordFromImageAsync(IFormFile image)
        {
            return await _geminiService.AnalyzeImageForSearchAsync(image);
        }
    }
}

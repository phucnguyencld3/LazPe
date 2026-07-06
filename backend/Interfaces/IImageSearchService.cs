namespace PolyBabyAPI.Interfaces
{
    public interface IImageSearchService
    {
        Task<List<int>> SearchByImageAsync(string keyword);
        Task<string> ExtractKeywordFromImageAsync(IFormFile image);
    }
}

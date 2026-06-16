namespace PolyBabyAPI.Interfaces
{
    public interface IRecommendationService
    {
        Task LogInteractionAsync(string userId, int productId, Models.Mongo.InteractionType interactionType);
        Task TrainModelAsync();
        Task<List<int>> GetRecommendationsAsync(string userId, int topN, List<int>? recentProductIds = null);
    }
}

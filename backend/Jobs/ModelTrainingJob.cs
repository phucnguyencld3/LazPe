using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Jobs
{
    public class ModelTrainingJob
    {
        private readonly IRecommendationService _recommendationService;

        public ModelTrainingJob(IRecommendationService recommendationService)
        {
            _recommendationService = recommendationService;
        }

        public async Task ExecuteAsync()
        {
            await _recommendationService.TrainModelAsync();
        }
    }
}

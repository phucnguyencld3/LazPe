using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.ML.Trainers;
using MongoDB.Driver;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models.Mongo;

namespace PolyBabyAPI.Services
{
    public class RecommendationService : IRecommendationService
    {
        private readonly IMongoDbService _mongoDbService;
        private readonly ApplicationDbContext _dbContext;
        private readonly ILogger<RecommendationService> _logger;
        private static readonly string ModelPath = Path.Combine(Environment.CurrentDirectory, "RecommendationModel.zip");
        private readonly MLContext _mlContext;

        public RecommendationService(IMongoDbService mongoDbService, ApplicationDbContext dbContext, ILogger<RecommendationService> logger)
        {
            _mongoDbService = mongoDbService;
            _dbContext = dbContext;
            _logger = logger;
            _mlContext = new MLContext();
        }

        public async Task LogInteractionAsync(string userId, int productId, InteractionType interactionType)
        {
            try
            {
                if (string.IsNullOrEmpty(userId)) return;

                float score = interactionType switch
                {
                    InteractionType.View => 1f,
                    InteractionType.Wishlist => 2f,
                    InteractionType.Cart => 3f,
                    InteractionType.Review => 4f,
                    InteractionType.Purchase => 5f,
                    _ => 1f
                };

                var interaction = new UserInteraction
                {
                    UserId = userId,
                    ProductId = productId,
                    InteractionType = interactionType,
                    Score = score,
                    CreatedAt = DateTime.UtcNow
                };

                await _mongoDbService.UserInteractions.InsertOneAsync(interaction);
                _logger.LogInformation($"Logged {interactionType} interaction for User {userId} on Product {productId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging interaction to MongoDB");
            }
        }

        public async Task TrainModelAsync()
        {
            try
            {
                _logger.LogInformation("Starting ML.NET Recommendation Model Training...");

                // 1. Lấy dữ liệu từ MongoDB
                var interactions = await _mongoDbService.UserInteractions.Find(_ => true).ToListAsync();
                if (interactions.Count < 10)
                {
                    _logger.LogWarning("Not enough data to train model. Minimum 10 interactions required.");
                    return;
                }

                // Nhóm dữ liệu theo UserId và ProductId để lấy max score (VD: vừa View vừa Mua thì lấy 5)
                var trainingDataList = interactions
                    .GroupBy(x => new { x.UserId, x.ProductId })
                    .Select(g => new ProductRating
                    {
                        UserId = g.Key.UserId,
                        ProductId = (uint)g.Key.ProductId,
                        Label = g.Max(x => x.Score)
                    }).ToList();

                // 2. Tải vào ML.NET
                IDataView trainingDataView = _mlContext.Data.LoadFromEnumerable(trainingDataList);

                // 3. Cấu hình pipeline Matrix Factorization
                var pipeline = _mlContext.Transforms.Conversion.MapValueToKey(outputColumnName: "userIdEncoded", inputColumnName: nameof(ProductRating.UserId))
                    .Append(_mlContext.Transforms.Conversion.MapValueToKey(outputColumnName: "productIdEncoded", inputColumnName: nameof(ProductRating.ProductId)))
                    .Append(_mlContext.Recommendation().Trainers.MatrixFactorization(
                        new MatrixFactorizationTrainer.Options
                        {
                            MatrixColumnIndexColumnName = "userIdEncoded",
                            MatrixRowIndexColumnName = "productIdEncoded",
                            LabelColumnName = nameof(ProductRating.Label),
                            NumberOfIterations = 20,
                            ApproximationRank = 100
                        }));

                // 4. Huấn luyện Model
                var model = pipeline.Fit(trainingDataView);

                // 5. Lưu Model ra file zip
                _mlContext.Model.Save(model, trainingDataView.Schema, ModelPath);
                
                _logger.LogInformation("Model trained and saved successfully at {ModelPath}", ModelPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during AI model training");
            }
        }

        public async Task<List<int>> GetRecommendationsAsync(string userId, int topN)
        {
            if (string.IsNullOrEmpty(userId))
            {
                // Nếu chưa đăng nhập, trả về các sản phẩm có tương tác cao nhất
                return await GetTopSellingOrViewedAsync(topN);
            }

            try
            {
                if (!File.Exists(ModelPath))
                {
                    _logger.LogWarning("Model file not found. Falling back to top selling.");
                    return await GetTopSellingOrViewedAsync(topN);
                }

                DataViewSchema modelSchema;
                ITransformer model = _mlContext.Model.Load(ModelPath, out modelSchema);
                var predictionEngine = _mlContext.Model.CreatePredictionEngine<ProductRating, ProductPrediction>(model);

                // Lấy tất cả ProductId hiện có
                var allProductIds = _dbContext.Products.Select(p => p.ProductID).ToList();

                // Lấy các sản phẩm user đã tương tác (không gợi ý lại đồ đã mua/view để tránh nhàm chán)
                // (Thực tế tuỳ bussiness, ở đây có thể gợi ý cả đồ đã xem chưa mua, nhưng tạm lọc đồ đã mua)
                var interactedIds = await _mongoDbService.UserInteractions
                    .Find(x => x.UserId == userId && x.InteractionType == InteractionType.Purchase)
                    .Project(x => x.ProductId)
                    .ToListAsync();

                var candidateIds = allProductIds.Except(interactedIds).ToList();

                var predictions = new List<Tuple<int, float>>();

                foreach (var pId in candidateIds)
                {
                    var input = new ProductRating { UserId = userId, ProductId = (uint)pId };
                    var prediction = predictionEngine.Predict(input);
                    predictions.Add(new Tuple<int, float>(pId, prediction.Score));
                }

                // Sắp xếp điểm giảm dần và lấy top N
                var topProductIds = predictions
                    .OrderByDescending(p => p.Item2)
                    .Take(topN)
                    .Select(p => p.Item1)
                    .ToList();

                // Nếu AI dự đoán trả về ít hơn topN (do thiếu dữ liệu ứng cử viên), bù thêm
                if (topProductIds.Count < topN)
                {
                    var fallback = await GetTopSellingOrViewedAsync(topN - topProductIds.Count);
                    topProductIds.AddRange(fallback.Except(topProductIds));
                }

                return topProductIds;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting AI recommendations");
                return await GetTopSellingOrViewedAsync(topN);
            }
        }

        private async Task<List<int>> GetTopSellingOrViewedAsync(int count)
        {
            // Trả về top sản phẩm có số lượng tương tác cao nhất trong MongoDB
            var topInteracted = await _mongoDbService.UserInteractions
                .Aggregate()
                .Group(x => x.ProductId, g => new { ProductId = g.Key, TotalScore = g.Sum(x => x.Score) })
                .SortByDescending(x => x.TotalScore)
                .Limit(count)
                .ToListAsync();

            if (topInteracted.Any())
            {
                return topInteracted.Select(x => x.ProductId).ToList();
            }

            // Nếu MongoDB chưa có data, lấy đại từ DB
            return _dbContext.Products.Take(count).Select(p => p.ProductID).ToList();
        }
    }

    public class ProductRating
    {
        public string UserId { get; set; } = null!;
        public uint ProductId { get; set; }
        public float Label { get; set; }
    }

    public class ProductPrediction
    {
        public float Score { get; set; }
    }
}

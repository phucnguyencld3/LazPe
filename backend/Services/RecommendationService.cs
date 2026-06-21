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
                    CreatedAt = DateTime.Now
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

        public async Task<List<int>> GetRecommendationsAsync(string userId, int topN, List<int>? recentProductIds = null)
        {
            var finalRecommendations = new List<int>();
            recentProductIds ??= new List<int>();

            try
            {
                // 1. Thu thập Clickstream (Short-term Intent)
                if (!string.IsNullOrEmpty(userId))
                {
                    var recentInteractions = await _mongoDbService.UserInteractions
                        .Find(x => x.UserId == userId)
                        .SortByDescending(x => x.CreatedAt)
                        .Limit(10)
                        .ToListAsync();
                    
                    var interactionProductIds = recentInteractions.Select(x => x.ProductId).ToList();
                    recentProductIds.AddRange(interactionProductIds);
                }

                recentProductIds = recentProductIds.Distinct().Take(10).ToList();

                // 2. Layer 1 & 2: Content-Based và Category-Based Real-time Candidates
                var realTimeCandidates = new List<int>();
                
                if (recentProductIds.Any())
                {
                    // Lấy thông tin các sản phẩm vừa xem
                    var recentProducts = _dbContext.Products
                        .Where(p => recentProductIds.Contains(p.ProductID))
                        .Select(p => new { p.ProductID, p.CategoryID, p.SupplierID, p.Description, p.Specifications })
                        .ToList();

                    if (recentProducts.Any())
                    {
                        var recentCategoryIds = recentProducts.Select(p => p.CategoryID).Distinct().ToList();

                        // Tìm các sản phẩm cùng danh mục
                        var categoryProducts = _dbContext.Products
                            .Where(p => recentCategoryIds.Contains(p.CategoryID) && !recentProductIds.Contains(p.ProductID))
                            .Select(p => new { p.ProductID, p.Description, p.Specifications })
                            .ToList();

                        // Tính điểm tương đồng nội dung (Content-based)
                        // Dựa trên số lượng từ khoá chung trong Description và Specifications
                        var recentTexts = recentProducts.Select(p => (p.Description + " " + p.Specifications).ToLower()).ToList();
                        
                        var contentScores = categoryProducts.Select(p =>
                        {
                            string pText = (p.Description + " " + p.Specifications).ToLower();
                            int score = 0;
                            
                            // Thuật toán đếm từ vựng chung
                            foreach (var rt in recentTexts)
                            {
                                var words = rt.Split(new[] { ' ', ',', '.', ':', '"', '{', '}', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                                              .Where(w => w.Length > 3)
                                              .Distinct()
                                              .Take(50); // Lấy top 50 từ khoá đặc trưng nhất

                                foreach (var w in words)
                                {
                                    if (pText.Contains(w)) score++;
                                }
                            }
                            return new { p.ProductID, Score = score };
                        })
                        .OrderByDescending(x => x.Score)
                        .Take(topN)
                        .Select(x => x.ProductID)
                        .ToList();

                        realTimeCandidates.AddRange(contentScores);
                    }
                }

                // 3. Layer 3: ML.NET Candidates (Collaborative Filtering)
                var mlCandidates = new List<int>();

                if (!string.IsNullOrEmpty(userId) && File.Exists(ModelPath))
                {
                    try
                    {
                        DataViewSchema modelSchema;
                        ITransformer model = _mlContext.Model.Load(ModelPath, out modelSchema);
                        var predictionEngine = _mlContext.Model.CreatePredictionEngine<ProductRating, ProductPrediction>(model);

                        var allProductIds = _dbContext.Products.Select(p => p.ProductID).ToList();
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

                        mlCandidates = predictions
                            .OrderByDescending(p => p.Item2)
                            .Take(topN)
                            .Select(p => p.Item1)
                            .ToList();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error getting ML.NET recommendations");
                    }
                }

                // 4. Merge & Boost (Trộn kết quả)
                // Lấy xen kẽ ưu tiên Real-time trước để có trải nghiệm phản ứng nhanh
                int realTimeIndex = 0;
                int mlIndex = 0;

                while (finalRecommendations.Count < topN && (realTimeIndex < realTimeCandidates.Count || mlIndex < mlCandidates.Count))
                {
                    if (realTimeIndex < realTimeCandidates.Count)
                    {
                        var id = realTimeCandidates[realTimeIndex++];
                        if (!finalRecommendations.Contains(id)) finalRecommendations.Add(id);
                    }

                    if (finalRecommendations.Count >= topN) break;

                    if (mlIndex < mlCandidates.Count)
                    {
                        var id = mlCandidates[mlIndex++];
                        if (!finalRecommendations.Contains(id)) finalRecommendations.Add(id);
                    }
                }

                // Fallback nếu vẫn thiếu
                if (finalRecommendations.Count < topN)
                {
                    var fallback = await GetTopSellingOrViewedAsync(topN);
                    foreach (var id in fallback)
                    {
                        if (finalRecommendations.Count >= topN) break;
                        if (!finalRecommendations.Contains(id)) finalRecommendations.Add(id);
                    }
                }

                return finalRecommendations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing Hybrid Recommendation");
                var fallback = await GetTopSellingOrViewedAsync(topN);
                return fallback.Take(topN).ToList();
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

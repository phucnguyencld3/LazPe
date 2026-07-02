using Microsoft.AspNetCore.Authorization;
using PolyBabyAPI.Filters;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models.Mongo;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.DTOs;
using MongoDB.Driver;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecommendationController : ControllerBase
    {
        private readonly IRecommendationService _recommendationService;
        private readonly ApplicationDbContext _dbContext;

        public RecommendationController(IRecommendationService recommendationService, ApplicationDbContext dbContext)
        {
            _recommendationService = recommendationService;
            _dbContext = dbContext;
        }

        [HttpGet("for-you")]
        public async Task<IActionResult> GetRecommendations([FromQuery] int limit = 10, [FromQuery] string? recentIds = null)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                
                var recentProductIds = new List<int>();
                if (!string.IsNullOrEmpty(recentIds))
                {
                    recentProductIds = recentIds.Split(',')
                        .Select(id => int.TryParse(id.Trim(), out var parsedId) ? parsedId : 0)
                        .Where(id => id > 0)
                        .ToList();
                }

                var productIds = await _recommendationService.GetRecommendationsAsync(userId ?? "", limit, recentProductIds);

                if (!productIds.Any())
                {
                    return Ok(new { success = true, data = new List<object>() });
                }

                // Lấy thông tin chi tiết từ SQL Server
                var products = await _dbContext.Products
                    .Where(p => productIds.Contains(p.ProductID))
                    .Select(p => new
                    {
                        p.ProductID,
                        p.Slug,
                        p.ProductName,
                        p.Price,
                        DiscountPrice = p.ProductDiscountPercent > 0 ? (decimal?)(p.Price * (1 - p.ProductDiscountPercent / 100)) : null,
                        Rating = 0,
                        ReviewsCount = 0,
                        ImageUrl = p.Variants.FirstOrDefault(v => v.ImageUrl != null && v.ImageUrl != "") != null ? p.Variants.FirstOrDefault(v => v.ImageUrl != null && v.ImageUrl != "").ImageUrl : (p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault() != null ? p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault().ImageUrl : null),
                        BrandName = p.Supplier != null ? p.Supplier.SupplierName : null,
                        CategoryName = p.Category != null ? p.Category.CategoryName : null
                    })
                    .ToListAsync();

                // Sắp xếp lại theo thứ tự mà AI trả về
                var sortedProducts = productIds
                    .Select(id => products.FirstOrDefault(p => p.ProductID == id))
                    .Where(p => p != null)
                    .ToList();

                return Ok(new { success = true, data = sortedProducts });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi lấy dữ liệu AI", error = ex.Message });
            }
        }

        [HttpGet("recently-viewed")]
        public async Task<IActionResult> GetRecentlyViewed([FromQuery] int limit = 10, [FromQuery] string? recentIds = null)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var productIds = new List<int>();

                if (!string.IsNullOrEmpty(userId))
                {
                    var mongoDbService = HttpContext.RequestServices.GetRequiredService<IMongoDbService>();
                    var recentInteractions = await mongoDbService.UserInteractions
                        .Find(x => x.UserId == userId && x.InteractionType == InteractionType.View)
                        .SortByDescending(x => x.CreatedAt)
                        .Limit(limit * 3)
                        .ToListAsync();
                    
                    productIds = recentInteractions.Select(x => x.ProductId).Distinct().Take(limit).ToList();
                }

                if (!productIds.Any() && !string.IsNullOrEmpty(recentIds))
                {
                    productIds = recentIds.Split(',')
                        .Select(id => int.TryParse(id.Trim(), out var parsedId) ? parsedId : 0)
                        .Where(id => id > 0)
                        .Distinct()
                        .Take(limit)
                        .ToList();
                }

                if (!productIds.Any())
                {
                    return Ok(new { success = true, data = new List<object>() });
                }

                var products = await _dbContext.Products
                    .Where(p => productIds.Contains(p.ProductID))
                    .Select(p => new
                    {
                        p.ProductID,
                        p.ProductName,
                        p.Price,
                        DiscountPrice = p.ProductDiscountPercent > 0 ? (decimal?)(p.Price * (1 - p.ProductDiscountPercent / 100)) : null,
                        Rating = 0,
                        ReviewsCount = 0,
                        ImageUrl = p.Variants.FirstOrDefault(v => v.ImageUrl != null && v.ImageUrl != "") != null ? p.Variants.FirstOrDefault(v => v.ImageUrl != null && v.ImageUrl != "").ImageUrl : (p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault() != null ? p.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault().ImageUrl : null),
                        BrandName = p.Supplier != null ? p.Supplier.SupplierName : null,
                        CategoryName = p.Category != null ? p.Category.CategoryName : null
                    })
                    .ToListAsync();

                var sortedProducts = productIds
                    .Select(id => products.FirstOrDefault(p => p.ProductID == id))
                    .Where(p => p != null)
                    .ToList();

                return Ok(new { success = true, data = sortedProducts });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi lấy dữ liệu đã xem", error = ex.Message });
            }
        }

        [HttpPost("log-view/{productId}")]
        public async Task<IActionResult> LogProductView(int productId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                await _recommendationService.LogInteractionAsync(userId, productId, InteractionType.View);
            }
            return Ok(new { success = true });
        }

        [Authorize(Roles = "Admin")]
        [Permission("System.Config")]
        [HttpPost("force-train")]
        public async Task<IActionResult> ForceTrainModel()
        {
            try
            {
                await _recommendationService.TrainModelAsync();
                return Ok(new { success = true, message = "Đã huấn luyện AI Model thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi huấn luyện AI Model", error = ex.Message });
            }
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class SearchController : ControllerBase
    {
        private readonly IImageSearchService _imageSearchService;
        private readonly IVoiceSearchService _voiceSearchService;
        private readonly ApplicationDbContext _dbContext;

        public SearchController(IImageSearchService imageSearchService, IVoiceSearchService voiceSearchService, ApplicationDbContext dbContext)
        {
            _imageSearchService = imageSearchService;
            _voiceSearchService = voiceSearchService;
            _dbContext = dbContext;
        }

        [HttpPost("image")]
        public async Task<IActionResult> SearchByImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Không có file ảnh được tải lên." });
                }

                var keyword = await _imageSearchService.ExtractKeywordFromImageAsync(file);
                if (string.IsNullOrEmpty(keyword))
                {
                    return BadRequest(new { success = false, message = "Không thể nhận diện hình ảnh." });
                }

                // Call search using the extracted keyword
                var productIds = await _imageSearchService.SearchByImageAsync(keyword);

                var products = await _dbContext.Products
                    .Include(p => p.Variants)
                    .Include(p => p.Images)
                    .Where(p => productIds.Contains(p.ProductID))
                    .Select(p => new
                    {
                        id = p.ProductID,
                        name = p.ProductName,
                        price = p.Price,
                        discountPrice = p.ProductDiscountPercent > 0 ? (decimal?)(p.Price * (1 - p.ProductDiscountPercent / 100)) : null,
                        image = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() 
                                ?? p.Variants.Where(v => v.ImageUrl != null && v.ImageUrl != "").Select(v => v.ImageUrl).FirstOrDefault()
                    })
                    .ToListAsync();

                // Order by matched score (actually ordered by Meilisearch ranking, so we sort by productIds order)
                var sortedProducts = productIds
                    .Select(id => products.FirstOrDefault(p => p.id == id))
                    .Where(p => p != null)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    query = keyword,
                    products = sortedProducts,
                    matchedScore = 0.99
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra: " + ex.Message });
            }
        }

        [HttpPost("voice")]
        public async Task<IActionResult> SearchByVoice(IFormFile audio)
        {
            try
            {
                if (audio == null || audio.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Không có file âm thanh được tải lên." });
                }

                var keyword = await _voiceSearchService.TranscribeAudioAsync(audio);
                if (string.IsNullOrEmpty(keyword))
                {
                    return BadRequest(new { success = false, message = "Không thể nhận diện giọng nói." });
                }

                var productIds = await _voiceSearchService.SearchByVoiceAsync(keyword);

                var products = await _dbContext.Products
                    .Include(p => p.Variants)
                    .Include(p => p.Images)
                    .Where(p => productIds.Contains(p.ProductID))
                    .Select(p => new
                    {
                        id = p.ProductID,
                        name = p.ProductName,
                        price = p.Price,
                        discountPrice = p.ProductDiscountPercent > 0 ? (decimal?)(p.Price * (1 - p.ProductDiscountPercent / 100)) : null,
                        image = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() 
                                ?? p.Variants.Where(v => v.ImageUrl != null && v.ImageUrl != "").Select(v => v.ImageUrl).FirstOrDefault()
                    })
                    .ToListAsync();

                var sortedProducts = productIds
                    .Select(id => products.FirstOrDefault(p => p.id == id))
                    .Where(p => p != null)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    query = keyword,
                    products = sortedProducts
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra: " + ex.Message });
            }
        }
    }
}

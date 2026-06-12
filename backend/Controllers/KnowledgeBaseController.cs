using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models.Mongo;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KnowledgeBaseController : ControllerBase
    {
        private readonly IMongoDbService _mongoDbService;
        private readonly IGeminiService _geminiService;

        public KnowledgeBaseController(IMongoDbService mongoDbService, IGeminiService geminiService)
        {
            _mongoDbService = mongoDbService;
            _geminiService = geminiService;
        }

        [HttpPost("seed")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SeedKnowledgeBase()
        {
            var defaultArticles = new List<KnowledgeArticle>
            {
                new KnowledgeArticle { Title = "Chính sách đổi trả", Content = "Khách hàng có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên tem mác và chưa qua sử dụng. Phí vận chuyển đổi trả do khách hàng chi trả trừ trường hợp lỗi do nhà sản xuất." },
                new KnowledgeArticle { Title = "Chính sách vận chuyển", Content = "Miễn phí vận chuyển cho đơn hàng từ 500,000 VNĐ. Thời gian giao hàng dự kiến từ 2-4 ngày làm việc. Khu vực nội thành có thể giao hỏa tốc trong 2 giờ." },
                new KnowledgeArticle { Title = "Hướng dẫn bảo hành", Content = "Sản phẩm được bảo hành tại các trung tâm bảo hành của LazPe. Vui lòng mang theo hóa đơn mua hàng. Thời gian bảo hành tùy thuộc vào từng loại sản phẩm." }
            };

            int count = 0;
            foreach (var article in defaultArticles)
            {
                var existing = await _mongoDbService.KnowledgeArticles.Find(a => a.Title == article.Title).FirstOrDefaultAsync();
                if (existing == null)
                {
                    article.Embedding = await _geminiService.GetEmbeddingAsync(article.Content);
                    await _mongoDbService.KnowledgeArticles.InsertOneAsync(article);
                    count++;
                }
            }

            return Ok(new { message = $"Đã thêm {count} bài viết vào Knowledge Base." });
        }
    }
}

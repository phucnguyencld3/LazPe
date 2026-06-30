using Google.Cloud.Vision.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class GoogleVisionModerationService : IImageModerationService
    {
        private readonly ILogger<GoogleVisionModerationService> _logger;

        public GoogleVisionModerationService(ILogger<GoogleVisionModerationService> logger)
        {
            _logger = logger;
        }

        public async Task<(bool IsSafe, string Message)> IsImageSafeAsync(IFormFile file)
        {
            try
            {
                // Kiểm tra loại file, API Vision hỗ trợ chủ yếu là ảnh
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (Array.IndexOf(allowedExtensions, extension) < 0)
                {
                    // Nếu không phải file ảnh hỗ trợ, bỏ qua kiểm duyệt Vision (cho phép tiếp tục hoặc từ chối tùy logic)
                    // Ở đây trả về an toàn để UploadController tự kiểm tra định dạng
                    return (true, string.Empty);
                }

                // Khởi tạo ImageAnnotatorClient
                // Lưu ý: Client này yêu cầu biến môi trường GOOGLE_APPLICATION_CREDENTIALS
                var client = await ImageAnnotatorClient.CreateAsync();

                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                ms.Position = 0;

                var image = Google.Cloud.Vision.V1.Image.FromStream(ms);
                
                // Gọi API SafeSearch
                var safeSearchAnnotation = await client.DetectSafeSearchAsync(image);

                if (safeSearchAnnotation == null)
                {
                    _logger.LogWarning("Không thể lấy kết quả SafeSearch từ Google Vision API.");
                    return (true, string.Empty); // Hoặc false tùy chiến lược rủi ro
                }

                _logger.LogInformation("SafeSearch Results: Adult: {Adult}, Spoof: {Spoof}, Medical: {Medical}, Violence: {Violence}, Racy: {Racy}",
                    safeSearchAnnotation.Adult, safeSearchAnnotation.Spoof, safeSearchAnnotation.Medical, safeSearchAnnotation.Violence, safeSearchAnnotation.Racy);

                // Các mức độ: Unknown, VeryUnlikely, Unlikely, Possible, Likely, VeryLikely
                var unsafeLikelihoods = new[] { Likelihood.Likely, Likelihood.VeryLikely };
                var strictLikelihoods = new[] { Likelihood.Possible, Likelihood.Likely, Likelihood.VeryLikely };

                // 18+ phạt nặng, chỉ cần Possible là cấm
                if (Array.IndexOf(strictLikelihoods, safeSearchAnnotation.Adult) >= 0)
                {
                    return (false, "Hình ảnh chứa nội dung nhạy cảm (18+).");
                }
                
                if (Array.IndexOf(unsafeLikelihoods, safeSearchAnnotation.Violence) >= 0)
                {
                    return (false, "Hình ảnh chứa yếu tố bạo lực.");
                }
                
                // Gợi cảm (Bikini, đồ lót, hở hang), quét gắt gao (Possible)
                if (Array.IndexOf(strictLikelihoods, safeSearchAnnotation.Racy) >= 0)
                {
                    return (false, "Hình ảnh chứa nội dung gợi cảm, hở hang quá mức.");
                }

                if (Array.IndexOf(unsafeLikelihoods, safeSearchAnnotation.Medical) >= 0)
                {
                    return (false, "Hình ảnh chứa nội dung y tế/máu me không phù hợp.");
                }

                // Ghi log kết quả ra file để debug
                File.AppendAllText("vision_debug_log.txt", $"[{DateTime.Now}] SUCCESS: Adult={safeSearchAnnotation.Adult}, Racy={safeSearchAnnotation.Racy}, Violence={safeSearchAnnotation.Violence}\n");

                return (true, string.Empty);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gọi Google Vision API kiểm duyệt ảnh.");
                File.AppendAllText("vision_debug_log.txt", $"[{DateTime.Now}] ERROR: {ex.Message}\n{ex.StackTrace}\n");
                // Tạm thời trả về lỗi luôn để xem có phải do cấu hình không
                return (false, "Lỗi hệ thống AI: " + ex.Message);
            }
        }
    }
}

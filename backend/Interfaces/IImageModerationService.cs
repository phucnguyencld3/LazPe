using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace PolyBabyAPI.Interfaces
{
    public interface IImageModerationService
    {
        /// <summary>
        /// Phân tích hình ảnh để phát hiện nội dung nhạy cảm (NSFW, bạo lực, v.v.).
        /// </summary>
        /// <param name="file">File ảnh được tải lên</param>
        /// <returns>Trả về một đối tượng chứa thuộc tính IsSafe và Message thông báo lỗi nếu có</returns>
        Task<(bool IsSafe, string Message)> IsImageSafeAsync(IFormFile file);
    }
}

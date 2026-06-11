namespace PolyBabyAPI.Interface
{
    public interface ICloudinaryService
    {
        Task<string> UploadImageAsync(IFormFile file);
        Task<string> UploadImageAsync(IFormFile file, string folder);
        Task<string> UploadAvatarAsync(IFormFile file, string userId);
        Task<string> UploadAvatarLocalAsync(IFormFile file, string userId); 
        Task<bool> DeleteImageAsync(string imageUrl);
        Task<string> ReplaceImageAsync(string oldImageUrl, IFormFile newFile, string folder);
    }
}



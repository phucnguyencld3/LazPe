using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Settings;

namespace PolyBabyAPI.Service
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<CloudinaryService> _logger;

        public CloudinaryService(IOptions<CloudinarySettings> config, ILogger<CloudinaryService> logger)
        {
            var account = new Account(
                config.Value.CloudName,
                config.Value.ApiKey,
                config.Value.ApiSecret
            );
            _cloudinary = new Cloudinary(account);
            _logger = logger;
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            return await UploadImageAsync(file, "polystation/products");
        }

        // Thêm method upload với folder tùy chọn
        public async Task<string> UploadImageAsync(IFormFile file, string folder)
        {
            if (file == null || file.Length == 0)
                return null;

            try
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folder,
                    Transformation = new Transformation()
                        .Width(folder.Contains("Avatar") ? 300 : 800)
                        .Height(folder.Contains("Avatar") ? 300 : 800)
                        .Crop("fill")
                        .Quality("auto")
                        .FetchFormat("auto"),
                    UseFilename = true,
                    UniqueFilename = true
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    _logger.LogInformation("Image uploaded successfully to {Folder}. Public ID: {PublicId}", folder, uploadResult.PublicId);
                    return uploadResult.SecureUrl.ToString();
                }

                _logger.LogError("Failed to upload image. Status: {Status}, Error: {Error}",
                    uploadResult.StatusCode, uploadResult.Error?.Message);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image to Cloudinary folder: {Folder}", folder);
                return null;
            }
        }

        // Thêm method upload avatar chuyên dụng
        public async Task<string> UploadAvatarAsync(IFormFile file, string userId)
        {
            if (file == null || file.Length == 0)
                return null;

            try
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "Avatar",
                    PublicId = $"avatar_{userId}_{DateTime.Now:yyyyMMdd_HHmmss}",
                    Transformation = new Transformation()
                        .Width(300).Height(300)
                        .Crop("fill")
                        .Quality("auto")
                        .FetchFormat("auto"),
                    Overwrite = true
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    _logger.LogInformation("Avatar uploaded successfully for user {UserId}. URL: {Url}", userId, uploadResult.SecureUrl);
                    return uploadResult.SecureUrl.ToString();
                }

                _logger.LogError("Failed to upload avatar. Status: {Status}, Error: {Error}",
                    uploadResult.StatusCode, uploadResult.Error?.Message);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar for user {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> DeleteImageAsync(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
                return false;

            try
            {
                // Lấy publicId từ URL
                var uri = new Uri(imageUrl);
                var segments = uri.AbsolutePath.Split('/');
                var fileNameWithExtension = segments[^1];
                var fileName = Path.GetFileNameWithoutExtension(fileNameWithExtension);

                // Lấy folder path
                var folderPath = string.Join("/", segments.Skip(3).Take(segments.Length - 4));
                var publicId = $"{folderPath}/{fileName}";

                var deletionParams = new DeletionParams(publicId);
                var result = await _cloudinary.DestroyAsync(deletionParams);

                _logger.LogInformation("Image deletion result: {Result} for PublicId: {PublicId}", result.Result, publicId);
                return result.Result == "ok";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image: {ImageUrl}", imageUrl);
                return false;
            }
        }

        public async Task<string> ReplaceImageAsync(string oldImageUrl, IFormFile newFile, string folder)
        {
            if (!string.IsNullOrEmpty(oldImageUrl))
            {
                try
                {
                    await DeleteImageAsync(oldImageUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error deleting old image during replacement: {ImageUrl}", oldImageUrl);
                }
            }

            return await UploadImageAsync(newFile, folder);
        }

        //Method upload local fallback
        public async Task<string> UploadAvatarLocalAsync(IFormFile file, string userId)
        {
            if (file == null || file.Length == 0)
                return null;

            try
            {
                _logger.LogInformation("Starting local avatar upload for user: {UserId}", userId);

                //Tạo thư mục uploads/avatars nếu chưa có
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
                Directory.CreateDirectory(uploadsPath);

                //Tạo tên file unique
                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{userId}_{Guid.NewGuid():N}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                //Lưu file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Trả về URL relative
                var avatarUrl = $"/uploads/avatars/{fileName}";
                _logger.LogInformation("Avatar uploaded locally for user {UserId}: {AvatarUrl}", userId, avatarUrl);

                return avatarUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar locally for user {UserId}", userId);
                return null;
            }
        }




    }
}

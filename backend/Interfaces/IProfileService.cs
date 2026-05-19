using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interface
{
    public interface IProfileService
    {
        Task<UserProfileDto?> GetProfileAsync(string userId);
        Task<UserProfileDto?> GetProfileByEmailAsync(string email);
        Task<bool> UpdateProfileAsync(string userId, UpdateProfileDto updateDto);
        Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto);
        Task<UploadAvatarResponseDto> UploadAvatarAsync(string userId, IFormFile avatarFile);
    }
}


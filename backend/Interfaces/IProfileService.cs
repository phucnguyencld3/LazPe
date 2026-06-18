using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interface
{
    public interface IProfileService
    {
        Task<UserProfileDto?> GetProfileAsync(string userId);
        Task<UserProfileDto?> GetProfileByEmailAsync(string email);
        Task<bool> UpdateProfileAsync(string userId, UpdateProfileDto updateDto);
        Task<bool> HasPasswordAsync(string userId);
        Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto);
        Task<bool> SetPasswordAsync(string userId, SetPasswordDto setPasswordDto);
        Task<UploadAvatarResponseDto> UploadAvatarAsync(string userId, IFormFile avatarFile);
        Task<bool> UpdateNotificationSettingsAsync(string userId, UpdateNotificationSettingsDto settingsDto);
    }
}


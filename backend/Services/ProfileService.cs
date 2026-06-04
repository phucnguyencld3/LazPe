using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Service 
{
    public class ProfileService : IProfileService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ILogger<ProfileService> _logger;

        public ProfileService(
            UserManager<ApplicationUser> userManager,
            ICloudinaryService cloudinaryService,
            ILogger<ProfileService> logger)
        {
            _userManager = userManager;
            _cloudinaryService = cloudinaryService;
            _logger = logger;
        }

        // ✅ Tất cả methods giữ nguyên như hiện tại...
        public async Task<UserProfileDto?> GetProfileAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found with ID: {UserId}", userId);
                    return null;
                }

                return new UserProfileDto
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email!,
                    PhoneNumber = user.PhoneNumber,
                    DateOfBirth = user.DateOfBirth,
                    Avatar = user.Avatar,
                    RegisterDate = user.RegisterDate,
                    EmailConfirmed = user.EmailConfirmed,
                    Status = user.Status,
                    ReceiveEmailNotifications = user.ReceiveEmailNotifications,
                    ReceiveOrderUpdates = user.ReceiveOrderUpdates,
                    ReceivePromotions = user.ReceivePromotions
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting profile for user {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> UpdateProfileAsync(string userId, UpdateProfileDto updateDto)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found with ID: {UserId}", userId);
                    return false;
                }

                // Cập nhật tất cả các field bao gồm Avatar
                user.FullName = updateDto.FullName;
                user.Email = updateDto.Email;
                user.UserName = updateDto.Email;
                user.PhoneNumber = updateDto.PhoneNumber;
                user.DateOfBirth = updateDto.DateOfBirth;

                // ✅ CẬP NHẬT AVATAR NẾU CÓ
                if (!string.IsNullOrEmpty(updateDto.Avatar))
                {
                    user.Avatar = updateDto.Avatar;
                }

                if (updateDto.ReceiveEmailNotifications.HasValue)
                {
                    user.ReceiveEmailNotifications = updateDto.ReceiveEmailNotifications.Value;
                }
                if (updateDto.ReceiveOrderUpdates.HasValue)
                {
                    user.ReceiveOrderUpdates = updateDto.ReceiveOrderUpdates.Value;
                }
                if (updateDto.ReceivePromotions.HasValue)
                {
                    user.ReceivePromotions = updateDto.ReceivePromotions.Value;
                }

                _logger.LogInformation("Updating user {UserId}. Avatar: {Avatar}",
                    userId, updateDto.Avatar);

                var result = await _userManager.UpdateAsync(user);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Profile updated successfully for user {UserId}", userId);
                    return true;
                }

                _logger.LogError("Failed to update profile for user {UserId}. Errors: {Errors}",
                    userId, string.Join(", ", result.Errors.Select(e => e.Description)));
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found with ID: {UserId}", userId);
                    return false;
                }

                var result = await _userManager.ChangePasswordAsync(user, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Password changed successfully for user {UserId}", userId);
                    return true;
                }

                _logger.LogWarning("Failed to change password for user {UserId}. Errors: {Errors}",
                    userId, string.Join(", ", result.Errors.Select(e => e.Description)));
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user {UserId}", userId);
                return false;
            }
        }

        public async Task<UploadAvatarResponseDto> UploadAvatarAsync(string userId, IFormFile avatarFile)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found with ID: {UserId}", userId);
                    return new UploadAvatarResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng"
                    };
                }

                var avatarUrl = await _cloudinaryService.UploadAvatarAsync(avatarFile, userId);

                if (string.IsNullOrEmpty(avatarUrl))
                {
                    return new UploadAvatarResponseDto
                    {
                        Success = false,
                        Message = "Không thể upload ảnh lên Cloudinary"
                    };
                }

                if (!string.IsNullOrEmpty(user.Avatar) && user.Avatar != "/assets/img/avatars/1.png")
                {
                    await _cloudinaryService.DeleteImageAsync(user.Avatar);
                }

                user.Avatar = avatarUrl;
                var updateResult = await _userManager.UpdateAsync(user);

                if (updateResult.Succeeded)
                {
                    _logger.LogInformation("Avatar updated successfully for user {UserId}. New URL: {AvatarUrl}", userId, avatarUrl);
                    return new UploadAvatarResponseDto
                    {
                        Success = true,
                        AvatarUrl = avatarUrl,
                        Message = "Cập nhật ảnh đại diện thành công!"
                    };
                }

                _logger.LogError("Failed to update avatar in database for user {UserId}", userId);
                return new UploadAvatarResponseDto
                {
                    Success = false,
                    Message = "Không thể cập nhật ảnh đại diện trong cơ sở dữ liệu"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar for user {UserId}", userId);
                return new UploadAvatarResponseDto
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi upload ảnh đại diện"
                };
            }
        }

        public async Task<UserProfileDto?> GetProfileByEmailAsync(string email)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    _logger.LogWarning("User not found with email: {Email}", email);
                    return null;
                }

                return new UserProfileDto
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email!,
                    PhoneNumber = user.PhoneNumber,
                    DateOfBirth = user.DateOfBirth,
                    Avatar = user.Avatar,
                    RegisterDate = user.RegisterDate,
                    EmailConfirmed = user.EmailConfirmed,
                    Status = user.Status,
                    ReceiveEmailNotifications = user.ReceiveEmailNotifications,
                    ReceiveOrderUpdates = user.ReceiveOrderUpdates,
                    ReceivePromotions = user.ReceivePromotions
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting profile by email {Email}", email);
                return null;
            }
        }

        public async Task<bool> UpdateNotificationSettingsAsync(string userId, UpdateNotificationSettingsDto settingsDto)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found with ID: {UserId} for updating settings", userId);
                    return false;
                }

                user.ReceiveEmailNotifications = settingsDto.ReceiveEmailNotifications;
                user.ReceiveOrderUpdates = settingsDto.ReceiveOrderUpdates;
                user.ReceivePromotions = settingsDto.ReceivePromotions;

                var result = await _userManager.UpdateAsync(user);
                return result.Succeeded;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification settings for user {UserId}", userId);
                return false;
            }
        }
    }
}


using PolyBabyAPI.Models;
using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    public interface IAuthenticationService
    {
        Task<bool> RegisterAsync(RegisterDto model);
        Task<bool> LoginAsync(LoginDto model);
        Task LogoutAsync();
        Task<ApplicationUser> GetCurrentUserAsync();
        Task<bool> ResetPasswordAsync(string email, string token, string newPassword);
        Task<bool> SendPasswordResetEmailAsync(string email);
        Task<bool> ConfirmEmailAsync(string userId, string token);

        Task<(bool exists, string userId)> CheckEmailExistsAsync(string email);
        Task<bool> ResetPasswordDirectAsync(string userId, string newPassword);
    }

}

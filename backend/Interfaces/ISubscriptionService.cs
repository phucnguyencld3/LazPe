using PolyBabyAPI.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PolyBabyAPI.Interfaces
{
    public interface ISubscriptionService
    {
        Task<SubscriptionDto> CreateSubscriptionAsync(string userId, CreateSubscriptionDto dto);
        Task<IEnumerable<SubscriptionDto>> GetUserSubscriptionsAsync(string userId);
        Task<SubscriptionDto> GetSubscriptionByIdAsync(string userId, int subscriptionId);
        Task<bool> PauseSubscriptionAsync(string userId, int subscriptionId);
        Task<bool> ResumeSubscriptionAsync(string userId, int subscriptionId);
        Task<bool> CancelSubscriptionAsync(string userId, int subscriptionId);
        Task ExecuteDueSubscriptionsAsync(); // Dành cho Cron Job
    }
}

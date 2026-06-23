using System.Collections.Generic;
using System.Threading.Tasks;
using PolyBabyAPI.DTOs.ProductAlert;

namespace PolyBabyAPI.Interfaces
{
    public interface IProductAlertService
    {
        Task<bool> SubscribeAlertAsync(string userId, CreateProductAlertDto dto);
        Task<bool> UnsubscribeAlertAsync(int alertId, string userId);
        Task<IEnumerable<ProductAlertDto>> GetUserAlertsAsync(string userId);
        
        // Dùng cho Hangfire / Background Jobs
        Task ProcessPriceDropAlertsAsync(int productId, int? variantId, decimal newPrice);
        Task ProcessBackInStockAlertsAsync(int productId, int? variantId);
    }
}

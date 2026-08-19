using System.Threading.Tasks;
using System;

namespace PolyBabyAPI.Services.Shipping
{
    public interface IShippingProvider
    {
        /// <summary>
        /// Tính phí ship giao hàng
        /// </summary>
        Task<decimal> CalculateFeeAsync(int toDistrictId, string toWardCode, int weight, int length, int width, int height);

        /// <summary>
        /// Lấy thời gian giao hàng dự kiến
        /// </summary>
        Task<DateTime?> GetExpectedDeliveryTimeAsync(int toDistrictId, string toWardCode);
    }
}

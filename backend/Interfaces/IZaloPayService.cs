using System.Threading.Tasks;

namespace PolyBabyAPI.Interfaces
{
    public interface IZaloPayService
    {
        Task<(bool Success, string PaymentUrl, string Message, string AppTransId)> CreatePaymentUrlAsync(
            string appTransId,
            decimal amount,
            string description,
            string? returnUrl = null,
            string appUser = "LazPeUser");

        bool ValidateCallback(string jsonStr, string mac);

        Task<(bool Success, int ReturnCode, string ReturnMessage, string ZaloPayTransId)> QueryOrderStatusAsync(string appTransId);
    }
}

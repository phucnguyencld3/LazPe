using Microsoft.AspNetCore.Http;

namespace PolyBabyAPI.Interfaces
{
    public interface IVnPayService
    {
        string CreatePaymentUrl(HttpContext context, int invoiceId, decimal amount, string orderInfo);

        string CreatePaymentUrl(HttpContext context, string txnRef, decimal amount, string orderInfo, string? returnUrl = null);

        bool ValidateReturn(IQueryCollection query, out string responseCode, out string txnRef, out string transactionNo);
    }
}
using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class VnPayService : IVnPayService
    {
        private readonly VnPayOptions _options;
        private readonly ILogger<VnPayService> _logger;

        public VnPayService(IOptions<VnPayOptions> options, ILogger<VnPayService> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public string CreatePaymentUrl(HttpContext context, int invoiceId, decimal amount, string orderInfo)
        {
            Console.WriteLine($"DEBUG CONFIG: TmnCode={_options.TmnCode}, HashSecret={_options.HashSecret}");
            return CreatePaymentUrl(context, invoiceId.ToString(CultureInfo.InvariantCulture), amount, orderInfo);
        }

        public string CreatePaymentUrl(HttpContext context, string txnRef, decimal amount, string orderInfo, string? returnUrl = null)
        {
            Console.WriteLine($"DEBUG CONFIG OVERLOAD: TmnCode={_options.TmnCode}, HashSecret={_options.HashSecret}");
            var vnTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vnTimeZone);

            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1" || ipAddress.Contains(":"))
            {
                ipAddress = "127.0.0.1";
            }

            var vnpay = new VnPayLibrary();
            vnpay.AddRequestData("vnp_Version", "2.1.0");
            vnpay.AddRequestData("vnp_Command", "pay");
            vnpay.AddRequestData("vnp_TmnCode", _options.TmnCode.Trim());
            vnpay.AddRequestData("vnp_Amount", ((long)(amount * 100)).ToString(CultureInfo.InvariantCulture));
            vnpay.AddRequestData("vnp_CreateDate", now.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture));
            vnpay.AddRequestData("vnp_CurrCode", "VND");
            vnpay.AddRequestData("vnp_IpAddr", ipAddress);
            vnpay.AddRequestData("vnp_Locale", "vn");
            vnpay.AddRequestData("vnp_OrderInfo", orderInfo);
            vnpay.AddRequestData("vnp_OrderType", "other");
            vnpay.AddRequestData("vnp_ReturnUrl", string.IsNullOrWhiteSpace(returnUrl) ? _options.ReturnUrl.Trim() : returnUrl.Trim());
            vnpay.AddRequestData("vnp_TxnRef", txnRef);
            vnpay.AddRequestData("vnp_ExpireDate", now.AddMinutes(15).ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture));

            string paymentUrl = vnpay.CreateRequestUrl(_options.BaseUrl, _options.HashSecret.Trim());
            
            return paymentUrl;
        }

        public bool ValidateReturn(IQueryCollection query, out string responseCode, out string txnRef, out string transactionNo)
        {
            var vnpay = new VnPayLibrary();
            foreach (var (key, value) in query)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    vnpay.AddResponseData(key, value.ToString());
                }
            }

            var vnp_SecureHash = query["vnp_SecureHash"].ToString();
            responseCode = vnpay.GetResponseData("vnp_ResponseCode");
            txnRef = vnpay.GetResponseData("vnp_TxnRef");
            transactionNo = vnpay.GetResponseData("vnp_TransactionNo");

            bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, _options.HashSecret.Trim());
            return checkSignature && responseCode == "00";
        }
    }
}
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

        public VnPayService(IOptions<VnPayOptions> options)
        {
            _options = options.Value;
        }

        public string CreatePaymentUrl(HttpContext context, int invoiceId, decimal amount, string orderInfo)
        {
            return CreatePaymentUrl(context, invoiceId.ToString(CultureInfo.InvariantCulture), amount, orderInfo);
        }

        public string CreatePaymentUrl(HttpContext context, string txnRef, decimal amount, string orderInfo, string? returnUrl = null)
        {
            var vnTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vnTimeZone);

            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1" || ipAddress.Contains(":"))
            {
                ipAddress = "127.0.0.1";
            }

            var vnpParams = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["vnp_Version"] = "2.1.0",
                ["vnp_Command"] = "pay",
                ["vnp_TmnCode"] = _options.TmnCode.Trim(),
                ["vnp_Amount"] = ((long)(amount * 100)).ToString(CultureInfo.InvariantCulture),
                ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture),
                ["vnp_CurrCode"] = "VND",
                ["vnp_IpAddr"] = ipAddress,
                ["vnp_Locale"] = "vn",
                ["vnp_OrderInfo"] = orderInfo,
                ["vnp_OrderType"] = "other",
                ["vnp_ReturnUrl"] = string.IsNullOrWhiteSpace(returnUrl) ? _options.ReturnUrl.Trim() : returnUrl.Trim(),
                ["vnp_TxnRef"] = txnRef,
                ["vnp_ExpireDate"] = now.AddMinutes(15).ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture)
            };

            var signData = string.Join("&", vnpParams.Select(x => $"{x.Key}={WebUtility.UrlEncode(x.Value)}"));
            var secureHash = ComputeHmacSha512(_options.HashSecret.Trim(), signData);

            return $"{_options.BaseUrl}?{signData}&vnp_SecureHashType=HMACSHA512&vnp_SecureHash={secureHash}";
        }

        public bool ValidateReturn(IQueryCollection query, out string responseCode, out string txnRef, out string transactionNo)
        {
            responseCode = query["vnp_ResponseCode"].ToString();
            txnRef = query["vnp_TxnRef"].ToString();
            transactionNo = query["vnp_TransactionNo"].ToString();

            var inputData = new SortedDictionary<string, string>(StringComparer.Ordinal);
            foreach (var key in query.Keys)
            {
                if (!key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) ||
                    key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var value = query[key].ToString();
                if (!string.IsNullOrWhiteSpace(value))
                {
                    inputData[key] = value;
                }
            }

            string signData = string.Join("&", inputData.Select(x => $"{x.Key}={WebUtility.UrlEncode(x.Value)}"));
            var signValue = ComputeHmacSha512(_options.HashSecret.Trim(), signData);
            var returnedHash = query["vnp_SecureHash"].ToString();

            var validSignature = string.Equals(signValue, returnedHash, StringComparison.OrdinalIgnoreCase);
            return validSignature && responseCode == "00";
        }

        private static string ComputeHmacSha512(string key, string data)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var dataBytes = Encoding.UTF8.GetBytes(data);

            using var hmac = new HMACSHA512(keyBytes);
            var hash = hmac.ComputeHash(dataBytes);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class ZaloPayService : IZaloPayService
    {
        private readonly ZaloPayOptions _options;
        private readonly ILogger<ZaloPayService> _logger;
        private readonly HttpClient _httpClient;

        public ZaloPayService(IOptions<ZaloPayOptions> options, ILogger<ZaloPayService> logger, HttpClient httpClient)
        {
            _options = options.Value;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<(bool Success, string PaymentUrl, string Message, string AppTransId)> CreatePaymentUrlAsync(
            string appTransId,
            decimal amount,
            string description,
            string? returnUrl = null,
            string appUser = "user_demo")
        {
            try
            {
                var jsonOptions = new JsonSerializerOptions
                {
                    Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                };

                string appIdStr = _options.AppId.Trim();
                string key1 = _options.Key1.Trim();
                int appId = int.Parse(appIdStr);
                long appTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                long amountLong = (long)amount;
                string redirectUrl = !string.IsNullOrWhiteSpace(returnUrl) ? returnUrl.Trim() : _options.ReturnUrl.Trim();

                var embedDataObj = new
                {
                    redirecturl = redirectUrl
                };
                string embedData = JsonSerializer.Serialize(embedDataObj, jsonOptions);
                string item = "[]";

                // 1. Nối chuỗi đúng thứ tự: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
                string rawData = $"{appIdStr}|{appTransId}|{appUser}|{amountLong}|{appTime}|{embedData}|{item}";
                
                // 2. Tính HMAC-SHA256
                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key1));
                var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData));
                string mac = Convert.ToHexString(hashBytes).ToLowerInvariant();

                _logger.LogInformation("ZaloPay RawData for MAC: {RawData}", rawData);
                _logger.LogInformation("ZaloPay Computed MAC: {Mac}", mac);

                // 3. Đưa vào payload đúng kiểu dữ liệu
                var payload = new Dictionary<string, object>
                {
                    { "app_id", appId },
                    { "app_user", appUser },
                    { "app_time", appTime },
                    { "amount", amountLong },
                    { "app_trans_id", appTransId },
                    { "embed_data", embedData },
                    { "item", item },
                    { "description", description },
                    { "bank_code", "" },
                    { "callback_url", _options.CallbackUrl.Trim() },
                    { "mac", mac }
                };

                var content = new StringContent(JsonSerializer.Serialize(payload, jsonOptions), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(_options.BaseUrl, content);
                string responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("ZaloPay Create Order Response: {Response}", responseContent);

                using var doc = JsonDocument.Parse(responseContent);
                var root = doc.RootElement;

                int returnCode = root.GetProperty("return_code").GetInt32();
                string returnMessage = root.GetProperty("return_message").GetString() ?? "";
                string subReturnMessage = root.TryGetProperty("sub_return_message", out var subMsgProp) ? subMsgProp.GetString() ?? "" : "";

                if (returnCode == 1)
                {
                    string orderUrl = root.GetProperty("order_url").GetString() ?? "";
                    return (true, orderUrl, returnMessage, appTransId);
                }
                else
                {
                    string fullErrMsg = !string.IsNullOrEmpty(subReturnMessage) ? $"{returnMessage} ({subReturnMessage})" : returnMessage;
                    _logger.LogError("ZaloPay Create Order Failed: {Code} - {Msg}", returnCode, fullErrMsg);
                    return (false, "", fullErrMsg, appTransId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating ZaloPay payment URL");
                return (false, "", ex.Message, appTransId);
            }
        }

        public bool ValidateCallback(string jsonStr, string mac)
        {
            try
            {
                string computedMac = ComputeHmacSha256(jsonStr, _options.Key2);
                return string.Equals(computedMac, mac, StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating ZaloPay callback MAC");
                return false;
            }
        }

        public async Task<(bool Success, int ReturnCode, string ReturnMessage, string ZaloPayTransId)> QueryOrderStatusAsync(string appTransId)
        {
            try
            {
                int appId = int.Parse(_options.AppId);
                long timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                // Raw data for query MAC: app_id|app_trans_id|key1
                string rawData = $"{appId}|{appTransId}|{_options.Key1}";
                string mac = ComputeHmacSha256(rawData, _options.Key1);

                var paramDict = new Dictionary<string, string>
                {
                    { "app_id", _options.AppId },
                    { "app_trans_id", appTransId },
                    { "timestamp", timestamp.ToString() },
                    { "mac", mac }
                };

                var content = new FormUrlEncodedContent(paramDict);
                string queryUrl = string.IsNullOrWhiteSpace(_options.QueryUrl)
                    ? "https://sb-openapi.zalopay.vn/v2/query"
                    : _options.QueryUrl;

                var response = await _httpClient.PostAsync(queryUrl, content);
                string responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("ZaloPay Query Status Response: {Response}", responseContent);

                using var doc = JsonDocument.Parse(responseContent);
                var root = doc.RootElement;

                int returnCode = root.GetProperty("return_code").GetInt32();
                string returnMessage = root.GetProperty("return_message").GetString() ?? "";
                string zpTransId = "";
                if (root.TryGetProperty("zp_trans_id", out var zpProp))
                {
                    zpTransId = zpProp.ToString();
                }

                return (returnCode == 1, returnCode, returnMessage, zpTransId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error querying ZaloPay order status");
                return (false, -1, ex.Message, "");
            }
        }

        private static string ComputeHmacSha256(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hash).Replace("-", "").ToLowerHex();
        }
    }

    public static class StringExtensions
    {
        public static string ToLowerHex(this string value) => value.ToLowerInvariant();
    }
}

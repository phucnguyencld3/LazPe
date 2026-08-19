using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using System.Collections.Generic;
using System.Linq;

namespace PolyBabyAPI.Services.Shipping
{
    public class GHNShippingService : IShippingProvider
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<GHNShippingService> _logger;
        private readonly IMemoryCache _cache;
        private readonly string _token;
        private readonly string _shopId;
        private readonly string _apiUrl;

        public GHNShippingService(HttpClient http, IConfiguration config, ILogger<GHNShippingService> logger, IMemoryCache cache)
        {
            _http = http;
            _config = config;
            _logger = logger;
            _cache = cache;
            _token = config["Ghn:Token"] ?? throw new ArgumentNullException("GHN Token is missing");
            _shopId = config["Ghn:ShopId"] ?? throw new ArgumentNullException("GHN ShopId is missing");
            _apiUrl = config["Ghn:ApiUrl"] ?? "https://dev-online-gateway.ghn.vn/shiip/public-api/";
        }

        private void SetHeaders()
        {
            if (!_http.DefaultRequestHeaders.Contains("token"))
                _http.DefaultRequestHeaders.Add("token", _token);
            if (!_http.DefaultRequestHeaders.Contains("ShopId"))
                _http.DefaultRequestHeaders.Add("ShopId", _shopId);
        }

        public async Task<decimal> CalculateFeeAsync(int toDistrictId, string toWardCode, int weight, int length, int width, int height)
        {
            try
            {
                SetHeaders();
                var requestBody = new
                {
                    service_type_id = 2, // Standard delivery
                    to_district_id = toDistrictId,
                    to_ward_code = toWardCode,
                    weight = weight,
                    length = length,
                    width = width,
                    height = height
                };

                var response = await _http.PostAsJsonAsync($"{_apiUrl}v2/shipping-order/fee", requestBody);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    _logger.LogError("GHN CalculateFeeAsync failed: {err}", err);
                    return 0; // Return 0 or fallback fee
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("data", out var data) && data.TryGetProperty("total", out var total))
                {
                    return total.GetDecimal();
                }

                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in CalculateFeeAsync");
                return 0;
            }
        }

        public async Task<DateTime?> GetExpectedDeliveryTimeAsync(int toDistrictId, string toWardCode)
        {
            try
            {
                SetHeaders();
                var requestBody = new
                {
                    service_id = 53320, // Typical standard service ID, might need dynamic fetch
                    to_district_id = toDistrictId,
                    to_ward_code = toWardCode
                };

                var response = await _http.PostAsJsonAsync($"{_apiUrl}v2/shipping-order/leadtime", requestBody);
                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("data", out var data) && data.TryGetProperty("leadtime", out var leadtime))
                {
                    var timestamp = leadtime.GetInt64();
                    return DateTimeOffset.FromUnixTimeSeconds(timestamp).DateTime;
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in GetExpectedDeliveryTimeAsync");
                return null;
            }
        }
        
        /// <summary>
        /// Maps system address strings (ProvinceName, DistrictName, WardName) to GHN District ID and Ward Code.
        /// Useful for V2 addresses where District is skipped.
        /// </summary>
        public async Task<(int districtId, string wardCode)?> MapAddressToGHNAsync(string provinceName, string districtName, string wardName)
        {
            try
            {
                SetHeaders();
                // 1. Get Provinces
                var provRes = await _http.GetAsync($"{_apiUrl}master-data/province");
                if (!provRes.IsSuccessStatusCode) return null;
                
                var provJson = await provRes.Content.ReadAsStringAsync();
                using var provDoc = JsonDocument.Parse(provJson);
                int? ghnProvinceId = null;
                
                // Extremely simple fuzzy match
                string cleanProv = provinceName.Replace("Tỉnh ", "").Replace("Thành phố ", "").Replace("TP ", "").Trim().ToLower();
                foreach (var p in provDoc.RootElement.GetProperty("data").EnumerateArray())
                {
                    string pName = p.GetProperty("ProvinceName").GetString().ToLower();
                    if (pName.Contains(cleanProv) || cleanProv.Contains(pName))
                    {
                        ghnProvinceId = p.GetProperty("ProvinceID").GetInt32();
                        break;
                    }
                }

                if (ghnProvinceId == null) return null;

                // 2. Get Districts
                var distRes = await _http.GetAsync($"{_apiUrl}master-data/district?province_id={ghnProvinceId}");
                if (!distRes.IsSuccessStatusCode) return null;

                var distJson = await distRes.Content.ReadAsStringAsync();
                using var distDoc = JsonDocument.Parse(distJson);
                int? ghnDistrictId = null;
                
                string cleanDist = (districtName ?? wardName).Replace("Quận ", "").Replace("Huyện ", "").Replace("Thị xã ", "").Replace("Thành phố ", "").Trim().ToLower();
                
                foreach (var d in distDoc.RootElement.GetProperty("data").EnumerateArray())
                {
                    string dName = d.GetProperty("DistrictName").GetString().ToLower();
                    if (dName.Contains(cleanDist) || cleanDist.Contains(dName))
                    {
                        ghnDistrictId = d.GetProperty("DistrictID").GetInt32();
                        break;
                    }
                }
                
                if (ghnDistrictId == null) return null;

                // If V2, we might not have a distinct ward name, or wardName is the district name
                if (string.IsNullOrEmpty(wardName) || wardName == districtName) 
                {
                    // Return just the district and null ward code (some APIs allow empty ward code)
                    return (ghnDistrictId.Value, "");
                }

                // 3. Get Wards
                var wardRes = await _http.GetAsync($"{_apiUrl}master-data/ward?district_id={ghnDistrictId}");
                if (!wardRes.IsSuccessStatusCode) return (ghnDistrictId.Value, "");

                var wardJson = await wardRes.Content.ReadAsStringAsync();
                using var wardDoc = JsonDocument.Parse(wardJson);
                string ghnWardCode = "";

                string cleanWard = wardName.Replace("Phường ", "").Replace("Xã ", "").Replace("Thị trấn ", "").Trim().ToLower();
                foreach (var w in wardDoc.RootElement.GetProperty("data").EnumerateArray())
                {
                    string wName = w.GetProperty("WardName").GetString().ToLower();
                    if (wName.Contains(cleanWard) || cleanWard.Contains(wName))
                    {
                        ghnWardCode = w.GetProperty("WardCode").GetString();
                        break;
                    }
                }

                return (ghnDistrictId.Value, ghnWardCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error mapping address to GHN");
                return null;
            }
        }
    }
}

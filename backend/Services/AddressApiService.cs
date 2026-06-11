using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using System.Net.Http.Json;
using System.Text.Json;

namespace PolyBabyAPI.Services
{
    public class AddressApiService
    {
        private readonly HttpClient _http;
        private readonly IMemoryCache _cache;
        private readonly string _token;
        private readonly string _apiUrl;

        public AddressApiService(HttpClient http, IConfiguration config, IMemoryCache cache)
        {
            _http = http;
            _cache = cache;
            _token = config["Ghn:Token"] ?? "";
            _apiUrl = config["Ghn:ApiUrl"] ?? "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/";
        }

        public async Task<JsonElement> GetProvincesAsync(string version = "v2")
        {
            string cacheKey = $"Provinces_{version}";
            if (_cache.TryGetValue(cacheKey, out JsonElement cachedResult))
            {
                return cachedResult;
            }

            string url = version == "v1" ? "https://provinces.open-api.vn/api/p/" : "https://provinces.open-api.vn/api/v2/p/";
            var res = await _http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            
            var resultList = new List<object>();

            foreach (var item in doc.RootElement.EnumerateArray())
            {
                resultList.Add(new
                {
                    code = item.GetProperty("code").GetInt32().ToString(),
                    name = item.GetProperty("name").GetString()
                });
            }

            var finalResult = JsonSerializer.SerializeToElement(resultList);
            
            // Cache for 24 hours
            _cache.Set(cacheKey, finalResult, TimeSpan.FromHours(24));

            return finalResult;
        }

        public async Task<JsonElement> GetDistrictByProvinceAsync(int provinceCode, string version = "v2")
        {
            string cacheKey = $"Districts_{provinceCode}_{version}";
            if (_cache.TryGetValue(cacheKey, out JsonElement cachedResult))
            {
                return cachedResult;
            }

            string url = version == "v1" ? $"https://provinces.open-api.vn/api/p/{provinceCode}?depth=2" : $"https://provinces.open-api.vn/api/v2/p/{provinceCode}?depth=2";
            var res = await _http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            
            string propertyName = version == "v1" ? "districts" : "wards";
            if (!doc.RootElement.TryGetProperty(propertyName, out var districts))
            {
                var emptyResult = JsonSerializer.SerializeToElement(new { districts = new List<object>() });
                _cache.Set(cacheKey, emptyResult, TimeSpan.FromHours(24));
                return emptyResult;
            }
            
            var districtsList = new List<object>();

            foreach (var item in districts.EnumerateArray())
            {
                districtsList.Add(new
                {
                    code = item.GetProperty("code").GetInt32().ToString(),
                    name = item.GetProperty("name").GetString()
                });
            }

            var finalResult = JsonSerializer.SerializeToElement(new { districts = districtsList });
            _cache.Set(cacheKey, finalResult, TimeSpan.FromHours(24));

            return finalResult;
        }

        public async Task<JsonElement> GetWardByDistrictAsync(int districtCode, string version = "v2")
        {
            if (version == "v2")
            {
                // In V2, the District dropdown already contains Wards.
                // We return a dummy "ward" that mirrors the selected "district" to satisfy the 3-level UI logic.
                var dummyWardsList = new List<object>
                {
                    new { code = districtCode.ToString(), name = "-" }
                };
                return JsonSerializer.SerializeToElement(new { wards = dummyWardsList });
            }

            string cacheKey = $"Wards_{districtCode}_{version}";
            if (_cache.TryGetValue(cacheKey, out JsonElement cachedResult))
            {
                return cachedResult;
            }

            string url = $"https://provinces.open-api.vn/api/d/{districtCode}?depth=2";
            var res = await _http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            
            if (!doc.RootElement.TryGetProperty("wards", out var wards))
            {
                var emptyResult = JsonSerializer.SerializeToElement(new { wards = new List<object>() });
                _cache.Set(cacheKey, emptyResult, TimeSpan.FromHours(24));
                return emptyResult;
            }

            var wardsList = new List<object>();

            foreach (var item in wards.EnumerateArray())
            {
                wardsList.Add(new
                {
                    code = item.GetProperty("code").GetInt32().ToString(),
                    name = item.GetProperty("name").GetString()
                });
            }

            var finalResult = JsonSerializer.SerializeToElement(new { wards = wardsList });
            _cache.Set(cacheKey, finalResult, TimeSpan.FromHours(24));

            return finalResult;
        }

        public async Task<JsonElement> GetWardsByProvinceAsync(int provinceCode, string version = "v2")
        {
            string cacheKey = $"WardsByProvince_{provinceCode}_{version}";
            if (_cache.TryGetValue(cacheKey, out JsonElement cachedResult))
            {
                return cachedResult;
            }

            string url = version == "v1" ? $"https://provinces.open-api.vn/api/p/{provinceCode}?depth=2" : $"https://provinces.open-api.vn/api/v2/p/{provinceCode}?depth=2";
            var res = await _http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            
            var wards = doc.RootElement.GetProperty("wards");
            var wardsList = new List<object>();

            foreach (var item in wards.EnumerateArray())
            {
                wardsList.Add(new
                {
                    code = item.GetProperty("code").GetInt32().ToString(),
                    name = item.GetProperty("name").GetString()
                });
            }

            var finalResult = JsonSerializer.SerializeToElement(new { wards = wardsList });
            _cache.Set(cacheKey, finalResult, TimeSpan.FromHours(24));

            return finalResult;
        }
    }
}

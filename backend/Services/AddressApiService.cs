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

        private async Task<JsonElement> GetAllV1DataAsync()
        {
            string cacheKey = "AllV1Data";
            if (_cache.TryGetValue(cacheKey, out JsonElement cachedResult))
            {
                return cachedResult;
            }

            string url = "https://provinces.open-api.vn/api/?depth=3";
            var res = await _http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var result = doc.RootElement.Clone();
            
            _cache.Set(cacheKey, result, TimeSpan.FromHours(24));
            return result;
        }

        public async Task<JsonElement> GetProvincesAsync(string version = "v2")
        {
            string cacheKey = $"Provinces_{version}";
            if (_cache.TryGetValue(cacheKey, out JsonElement cachedResult))
            {
                return cachedResult;
            }

            var resultList = new List<object>();

            if (version == "v1")
            {
                var allData = await GetAllV1DataAsync();
                foreach (var item in allData.EnumerateArray())
                {
                    resultList.Add(new
                    {
                        code = item.GetProperty("code").GetInt32().ToString(),
                        name = item.GetProperty("name").GetString()
                    });
                }
            }
            else
            {
                string url = "https://provinces.open-api.vn/api/v2/p/";
                var res = await _http.GetAsync(url);
                res.EnsureSuccessStatusCode();

                var json = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                
                foreach (var item in doc.RootElement.EnumerateArray())
                {
                    resultList.Add(new
                    {
                        code = item.GetProperty("code").GetInt32().ToString(),
                        name = item.GetProperty("name").GetString()
                    });
                }
            }

            var finalResult = JsonSerializer.SerializeToElement(resultList);
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

            JsonElement districtsArray;

            if (version == "v1")
            {
                var allData = await GetAllV1DataAsync();
                var province = allData.EnumerateArray().FirstOrDefault(p => p.GetProperty("code").GetInt32() == provinceCode);
                if (province.ValueKind == JsonValueKind.Undefined || !province.TryGetProperty("districts", out districtsArray))
                {
                    var emptyResult = JsonSerializer.SerializeToElement(new { districts = new List<object>() });
                    _cache.Set(cacheKey, emptyResult, TimeSpan.FromHours(24));
                    return emptyResult;
                }
            }
            else
            {
                string url = $"https://provinces.open-api.vn/api/v2/p/{provinceCode}?depth=2";
                var res = await _http.GetAsync(url);
                res.EnsureSuccessStatusCode();

                var json = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                
                if (!doc.RootElement.TryGetProperty("wards", out districtsArray))
                {
                    var emptyResult = JsonSerializer.SerializeToElement(new { districts = new List<object>() });
                    _cache.Set(cacheKey, emptyResult, TimeSpan.FromHours(24));
                    return emptyResult;
                }
            }
            
            var districtsList = new List<object>();

            foreach (var item in districtsArray.EnumerateArray())
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

            var allData = await GetAllV1DataAsync();
            JsonElement wardsArray = default;
            bool found = false;

            foreach (var province in allData.EnumerateArray())
            {
                if (province.TryGetProperty("districts", out var districts))
                {
                    var district = districts.EnumerateArray().FirstOrDefault(d => d.GetProperty("code").GetInt32() == districtCode);
                    if (district.ValueKind != JsonValueKind.Undefined)
                    {
                        if (district.TryGetProperty("wards", out wardsArray))
                        {
                            found = true;
                        }
                        break;
                    }
                }
            }

            if (!found)
            {
                var emptyResult = JsonSerializer.SerializeToElement(new { wards = new List<object>() });
                _cache.Set(cacheKey, emptyResult, TimeSpan.FromHours(24));
                return emptyResult;
            }

            var wardsList = new List<object>();

            foreach (var item in wardsArray.EnumerateArray())
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

            var wardsList = new List<object>();

            if (version == "v1")
            {
                // In V1, Wards belong to Districts, not directly to Provinces.
                // Just return empty or all wards in the province. Returning empty to match structure.
                var emptyResult = JsonSerializer.SerializeToElement(new { wards = new List<object>() });
                _cache.Set(cacheKey, emptyResult, TimeSpan.FromHours(24));
                return emptyResult;
            }
            else
            {
                string url = $"https://provinces.open-api.vn/api/v2/p/{provinceCode}?depth=2";
                var res = await _http.GetAsync(url);
                res.EnsureSuccessStatusCode();

                var json = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                
                if (doc.RootElement.TryGetProperty("wards", out var wards))
                {
                    foreach (var item in wards.EnumerateArray())
                    {
                        wardsList.Add(new
                        {
                            code = item.GetProperty("code").GetInt32().ToString(),
                            name = item.GetProperty("name").GetString()
                        });
                    }
                }
            }

            var finalResult = JsonSerializer.SerializeToElement(new { wards = wardsList });
            _cache.Set(cacheKey, finalResult, TimeSpan.FromHours(24));

            return finalResult;
        }
    }
}

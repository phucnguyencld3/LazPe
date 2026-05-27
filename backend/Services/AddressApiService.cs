using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text.Json;

namespace PolyBabyAPI.Services
{
    public class AddressApiService
    {
        private readonly HttpClient _http;
        private readonly string _token;
        private readonly string _apiUrl;

        public AddressApiService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _token = config["Ghn:Token"] ?? "";
            _apiUrl = config["Ghn:ApiUrl"] ?? "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/";
        }

        public async Task<JsonElement> GetProvincesAsync(string version = "v2")
        {
            string url = version == "v1" ? "https://provinces.open-api.vn/api/p/" : "https://provinces.open-api.vn/api/v2/p/";
            var res = await _http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            
            var resultList = new List<object>();

            foreach (var item in doc.RootElement.EnumerateArray())
            {
                resultList.Add(new
                {
                    code = item.GetProperty("code").GetInt32().ToString(),
                    name = item.GetProperty("name").GetString()
                });
            }

            return JsonSerializer.SerializeToElement(resultList);
        }

        public async Task<JsonElement> GetDistrictByProvinceAsync(int provinceCode, string version = "v2")
        {
            string url = version == "v1" ? $"https://provinces.open-api.vn/api/p/{provinceCode}?depth=2" : $"https://provinces.open-api.vn/api/v2/p/{provinceCode}?depth=2";
            var res = await _http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            
            string propertyName = version == "v1" ? "districts" : "wards";
            if (!doc.RootElement.TryGetProperty(propertyName, out var districts))
            {
                return JsonSerializer.SerializeToElement(new { districts = new List<object>() });
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

            return JsonSerializer.SerializeToElement(new { districts = districtsList });
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

            string url = $"https://provinces.open-api.vn/api/d/{districtCode}?depth=2";
            var res = await _http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            
            if (!doc.RootElement.TryGetProperty("wards", out var wards))
            {
                return JsonSerializer.SerializeToElement(new { wards = new List<object>() });
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

            return JsonSerializer.SerializeToElement(new { wards = wardsList });
        }

        public async Task<JsonElement> GetWardsByProvinceAsync(int provinceCode, string version = "v2")
        {
            string url = version == "v1" ? $"https://provinces.open-api.vn/api/p/{provinceCode}?depth=2" : $"https://provinces.open-api.vn/api/v2/p/{provinceCode}?depth=2";
            var res = await _http.GetAsync(url);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            
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

            return JsonSerializer.SerializeToElement(new { wards = wardsList });
        }
    }
}

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

        public async Task<JsonElement> GetProvincesAsync()
        {
            var res = await _http.GetAsync("https://provinces.open-api.vn/api/v2/p/");
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

        public async Task<JsonElement> GetDistrictByProvinceAsync(int provinceCode)
        {
            var res = await _http.GetAsync($"https://provinces.open-api.vn/api/v2/p/{provinceCode}");
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            var provinceName = doc.RootElement.GetProperty("name").GetString() ?? "Thành phố/Tỉnh";

            var districtsList = new List<object>
            {
                new
                {
                    code = provinceCode.ToString(),
                    name = provinceName
                }
            };

            return JsonSerializer.SerializeToElement(new { districts = districtsList });
        }

        public async Task<JsonElement> GetWardByDistrictAsync(int districtCode)
        {
            var res = await _http.GetAsync($"https://provinces.open-api.vn/api/v2/p/{districtCode}?depth=2");
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

        public async Task<JsonElement> GetWardsByProvinceAsync(int provinceCode)
        {
            var res = await _http.GetAsync($"https://provinces.open-api.vn/api/v2/p/{provinceCode}?depth=2");
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

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
            var request = new HttpRequestMessage(HttpMethod.Get, $"{_apiUrl}province");
            request.Headers.Add("Token", _token);

            var res = await _http.SendAsync(request);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            
            // Map từ format của GHN sang format tương thích với frontend mong đợi
            // Frontend cũ mong đợi mảng các tỉnh có: code (string), name (string)
            // GHN trả về: ProvinceID (int), ProvinceName (string)
            var ghnProvinces = doc.RootElement.GetProperty("data");
            var resultList = new List<object>();

            foreach (var item in ghnProvinces.EnumerateArray())
            {
                resultList.Add(new
                {
                    code = item.GetProperty("ProvinceID").GetInt32().ToString(),
                    name = item.GetProperty("ProvinceName").GetString()
                });
            }

            return JsonSerializer.SerializeToElement(resultList);
        }

        public async Task<JsonElement> GetDistrictByProvinceAsync(int provinceCode)
        {
            // GHN District lấy theo POST body: { "province_id": provinceCode }
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_apiUrl}district");
            request.Headers.Add("Token", _token);
            request.Content = JsonContent.Create(new { province_id = provinceCode });

            var res = await _http.SendAsync(request);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            
            // Map từ format của GHN sang format tương thích với frontend mong đợi
            // Frontend mong đợi: { districts: [ { code: string, name: string } ] }
            var ghnDistricts = doc.RootElement.GetProperty("data");
            var districtsList = new List<object>();

            foreach (var item in ghnDistricts.EnumerateArray())
            {
                districtsList.Add(new
                {
                    code = item.GetProperty("DistrictID").GetInt32().ToString(),
                    name = item.GetProperty("DistrictName").GetString()
                });
            }

            return JsonSerializer.SerializeToElement(new { districts = districtsList });
        }

        public async Task<JsonElement> GetWardByDistrictAsync(int districtCode)
        {
            // GHN Ward lấy theo POST body: { "district_id": districtCode }
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_apiUrl}ward");
            request.Headers.Add("Token", _token);
            request.Content = JsonContent.Create(new { district_id = districtCode });

            var res = await _http.SendAsync(request);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            
            // Map từ format của GHN sang format tương thích với frontend mong đợi
            // Frontend mong đợi: { wards: [ { code: string, name: string } ] }
            var ghnWards = doc.RootElement.GetProperty("data");
            var wardsList = new List<object>();

            foreach (var item in ghnWards.EnumerateArray())
            {
                wardsList.Add(new
                {
                    code = item.GetProperty("WardCode").GetString(),
                    name = item.GetProperty("WardName").GetString()
                });
            }

            return JsonSerializer.SerializeToElement(new { wards = wardsList });
        }
    }
}

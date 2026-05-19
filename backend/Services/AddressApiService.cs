using System.Text.Json;

namespace PolyBabyAPI.Services
{
    public class AddressApiService
    {
        private readonly HttpClient _http;

        public AddressApiService(HttpClient http)
        {
            _http = http;
        }

        public async Task<JsonElement> GetProvincesAsync()
        {
            var res = await _http.GetAsync("https://provinces.open-api.vn/api/p/");
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            return JsonDocument.Parse(json).RootElement;
        }

        public async Task<JsonElement> GetDistrictByProvinceAsync(int provinceCode)
        {
            var res = await _http.GetAsync(
                $"https://provinces.open-api.vn/api/p/{provinceCode}?depth=2"
            );
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            return JsonDocument.Parse(json).RootElement;
        }

        public async Task<JsonElement> GetWardByDistrictAsync(int districtCode)
        {
            var res = await _http.GetAsync(
                $"https://provinces.open-api.vn/api/d/{districtCode}?depth=2"
            );
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            return JsonDocument.Parse(json).RootElement;
        }
    }
}

using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

class Program {
    static async Task Main() {
        var http = new HttpClient();
        http.DefaultRequestHeaders.Add("token", "e33ae7cf-9bc2-11f1-a047-ce1da9aa64a0");
        
        string provinceName = "Hà N?i";
        string inputName = "Ng?c Hà"; // This is a Ward in GHN, but user provides it as District in V2
        string cleanProv = provinceName.Replace("T?nh ", "").Replace("Thành ph? ", "").Replace("TP. ", "").Replace("TP ", "").Trim().ToLower();

        var provRes = await http.GetAsync("https://online-gateway.ghn.vn/shiip/public-api/master-data/province");
        using var provDoc = JsonDocument.Parse(await provRes.Content.ReadAsStringAsync());
        int ghnProvId = provDoc.RootElement.GetProperty("data").EnumerateArray()
            .First(p => p.GetProperty("ProvinceName").GetString().ToLower().Contains(cleanProv)).GetProperty("ProvinceID").GetInt32();

        var distRes = await http.GetAsync($"https://online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id={ghnProvId}");
        using var distDoc = JsonDocument.Parse(await distRes.Content.ReadAsStringAsync());
        var districts = distDoc.RootElement.GetProperty("data").EnumerateArray().ToList();

        string cleanInput = inputName.Replace("Qu?n ", "").Replace("Huy?n ", "").Replace("Th? x? ", "").Replace("Thành ph? ", "").Replace("Phý?ng ", "").Trim().ToLower();
        
        // 1. Try match District
        var matchedDist = districts.FirstOrDefault(d => d.GetProperty("DistrictName").GetString().ToLower().Contains(cleanInput));
        if (matchedDist.ValueKind != JsonValueKind.Undefined) {
            Console.WriteLine($"Found as District: {matchedDist.GetProperty("DistrictID")}");
            return;
        }

        // 2. Try match Ward by querying ALL districts in parallel
        Console.WriteLine($"Not found as District, searching Wards in {districts.Count} districts...");
        var tasks = districts.Select(async d => {
            int dId = d.GetProperty("DistrictID").GetInt32();
            var wRes = await http.GetAsync($"https://online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id={dId}");
            if (!wRes.IsSuccessStatusCode) return (JsonElement?)null;
            var wDoc = JsonDocument.Parse(await wRes.Content.ReadAsStringAsync());
            var matchedW = wDoc.RootElement.GetProperty("data").EnumerateArray().FirstOrDefault(w => w.GetProperty("WardName").GetString().ToLower().Contains(cleanInput));
            if (matchedW.ValueKind != JsonValueKind.Undefined) return matchedW;
            return (JsonElement?)null;
        });

        var results = await Task.WhenAll(tasks);
        var foundWard = results.FirstOrDefault(r => r != null);
        if (foundWard != null) {
            Console.WriteLine($"Found as Ward: {foundWard.Value.GetProperty("WardCode")} in District {foundWard.Value.GetProperty("DistrictID")}");
        } else {
            Console.WriteLine("Not found anywhere!");
        }
    }
}

namespace PolyBabyAPI.Models
{
    public class VnPayOptions
    {
        public const string SectionName = "VnPay";

        public string TmnCode { get; set; } = string.Empty;
        public string HashSecret { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
        public string FrontendBaseUrl { get; set; } = string.Empty;
    }
}
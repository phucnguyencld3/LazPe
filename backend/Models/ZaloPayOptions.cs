namespace PolyBabyAPI.Models
{
    public class ZaloPayOptions
    {
        public const string SectionName = "ZaloPay";

        public string AppId { get; set; } = string.Empty;
        public string Key1 { get; set; } = string.Empty;
        public string Key2 { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public string QueryUrl { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
        public string CallbackUrl { get; set; } = string.Empty;
        public string FrontendBaseUrl { get; set; } = string.Empty;
    }
}

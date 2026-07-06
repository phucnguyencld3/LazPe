using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services.Models
{
    public class UpsellCandidate
    {
        public Variant Variant { get; set; }
        
        // Điểm số ưu tiên cho gợi ý
        public int Score { get; set; } = 0;
        
        public UpsellCandidate(Variant variant)
        {
            Variant = variant;
        }
    }
}

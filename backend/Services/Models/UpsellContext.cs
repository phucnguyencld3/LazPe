using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services.Models
{
    public class UpsellContext
    {
        public Cart Cart { get; set; }
        public List<CartDetail> CartDetails { get; set; } = new List<CartDetail>();
        
        // Cache lại các ID để các hàm tính toán sau không cần truy vấn lại
        public HashSet<int> ExistingVariantIds { get; set; } = new HashSet<int>();
        public HashSet<int> CategoryIds { get; set; } = new HashSet<int>();
        public HashSet<int> SupplierIds { get; set; } = new HashSet<int>();
        
        public decimal TotalAmount { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection.Metadata;

namespace PolyBabyAPI.Models
{
    public class CartDetail
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CartDetailID { get; set; }

        public int CartID { get; set; }
        public int? VariantID { get; set; }
        public int? BundleID { get; set; }
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        [Display(Name = "Số lượng")]
        public int Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Đơn giá")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tổng tiền")]
        public decimal TotalPrice { get; set; }


        // Navigation
        public virtual Cart Cart { get; set; } 
        public virtual Variant? Variant { get; set; } 
        public virtual Bundle? Bundle { get; set; }
    }
}

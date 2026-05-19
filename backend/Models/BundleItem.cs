using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class BundleItem
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int BundleItemID { get; set; }

        [Required(ErrorMessage = "Mã combo không được để trống")]
        public int BundleID { get; set; }

        [ForeignKey(nameof(BundleID))]
        [ValidateNever]
        public Bundle Bundle { get; set; }

        [Required(ErrorMessage = "Mã biến thể không được để trống")]
        public int VariantID { get; set; }

        [ForeignKey(nameof(VariantID))]
        [ValidateNever]
        public Variant Variant { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        [Display(Name = "Số lượng")]
        public int Quantity { get; set; } = 1;

        public int SortOrder { get; set; }
    }
}

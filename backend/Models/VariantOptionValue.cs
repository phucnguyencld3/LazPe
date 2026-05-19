using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public class VariantOptionValue
    {
        // ✅ Thêm primary key
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int VariantOptionValueID { get; set; }

        public int VariantID { get; set; }
        public int ProductOptionValueID { get; set; }

        [ValidateNever]
        [ForeignKey(nameof(VariantID))]
        public Variant Variant { get; set; }

        [ValidateNever]
        [ForeignKey(nameof(ProductOptionValueID))]
        public ProductOptionValue ProductOptionValue { get; set; }
    }
}

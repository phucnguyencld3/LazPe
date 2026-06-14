using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class ProductImage
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProductImageID { get; set; }

        public int ProductID { get; set; }

        [Required]
        public string ImageUrl { get; set; }

        public int DisplayOrder { get; set; } = 0;

        // Navigation property
        [ForeignKey(nameof(ProductID))]
        public virtual Product Product { get; set; }
    }
}

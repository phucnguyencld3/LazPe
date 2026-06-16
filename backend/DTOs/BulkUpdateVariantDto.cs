using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class BulkUpdateVariantDto
    {
        [Required]
        public int VariantId { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Giá không hợp lệ")]
        public decimal UnitPrice { get; set; }

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho không hợp lệ")]
        public int Stock { get; set; }
    }
}

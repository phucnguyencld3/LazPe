using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class Ward
    {
        [Key]
        public int WardID { get; set; }

        [Required(ErrorMessage = "Tên phường/xã là bắt buộc")]
        [StringLength(100)]
        [Display(Name = "Tên phường/xã")]
        public string Name { get; set; }

        [Required]
        [StringLength(20)]
        public string Code { get; set; }

        public int DistrictID { get; set; }

        public bool IsActive { get; set; } = true;

        [StringLength(20)]
        public string? ReplacedByCode { get; set; }

        public string? Note { get; set; }

        [Required]
        [StringLength(10)]
        public string ApiVersion { get; set; } = "v1";

        // Navigation
        [ForeignKey(nameof(DistrictID))]
        public virtual District District { get; set; }
    }
}

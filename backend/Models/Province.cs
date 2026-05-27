using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.Models
{
    public class Province
    {
        [Key]
        public int ProvinceID { get; set; }

        [Required(ErrorMessage = "Tên tỉnh/thành phố là bắt buộc")]
        [StringLength(100)]
        [Display(Name = "Tên tỉnh/thành phố")]
        public string Name { get; set; }

        [Required]
        [StringLength(20)]
        public string Code { get; set; }

        public bool IsActive { get; set; } = true;

        [StringLength(20)]
        public string? ReplacedByCode { get; set; }

        public string? Note { get; set; }

        [Required]
        [StringLength(10)]
        public string ApiVersion { get; set; } = "v1";

        // Navigation
        public virtual ICollection<District> Districts { get; set; } = new List<District>();
        public virtual ICollection<UserAddress> UserAddresses { get; set; } = new List<UserAddress>();
    }
}

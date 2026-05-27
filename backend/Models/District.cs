using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class District
    {
        [Key]
        public int DistrictID { get; set; }

        [Required(ErrorMessage = "Tên quận/huyện là bắt buộc")]
        [StringLength(100)]
        [Display(Name = "Tên quận/huyện")]
        public string Name { get; set; }

        [Required]
        [StringLength(20)]
        public string Code { get; set; }

        public int ProvinceID { get; set; }

        public bool IsActive { get; set; } = true;

        [StringLength(20)]
        public string? ReplacedByCode { get; set; }

        public string? Note { get; set; }

        [Required]
        [StringLength(10)]
        public string ApiVersion { get; set; } = "v1";

        // Navigation
        [ForeignKey(nameof(ProvinceID))]
        public virtual Province Province { get; set; }

        public virtual ICollection<Ward> Wards { get; set; } = new List<Ward>();
        public virtual ICollection<UserAddress> UserAddresses { get; set; } = new List<UserAddress>();
    }
}

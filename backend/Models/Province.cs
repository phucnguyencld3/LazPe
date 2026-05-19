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

        // Navigation
        public virtual ICollection<Ward> Wards { get; set; }
        public virtual ICollection<UserAddress> UserAddresses { get; set; }
    }
}

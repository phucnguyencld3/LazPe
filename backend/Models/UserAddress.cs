using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class UserAddress
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AddressID { get; set; }

        public string UserID { get; set; }
        public int ProvinceID { get; set; }
        public int? DistrictID { get; set; }
        public int WardID { get; set; }

        [Required(ErrorMessage = "Tên người nhận là bắt buộc")]
        [StringLength(100)]
        [Display(Name = "Tên người nhận")]
        public string RecipientName { get; set; } = "";

        // sđt nhận hàng
        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [StringLength(15)]
        [Display(Name = "Số điện thoại nhận hàng")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Địa chỉ chi tiết là bắt buộc")]
        [StringLength(500)]
        [Display(Name = "Địa chỉ chi tiết")]
        public string StreetAddress { get; set; }

        [Display(Name = "Địa chỉ mặc định")]
        public bool IsDefault { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation
        [ForeignKey(nameof(UserID))]
        public virtual ApplicationUser User { get; set; }

        [ForeignKey(nameof(ProvinceID))]
        public virtual Province? Province { get; set; }

        [ForeignKey(nameof(DistrictID))]
        public virtual District? District { get; set; }

        [ForeignKey(nameof(WardID))]
        public virtual Ward? Ward { get; set; }
    }
}


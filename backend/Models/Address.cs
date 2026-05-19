using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class Address
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AddressID { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn người dùng")]
        public string UserID { get; set; }

        [ForeignKey(nameof(UserID))]
        [ValidateNever]
        public ApplicationUser User { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập tên người nhận")]
        [MaxLength(100, ErrorMessage = "Tên người nhận không được quá 100 ký tự")]
        [Display(Name = "Tên người nhận")]
        public string RecipientName { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [MaxLength(15, ErrorMessage = "Số điện thoại không được quá 15 ký tự")]
        [Display(Name = "Số điện thoại")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn Tỉnh/Thành phố")]
        [MaxLength(100, ErrorMessage = "Tên Tỉnh/Thành phố không được quá 100 ký tự")]
        [Display(Name = "Tỉnh/Thành phố")]
        public string Province { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn Quận/Huyện")]
        [MaxLength(100, ErrorMessage = "Tên Quận/Huyện không được quá 100 ký tự")]
        [Display(Name = "Quận/Huyện")]
        public string District { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn Phường/Xã")]
        [MaxLength(100, ErrorMessage = "Tên Phường/Xã không được quá 100 ký tự")]
        [Display(Name = "Phường/Xã")]
        public string Ward { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập địa chỉ chi tiết")]
        [MaxLength(500, ErrorMessage = "Địa chỉ chi tiết không được quá 500 ký tự")]
        [Display(Name = "Địa chỉ chi tiết")]
        public string DetailAddress { get; set; }

        [Display(Name = "Địa chỉ mặc định")]
        public bool IsDefault { get; set; } = false;

        [Display(Name = "Ngày tạo")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Helper method để lấy địa chỉ đầy đủ
        public string GetFullAddress()
        {
            return $"{DetailAddress}, {Ward}, {District}, {Province}";
        }
    }
}

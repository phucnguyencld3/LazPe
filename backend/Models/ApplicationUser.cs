using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Display(Name = "Họ và tên")]
        [Required(ErrorMessage = "Họ và tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ và tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; }

        [Display(Name = "Ngày sinh")]
        [DataType(DataType.Date)]
        public DateTime? DateOfBirth { get; set; }

        // Không cần định nghĩa lại PhoneNumber vì IdentityUser đã có sẵn
        // Chỉ cần override để thêm validation nếu cần
        [Display(Name = "Số điện thoại")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(13, ErrorMessage = "Số điện thoại không hợp lệ")]
        public override string? PhoneNumber { get; set; }

        // THÊM TRƯỜNG AVATAR
        [Display(Name = "Ảnh đại diện")]
        [StringLength(500, ErrorMessage = "Đường dẫn ảnh không được vượt quá 500 ký tự")]
        public string? Avatar { get; set; }

        [Display(Name = "Trạng thái")]
        public bool Status { get; set; } = true;

        [Display(Name = "Ngày đăng ký")]
        public DateTime RegisterDate { get; set; } = DateTime.Now;

        // Navigation Properties
        public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();
        public virtual ICollection<UserAddress> UserAddresses { get; set; } = new List<UserAddress>();
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
        public virtual ICollection<VoucherUsage> VoucherUsages { get; set; } = new List<VoucherUsage>();
        public virtual ICollection<UserVoucher> UserVouchers { get; set; } = new List<UserVoucher>();
        public virtual ICollection<ReviewLike> ReviewLikes { get; set; } = new List<ReviewLike>();
        public virtual ICollection<ReviewComment> ReviewComments { get; set; } = new List<ReviewComment>();

        // THÊM NAVIGATION PROPERTY CHO ADDRESS
        public virtual ICollection<Address> Addresses { get; set; } = new List<Address>();

        // Navigation property cho permissions
        public virtual ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
    }
}




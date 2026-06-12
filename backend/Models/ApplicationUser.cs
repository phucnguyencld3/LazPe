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

        [Display(Name = "Nhận thông báo qua Email")]
        public bool ReceiveEmailNotifications { get; set; } = true;

        [Display(Name = "Nhận cập nhật đơn hàng")]
        public bool ReceiveOrderUpdates { get; set; } = true;

        [Display(Name = "Nhận thông báo khuyến mãi")]
        public bool ReceivePromotions { get; set; } = true;

        [Display(Name = "Sở thích màu sắc của mẹ")]
        [StringLength(200, ErrorMessage = "Sở thích màu sắc không được vượt quá 200 ký tự")]
        public string? MomFavoriteColors { get; set; }

        [Display(Name = "Giới tính của bé")]
        [StringLength(20, ErrorMessage = "Giới tính không được vượt quá 20 ký tự")]
        public string? ChildGender { get; set; }

        [Display(Name = "Tuổi của bé (tháng)")]
        [Range(0, 120, ErrorMessage = "Độ tuổi của bé phải từ 0 đến 120 tháng")]
        public int? ChildAgeMonths { get; set; }

        [Display(Name = "Cân nặng của bé (kg)")]
        [Range(0, 100, ErrorMessage = "Cân nặng của bé phải từ 0 đến 100 kg")]
        public double? ChildWeightKg { get; set; }

        [Display(Name = "Đã hoàn thành onboarding")]
        public bool IsOnboarded { get; set; } = false;

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

        // THÊM NAVIGATION PROPERTY CHO ROLE TEMPLATE
        public int? RoleTemplateId { get; set; }
        [ForeignKey("RoleTemplateId")]
        public virtual RoleTemplate? RoleTemplate { get; set; }
    }
}




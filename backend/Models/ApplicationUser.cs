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

        [Column(TypeName = "decimal(18,2)")]
        [ConcurrencyCheck]
        public decimal WalletBalance { get; set; } = 0;

        // Affiliate Properties
        public bool IsAffiliate { get; set; } = false;

        [MaxLength(20)]
        public string? AffiliateCode { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyAffiliateRevenue { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal LifetimeAffiliateRevenue { get; set; } = 0;

        public int AffiliatePoint { get; set; } = 0;

        public int MonthlyAffiliateRedeemCount { get; set; } = 0;
        public int LastAffiliateRedeemMonth { get; set; } = 0;

        [MaxLength(256)]
        public string? WalletSignature { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [ConcurrencyCheck]
        public decimal CoinsBalance { get; set; } = 0;

        [MaxLength(256)]
        public string? CoinsSignature { get; set; }

        // MÃ PIN THANH TOÁN (Lưu dưới dạng băm)
        [MaxLength(256)]
        public string? PaymentPinHash { get; set; }

        public int PaymentPinFailedCount { get; set; } = 0;
        
        public DateTimeOffset? PaymentPinLockoutEnd { get; set; }

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


        [Display(Name = "Đã hoàn thành onboarding")]
        public bool IsOnboarded { get; set; } = false;

        [Display(Name = "Mã giới thiệu")]
        [StringLength(20)]
        public string? ReferralCode { get; set; }
        
        public bool IsWishlistPublic { get; set; } = false;
        public string? WishlistShareToken { get; set; }

        // Refresh Token
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }

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

        public virtual ICollection<BabyProfile> BabyProfiles { get; set; } = new List<BabyProfile>();
    }
}




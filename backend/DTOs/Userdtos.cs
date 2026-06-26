using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // USER — READ DTOs
    // =============================================

    /// <summary>
    /// DTO thông tin user dùng trong danh sách và chi tiết (Admin)
    /// </summary>
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Avatar { get; set; }
        public bool Status { get; set; }
        public bool EmailConfirmed { get; set; }

        /// <summary>true nếu LockoutEnd > DateTime.Now</summary>
        public bool IsLocked { get; set; }

        /// <summary>null nếu không bị khóa</summary>
        public DateTime? LockoutEnd { get; set; }

        public DateTime? DateOfBirth { get; set; }
        public int AccessFailedCount { get; set; }
        public DateTime RegisterDate { get; set; }
        public List<string> Roles { get; set; } = new();
    }

    /// <summary>
    /// DTO thống kê tổng quan users — dùng trên dashboard Admin
    /// </summary>
    public class UserStatisticsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int LockedUsers { get; set; }
        public int NewUsersThisMonth { get; set; }
    }

    // =============================================
    // PROFILE — READ DTOs
    // =============================================

    /// <summary>
    /// DTO thông tin profile của user đang đăng nhập
    /// </summary>
    public class UserProfileDto
    {
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Avatar { get; set; }
        public DateTime RegisterDate { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool Status { get; set; }
        public bool ReceiveEmailNotifications { get; set; }
        public bool ReceiveOrderUpdates { get; set; }
        public bool ReceivePromotions { get; set; }
        public string? MomFavoriteColors { get; set; }
        public string? ChildGender { get; set; }
        public int? ChildAgeMonths { get; set; }
        public double? ChildWeightKg { get; set; }
        public bool IsOnboarded { get; set; }
        public decimal WalletBalance { get; set; }
        public decimal CoinsBalance { get; set; }
    }

    /// <summary>
    /// DTO response sau khi upload avatar thành công
    /// </summary>
    public class UploadAvatarResponseDto
    {
        public bool Success { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Message { get; set; }
    }

    // =============================================
    // PROFILE — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO cập nhật thông tin cá nhân
    /// </summary>
    public class UpdateProfileDto
    {
        [Required(ErrorMessage = "Họ và tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;

        private string? _phoneNumber;

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(13)]
        public string? PhoneNumber
        {
            get => _phoneNumber;
            set => _phoneNumber = string.IsNullOrWhiteSpace(value) ? null : value;
        }


        public DateTime? DateOfBirth { get; set; }

        /// <summary>URL Cloudinary sau khi upload riêng, null = giữ nguyên</summary>
        public string? Avatar { get; set; }

        public bool? ReceiveEmailNotifications { get; set; }
        public bool? ReceiveOrderUpdates { get; set; }
        public bool? ReceivePromotions { get; set; }
        public string? MomFavoriteColors { get; set; }
        public string? ChildGender { get; set; }
        public int? ChildAgeMonths { get; set; }
        public double? ChildWeightKg { get; set; }
        public bool? IsOnboarded { get; set; }
    }

    /// <summary>
    /// DTO đổi mật khẩu
    /// </summary>
    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "Mật khẩu hiện tại là bắt buộc")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }

    public class SetPasswordDto
    {
        [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc")]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO upload avatar (multipart/form-data)
    /// </summary>
    public class UploadAvatarRequest
    {
        [Required(ErrorMessage = "UserId không được để trống")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn file ảnh")]
        public IFormFile Avatar { get; set; } = null!;
    }

    // =============================================
    // USER MANAGEMENT — WRITE DTOs (Admin)
    // =============================================

    /// <summary>
    /// DTO khóa tài khoản user
    /// </summary>
    public class LockUserDto
    {
        [StringLength(500, ErrorMessage = "Lý do không được vượt quá 500 ký tự")]
        public string? Reason { get; set; }

        /// <summary>Số ngày khóa; null hoặc 0 = khóa vĩnh viễn</summary>
        [Range(0, 3650, ErrorMessage = "Số ngày khóa tối đa là 3650 ngày (10 năm)")]
        public int? LockoutDays { get; set; }
    }

    // =============================================
    // ADDRESS — READ DTOs
    // =============================================

    /// <summary>
    /// DTO thông tin địa chỉ giao hàng
    /// </summary>
    public class AddressDto
    {
        public int AddressID { get; set; }
        public string UserID { get; set; } = string.Empty;
        public string RecipientName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string Ward { get; set; } = string.Empty;
        public string DetailAddress { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>Địa chỉ đầy đủ một dòng để hiển thị</summary>
        public string FullAddress => $"{DetailAddress}, {Ward}, {District}, {Province}";
    }

    // =============================================
    // ADDRESS — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO tạo mới địa chỉ giao hàng theo chuẩn địa chính Việt Nam
    /// </summary>
    public class CreateVietnamAddressDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên người nhận là bắt buộc")]
        [MaxLength(100, ErrorMessage = "Tên người nhận không được quá 100 ký tự")]
        public string RecipientName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mã tỉnh/thành phố là bắt buộc")]
        public string ProvinceCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên tỉnh/thành phố là bắt buộc")]
        public string ProvinceName { get; set; } = string.Empty;

        public string? DistrictCode { get; set; }

        public string? DistrictName { get; set; }

        [Required(ErrorMessage = "Mã phường/xã là bắt buộc")]
        public string WardCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên phường/xã là bắt buộc")]
        public string WardName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ chi tiết là bắt buộc")]
        [MaxLength(500, ErrorMessage = "Địa chỉ chi tiết không được quá 500 ký tự")]
        public string DetailAddress { get; set; } = string.Empty;

        public bool IsDefault { get; set; } = false;
    }

    /// <summary>
    /// DTO cập nhật địa chỉ giao hàng — kế thừa toàn bộ fields từ Create
    /// </summary>
    public class UpdateVietnamAddressDto : CreateVietnamAddressDto
    {
        // UserId lấy từ record hiện có, không cần nhập lại
        // Kế thừa toàn bộ validation từ CreateVietnamAddressDto
    }
}
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // PERMISSION — READ DTOs
    // =============================================

    /// <summary>
    /// DTO thông tin một quyền trong hệ thống
    /// </summary>
    public class PermissionDto
    {
        public int Id { get; set; }

        /// <summary>Tên quyền theo format Resource.Action — vd: Product.Read</summary>
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        /// <summary>Nhóm tài nguyên — vd: Product, User, Order</summary>
        public string Resource { get; set; } = string.Empty;

        /// <summary>Hành động — vd: Read, Create, Update, Delete</summary>
        public string Action { get; set; } = string.Empty;

        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO thông tin quyền đã gán cho một user cụ thể
    /// </summary>
    public class UserPermissionDto
    {
        public string UserId { get; set; } = string.Empty;
        public int PermissionId { get; set; }
        public string PermissionName { get; set; } = string.Empty;
        public DateTime GrantedAt { get; set; }
        public string? GrantedBy { get; set; }
    }

    // =============================================
    // PERMISSION — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO tạo mới một quyền — Name tự sinh = Resource.Action
    /// </summary>
    public class CreatePermissionDto
    {
        [Required(ErrorMessage = "Tên quyền là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên quyền không được vượt quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Resource là bắt buộc")]
        [StringLength(50, ErrorMessage = "Resource không được vượt quá 50 ký tự")]
        public string Resource { get; set; } = string.Empty;

        [Required(ErrorMessage = "Action là bắt buộc")]
        [StringLength(50, ErrorMessage = "Action không được vượt quá 50 ký tự")]
        public string Action { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO gán quyền cho user
    /// </summary>
    public class GrantPermissionDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "PermissionId là bắt buộc")]
        public int PermissionId { get; set; }
    }

    /// <summary>
    /// DTO thu hồi quyền của user
    /// </summary>
    public class RevokePermissionDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public string UserId { get; set; } = string.Empty;

        [Required(ErrorMessage = "PermissionId là bắt buộc")]
        public int PermissionId { get; set; }
    }
}
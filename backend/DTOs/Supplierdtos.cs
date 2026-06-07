using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // SUPPLIER — READ DTOs
    // =============================================

    /// <summary>
    /// DTO thông tin đầy đủ nhà cung cấp — dùng trong response chi tiết và nhúng trong ProductDto
    /// </summary>
    public class SupplierDto
    {
        public int SupplierID { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string? Logo { get; set; }
        public string? Description { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }

        /// <summary>Số lượng sản phẩm đang cung cấp</summary>
        public int ProductCount { get; set; }
    }

    // =============================================
    // SUPPLIER — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO tạo mới nhà cung cấp
    /// </summary>
    public class SupplierCreateDto
    {
        [Required(ErrorMessage = "Tên nhà cung cấp là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên nhà cung cấp không được vượt quá 200 ký tự")]
        public string SupplierName { get; set; } = string.Empty;


        public string? Logo { get; set; }

        [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        public string? Description { get; set; }

        public bool Status { get; set; } = true;

        // Gán bởi Controller từ JWT, không nhận từ client
        public string? CreatedBy { get; set; }
    }

    /// <summary>
    /// DTO cập nhật nhà cung cấp — không cho thay đổi Logo qua field này (dùng Upload riêng)
    /// </summary>
    public class SupplierUpdateDto
    {
        [Required(ErrorMessage = "Tên nhà cung cấp là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên nhà cung cấp không được vượt quá 200 ký tự")]
        public string SupplierName { get; set; } = string.Empty;


        /// <summary>null = giữ nguyên logo cũ</summary>
        public string? Logo { get; set; }

        [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        public string? Description { get; set; }

        public bool Status { get; set; } = true;
    }
}
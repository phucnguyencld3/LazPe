using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // BUNDLE — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO tạo mới combo — bao gồm danh sách sản phẩm ban đầu
    /// </summary>
    public class CreateBundleDto
    {
        [Required(ErrorMessage = "Tên combo là bắt buộc")]
        [MaxLength(300, ErrorMessage = "Tên combo tối đa 300 ký tự")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Mô tả tối đa 500 ký tự")]
        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        [Range(0, 100, ErrorMessage = "Phần trăm giảm giá phải từ 0 đến 100")]
        public decimal DiscountPercent { get; set; } = 0;

        public bool Status { get; set; } = true;

        /// <summary>Danh sách sản phẩm thêm ngay khi tạo combo (có thể rỗng)</summary>
        public List<AddBundleItemDto> BundleItems { get; set; } = new();
    }

    /// <summary>
    /// DTO cập nhật thông tin combo (không thay đổi danh sách sản phẩm)
    /// </summary>
    public class UpdateBundleDto
    {
        [Required(ErrorMessage = "BundleID là bắt buộc")]
        public int BundleID { get; set; }

        [Required(ErrorMessage = "Tên combo là bắt buộc")]
        [MaxLength(300, ErrorMessage = "Tên combo tối đa 300 ký tự")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Mô tả tối đa 500 ký tự")]
        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        [Range(0, 100, ErrorMessage = "Phần trăm giảm giá phải từ 0 đến 100")]
        public decimal DiscountPercent { get; set; } = 0;

        public bool Status { get; set; } = true;
    }

    /// <summary>
    /// DTO thêm một biến thể vào combo
    /// </summary>
    public class AddBundleItemDto
    {
        [Required(ErrorMessage = "VariantID là bắt buộc")]
        public int VariantID { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; } = 1;

        public int SortOrder { get; set; } = 0;
    }

    /// <summary>
    /// DTO cập nhật số lượng của một sản phẩm trong combo
    /// </summary>
    public class UpdateBundleItemDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; }
    }
}
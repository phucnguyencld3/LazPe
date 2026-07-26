using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // PRODUCT OPTION — READ DTOs
    // (đặt cùng file vì gắn chặt với Variant)
    // =============================================

    /// <summary>
    /// DTO thông tin một tùy chọn sản phẩm (vd: Màu sắc, Kích thước)
    /// </summary>
    public class ProductOptionValueDto
    {
        public int ProductOptionValueID { get; set; }
        public int ProductOptionID { get; set; }
        public string Value { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int DisplayOrder { get; set; }

        public DateTime? CreatedAt { get; set; }   
        public string CreatedBy { get; set; } = string.Empty; 
    }

    /// <summary>
    /// DTO thông tin một giá trị của tùy chọn (vd: Đỏ, Size S)
    /// </summary>
/*    public class ProductOptionValueDto
    {
        public int ProductOptionValueID { get; set; }
        public int ProductOptionID { get; set; }
        public string Value { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int DisplayOrder { get; set; }
    }*/

    // =============================================
    // VARIANT — READ DTOs
    // =============================================

    /// <summary>
    /// DTO thông tin đầy đủ của một biến thể sản phẩm
    /// </summary>
    public class VariantDto
    {
        public int VariantID { get; set; }
        public int ProductID { get; set; }
        public string VariantName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal VariantDiscountPercent { get; set; }
        public decimal EffectiveDiscountPercent { get; set; }
        public decimal FinalPrice { get; set; }
        public int Stock { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Description { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<VariantOptionValueDto> VariantOptionValues { get; set; } = new();
    }

    /// <summary>
    /// DTO ánh xạ giữa biến thể và giá trị tùy chọn
    /// </summary>
    public class VariantOptionValueDto
    {
        public int VariantOptionValueID { get; set; }
        public int VariantID { get; set; }
        public int ProductOptionValueID { get; set; }

        public ProductOptionValueDto? ProductOptionValue { get; set; }
    }

    /// <summary>
    /// DTO biểu diễn một tổ hợp biến thể được generate tự động từ ProductOptions
    /// </summary>
    public class VariantCombinationDto
    {
        public string VariantName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }

        /// <summary>Key = tên option (vd: "Màu"), Value = giá trị (vd: "Đỏ")</summary>
        public Dictionary<string, string> OptionCombination { get; set; } = new();

        public List<int> OptionValueIds { get; set; } = new();

        /// <summary>true nếu tổ hợp này đã tồn tại trong DB</summary>
        public bool AlreadyExists { get; set; }
    }

    // =============================================
    // VARIANT — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO tạo mới biến thể
    /// </summary>
    public class VariantCreateDto
    {
        [Required(ErrorMessage = "ProductID là bắt buộc")]
        public int ProductID { get; set; }

        [Required(ErrorMessage = "Tên biến thể là bắt buộc")]
        [MaxLength(300, ErrorMessage = "Tên biến thể tối đa 300 ký tự")]
        public string VariantName { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá không hợp lệ")]
        public decimal UnitPrice { get; set; }

        [Range(0, 50, ErrorMessage = "Giảm giá biến thể không được vượt quá 50% theo quy định.")]
        public decimal VariantDiscountPercent { get; set; } = 0;

        public decimal Price { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho không hợp lệ")]
        public int Stock { get; set; }

        [MaxLength(10, ErrorMessage = "SKU tối đa 10 ký tự")]
        public string SKU { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        [MaxLength(500, ErrorMessage = "Mô tả tối đa 500 ký tự")]
        public string? Description { get; set; }

        public string? CreatedBy { get; set; }

        public List<int> OptionValueIds { get; set; } = new();
    }

    /// <summary>
    /// DTO cập nhật biến thể
    /// </summary>
    public class VariantUpdateDto
    {
        [MaxLength(300, ErrorMessage = "Tên biến thể tối đa 300 ký tự")]
        public string? Name { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá không hợp lệ")]
        public decimal Price { get; set; }

        [Range(0, 50, ErrorMessage = "Giảm giá biến thể không được vượt quá 50% theo quy định.")]
        public decimal VariantDiscountPercent { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho không hợp lệ")]
        public int Stock { get; set; }

        public string? ImageUrl { get; set; }

        [MaxLength(500, ErrorMessage = "Mô tả tối đa 500 ký tự")]
        public string? Description { get; set; }

        public bool Status { get; set; } = true;
    }

    /// <summary>
    /// DTO kiểm tra tổ hợp biến thể đã tồn tại chưa
    /// </summary>
    public class CheckVariantExistsDto
    {
        [Required(ErrorMessage = "ProductID là bắt buộc")]
        public int ProductID { get; set; }

        [Required(ErrorMessage = "Danh sách OptionValueIds là bắt buộc")]
        public List<int> OptionValueIds { get; set; } = new();
    }

    /// <summary>
    /// DTO bật/tắt trạng thái biến thể
    /// </summary>
    public class ToggleStatusDto
    {
        public bool Status { get; set; }
    }

    /// <summary>
    /// DTO cập nhật tồn kho biến thể
    /// </summary>
    public class UpdateStockDto
    {
        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho không được âm")]
        public int Stock { get; set; }
        public int NewStock { get; set; }

    }

    // =============================================
    // PRODUCT OPTION — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO tạo mới một tùy chọn sản phẩm (vd: thêm option "Màu sắc")
    /// </summary>
    public class CreateProductOptionDto
    {
        [Required(ErrorMessage = "ProductID là bắt buộc")]
        public int ProductID { get; set; }

        [Required(ErrorMessage = "Tên tùy chọn là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên tùy chọn tối đa 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Thứ tự phải lớn hơn 0")]
        public int DisplayOrder { get; set; } = 1;

        public List<CreateProductOptionValueDto> Values { get; set; } = new();
    }

    /// <summary>
    /// DTO cập nhật tùy chọn sản phẩm
    /// </summary>
    public class UpdateProductOptionDto
    {
        [StringLength(100, ErrorMessage = "Tên tùy chọn tối đa 100 ký tự")]
        public string? Name { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Thứ tự phải lớn hơn 0")]
        public int DisplayOrder { get; set; } = 1;
    }

    /// <summary>
    /// DTO tạo mới một giá trị tùy chọn (vd: thêm giá trị "Đỏ" cho option "Màu sắc")
    /// </summary>
    public class CreateProductOptionValueDto
    {
        [Required(ErrorMessage = "ProductOptionID là bắt buộc")]
        public int ProductOptionID { get; set; }

        [Required(ErrorMessage = "Giá trị không được để trống")]
        [MaxLength(50, ErrorMessage = "Giá trị tối đa 50 ký tự")]
        public string Value { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Giá không hợp lệ")]
        public decimal Price { get; set; } = 0;

        [Range(1, int.MaxValue, ErrorMessage = "Thứ tự phải lớn hơn 0")]
        public int DisplayOrder { get; set; } = 1;
    }

    /// <summary>
    /// DTO cập nhật giá trị tùy chọn
    /// </summary>
    public class UpdateProductOptionValueDto
    {
        [MaxLength(50, ErrorMessage = "Giá trị tối đa 50 ký tự")]
        public string? Value { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá không hợp lệ")]
        public decimal Price { get; set; } = 0;

        [Range(1, int.MaxValue, ErrorMessage = "Thứ tự phải lớn hơn 0")]
        public int DisplayOrder { get; set; } = 1;
    }
}
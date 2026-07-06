using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // PRODUCT — READ DTOs
    // =============================================

    /// <summary>
    /// DTO hiển thị 1 dòng trong danh sách sản phẩm (table/grid)
    /// </summary>
    public class ProductListItemDto
    {
        public int ProductID { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Specifications { get; set; }
        public decimal Price { get; set; }
        public decimal ProductDiscountPercent { get; set; }
        public int Stock { get; set; }
        public bool Status { get; set; }
        public bool SupportsSubscription { get; set; }

        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;

        public int SupplierID { get; set; }
        public string SupplierName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }

        // Thông tin tổng hợp từ Variants
        public string? ImageUrl { get; set; }
        public int TotalStock { get; set; }
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public decimal MinEffectivePrice { get; set; }
        public decimal MaxEffectivePrice { get; set; }
        public int VariantCount { get; set; }
        public double Rating { get; set; }
        public int RatingCount { get; set; }
    }

    /// <summary>
    /// DTO thông tin cơ bản của sản phẩm (không bao gồm Variants/Options)
    /// </summary>
    public class ProductDto
    {
        public int ProductID { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? Specifications { get; set; }
        public decimal Price { get; set; }
        public decimal ProductDiscountPercent { get; set; }
        public int Stock { get; set; }
        public bool Status { get; set; }
        public bool SupportsSubscription { get; set; }
        public int CategoryID { get; set; }
        public int SupplierID { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }

        public CategoryDto? Category { get; set; }
        public SupplierDto? Supplier { get; set; }
        public double Rating { get; set; }
        public int RatingCount { get; set; }
    }

    /// <summary>
    /// DTO chi tiết sản phẩm đầy đủ, bao gồm Variants và ProductOptions
    /// </summary>
    /// /// <summary>
    /// DTO thông tin một tùy chọn sản phẩm (vd: Màu sắc, Kích thước)
    /// </summary>
    public class ProductOptionDto
    {
        public int ProductOptionID { get; set; }
        public int ProductID { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }

        public DateTime? CreatedAt { get; set; }
        public string? CreatedBy { get; set; }

        public List<ProductOptionValueDto> ProductOptionValues { get; set; } = new();
    }
    public class ProductDetailDto : ProductDto
    {
        public List<VariantDto> Variants { get; set; } = new();
        public List<ProductOptionDto> ProductOptions { get; set; } = new();
        public List<string> ImageUrls { get; set; } = new();
    }

    /// <summary>
    /// DTO kết quả phân trang danh sách sản phẩm
    /// </summary>
    public class ProductPaginationDto
    {
        public List<ProductListItemDto> Products { get; set; } = new();
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int TotalItems { get; set; }
        public int PageSize { get; set; }

        // Filter params trả về để client giữ trạng thái
        public string? SearchTerm { get; set; }
        public int? CategoryId { get; set; }
        public int? SupplierId { get; set; }
        public bool? Status { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string SortBy { get; set; } = "CreatedAt";
        public string SortDirection { get; set; } = "desc";
    }

    /// <summary>
    /// DTO tóm tắt sản phẩm — dùng trong danh sách con (vd: hiển thị trong Category detail)
    /// </summary>
    public class ProductSummaryDto
    {
        public int ProductID { get; set; }
        public string Code { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // =============================================
    // PRODUCT — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO tạo mới sản phẩm
    /// </summary>
    public class CreateProductDto
    {
        [StringLength(50)]
        public string? Code { get; set; }

        public string? Slug { get; set; }

        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên không được vượt quá 200 ký tự")]
        public string ProductName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }

        public string? Specifications { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá không hợp lệ")]
        public decimal Price { get; set; } = 0;

        [Range(0, 100, ErrorMessage = "Giảm giá sản phẩm phải từ 0 đến 100")]
        public decimal ProductDiscountPercent { get; set; } = 0;

        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho không hợp lệ")]
        public int Stock { get; set; } = 0;

        public bool SupportsSubscription { get; set; } = false;

        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        public int CategoryID { get; set; }

        public int? SupplierID { get; set; }

        // Gán bởi Controller từ JWT, không nhận từ client
        public string? CreatedBy { get; set; }
    }

    /// <summary>
    /// DTO cập nhật sản phẩm
    /// </summary>
    public class UpdateProductDto
    {
        [StringLength(50)]
        public string? Code { get; set; }

        public string? Slug { get; set; }

        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên không được vượt quá 200 ký tự")]
        public string ProductName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }

        public string? Specifications { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá không hợp lệ")]
        public decimal Price { get; set; }

        [Range(0, 100, ErrorMessage = "Giảm giá sản phẩm phải từ 0 đến 100")]
        public decimal ProductDiscountPercent { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho không hợp lệ")]
        public int Stock { get; set; }

        public bool SupportsSubscription { get; set; } = false;

        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        public int CategoryID { get; set; }

        public int? SupplierID { get; set; }
        public bool Status { get; set; } = true;

        public List<string>? Images { get; set; } = new();
        public bool ClearVariantImages { get; set; } = false;
    }

    // =============================================
    // PRODUCT — SELECT / LOOKUP DTOs
    // =============================================

    /// <summary>
    /// DTO nhỏ gọn dùng cho dropdown chọn danh mục khi tạo/sửa sản phẩm
    /// </summary>
    public class CategorySelectDto
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int? ParentID { get; set; }
        public int Level { get; set; }
        public bool Status { get; set; }
        public int ProductCount { get; set; }
    }

    /// <summary>
    /// DTO nhỏ gọn dùng cho dropdown chọn thương hiệu khi tạo/sửa sản phẩm
    /// </summary>
    public class SupplierSelectDto
    {
        public int SupplierID { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public bool Status { get; set; }
    }
}
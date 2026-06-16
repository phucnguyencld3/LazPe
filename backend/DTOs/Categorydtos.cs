using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // CATEGORY — READ DTOs
    // =============================================

    /// <summary>
    /// DTO thông tin cơ bản của danh mục — dùng làm navigation/breadcrumb nhúng trong ProductDto
    /// </summary>
    public class CategoryDto
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ParentID { get; set; }
        public string? ParentCategoryName { get; set; }
        public int Level { get; set; }
        public string? SortOrder { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public int ProductCount { get; set; }
    }

    /// <summary>
    /// DTO hiển thị 1 dòng trong danh sách danh mục (table/grid)
    /// </summary>
    public class CategoryListItemDto
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int? ParentID { get; set; }
        public string? ParentCategoryName { get; set; }

        public int Level { get; set; }
        public string? SortOrder { get; set; }
        public bool Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }

        // Thống kê
        public int ProductCount { get; set; }
        public bool HasSubCategories { get; set; }
    }

    /// <summary>
    /// DTO chi tiết đầy đủ của danh mục — bao gồm sub-categories và sản phẩm thuộc danh mục
    /// </summary>
    public class CategoryDetailDto
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int? ParentID { get; set; }
        public string? ParentCategoryName { get; set; }

        public int Level { get; set; }
        public string? SortOrder { get; set; }
        public bool Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }

        public int ProductCount { get; set; }

        public List<CategoryListItemDto> SubCategories { get; set; } = new();

        /// <summary>Preview tối đa 10 sản phẩm thuộc danh mục</summary>
        public List<ProductSummaryDto> Products { get; set; } = new();
    }

    /// <summary>
    /// DTO kết quả phân trang danh sách danh mục
    /// </summary>
    public class CategoriesPaginationDto
    {
        public List<CategoryListItemDto> Categories { get; set; } = new();
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int TotalItems { get; set; }
        public int PageSize { get; set; }

        // Filter params trả về để client giữ trạng thái
        public string? SearchTerm { get; set; }
        public bool? Status { get; set; }
    }

    // =============================================
    // CATEGORY — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO tạo mới danh mục
    /// </summary>
    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "Tên danh mục là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên danh mục không được vượt quá 100 ký tự")]
        public string CategoryName { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        [Required(ErrorMessage = "Mô tả là bắt buộc")]
        public string Description { get; set; } = string.Empty;

        /// <summary>null = danh mục gốc (Level 0)</summary>
        public int? ParentID { get; set; }

        [StringLength(50)]
        public string? SortOrder { get; set; }

        public bool Status { get; set; } = true;
    }

    /// <summary>
    /// DTO chỉnh sửa danh mục (yêu cầu có CategoryID)
    /// </summary>
    public class EditCategoryDto
    {
        [Required(ErrorMessage = "CategoryID là bắt buộc")]
        public int CategoryID { get; set; }

        [Required(ErrorMessage = "Tên danh mục là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên danh mục không được vượt quá 100 ký tự")]
        public string CategoryName { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        [Required(ErrorMessage = "Mô tả là bắt buộc")]
        public string Description { get; set; } = string.Empty;

        /// <summary>null = chuyển về danh mục gốc</summary>
        public int? ParentID { get; set; }

        [StringLength(50)]
        public string? SortOrder { get; set; }

        public bool Status { get; set; } = true;
    }
}
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // REVIEW — READ DTOs
    // =============================================

    /// <summary>
    /// DTO đầy đủ của một đánh giá — bao gồm user, likes, comments
    /// </summary>
    public class ReviewDto
    {
        public int ReviewID { get; set; }
        public string UserID { get; set; } = string.Empty;

        public int? VariantID { get; set; }
        public int? BundleID { get; set; }

        /// <summary>Số sao từ 1 đến 5</summary>
        public int Rating { get; set; }

        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsHidden { get; set; }

        /// <summary>Thông tin tóm tắt người viết đánh giá</summary>
        public ReviewUserDto? User { get; set; }

        public int LikeCount { get; set; }
        public int CommentCount { get; set; }

        /// <summary>User hiện tại đã like đánh giá này chưa</summary>
        public bool IsLikedByCurrentUser { get; set; }

        /// <summary>Chỉ chứa top-level comments (ParentCommentID = null)</summary>
        public List<ReviewCommentDto> Comments { get; set; } = new();

        // Context — tên sản phẩm/biến thể/combo để hiển thị trong trang quản lý
        public string? ProductName { get; set; }
        public string? VariantName { get; set; }
        public string? BundleName { get; set; }
    }

    /// <summary>
    /// DTO tóm tắt user nhúng trong ReviewDto và ReviewCommentDto
    /// </summary>
    public class ReviewUserDto
    {
        public string UserID { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
    }

    /// <summary>
    /// DTO một bình luận — hỗ trợ lồng nhau qua ChildComments
    /// </summary>
    public class ReviewCommentDto
    {
        public int CommentID { get; set; }
        public int ReviewID { get; set; }
        public string UserID { get; set; } = string.Empty;

        /// <summary>null = bình luận gốc; có giá trị = reply</summary>
        public int? ParentCommentID { get; set; }

        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsHidden { get; set; }

        public ReviewUserDto? User { get; set; }

        /// <summary>Danh sách reply của bình luận này</summary>
        public List<ReviewCommentDto> ChildComments { get; set; } = new();
    }

    /// <summary>
    /// DTO thống kê đánh giá của một sản phẩm/combo
    /// </summary>
    public class ReviewStatsDto
    {
        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }

        /// <summary>Key = số sao (1-5), Value = số lượng đánh giá</summary>
        public Dictionary<int, int> RatingDistribution { get; set; } = new();
    }

    /// <summary>
    /// DTO kết quả danh sách đánh giá phân trang kèm thống kê
    /// </summary>
    public class ReviewListResponseDto
    {
        public List<ReviewDto> Reviews { get; set; } = new();
        public ReviewStatsDto? Stats { get; set; }
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    }

    // =============================================
    // REVIEW — QUERY DTOs
    // =============================================

    /// <summary>
    /// DTO tham số tìm kiếm / lọc danh sách đánh giá (dùng với [FromQuery])
    /// </summary>
    public class ReviewSearchDto
    {
        public int? VariantID { get; set; }
        public int? BundleID { get; set; }

        [Range(1, 5, ErrorMessage = "Rating phải từ 1 đến 5")]
        public int? Rating { get; set; }

        public string? SearchTerm { get; set; }          
        public string SortBy { get; set; } = "createdat"; 
        public string SortOrder { get; set; } = "desc";  

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // =============================================
    // REVIEW — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO tạo đánh giá mới — phải có ít nhất VariantID hoặc BundleID
    /// </summary>
    public class CreateReviewDto
    {
        public int? VariantID { get; set; }
        public int? BundleID { get; set; }

        [Required(ErrorMessage = "Số sao là bắt buộc")]
        [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao")]
        public int Rating { get; set; }

        [StringLength(500, ErrorMessage = "Nội dung tối đa 500 ký tự")]
        public string? Content { get; set; }

        /// <summary>Hợp lệ khi có đúng một trong VariantID hoặc BundleID</summary>
        public bool IsValid => VariantID.HasValue ^ BundleID.HasValue;
    }

    public class CreateInvoiceReviewDto
    {
        [Required]
        public int InvoiceID { get; set; }

        [Required]
        public int InvoiceDetailID { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao")]
        public int Rating { get; set; }

        [StringLength(500, ErrorMessage = "Nội dung tối đa 500 ký tự")]
        public string? Content { get; set; }
    }

    public class ReviewableInvoiceItemDto
    {
        public int InvoiceDetailID { get; set; }
        public int? VariantID { get; set; }
        public int? BundleID { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public bool IsReviewed { get; set; }
    }

    /// <summary>
    /// DTO cập nhật đánh giá — chỉ cho phép sửa Rating và Content
    /// </summary>
    public class UpdateReviewDto
    {
        [Required(ErrorMessage = "ReviewID là bắt buộc")]
        public int ReviewID { get; set; }

        [Required(ErrorMessage = "Số sao là bắt buộc")]
        [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao")]
        public int Rating { get; set; }

        [StringLength(500, ErrorMessage = "Nội dung tối đa 500 ký tự")]
        public string? Content { get; set; }
    }

    /// <summary>
    /// DTO tạo bình luận mới (kể cả reply)
    /// </summary>
    public class CreateReviewCommentDto
    {
        [Required(ErrorMessage = "ReviewID là bắt buộc")]
        public int ReviewID { get; set; }

        /// <summary>null = bình luận gốc; có giá trị = reply</summary>
        public int? ParentCommentID { get; set; }

        [Required(ErrorMessage = "Nội dung bình luận là bắt buộc")]
        [StringLength(500, ErrorMessage = "Nội dung tối đa 500 ký tự")]
        public string Content { get; set; } = string.Empty;
    }
}
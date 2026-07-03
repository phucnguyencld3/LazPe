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
        public bool HasEarnedRewardPoints { get; set; }
        public int LoyaltyPointsEarned { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CensorshipReason { get; set; }

        /// <summary>Thông tin tóm tắt người viết đánh giá</summary>
        public ReviewUserDto? User { get; set; }

        public int LikeCount { get; set; }
        public int CommentCount { get; set; }

        /// <summary>User hiện tại đã like đánh giá này chưa</summary>
        public bool IsLikedByCurrentUser { get; set; }

        /// <summary>Chỉ chứa top-level comments (ParentCommentID = null)</summary>
        public List<ReviewCommentDto> Comments { get; set; } = new();

        /// <summary>Danh sách hình ảnh/video đi kèm</summary>
        public List<ReviewMediaDto> ReviewMedia { get; set; } = new();

        /// <summary>Lịch sử kiểm duyệt (chỉ admin xem được)</summary>
        public List<ReviewCensorshipLogDto> CensorshipLogs { get; set; } = new();

        // Context — tên sản phẩm/biến thể/combo để hiển thị trong trang quản lý
        public string? ProductName { get; set; }
        public string? VariantName { get; set; }
        public string? BundleName { get; set; }
        public string? ImageUrl { get; set; }

        public string? AutoModerationStatus { get; set; }
        public string? FlaggedReason { get; set; }
        public int ViolationScore { get; set; }
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
        public bool? IsHidden { get; set; } // Hỗ trợ lọc cho admin
        public bool? HasMedia { get; set; } // Hỗ trợ lọc theo file ảnh/video
    }

    // =============================================
    // REVIEW — WRITE DTOs
    // =============================================

    public class ReviewMediaInputDto
    {
        [Required]
        public string Url { get; set; } = string.Empty;
        public string MediaType { get; set; } = "IMAGE"; // IMAGE, VIDEO
    }

    public class ReviewMediaDto
    {
        public int MediaID { get; set; }
        public int ReviewID { get; set; }
        public string Url { get; set; } = string.Empty;
        public string MediaType { get; set; } = "IMAGE";
        public DateTime CreatedAt { get; set; }
    }

    public class ReviewCensorshipLogDto
    {
        public int LogID { get; set; }
        public int ReviewID { get; set; }
        public string ActorID { get; set; } = string.Empty;
        public string ActorName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // HIDE, RESTORE
        public string Reason { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class CensorReviewDto
    {
        [Required]
        public int ReviewID { get; set; }
        [Required]
        public string Action { get; set; } = string.Empty; // HIDE, RESTORE
        [Required(ErrorMessage = "Lý do là bắt buộc")]
        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;
    }

    public class ReviewAdminStatsDto
    {
        public int TotalReviews { get; set; }
        public int HiddenReviews { get; set; }
        public int VisibleReviews { get; set; }
        public double AverageRating { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; } = new();
    }

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

        public List<ReviewMediaInputDto> Media { get; set; } = new();

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

        public List<ReviewMediaInputDto> Media { get; set; } = new();
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

        public List<ReviewMediaInputDto> Media { get; set; } = new();
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

    public class PendingReviewItemDto
    {
        public int InvoiceID { get; set; }
        public int InvoiceDetailID { get; set; }
        public int? VariantID { get; set; }
        public int? BundleID { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string VariantName { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public DateTime PurchaseDate { get; set; }
    }

    // =============================================
    // AUTO MODERATION & KEYWORD DTOs
    // =============================================

    public class ReviewSensitiveKeywordDto
    {
        public int KeywordID { get; set; }
        public string Word { get; set; } = string.Empty;
        public string Severity { get; set; } = "Warning";
        public string Category { get; set; } = "Abuse";
        public DateTime CreatedAt { get; set; }
    }

    public class CreateSensitiveKeywordDto
    {
        [Required(ErrorMessage = "Từ khóa là bắt buộc")]
        [StringLength(100)]
        public string Word { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Severity { get; set; } = "Warning";

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = "Abuse";
    }

    public class ModerationDashboardDto
    {
        public int TotalNeedsReview { get; set; }
        public int TotalFlagged { get; set; }
        public int TotalAutoHidden { get; set; }
        public List<KeywordCountDto> TopKeywords { get; set; } = new();
        public List<ProductCountDto> TopProducts { get; set; } = new();
        public List<UserCountDto> TopUsers { get; set; } = new();
    }

    public class KeywordCountDto
    {
        public string Keyword { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class ProductCountDto
    {
        public string ProductName { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class UserCountDto
    {
        public string UserFullName { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
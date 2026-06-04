using PolyBabyAPI.DTOs;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface IReviewService
    {
        // Review Management
        Task<Review> CreateReviewAsync(string userId, CreateReviewDto dto);
        Task<Review?> GetReviewByIdAsync(int reviewId);
        Task<bool> UpdateReviewAsync(int reviewId, string userId, UpdateReviewDto dto);
        Task<bool> DeleteReviewAsync(int reviewId, string userId);
        Task<bool> CanUserReviewAsync(string userId, int? variantId, int? bundleId);
        Task<IEnumerable<ReviewableInvoiceItemDto>> GetReviewableItemsAsync(string userId, int invoiceId);
        Task<Review> CreateReviewFromInvoiceAsync(string userId, CreateInvoiceReviewDto dto);
        Task<IEnumerable<Review>> GetProductReviewsAsync(int productId, int page = 1, int pageSize = 10);
        Task<ReviewStatsDto> GetProductReviewStatsAsync(int productId);

        // Review Queries
        Task<IEnumerable<Review>> GetReviewsAsync(ReviewSearchDto searchDto);
        Task<IEnumerable<Review>> GetBundleReviewsAsync(int bundleId, int page = 1, int pageSize = 10);
        Task<IEnumerable<Review>> GetVariantReviewsAsync(int variantId, int page = 1, int pageSize = 10);
        Task<Review?> GetUserReviewAsync(string userId, int? variantId, int? bundleId);

        // Review Statistics
        Task<ReviewStatsDto> GetReviewStatsAsync(int? bundleId = null, int? variantId = null);
        Task<double> GetAverageRatingAsync(int? bundleId = null, int? variantId = null);
        Task<int> GetReviewCountAsync(int? bundleId = null, int? variantId = null);

        // Review Likes
        Task<bool> ToggleReviewLikeAsync(int reviewId, string userId);
        Task<bool> IsReviewLikedByUserAsync(int reviewId, string userId);
        Task<int> GetReviewLikeCountAsync(int reviewId);

        // Review Comments
        Task<ReviewComment> CreateCommentAsync(string userId, CreateReviewCommentDto dto);
        Task<IEnumerable<ReviewComment>> GetReviewCommentsAsync(int reviewId);
        Task<bool> DeleteCommentAsync(int commentId, string userId);

        // User specific functions
        Task<IEnumerable<Review>> GetUserReviewsAsync(string userId, int page = 1, int pageSize = 10);
        Task<int> GetUserReviewCountAsync(string userId);
        Task<IEnumerable<PendingReviewItemDto>> GetPendingReviewsAsync(string userId);

        // Admin functions
        Task<bool> HideReviewAsync(int reviewId);
        Task<bool> ShowReviewAsync(int reviewId);
        Task<bool> HideCommentAsync(int commentId);
    }
}


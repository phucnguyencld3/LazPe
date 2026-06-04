using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class ReviewService : IReviewService
    {
        private readonly ApplicationDbContext _context;
        private const string InvoiceReviewPrefix = "[#INV:";

        public ReviewService(ApplicationDbContext context)
        {
            _context = context;
        }

        #region Review Management

        public async Task<Review> CreateReviewAsync(string userId, CreateReviewDto dto)
        {
            // Check if user already reviewed this item
            var existingReview = await GetUserReviewAsync(userId, dto.VariantID, dto.BundleID);
            if (existingReview != null)
            {
                throw new InvalidOperationException("Bạn đã đánh giá sản phẩm này rồi");
            }

            var review = new Review
            {
                UserID = userId,
                VariantID = dto.VariantID.HasValue ? dto.VariantID.Value : 0, 
                BundleID = dto.BundleID,
                Rating = dto.Rating,
                Content = dto.Content ?? "",
                CreatedAt = DateTime.Now,
                IsHidden = false
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return await GetReviewByIdAsync(review.ReviewID) ?? review;
        }

        public async Task<Review?> GetReviewByIdAsync(int reviewId)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Variant)
                    .ThenInclude(v => v.Product)
                .Include(r => r.Bundle)
                .Include(r => r.ReviewLikes)
                .Include(r => r.ReviewComments)
                    .ThenInclude(rc => rc.User)
                .FirstOrDefaultAsync(r => r.ReviewID == reviewId);
        }

        public async Task<bool> UpdateReviewAsync(int reviewId, string userId, UpdateReviewDto dto)
        {
            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.ReviewID == reviewId && r.UserID == userId);

            if (review == null) return false;

            review.Rating = dto.Rating;
            review.Content = dto.Content ?? "";

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteReviewAsync(int reviewId, string userId)
        {
            var review = await _context.Reviews
                .Include(r => r.ReviewLikes)
                .Include(r => r.ReviewComments)
                .FirstOrDefaultAsync(r => r.ReviewID == reviewId && r.UserID == userId);

            if (review == null) return false;

            // Delete related data
            _context.ReviewLikes.RemoveRange(review.ReviewLikes);
            _context.ReviewComments.RemoveRange(review.ReviewComments);
            _context.Reviews.Remove(review);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CanUserReviewAsync(string userId, int? variantId, int? bundleId)
        {
            var existingReview = await GetUserReviewAsync(userId, variantId, bundleId);
            return existingReview == null;
        }

        public async Task<IEnumerable<ReviewableInvoiceItemDto>> GetReviewableItemsAsync(string userId, int invoiceId)
        {
            var invoice = await _context.Invoices
                .AsNoTracking()
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Variant)
                        .ThenInclude(v => v.Product)
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Bundle)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && i.UserID == userId);

            if (invoice == null)
            {
                return [];
            }

            var reviewedContentTokens = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.UserID == userId && r.Content.StartsWith(InvoiceReviewPrefix))
                .Select(r => r.Content)
                .ToListAsync();

            return invoice.InvoiceDetails.Select(d => new ReviewableInvoiceItemDto
            {
                InvoiceDetailID = d.InvoiceDetailID,
                VariantID = d.VariantID,
                BundleID = d.BundleID,
                ProductName = d.Variant?.Product?.ProductName ?? d.Bundle?.Name ?? "Sản phẩm",
                IsReviewed = reviewedContentTokens.Any(c => c.StartsWith(BuildInvoiceReviewMarker(invoice.InvoiceID, d.InvoiceDetailID)))
            }).ToList();
        }

        public async Task<Review> CreateReviewFromInvoiceAsync(string userId, CreateInvoiceReviewDto dto)
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceDetails)
                .FirstOrDefaultAsync(i => i.InvoiceID == dto.InvoiceID && i.UserID == userId);

            if (invoice == null)
            {
                throw new InvalidOperationException("Không tìm thấy đơn hàng.");
            }

            if (invoice.Status != OrderStatus.Completed)
            {
                throw new InvalidOperationException("Chỉ có thể đánh giá đơn hàng đã hoàn thành.");
            }

            var invoiceItem = invoice.InvoiceDetails.FirstOrDefault(d => d.InvoiceDetailID == dto.InvoiceDetailID);
            if (invoiceItem == null)
            {
                throw new InvalidOperationException("Không tìm thấy sản phẩm trong đơn hàng.");
            }

            var marker = BuildInvoiceReviewMarker(dto.InvoiceID, dto.InvoiceDetailID);
            var hasReviewed = await _context.Reviews
                .AnyAsync(r => r.UserID == userId && r.Content.StartsWith(marker));

            if (hasReviewed)
            {
                throw new InvalidOperationException("Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi.");
            }

            var reviewContent = (dto.Content ?? string.Empty).Trim();
            var storedContent = string.IsNullOrWhiteSpace(reviewContent)
                ? marker
                : $"{marker}\n{reviewContent}";

            var review = new Review
            {
                UserID = userId,
                VariantID = invoiceItem.VariantID ?? 0,
                BundleID = invoiceItem.BundleID,
                Rating = dto.Rating,
                Content = storedContent,
                CreatedAt = DateTime.Now,
                IsHidden = false
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return await GetReviewByIdAsync(review.ReviewID) ?? review;
        }

        #endregion

        #region Review Queries

        public async Task<IEnumerable<Review>> GetReviewsAsync(ReviewSearchDto searchDto)
        {
            var query = _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Variant)
                    .ThenInclude(v => v.Product)
                .Include(r => r.Bundle)
                .Include(r => r.ReviewLikes)
                .Include(r => r.ReviewComments)
                    .ThenInclude(rc => rc.User)
                .Where(r => !r.IsHidden);

            // Apply filters
            if (searchDto.BundleID.HasValue)
                query = query.Where(r => r.BundleID == searchDto.BundleID.Value);

            if (searchDto.VariantID.HasValue)
                query = query.Where(r => r.VariantID == searchDto.VariantID.Value);

            if (searchDto.Rating.HasValue)
                query = query.Where(r => r.Rating == searchDto.Rating.Value);

            if (!string.IsNullOrEmpty(searchDto.SearchTerm))
                query = query.Where(r => r.Content.Contains(searchDto.SearchTerm));

            // Apply sorting
            switch (searchDto.SortBy.ToLower())
            {
                case "rating":
                    query = searchDto.SortOrder.ToLower() == "desc" ?
                        query.OrderByDescending(r => r.Rating) :
                        query.OrderBy(r => r.Rating);
                    break;
                case "likes":
                    query = searchDto.SortOrder.ToLower() == "desc" ?
                        query.OrderByDescending(r => r.ReviewLikes.Count) :
                        query.OrderBy(r => r.ReviewLikes.Count);
                    break;
                default: // CreatedAt
                    query = searchDto.SortOrder.ToLower() == "desc" ?
                        query.OrderByDescending(r => r.CreatedAt) :
                        query.OrderBy(r => r.CreatedAt);
                    break;
            }

            // Apply pagination
            return await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetBundleReviewsAsync(int bundleId, int page = 1, int pageSize = 10)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.ReviewLikes)
                .Include(r => r.ReviewComments)
                    .ThenInclude(rc => rc.User)
                .Where(r => r.BundleID == bundleId && !r.IsHidden)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetProductReviewsAsync(int productId, int page = 1, int pageSize = 10)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Variant)
                .Include(r => r.ReviewLikes)
                .Include(r => r.ReviewComments)
                    .ThenInclude(rc => rc.User)
                .Where(r => !r.IsHidden && r.Variant != null && r.Variant.ProductID == productId)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<ReviewStatsDto> GetProductReviewStatsAsync(int productId)
        {
            var reviews = await _context.Reviews
                .Where(r => !r.IsHidden && r.Variant != null && r.Variant.ProductID == productId)
                .ToListAsync();

            return new ReviewStatsDto
            {
                TotalReviews = reviews.Count,
                AverageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0,
                RatingDistribution = reviews
                    .GroupBy(r => r.Rating)
                    .ToDictionary(g => g.Key, g => g.Count())
            };
        }

        public async Task<IEnumerable<Review>> GetVariantReviewsAsync(int variantId, int page = 1, int pageSize = 10)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.ReviewLikes)
                .Include(r => r.ReviewComments)
                    .ThenInclude(rc => rc.User)
                .Where(r => r.VariantID == variantId && !r.IsHidden)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Review?> GetUserReviewAsync(string userId, int? variantId, int? bundleId)
        {
            var query = _context.Reviews.Where(r => r.UserID == userId);

            if (bundleId.HasValue)
                query = query.Where(r => r.BundleID == bundleId.Value);
            else if (variantId.HasValue)
                query = query.Where(r => r.VariantID == variantId.Value);

            return await query.FirstOrDefaultAsync();
        }

        private static string BuildInvoiceReviewMarker(int invoiceId, int invoiceDetailId)
            => $"{InvoiceReviewPrefix}{invoiceId};ITEM:{invoiceDetailId}]";

        #endregion

        #region Review Statistics

        public async Task<ReviewStatsDto> GetReviewStatsAsync(int? bundleId = null, int? variantId = null)
        {
            var query = _context.Reviews.Where(r => !r.IsHidden);

            if (bundleId.HasValue)
                query = query.Where(r => r.BundleID == bundleId.Value);
            else if (variantId.HasValue)
                query = query.Where(r => r.VariantID == variantId.Value);

            var reviews = await query.ToListAsync();

            var stats = new ReviewStatsDto
            {
                TotalReviews = reviews.Count,
                AverageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0,
                RatingDistribution = reviews
                    .GroupBy(r => r.Rating)
                    .ToDictionary(g => g.Key, g => g.Count())
            };

            return stats;
        }

        public async Task<double> GetAverageRatingAsync(int? bundleId = null, int? variantId = null)
        {
            var query = _context.Reviews.Where(r => !r.IsHidden);

            if (bundleId.HasValue)
                query = query.Where(r => r.BundleID == bundleId.Value);
            else if (variantId.HasValue)
                query = query.Where(r => r.VariantID == variantId.Value);

            var ratings = await query.Select(r => r.Rating).ToListAsync();
            return ratings.Any() ? ratings.Average() : 0;
        }

        public async Task<int> GetReviewCountAsync(int? bundleId = null, int? variantId = null)
        {
            var query = _context.Reviews.Where(r => !r.IsHidden);

            if (bundleId.HasValue)
                query = query.Where(r => r.BundleID == bundleId.Value);
            else if (variantId.HasValue)
                query = query.Where(r => r.VariantID == variantId.Value);

            return await query.CountAsync();
        }

        #endregion

        #region Review Likes

        public async Task<bool> ToggleReviewLikeAsync(int reviewId, string userId)
        {
            var existingLike = await _context.ReviewLikes
                .FirstOrDefaultAsync(rl => rl.ReviewID == reviewId && rl.UserID == userId);

            if (existingLike != null)
            {
                // Unlike
                _context.ReviewLikes.Remove(existingLike);
                await _context.SaveChangesAsync();
                return false; // Unliked
            }
            else
            {
                // Like
                var like = new ReviewLike
                {
                    ReviewID = reviewId,
                    UserID = userId,
                    CreatedAt = DateTime.Now
                };
                _context.ReviewLikes.Add(like);
                await _context.SaveChangesAsync();
                return true; // Liked
            }
        }

        public async Task<bool> IsReviewLikedByUserAsync(int reviewId, string userId)
        {
            return await _context.ReviewLikes
                .AnyAsync(rl => rl.ReviewID == reviewId && rl.UserID == userId);
        }

        public async Task<int> GetReviewLikeCountAsync(int reviewId)
        {
            return await _context.ReviewLikes
                .CountAsync(rl => rl.ReviewID == reviewId);
        }

        #endregion

        #region Review Comments

        public async Task<ReviewComment> CreateCommentAsync(string userId, CreateReviewCommentDto dto)
        {
            var comment = new ReviewComment
            {
                ReviewID = dto.ReviewID,
                UserID = userId,
                ParentCommentID = dto.ParentCommentID,
                Content = dto.Content,
                CreatedAt = DateTime.Now,
                IsHidden = false
            };

            _context.ReviewComments.Add(comment);
            await _context.SaveChangesAsync();

            return await _context.ReviewComments
                .Include(rc => rc.User)
                .Include(rc => rc.ChildComments)
                    .ThenInclude(cc => cc.User)
                .FirstAsync(rc => rc.CommentID == comment.CommentID);
        }

        public async Task<IEnumerable<ReviewComment>> GetReviewCommentsAsync(int reviewId)
        {
            return await _context.ReviewComments
                .Include(rc => rc.User)
                .Include(rc => rc.ChildComments)
                    .ThenInclude(cc => cc.User)
                .Where(rc => rc.ReviewID == reviewId && !rc.IsHidden && rc.ParentCommentID == null)
                .OrderBy(rc => rc.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> DeleteCommentAsync(int commentId, string userId)
        {
            var comment = await _context.ReviewComments
                .Include(rc => rc.ChildComments)
                .FirstOrDefaultAsync(rc => rc.CommentID == commentId && rc.UserID == userId);

            if (comment == null) return false;

            // Delete child comments too
            _context.ReviewComments.RemoveRange(comment.ChildComments);
            _context.ReviewComments.Remove(comment);

            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        #region User Functions

        public async Task<IEnumerable<Review>> GetUserReviewsAsync(string userId, int page = 1, int pageSize = 10)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Variant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Variants)
                .Include(r => r.Bundle)
                .Include(r => r.ReviewLikes)
                .Include(r => r.ReviewComments)
                    .ThenInclude(rc => rc.User)
                .Where(r => r.UserID == userId && !r.IsHidden)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> GetUserReviewCountAsync(string userId)
        {
            return await _context.Reviews
                .CountAsync(r => r.UserID == userId && !r.IsHidden);
        }

        public async Task<IEnumerable<PendingReviewItemDto>> GetPendingReviewsAsync(string userId)
        {
            var completedInvoices = await _context.Invoices
                .AsNoTracking()
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Variant)
                        .ThenInclude(v => v.Product)
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Bundle)
                .Where(i => i.UserID == userId && i.Status == OrderStatus.Completed)
                .ToListAsync();

            var reviewedContentTokens = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.UserID == userId && r.Content.StartsWith(InvoiceReviewPrefix))
                .Select(r => r.Content)
                .ToListAsync();

            var pendingItems = new List<PendingReviewItemDto>();

            // Fetch fallback images for variants that have no ImageUrl
            var productIdsForFallback = completedInvoices
                .SelectMany(i => i.InvoiceDetails)
                .Where(d => d.Variant != null && string.IsNullOrEmpty(d.Variant.ImageUrl) && d.Variant.ProductID > 0)
                .Select(d => d.Variant.ProductID)
                .Distinct()
                .ToList();

            var fallbackImages = new Dictionary<int, string>();
            if (productIdsForFallback.Any())
            {
                var variantImages = await _context.Variants
                    .AsNoTracking()
                    .Where(v => productIdsForFallback.Contains(v.ProductID) && !string.IsNullOrEmpty(v.ImageUrl))
                    .Select(v => new { v.ProductID, v.ImageUrl })
                    .ToListAsync();

                fallbackImages = variantImages
                    .GroupBy(v => v.ProductID)
                    .ToDictionary(g => g.Key, g => g.First().ImageUrl ?? string.Empty);
            }

            foreach (var invoice in completedInvoices)
            {
                foreach (var detail in invoice.InvoiceDetails)
                {
                    var marker = BuildInvoiceReviewMarker(invoice.InvoiceID, detail.InvoiceDetailID);
                    var isReviewed = reviewedContentTokens.Any(c => c.StartsWith(marker));

                    if (!isReviewed)
                    {
                        var imageUrl = detail.Variant?.ImageUrl;
                        if (string.IsNullOrEmpty(imageUrl) && detail.Variant != null)
                        {
                            fallbackImages.TryGetValue(detail.Variant.ProductID, out imageUrl);
                        }
                        imageUrl = imageUrl ?? detail.Bundle?.ImageUrl ?? string.Empty;

                        pendingItems.Add(new PendingReviewItemDto
                        {
                            InvoiceID = invoice.InvoiceID,
                            InvoiceDetailID = detail.InvoiceDetailID,
                            VariantID = detail.VariantID,
                            BundleID = detail.BundleID,
                            ProductName = detail.Variant?.Product?.ProductName ?? detail.Bundle?.Name ?? "Sản phẩm",
                            VariantName = detail.Variant?.VariantName ?? string.Empty,
                            ImageUrl = imageUrl,
                            PurchaseDate = invoice.CreatedAt ?? DateTime.Now
                        });
                    }
                }
            }

            return pendingItems;
        }

        #endregion

        #region Admin Functions

        public async Task<bool> HideReviewAsync(int reviewId)
        {
            var review = await _context.Reviews.FindAsync(reviewId);
            if (review == null) return false;

            review.IsHidden = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ShowReviewAsync(int reviewId)
        {
            var review = await _context.Reviews.FindAsync(reviewId);
            if (review == null) return false;

            review.IsHidden = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HideCommentAsync(int commentId)
        {
            var comment = await _context.ReviewComments.FindAsync(commentId);
            if (comment == null) return false;

            comment.IsHidden = true;
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion
    }
}


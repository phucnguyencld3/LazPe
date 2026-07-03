using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class ReviewService : IReviewService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILoyaltyService _loyaltyService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ReviewService> _logger;
        private const string InvoiceReviewPrefix = "[#INV:";

        public ReviewService(
            ApplicationDbContext context,
            ILoyaltyService loyaltyService,
            INotificationService notificationService,
            ILogger<ReviewService> logger)
        {
            _context = context;
            _loyaltyService = loyaltyService;
            _notificationService = notificationService;
            _logger = logger;
        }

        #region Review Management

        public async Task<Review> CreateReviewAsync(string userId, CreateReviewDto dto)
        {
            var existingReview = await GetUserReviewAsync(userId, dto.VariantID, dto.BundleID);
            if (existingReview != null)
            {
                throw new InvalidOperationException("Bạn đã đánh giá sản phẩm này rồi");
            }

            var moderationResult = await PerformAutoModerationAsync(dto.Content ?? "");
            if (moderationResult.Status == "Rejected")
            {
                throw new InvalidOperationException("Nội dung đánh giá chứa từ ngữ hoặc thông tin vi phạm chính sách cộng đồng. Vui lòng chỉnh sửa và gửi lại.");
            }

            var review = new Review
            {
                UserID = userId,
                VariantID = dto.VariantID ?? 0,
                BundleID = dto.BundleID,
                Rating = dto.Rating,
                Content = dto.Content ?? "",
                CreatedAt = DateTime.Now,
                IsHidden = moderationResult.Status == "AutoHidden",
                HasEarnedRewardPoints = false,
                LoyaltyPointsEarned = 0,
                AutoModerationStatus = moderationResult.Status,
                FlaggedReason = moderationResult.FlaggedReason,
                ViolationScore = moderationResult.ViolationScore
            };

            // Parse Media
            if (dto.Media != null && dto.Media.Any())
            {
                foreach (var mediaDto in dto.Media)
                {
                    review.ReviewMedia.Add(new ReviewMedia
                    {
                        Url = mediaDto.Url,
                        MediaType = mediaDto.MediaType.ToUpper(),
                        CreatedAt = DateTime.Now
                    });
                }
            }

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            if (moderationResult.Status == "AutoHidden")
            {
                try
                {
                    var notifDto = new CreateNotificationDto
                    {
                        Title = "Cảnh báo đánh giá vi phạm",
                        ShortDescription = $"Một đánh giá đã bị tự động ẩn do chứa từ khóa vi phạm: {moderationResult.FlaggedReason}.",
                        Content = $"<p>Hệ thống tự động phát hiện đánh giá vi phạm của người dùng. Trạng thái: <strong>Tự động ẩn</strong>. Lý do: {moderationResult.FlaggedReason}.</p>",
                        Type = NotificationType.System,
                        Priority = NotificationPriority.High,
                        ActionType = ActionType.CustomUrl,
                        ActionUrl = "/admin/reviews",
                        TargetType = TargetType.Role,
                        TargetValue = "Admin",
                        PublishedAt = DateTime.Now
                    };
                    await _notificationService.CreateNotificationAsync(notifDto, "System");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi thông báo cho Admin về đánh giá bị tự động ẩn.");
                }
            }

            await UpdateProductRatingCacheAsync(review.VariantID);

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
                .Include(r => r.ReviewMedia)
                .Include(r => r.CensorshipLogs)
                    .ThenInclude(l => l.Actor)
                .Include(r => r.ReviewComments)
                    .ThenInclude(rc => rc.User)
                .FirstOrDefaultAsync(r => r.ReviewID == reviewId);
        }

        public async Task<bool> UpdateReviewAsync(int reviewId, string userId, UpdateReviewDto dto)
        {
            var review = await _context.Reviews
                .Include(r => r.ReviewMedia)
                .Include(r => r.CensorshipLogs)
                .FirstOrDefaultAsync(r => r.ReviewID == reviewId && r.UserID == userId);

            if (review == null) return false;

            var settings = await _context.LoyaltySettings.FirstOrDefaultAsync() ?? new LoyaltySetting();

            // Time limit validation
            if (DateTime.Now - review.CreatedAt > TimeSpan.FromMinutes(settings.AllowEditReviewTimeLimitMinutes))
            {
                throw new InvalidOperationException($"Không thể chỉnh sửa đánh giá quá {settings.AllowEditReviewTimeLimitMinutes} phút kể từ khi tạo.");
            }

            // Censorship validation - cannot edit if censored by Admin
            if (review.IsHidden || review.CensorshipLogs.Any(l => l.Action == "HIDE"))
            {
                throw new InvalidOperationException("Đánh giá đã bị kiểm duyệt và ẩn bởi quản trị viên, không thể chỉnh sửa.");
            }

            var reviewContent = (dto.Content ?? string.Empty).Trim();
            var moderationResult = await PerformAutoModerationAsync(reviewContent);
            if (moderationResult.Status == "Rejected")
            {
                throw new InvalidOperationException("Nội dung đánh giá chứa từ ngữ hoặc thông tin vi phạm chính sách cộng đồng. Vui lòng chỉnh sửa và gửi lại.");
            }

            review.Rating = dto.Rating;
            
            // Retain the invoice marker prefix if present
            var marker = "";
            var originalContent = review.Content ?? "";
            if (originalContent.StartsWith(InvoiceReviewPrefix))
            {
                var endIndex = originalContent.IndexOf(']');
                if (endIndex != -1)
                {
                    marker = originalContent.Substring(0, endIndex + 1);
                }
            }

            if (!string.IsNullOrEmpty(marker))
            {
                review.Content = string.IsNullOrWhiteSpace(reviewContent) ? marker : $"{marker}\n{reviewContent}";
            }
            else
            {
                review.Content = reviewContent;
            }

            review.UpdatedAt = DateTime.Now;
            review.AutoModerationStatus = moderationResult.Status;
            review.FlaggedReason = moderationResult.FlaggedReason;
            review.ViolationScore = moderationResult.ViolationScore;
            review.IsHidden = moderationResult.Status == "AutoHidden";

            // Update Media
            _context.ReviewMedia.RemoveRange(review.ReviewMedia);
            review.ReviewMedia.Clear();

            if (dto.Media != null && dto.Media.Any())
            {
                foreach (var mediaDto in dto.Media)
                {
                    review.ReviewMedia.Add(new ReviewMedia
                    {
                        Url = mediaDto.Url,
                        MediaType = mediaDto.MediaType.ToUpper(),
                        CreatedAt = DateTime.Now
                    });
                }
            }

            await _context.SaveChangesAsync();

            if (moderationResult.Status == "AutoHidden")
            {
                try
                {
                    var notifDto = new CreateNotificationDto
                    {
                        Title = "Cảnh báo đánh giá vi phạm",
                        ShortDescription = $"Một đánh giá đã bị tự động ẩn do chứa từ khóa vi phạm: {moderationResult.FlaggedReason}.",
                        Content = $"<p>Hệ thống tự động phát hiện đánh giá vi phạm được chỉnh sửa. Trạng thái: <strong>Tự động ẩn</strong>. Lý do: {moderationResult.FlaggedReason}.</p>",
                        Type = NotificationType.System,
                        Priority = NotificationPriority.High,
                        ActionType = ActionType.CustomUrl,
                        ActionUrl = "/admin/reviews",
                        TargetType = TargetType.Role,
                        TargetValue = "Admin",
                        PublishedAt = DateTime.Now
                    };
                    await _notificationService.CreateNotificationAsync(notifDto, "System");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi thông báo cho Admin về đánh giá bị tự động ẩn.");
                }
            }

            await UpdateProductRatingCacheAsync(review.VariantID);

            return true;
        }

        public async Task<bool> DeleteReviewAsync(int reviewId, string userId)
        {
            var review = await _context.Reviews
                .Include(r => r.ReviewLikes)
                .Include(r => r.ReviewComments)
                .Include(r => r.ReviewMedia)
                .Include(r => r.CensorshipLogs)
                .FirstOrDefaultAsync(r => r.ReviewID == reviewId && r.UserID == userId);

            if (review == null) return false;

            // Check if review has already been censored/processed by admin
            if (review.IsHidden || review.CensorshipLogs.Any())
            {
                throw new InvalidOperationException("Không thể xóa đánh giá đã bị kiểm duyệt bởi quản trị viên.");
            }

            // Revoke loyalty points if earned
            if (review.HasEarnedRewardPoints && review.LoyaltyPointsEarned > 0)
            {
                try
                {
                    await _loyaltyService.AddPointsAsync(userId, -review.LoyaltyPointsEarned, "REVOKE", $"Thu hồi điểm do xóa đánh giá ID {review.ReviewID}", null);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi thu hồi điểm loyalty cho user {UserId} khi xóa review {ReviewId}", userId, reviewId);
                }
            }

            // Delete related records
            _context.ReviewLikes.RemoveRange(review.ReviewLikes);
            _context.ReviewComments.RemoveRange(review.ReviewComments);
            _context.ReviewMedia.RemoveRange(review.ReviewMedia);
            _context.Reviews.Remove(review);

            await _context.SaveChangesAsync();

            await UpdateProductRatingCacheAsync(review.VariantID);

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
                    .ThenInclude(d => d.Variant)
                        .ThenInclude(v => v.Product)
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Bundle)
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
            var moderationResult = await PerformAutoModerationAsync(reviewContent);
            if (moderationResult.Status == "Rejected")
            {
                throw new InvalidOperationException("Nội dung đánh giá chứa từ ngữ hoặc thông tin vi phạm chính sách cộng đồng. Vui lòng chỉnh sửa và gửi lại.");
            }

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
                IsHidden = moderationResult.Status == "AutoHidden",
                HasEarnedRewardPoints = false,
                LoyaltyPointsEarned = 0,
                AutoModerationStatus = moderationResult.Status,
                FlaggedReason = moderationResult.FlaggedReason,
                ViolationScore = moderationResult.ViolationScore
            };

            // Parse media
            if (dto.Media != null && dto.Media.Any())
            {
                foreach (var mediaDto in dto.Media)
                {
                    review.ReviewMedia.Add(new ReviewMedia
                    {
                        Url = mediaDto.Url,
                        MediaType = mediaDto.MediaType.ToUpper(),
                        CreatedAt = DateTime.Now
                    });
                }
            }

            // Word and Char counts (exclude prefix marker)
            var charCount = reviewContent.Length;
            var wordCount = string.IsNullOrWhiteSpace(reviewContent) ? 0 : reviewContent.Split(new[] { ' ', '\r', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries).Length;

            // Load configuration
            var settings = await _context.LoyaltySettings.FirstOrDefaultAsync() ?? new LoyaltySetting();

            // Date validation (must review within configured days after receipt)
            if (settings.MaxReviewDaysAfterReceipt > 0 && invoice.CreatedAt.HasValue)
            {
                if (DateTime.Now - invoice.CreatedAt.Value > TimeSpan.FromDays(settings.MaxReviewDaysAfterReceipt))
                {
                    throw new InvalidOperationException($"Thời gian đánh giá sản phẩm đã hết hạn (Giới hạn trong vòng {settings.MaxReviewDaysAfterReceipt} ngày kể từ khi mua).");
                }
            }

            // Check eligibility for loyalty reward
            bool qualifyForReward = settings.EnableReviewReward
                && dto.Rating >= settings.RequiredRatingForReward
                && (charCount >= settings.MinimumReviewChars || wordCount >= settings.MinimumReviewWords)
                && moderationResult.Status != "AutoHidden";

            // Check if already rewarded for the product
            bool alreadyRewarded = false;
            if (qualifyForReward && !settings.AllowMultipleRewardsPerProduct)
            {
                if (invoiceItem.VariantID.HasValue && invoiceItem.VariantID.Value > 0)
                {
                    var productID = await _context.Variants
                        .Where(v => v.VariantID == invoiceItem.VariantID.Value)
                        .Select(v => v.ProductID)
                        .FirstOrDefaultAsync();

                    alreadyRewarded = await _context.Reviews
                        .AnyAsync(r => r.UserID == userId
                            && r.HasEarnedRewardPoints
                            && _context.Variants.Any(v => v.VariantID == r.VariantID && v.ProductID == productID));
                }
                else if (invoiceItem.BundleID.HasValue)
                {
                    alreadyRewarded = await _context.Reviews
                        .AnyAsync(r => r.UserID == userId
                            && r.HasEarnedRewardPoints
                            && r.BundleID == invoiceItem.BundleID.Value);
                }
            }

            if (qualifyForReward && !alreadyRewarded)
            {
                // Determine reward amount based on media content type
                int rewardPoints = settings.ReviewRewardPoints;
                if (review.ReviewMedia.Any(m => m.MediaType == "VIDEO"))
                {
                    rewardPoints = settings.ReviewWithVideoRewardPoints;
                }
                else if (review.ReviewMedia.Any(m => m.MediaType == "IMAGE"))
                {
                    rewardPoints = settings.ReviewWithImageRewardPoints;
                }

                review.HasEarnedRewardPoints = true;
                review.LoyaltyPointsEarned = rewardPoints;
            }

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            if (moderationResult.Status == "AutoHidden")
            {
                try
                {
                    var notifDto = new CreateNotificationDto
                    {
                        Title = "Cảnh báo đánh giá vi phạm",
                        ShortDescription = $"Một đánh giá đã bị tự động ẩn do chứa từ khóa vi phạm: {moderationResult.FlaggedReason}.",
                        Content = $"<p>Hệ thống tự động phát hiện đánh giá vi phạm của người dùng. Trạng thái: <strong>Tự động ẩn</strong>. Lý do: {moderationResult.FlaggedReason}.</p>",
                        Type = NotificationType.System,
                        Priority = NotificationPriority.High,
                        ActionType = ActionType.CustomUrl,
                        ActionUrl = "/admin/reviews",
                        TargetType = TargetType.Role,
                        TargetValue = "Admin",
                        PublishedAt = DateTime.Now
                    };
                    await _notificationService.CreateNotificationAsync(notifDto, "System");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi thông báo cho Admin về đánh giá bị tự động ẩn.");
                }
            }

            // Reward loyalty points
            if (review.HasEarnedRewardPoints && review.LoyaltyPointsEarned > 0)
            {
                var productName = invoiceItem.Variant?.Product?.ProductName
                    ?? invoiceItem.Bundle?.Name
                    ?? "sản phẩm";
                var description = $"Thưởng điểm đánh giá sản phẩm {productName}";

                await _loyaltyService.AddPointsAsync(userId, review.LoyaltyPointsEarned, "EARN", description, dto.InvoiceID);

                try
                {
                    var notifDto = new CreateNotificationDto
                    {
                        Title = "Nhận điểm thưởng đánh giá",
                        ShortDescription = $"Bạn đã nhận được {review.LoyaltyPointsEarned} điểm thưởng từ chương trình đánh giá sản phẩm.",
                        Content = $"<p>Cảm ơn bạn đã đóng góp đánh giá sản phẩm. Bạn đã được cộng <strong>{review.LoyaltyPointsEarned} điểm</strong> vào tài khoản Loyalty.</p>",
                        Type = NotificationType.RewardPoints,
                        Priority = NotificationPriority.Medium,
                        ActionType = ActionType.CustomUrl,
                        ActionUrl = "/profile?tab=loyalty",
                        TargetType = TargetType.SpecificUsers,
                        TargetValue = userId,
                        PublishedAt = DateTime.Now
                    };
                    await _notificationService.CreateNotificationAsync(notifDto, "System");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi thông báo điểm thưởng cho user {UserId}", userId);
                }
            }
            else if (!qualifyForReward && settings.EnableReviewReward)
            {
                try
                {
                    var notifDto = new CreateNotificationDto
                    {
                        Title = "Đánh giá chưa đủ điều kiện nhận thưởng",
                        ShortDescription = $"Đánh giá cần tối thiểu {settings.MinimumReviewChars} ký tự và đạt {settings.RequiredRatingForReward} sao để nhận điểm thưởng.",
                        Content = $"<p>Đánh giá của bạn chưa đủ điều kiện nhận điểm thưởng Loyalty. Để nhận điểm thưởng, đánh giá cần có tối thiểu <strong>{settings.MinimumReviewChars} ký tự</strong> và đạt mức đánh giá <strong>{settings.RequiredRatingForReward} sao</strong>.</p>",
                        Type = NotificationType.RewardPoints,
                        Priority = NotificationPriority.Low,
                        ActionType = ActionType.CustomUrl,
                        ActionUrl = "/profile?tab=loyalty",
                        TargetType = TargetType.SpecificUsers,
                        TargetValue = userId,
                        PublishedAt = DateTime.Now
                    };
                    await _notificationService.CreateNotificationAsync(notifDto, "System");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi thông báo nhắc nhở điều kiện nhận thưởng cho user {UserId}", userId);
                }
            }

            await UpdateProductRatingCacheAsync(review.VariantID);

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
                .Include(r => r.ReviewMedia)
                .Include(r => r.CensorshipLogs)
                    .ThenInclude(l => l.Actor)
                .Include(r => r.ReviewComments)
                    .ThenInclude(rc => rc.User)
                .AsQueryable();

            // Apply Hide status filter (for Admin view)
            if (searchDto.IsHidden.HasValue)
            {
                query = query.Where(r => r.IsHidden == searchDto.IsHidden.Value);
            }

            // Apply media filter
            if (searchDto.HasMedia.HasValue)
            {
                if (searchDto.HasMedia.Value)
                    query = query.Where(r => r.ReviewMedia.Any());
                else
                    query = query.Where(r => !r.ReviewMedia.Any());
            }

            // Apply filters
            if (searchDto.BundleID.HasValue)
                query = query.Where(r => r.BundleID == searchDto.BundleID.Value);

            if (searchDto.VariantID.HasValue)
                query = query.Where(r => r.VariantID == searchDto.VariantID.Value);

            if (searchDto.Rating.HasValue)
                query = query.Where(r => r.Rating == searchDto.Rating.Value);

            if (!string.IsNullOrEmpty(searchDto.SearchTerm))
                query = query.Where(r => r.Content.Contains(searchDto.SearchTerm) || (r.User != null && r.User.FullName.Contains(searchDto.SearchTerm)));

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
                .Include(r => r.ReviewMedia)
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
                .Include(r => r.ReviewMedia)
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
                .Include(r => r.ReviewMedia)
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

        private async Task UpdateProductRatingCacheAsync(int? variantId)
        {
            if (!variantId.HasValue || variantId.Value <= 0) return;

            var variant = await _context.Variants.AsNoTracking().FirstOrDefaultAsync(v => v.VariantID == variantId.Value);
            if (variant != null)
            {
                var productId = variant.ProductID;
                
                var stats = await _context.Reviews
                    .Where(r => !r.IsHidden && r.Variant != null && r.Variant.ProductID == productId)
                    .GroupBy(r => r.Variant!.ProductID)
                    .Select(g => new
                    {
                        AverageRating = g.Average(r => (double)r.Rating),
                        RatingCount = g.Count()
                    })
                    .FirstOrDefaultAsync();

                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductID == productId);
                if (product != null)
                {
                    product.AverageRating = stats != null ? Math.Round(stats.AverageRating, 1) : 0;
                    product.ReviewCount = stats?.RatingCount ?? 0;
                    await _context.SaveChangesAsync();
                }
            }
        }

        #endregion

        #region Review Likes

        public async Task<bool> ToggleReviewLikeAsync(int reviewId, string userId)
        {
            var existingLike = await _context.ReviewLikes
                .FirstOrDefaultAsync(rl => rl.ReviewID == reviewId && rl.UserID == userId);

            if (existingLike != null)
            {
                _context.ReviewLikes.Remove(existingLike);
                await _context.SaveChangesAsync();
                return false;
            }
            else
            {
                var like = new ReviewLike
                {
                    ReviewID = reviewId,
                    UserID = userId,
                    CreatedAt = DateTime.Now
                };
                _context.ReviewLikes.Add(like);
                await _context.SaveChangesAsync();
                return true;
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
                        .ThenInclude(p => p.Images)
                .Include(r => r.Bundle)
                .Include(r => r.ReviewLikes)
                .Include(r => r.ReviewMedia)
                .Include(r => r.ReviewComments)
                    .ThenInclude(rc => rc.User)
                .Where(r => r.UserID == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> GetUserReviewCountAsync(string userId)
        {
            return await _context.Reviews
                .CountAsync(r => r.UserID == userId);
        }

        public async Task<IEnumerable<PendingReviewItemDto>> GetPendingReviewsAsync(string userId)
        {
            var completedInvoices = await _context.Invoices
                .AsNoTracking()
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.Images)
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
                        
                        // Nếu variant không có ảnh, lấy ảnh của sản phẩm
                        if (string.IsNullOrEmpty(imageUrl) && detail.Variant?.Product?.Images != null && detail.Variant.Product.Images.Any())
                        {
                            imageUrl = detail.Variant.Product.Images.OrderBy(img => img.DisplayOrder).FirstOrDefault()?.ImageUrl;
                        }

                        // Nếu vẫn không có, tìm ảnh của variant khác cùng sản phẩm
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

            await UpdateProductRatingCacheAsync(review.VariantID);

            return true;
        }

        public async Task<bool> ShowReviewAsync(int reviewId)
        {
            var review = await _context.Reviews.FindAsync(reviewId);
            if (review == null) return false;

            review.IsHidden = false;
            await _context.SaveChangesAsync();

            await UpdateProductRatingCacheAsync(review.VariantID);

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

        public async Task<bool> CensorReviewAsync(string actorId, CensorReviewDto dto)
        {
            var review = await _context.Reviews
                .Include(r => r.CensorshipLogs)
                .Include(r => r.Variant)
                    .ThenInclude(v => v.Product)
                .Include(r => r.Bundle)
                .FirstOrDefaultAsync(r => r.ReviewID == dto.ReviewID);

            if (review == null) return false;

            var actionUpper = dto.Action.ToUpper();
            if (actionUpper == "HIDE")
            {
                review.IsHidden = true;
                review.CensorshipReason = dto.Reason;
                review.AutoModerationStatus = "Rejected";

                // Revoke loyalty points if earned
                if (review.HasEarnedRewardPoints && review.LoyaltyPointsEarned > 0)
                {
                    try
                    {
                        await _loyaltyService.AddPointsAsync(review.UserID, -review.LoyaltyPointsEarned, "REVOKE", $"Thu hồi điểm do đánh giá ID {review.ReviewID} bị ẩn bởi kiểm duyệt: {dto.Reason}", null);
                        review.HasEarnedRewardPoints = false;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Lỗi khi thu hồi điểm loyalty cho user {UserId} khi ẩn review {ReviewId}", review.UserID, review.ReviewID);
                    }
                }
            }
            else if (actionUpper == "RESTORE")
            {
                bool wasHidden = review.IsHidden;
                review.IsHidden = false;
                review.CensorshipReason = null;
                review.AutoModerationStatus = "Approved";

                // If restored, check if we should award/restore loyalty points
                if (wasHidden && !review.HasEarnedRewardPoints)
                {
                    var settings = await _context.LoyaltySettings.FirstOrDefaultAsync() ?? new LoyaltySetting();
                    if (settings.EnableReviewReward && review.Rating >= settings.RequiredRatingForReward)
                    {
                        // Calculate word/char count, ignoring the invoice marker prefix
                        var reviewContent = review.Content ?? "";
                        if (reviewContent.StartsWith(InvoiceReviewPrefix))
                        {
                            var endIndex = reviewContent.IndexOf(']');
                            if (endIndex != -1)
                            {
                                reviewContent = reviewContent.Substring(endIndex + 1).Trim();
                            }
                        }
                        var charCount = reviewContent.Length;
                        var wordCount = string.IsNullOrWhiteSpace(reviewContent) ? 0 : reviewContent.Split(new[] { ' ', '\r', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries).Length;

                        if (charCount >= settings.MinimumReviewChars || wordCount >= settings.MinimumReviewWords)
                        {
                            // Determine reward points amount
                            int rewardPoints = settings.ReviewRewardPoints;
                            // Load media to check
                            var media = await _context.ReviewMedia.Where(m => m.ReviewID == review.ReviewID).ToListAsync();
                            if (media.Any(m => m.MediaType == "VIDEO"))
                            {
                                rewardPoints = settings.ReviewWithVideoRewardPoints;
                            }
                            else if (media.Any(m => m.MediaType == "IMAGE"))
                            {
                                rewardPoints = settings.ReviewWithImageRewardPoints;
                            }

                            review.HasEarnedRewardPoints = true;
                            review.LoyaltyPointsEarned = rewardPoints;

                            // Award points
                            var productName = review.Variant?.Product?.ProductName
                                ?? review.Bundle?.Name
                                ?? "sản phẩm";
                            var description = $"Thưởng điểm đánh giá sản phẩm {productName} (Phục hồi sau kiểm duyệt)";

                            try
                            {
                                await _loyaltyService.AddPointsAsync(review.UserID, rewardPoints, "EARN", description, null);

                                // Send notification to user about points
                                var rewardNotifDto = new CreateNotificationDto
                                {
                                    Title = "Nhận điểm thưởng đánh giá",
                                    ShortDescription = $"Bạn đã nhận được {rewardPoints} điểm thưởng từ chương trình đánh giá sản phẩm sau khi duyệt.",
                                    Content = $"<p>Đánh giá của bạn đã được kiểm duyệt và hiển thị lại. Bạn đã được cộng <strong>{rewardPoints} điểm</strong> vào tài khoản Loyalty.</p>",
                                    Type = NotificationType.RewardPoints,
                                    Priority = NotificationPriority.Medium,
                                    ActionType = ActionType.CustomUrl,
                                    ActionUrl = "/profile?tab=loyalty",
                                    TargetType = TargetType.SpecificUsers,
                                    TargetValue = review.UserID,
                                    PublishedAt = DateTime.Now
                                };
                                await _notificationService.CreateNotificationAsync(rewardNotifDto, "System");
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Lỗi khi cộng điểm thưởng loyalty khi khôi phục review {ReviewId} cho user {UserId}", review.ReviewID, review.UserID);
                            }
                        }
                    }
                }
            }
            else
            {
                throw new ArgumentException("Hành động kiểm duyệt không hợp lệ (Chỉ chấp nhận HIDE hoặc RESTORE).");
            }

            // Create Log
            var log = new ReviewCensorshipLog
            {
                ReviewID = review.ReviewID,
                ActorID = actorId,
                Action = actionUpper,
                Reason = dto.Reason,
                Timestamp = DateTime.Now
            };

            _context.ReviewCensorshipLogs.Add(log);
            await _context.SaveChangesAsync();

            // Send notification to user about censorship
            try
            {
                var title = actionUpper == "HIDE" ? "Đánh giá của bạn đã bị ẩn" : "Đánh giá của bạn đã được hiển thị lại";
                var description = actionUpper == "HIDE" 
                    ? $"Đánh giá của bạn đã bị quản trị viên ẩn do vi phạm quy chuẩn. Lý do: {dto.Reason}"
                    : "Đánh giá của bạn đã được quản trị viên duyệt hiển thị lại.";

                var notifDto = new CreateNotificationDto
                {
                    Title = title,
                    ShortDescription = description,
                    Content = $"<p>{description}</p>",
                    Type = NotificationType.System,
                    Priority = NotificationPriority.Medium,
                    ActionType = ActionType.CustomUrl,
                    ActionUrl = "/profile?tab=reviews",
                    TargetType = TargetType.SpecificUsers,
                    TargetValue = review.UserID,
                    PublishedAt = DateTime.Now
                };
                await _notificationService.CreateNotificationAsync(notifDto, "System");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi thông báo kiểm duyệt cho user {UserId}", review.UserID);
            }

            await UpdateProductRatingCacheAsync(review.VariantID);

            return true;
        }

        public async Task<ReviewAdminStatsDto> GetReviewAdminStatsAsync()
        {
            var reviews = await _context.Reviews.AsNoTracking().ToListAsync();

            var totalReviews = reviews.Count;
            var hiddenReviews = reviews.Count(r => r.IsHidden);
            var visibleReviews = totalReviews - hiddenReviews;

            var activeReviews = reviews.Where(r => !r.IsHidden).ToList();
            var averageRating = activeReviews.Any() ? activeReviews.Average(r => r.Rating) : 0;

            var ratingDistribution = reviews
                .GroupBy(r => r.Rating)
                .ToDictionary(g => g.Key, g => g.Count());

            // Fill missing keys 1 to 5
            for (int i = 1; i <= 5; i++)
            {
                if (!ratingDistribution.ContainsKey(i))
                {
                    ratingDistribution[i] = 0;
                }
            }

            return new ReviewAdminStatsDto
            {
                TotalReviews = totalReviews,
                HiddenReviews = hiddenReviews,
                VisibleReviews = visibleReviews,
                AverageRating = Math.Round(averageRating, 1),
                RatingDistribution = ratingDistribution
            };
        }

        public async Task<IEnumerable<ReviewCensorshipLogDto>> GetCensorshipLogsAsync(int reviewId)
        {
            return await _context.ReviewCensorshipLogs
                .Include(l => l.Actor)
                .Where(l => l.ReviewID == reviewId)
                .OrderByDescending(l => l.Timestamp)
                .Select(l => new ReviewCensorshipLogDto
                {
                    LogID = l.LogID,
                    ReviewID = l.ReviewID,
                    ActorID = l.ActorID,
                    ActorName = l.Actor != null ? l.Actor.FullName : "Quản trị viên",
                    Action = l.Action,
                    Reason = l.Reason,
                    Timestamp = l.Timestamp
                })
                .ToListAsync();
        }

        public async Task<LoyaltySetting> GetLoyaltySettingAsync()
        {
            return await _context.LoyaltySettings.FirstOrDefaultAsync() ?? new LoyaltySetting();
        }

        public async Task<bool> UpdateLoyaltySettingAsync(LoyaltySetting setting)
        {
            var existing = await _context.LoyaltySettings.FirstOrDefaultAsync(s => s.Id == setting.Id);
            if (existing == null)
            {
                _context.LoyaltySettings.Add(setting);
            }
            else
            {
                existing.EnableReviewReward = setting.EnableReviewReward;
                existing.ReviewRewardPoints = setting.ReviewRewardPoints;
                existing.MinimumReviewWords = setting.MinimumReviewWords;
                existing.RequiredRatingForReward = setting.RequiredRatingForReward;
                existing.AllowMultipleRewardsPerProduct = setting.AllowMultipleRewardsPerProduct;

                existing.ReviewWithImageRewardPoints = setting.ReviewWithImageRewardPoints;
                existing.ReviewWithVideoRewardPoints = setting.ReviewWithVideoRewardPoints;
                existing.MinimumReviewChars = setting.MinimumReviewChars;
                existing.AllowEditReviewTimeLimitMinutes = setting.AllowEditReviewTimeLimitMinutes;
                existing.MaxReviewDaysAfterReceipt = setting.MaxReviewDaysAfterReceipt;
                existing.RequireDeliveryToReview = setting.RequireDeliveryToReview;
                existing.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ModerationDashboardDto> GetModerationDashboardAsync()
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Variant)
                    .ThenInclude(v => v.Product)
                .ToListAsync();

            var result = new ModerationDashboardDto
            {
                TotalNeedsReview = reviews.Count(r => r.AutoModerationStatus == "NeedsReview"),
                TotalFlagged = reviews.Count(r => r.ViolationScore > 0),
                TotalAutoHidden = reviews.Count(r => r.AutoModerationStatus == "AutoHidden")
            };

            // Calculate Top Keywords
            var keywordCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var flaggedReviews = reviews.Where(r => r.ViolationScore > 0 && !string.IsNullOrEmpty(r.FlaggedReason)).ToList();

            foreach (var r in flaggedReviews)
            {
                var reason = r.FlaggedReason!;
                var colonIndex = reason.IndexOf(':');
                if (colonIndex != -1)
                {
                    var wordListStr = reason[(colonIndex + 1)..].Trim();
                    var words = wordListStr.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
                    foreach (var word in words)
                    {
                        if (keywordCounts.ContainsKey(word))
                            keywordCounts[word]++;
                        else
                            keywordCounts[word] = 1;
                    }
                }
            }

            result.TopKeywords = keywordCounts
                .OrderByDescending(kv => kv.Value)
                .Take(5)
                .Select(kv => new KeywordCountDto { Keyword = kv.Key, Count = kv.Value })
                .ToList();

            // Calculate Top Products
            result.TopProducts = reviews
                .Where(r => r.ViolationScore > 0 && r.Variant?.Product != null)
                .GroupBy(r => r.Variant.Product.ProductName)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => new ProductCountDto { ProductName = g.Key, Count = g.Count() })
                .ToList();

            // Calculate Top Users
            result.TopUsers = reviews
                .Where(r => r.ViolationScore > 0 && r.User != null)
                .GroupBy(r => r.User.FullName)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => new UserCountDto { UserFullName = g.Key, Count = g.Count() })
                .ToList();

            return result;
        }

        private async Task<AutoModerationResult> PerformAutoModerationAsync(string content)
        {
            var result = new AutoModerationResult();
            if (string.IsNullOrWhiteSpace(content)) return result;

            var keywords = await _context.ReviewSensitiveKeywords.ToListAsync();
            var matchedKeywords = new List<ReviewSensitiveKeyword>();

            foreach (var kw in keywords)
            {
                if (content.Contains(kw.Word, StringComparison.OrdinalIgnoreCase))
                {
                    matchedKeywords.Add(kw);
                }
            }

            if (!matchedKeywords.Any()) return result;

            var criticalMatches = matchedKeywords.Where(k => k.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase)).ToList();
            var mediumMatches = matchedKeywords.Where(k => k.Severity.Equals("Medium", StringComparison.OrdinalIgnoreCase)).ToList();
            var warningMatches = matchedKeywords.Where(k => k.Severity.Equals("Warning", StringComparison.OrdinalIgnoreCase)).ToList();

            if (criticalMatches.Any())
            {
                result.Status = "Rejected";
                result.FlaggedReason = $"Vi phạm nghiêm trọng: {string.Join(", ", criticalMatches.Select(m => m.Word))}";
                result.ViolationScore = 3;
            }
            else if (mediumMatches.Any())
            {
                result.Status = "AutoHidden";
                result.FlaggedReason = $"Tự động ẩn: {string.Join(", ", mediumMatches.Select(m => m.Word))}";
                result.ViolationScore = 2;
            }
            else if (warningMatches.Any())
            {
                result.Status = "NeedsReview";
                result.FlaggedReason = $"Cần xem xét: {string.Join(", ", warningMatches.Select(m => m.Word))}";
                result.ViolationScore = 1;
            }

            return result;
        }

        private class AutoModerationResult
        {
            public string Status { get; set; } = "Approved";
            public string? FlaggedReason { get; set; }
            public int ViolationScore { get; set; }
        }

        #endregion
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System.Security.Claims;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(IReviewService reviewService, ILogger<ReviewController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetProductReviews(int productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var reviews = await _reviewService.GetProductReviewsAsync(productId, page, pageSize);
                var userId = GetCurrentUserId();
                var reviewDtos = reviews.Select(r => MapReviewToDto(r, userId)).ToList();

                var stats = await _reviewService.GetProductReviewStatsAsync(productId);

                var response = new ReviewListResponseDto
                {
                    Reviews = reviewDtos,
                    Stats = stats,
                    TotalCount = stats.TotalReviews,
                    Page = page,
                    PageSize = pageSize
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product reviews for product {ProductId}", productId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy đánh giá sản phẩm" });
            }
        }

        [HttpGet("reviewable-items/{invoiceId}")]
        [Authorize]
        public async Task<IActionResult> GetReviewableItems(int invoiceId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var items = await _reviewService.GetReviewableItemsAsync(userId, invoiceId);
                return Ok(new { success = true, data = items });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reviewable items for invoice {InvoiceId}", invoiceId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi tải danh sách đánh giá" });
            }
        }

        [HttpPost("from-invoice")]
        [Authorize]
        public async Task<IActionResult> CreateReviewFromInvoice([FromBody] CreateInvoiceReviewDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var review = await _reviewService.CreateReviewFromInvoiceAsync(userId, dto);
                var reviewDto = MapReviewToDto(review, userId);

                return Ok(new { success = true, message = "Đánh giá thành công", data = reviewDto });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review from invoice {InvoiceId}", dto.InvoiceID);
                return StatusCode(500, new { success = false, message = "Có lỗi khi tạo đánh giá" });
            }
        }

        #region Review Management

        /// <summary>
        /// Tạo đánh giá mới
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            if (!ModelState.IsValid || !dto.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                if (!await _reviewService.CanUserReviewAsync(userId, dto.VariantID, dto.BundleID))
                {
                    return BadRequest(new { success = false, message = "Bạn đã đánh giá sản phẩm này rồi" });
                }

                var review = await _reviewService.CreateReviewAsync(userId, dto);
                var reviewDto = MapReviewToDto(review, userId);

                _logger.LogInformation("User {UserId} created review {ReviewId}", userId, review.ReviewID);

                return CreatedAtAction(nameof(GetReview), new { id = review.ReviewID },
                    new { success = true, message = "Tạo đánh giá thành công", data = reviewDto });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review");
                return StatusCode(500, new { success = false, message = "Có lỗi khi tạo đánh giá" });
            }
        }

        /// <summary>
        /// Lấy đánh giá theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReview(int id)
        {
            try
            {
                var review = await _reviewService.GetReviewByIdAsync(id);
                if (review == null || (review.IsHidden && !User.IsInRole("Admin")))
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đánh giá" });
                }

                var userId = GetCurrentUserId();
                var reviewDto = MapReviewToDto(review, userId);

                return Ok(new { success = true, data = reviewDto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review {ReviewId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy đánh giá" });
            }
        }

        /// <summary>
        /// Cập nhật đánh giá
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewDto dto)
        {
            if (id != dto.ReviewID)
            {
                return BadRequest(new { success = false, message = "ID không khớp" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var success = await _reviewService.UpdateReviewAsync(id, userId, dto);
                if (!success)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đánh giá hoặc bạn không có quyền sửa" });
                }

                var updatedReview = await _reviewService.GetReviewByIdAsync(id);
                var reviewDto = MapReviewToDto(updatedReview!, userId);

                return Ok(new { success = true, message = "Cập nhật đánh giá thành công", data = reviewDto });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review {ReviewId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi khi cập nhật đánh giá" });
            }
        }

        /// <summary>
        /// Xóa đánh giá
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var success = await _reviewService.DeleteReviewAsync(id, userId);
                if (!success)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đánh giá hoặc bạn không có quyền xóa" });
                }

                return Ok(new { success = true, message = "Xóa đánh giá thành công" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi khi xóa đánh giá" });
            }
        }

        #endregion

        #region Review Queries

        /// <summary>
        /// Tìm kiếm đánh giá
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> SearchReviews([FromQuery] ReviewSearchDto searchDto)
        {
            try
            {
                if (!User.IsInRole("Admin"))
                {
                    searchDto.IsHidden = false;
                }

                var reviews = await _reviewService.GetReviewsAsync(searchDto);
                var userId = GetCurrentUserId();
                var reviewDtos = reviews.Select(r => MapReviewToDto(r, userId)).ToList();

                var totalCount = await _reviewService.GetReviewCountAsync(searchDto.BundleID, searchDto.VariantID);
                var stats = await _reviewService.GetReviewStatsAsync(searchDto.BundleID, searchDto.VariantID);

                var response = new ReviewListResponseDto
                {
                    Reviews = reviewDtos,
                    Stats = stats,
                    TotalCount = totalCount,
                    Page = searchDto.Page,
                    PageSize = searchDto.PageSize
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching reviews");
                return StatusCode(500, new { success = false, message = "Có lỗi khi tìm kiếm đánh giá" });
            }
        }

        /// <summary>
        /// Lấy đánh giá của bundle
        /// </summary>
        [HttpGet("bundle/{bundleId}")]
        public async Task<IActionResult> GetBundleReviews(int bundleId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var reviews = await _reviewService.GetBundleReviewsAsync(bundleId, page, pageSize);
                var userId = GetCurrentUserId();
                var reviewDtos = reviews.Select(r => MapReviewToDto(r, userId)).ToList();

                var stats = await _reviewService.GetReviewStatsAsync(bundleId: bundleId);
                var totalCount = await _reviewService.GetReviewCountAsync(bundleId: bundleId);

                var response = new ReviewListResponseDto
                {
                    Reviews = reviewDtos,
                    Stats = stats,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bundle reviews for bundle {BundleId}", bundleId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy đánh giá combo" });
            }
        }

        /// <summary>
        /// Lấy thống kê đánh giá
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetReviewStats([FromQuery] int? bundleId, [FromQuery] int? variantId)
        {
            try
            {
                var stats = await _reviewService.GetReviewStatsAsync(bundleId, variantId);
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review stats");
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy thống kê đánh giá" });
            }
        }

        /// <summary>
        /// Lấy danh sách đánh giá của một người dùng cụ thể
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserReviews(string userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var reviews = await _reviewService.GetUserReviewsAsync(userId, page, pageSize);
                var currentUserId = GetCurrentUserId();
                var reviewDtos = reviews.Select(r => MapReviewToDto(r, currentUserId)).ToList();
                var totalCount = await _reviewService.GetUserReviewCountAsync(userId);

                var response = new ReviewListResponseDto
                {
                    Reviews = reviewDtos,
                    Stats = null,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reviews for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy đánh giá của người dùng" });
            }
        }

        /// <summary>
        /// Lấy danh sách sản phẩm chờ đánh giá của một người dùng cụ thể
        /// </summary>
        [HttpGet("pending/{userId}")]
        public async Task<IActionResult> GetPendingReviews(string userId)
        {
            try
            {
                var pendingItems = await _reviewService.GetPendingReviewsAsync(userId);
                return Ok(new { success = true, data = pendingItems });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending reviews for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy sản phẩm chờ đánh giá" });
            }
        }

        #endregion

        #region Review Interactions

        /// <summary>
        /// Like/Unlike đánh giá
        /// </summary>
        [HttpPost("{id}/like")]
        [Authorize]
        public async Task<IActionResult> ToggleReviewLike(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var isLiked = await _reviewService.ToggleReviewLikeAsync(id, userId);
                var likeCount = await _reviewService.GetReviewLikeCountAsync(id);

                var message = isLiked ? "Đã thích đánh giá" : "Đã bỏ thích đánh giá";

                return Ok(new
                {
                    success = true,
                    message = message,
                    data = new { isLiked = isLiked, likeCount = likeCount }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling review like for review {ReviewId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi khi thích đánh giá" });
            }
        }

        /// <summary>
        /// Thêm bình luận vào đánh giá
        /// </summary>
        [HttpPost("{id}/comments")]
        [Authorize]
        public async Task<IActionResult> CreateComment(int id, [FromBody] CreateReviewCommentDto dto)
        {
            if (id != dto.ReviewID)
            {
                return BadRequest(new { success = false, message = "Review ID không khớp" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var comment = await _reviewService.CreateCommentAsync(userId, dto);
                var commentDto = MapCommentToDto(comment);

                return Ok(new { success = true, message = "Thêm bình luận thành công", data = commentDto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comment for review {ReviewId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi khi thêm bình luận" });
            }
        }

        /// <summary>
        /// Lấy bình luận của đánh giá
        /// </summary>
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetReviewComments(int id)
        {
            try
            {
                var comments = await _reviewService.GetReviewCommentsAsync(id);
                var commentDtos = comments.Select(MapCommentToDto).ToList();

                return Ok(new { success = true, data = commentDtos });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comments for review {ReviewId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy bình luận" });
            }
        }

        /// <summary>
        /// Xóa bình luận
        /// </summary>
        [HttpDelete("comments/{commentId}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var success = await _reviewService.DeleteCommentAsync(commentId, userId);
                if (!success)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận hoặc bạn không có quyền xóa" });
                }

                return Ok(new { success = true, message = "Xóa bình luận thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting comment {CommentId}", commentId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi xóa bình luận" });
            }
        }

        #endregion

        #region Admin & Censorship Endpoints

        [HttpPost("censor")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CensorReview([FromBody] CensorReviewDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var actorId = GetCurrentUserId();
                var success = await _reviewService.CensorReviewAsync(actorId, dto);
                if (!success)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đánh giá" });
                }

                return Ok(new { success = true, message = dto.Action.ToUpper() == "HIDE" ? "Đã ẩn đánh giá thành công." : "Đã hiển thị lại đánh giá thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error censoring review {ReviewId}", dto.ReviewID);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi kiểm duyệt đánh giá." });
            }
        }

        [HttpGet("admin/stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetReviewAdminStats()
        {
            try
            {
                var stats = await _reviewService.GetReviewAdminStatsAsync();
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review admin stats");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thống kê kiểm duyệt." });
            }
        }

        [HttpGet("{reviewId}/logs")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetCensorshipLogs(int reviewId)
        {
            try
            {
                var logs = await _reviewService.GetCensorshipLogsAsync(reviewId);
                return Ok(new { success = true, data = logs });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting censorship logs for review {ReviewId}", reviewId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy lịch sử kiểm duyệt." });
            }
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetReviewLoyaltySettings()
        {
            try
            {
                var settings = await _reviewService.GetLoyaltySettingAsync();
                return Ok(new { success = true, data = settings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting loyalty settings for reviews");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy cấu hình thưởng điểm." });
            }
        }

        [HttpPut("settings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateReviewLoyaltySettings([FromBody] LoyaltySetting setting)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var success = await _reviewService.UpdateLoyaltySettingAsync(setting);
                return Ok(new { success = true, message = "Cập nhật cấu hình thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating loyalty settings for reviews");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật cấu hình thưởng điểm." });
            }
        }

        #endregion

        #region Helper Methods

        private string GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        private ReviewDto MapReviewToDto(Review review, string? currentUserId = null)
        {
            return new ReviewDto
            {
                ReviewID = review.ReviewID,
                UserID = review.UserID,
                VariantID = review.VariantID == 0 ? null : review.VariantID,
                BundleID = review.BundleID,
                Rating = review.Rating,
                Content = SanitizeReviewContent(review.Content),
                CreatedAt = review.CreatedAt,
                IsHidden = review.IsHidden,
                HasEarnedRewardPoints = review.HasEarnedRewardPoints,
                LoyaltyPointsEarned = review.LoyaltyPointsEarned,
                UpdatedAt = review.UpdatedAt,
                CensorshipReason = review.CensorshipReason,
                User = review.User != null ? new ReviewUserDto
                {
                    UserID = review.User.Id,
                    FullName = review.User.FullName,
                    Avatar = review.User.Avatar
                } : null,
                LikeCount = review.ReviewLikes?.Count ?? 0,
                CommentCount = review.ReviewComments?.Count ?? 0,
                IsLikedByCurrentUser = !string.IsNullOrEmpty(currentUserId) &&
                    (review.ReviewLikes?.Any(rl => rl.UserID == currentUserId) ?? false),
                Comments = review.ReviewComments?
                    .Where(rc => !rc.IsHidden && rc.ParentCommentID == null)
                    .Select(MapCommentToDto).ToList() ?? new List<ReviewCommentDto>(),
                ReviewMedia = review.ReviewMedia?.Select(m => new ReviewMediaDto
                {
                    MediaID = m.MediaID,
                    ReviewID = m.ReviewID,
                    Url = m.Url,
                    MediaType = m.MediaType,
                    CreatedAt = m.CreatedAt
                }).ToList() ?? new List<ReviewMediaDto>(),
                CensorshipLogs = review.CensorshipLogs?.Select(l => new ReviewCensorshipLogDto
                {
                    LogID = l.LogID,
                    ReviewID = l.ReviewID,
                    ActorID = l.ActorID,
                    ActorName = l.Actor != null ? l.Actor.FullName : "Quản trị viên",
                    Action = l.Action,
                    Reason = l.Reason,
                    Timestamp = l.Timestamp
                }).ToList() ?? new List<ReviewCensorshipLogDto>(),
                ProductName = review.Variant?.Product?.ProductName,
                VariantName = review.Variant?.VariantName,
                BundleName = review.Bundle?.Name,
                ImageUrl = review.Variant?.ImageUrl 
                    ?? review.Variant?.Product?.Variants?.FirstOrDefault(v => !string.IsNullOrEmpty(v.ImageUrl))?.ImageUrl 
                    ?? review.Bundle?.ImageUrl 
                    ?? ""
            };
        }

        private static string SanitizeReviewContent(string? content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return string.Empty;
            }

            var text = content.Trim();
            if (!text.StartsWith("[#INV:"))
            {
                return text;
            }

            var endMarkerIndex = text.IndexOf(']');
            if (endMarkerIndex < 0)
            {
                return text;
            }

            return text[(endMarkerIndex + 1)..].Trim();
        }

        private ReviewCommentDto MapCommentToDto(ReviewComment comment)
        {
            return new ReviewCommentDto
            {
                CommentID = comment.CommentID,
                ReviewID = comment.ReviewID,
                UserID = comment.UserID,
                ParentCommentID = comment.ParentCommentID,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                IsHidden = comment.IsHidden,
                User = comment.User != null ? new ReviewUserDto
                {
                    UserID = comment.User.Id,
                    FullName = comment.User.FullName,
                    Avatar = comment.User.Avatar
                } : null,
                ChildComments = comment.ChildComments?
                    .Where(cc => !cc.IsHidden)
                    .Select(MapCommentToDto).ToList() ?? new List<ReviewCommentDto>()
            };
        }

        #endregion
    }
}

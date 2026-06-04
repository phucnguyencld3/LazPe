using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LoyaltyController : ControllerBase
    {
        private readonly ILoyaltyService _loyaltyService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LoyaltyController> _logger;

        public LoyaltyController(ILoyaltyService loyaltyService, ApplicationDbContext context, ILogger<LoyaltyController> logger)
        {
            _loyaltyService = loyaltyService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy thông tin Hồ sơ Loyalty của người dùng hiện tại
        /// </summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var profile = await _loyaltyService.GetProfileAsync(userId);
                if (profile == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hồ sơ Loyalty" });
                }

                // Tính toán tỷ lệ phần trăm thăng hạng dựa vào Enum và Offset
                double progress = 0;
                var offset = profile.RankAdjustmentOffset;
                
                if (profile.CurrentTierID == 4) // Diamond
                {
                    progress = 100.0;
                }
                else if (profile.CurrentTierID == 3) // Gold
                {
                    var minPoints = 60000 - offset;
                    var maxPoints = 99999 - offset;
                    var denominator = maxPoints - minPoints + 1;
                    progress = Math.Round((double)(profile.TotalPoints - minPoints) / denominator * 100, 2);
                }
                else if (profile.CurrentTierID == 2) // Silver
                {
                    var minPoints = 30000 - offset;
                    var maxPoints = 59999 - offset;
                    var denominator = maxPoints - minPoints + 1;
                    progress = Math.Round((double)(profile.TotalPoints - minPoints) / denominator * 100, 2);
                }
                else if (profile.CurrentTierID == 1) // Standard
                {
                    var minPoints = 0;
                    var maxPoints = 29999;
                    var denominator = maxPoints - minPoints + 1;
                    progress = Math.Round((double)(profile.TotalPoints - minPoints) / denominator * 100, 2);
                }

                if (progress < 0) progress = 0;
                if (progress > 100) progress = 100;

                var tierName = profile.Tier?.TierName ?? (profile.CurrentTierID switch
                {
                    1 => "Standard",
                    2 => "Silver",
                    3 => "Gold",
                    4 => "Diamond",
                    _ => "Standard"
                });

                var privileges = await _context.LoyaltyTierPrivileges
                    .Where(p => p.TierID == profile.CurrentTierID && p.IsActive)
                    .Select(p => p.Name)
                    .ToListAsync();
                var tierDescription = privileges.Any() 
                    ? string.Join(", ", privileges) 
                    : (profile.CurrentTierID switch
                    {
                        1 => "Thành viên thông thường, bắt đầu tích lũy điểm",
                        2 => "Thành viên Bạc, nhận 3 voucher độc quyền mỗi tháng",
                        3 => "Thành viên Vàng, nhận 5 voucher độc quyền mỗi tháng",
                        4 => "Thành viên Kim Cương cao cấp, nhận 8 voucher độc quyền mỗi tháng",
                        _ => "Thành viên tích lũy điểm"
                    });

                var response = new Loyaltydtos.LoyaltyProfileResponse
                {
                    UserID = profile.UserID,
                    FullName = profile.User?.FullName ?? "Thành viên",
                    AvailablePoints = profile.AvailablePoints,
                    TotalPoints = profile.TotalPoints,
                    PointsToNextTier = profile.PointsToNextTier,
                    CurrentTierID = profile.CurrentTierID,
                    CurrentTierName = tierName,
                    CurrentTierDescription = tierDescription,
                    ProgressPercentage = progress,
                    RankAdjustmentOffset = profile.RankAdjustmentOffset,
                    LastUpdated = profile.LastUpdated
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin hồ sơ Loyalty");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xử lý thông tin" });
            }
        }

        /// <summary>
        /// Lấy lịch sử biến động điểm tích lũy của người dùng
        /// </summary>
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory(
            [FromQuery] string type = "ALL",
            [FromQuery] string period = "All",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var (items, totalCount) = await _loyaltyService.GetPointsHistoryAsync(userId, type, period, page, pageSize);

                var dtoList = items.Select(h => new Loyaltydtos.LoyaltyPointHistoryResponse
                {
                    HistoryID = h.HistoryID,
                    TransactionType = h.TransactionType,
                    Amount = h.Amount,
                    InvoiceID = h.InvoiceID,
                    Description = h.Description,
                    CreatedAt = h.CreatedAt
                });

                return Ok(new
                {
                    success = true,
                    data = dtoList,
                    pagination = new
                    {
                        pageNumber = page,
                        pageSize = pageSize,
                        totalItems = totalCount,
                        totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy lịch sử tích điểm");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải dữ liệu" });
            }
        }

        /// <summary>
        /// Kiểm tra tính hợp lệ khi áp dụng đổi điểm thanh toán
        /// </summary>
        [HttpPost("redemption/validate")]
        public async Task<IActionResult> ValidateRedemption([FromBody] Loyaltydtos.ApplyPointsRedemptionRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var isValid = await _loyaltyService.ValidatePointsRedemptionAsync(userId, request.PointsToUse, request.CartSubtotal);
                if (isValid)
                {
                    var discountAmount = await _loyaltyService.CalculateRedemptionDiscountAsync(userId, request.PointsToUse);
                    return Ok(new Loyaltydtos.ApplyPointsRedemptionResponse
                    {
                        IsApplied = true,
                        PointsUsed = request.PointsToUse,
                        DiscountAmount = discountAmount,
                        Message = $"Áp dụng đổi {request.PointsToUse:N0} điểm thành công. Nhận giảm {discountAmount:N0} VNĐ."
                    });
                }
                else
                {
                    return BadRequest(new Loyaltydtos.ApplyPointsRedemptionResponse
                    {
                        IsApplied = false,
                        PointsUsed = 0,
                        DiscountAmount = 0,
                        Message = "Điểm quy đổi không hợp lệ hoặc số dư điểm khả dụng không đủ."
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kiểm tra đổi điểm");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống khi kiểm tra đổi điểm" });
            }
        }

        /// <summary>
        /// Lấy thông tin cơ chế tích/đổi điểm đang áp dụng (dùng cho checkout)
        /// </summary>
        [HttpGet("policies/summary")]
        public async Task<IActionResult> GetPolicySummary()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var profile = await _loyaltyService.GetProfileAsync(userId);
                if (profile == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hồ sơ Loyalty" });
                }

                var now = DateTime.Now;

                var earnPolicy = await _context.LoyaltyEarnPolicies
                    .Where(p => p.IsActive
                        && p.IsCampaign
                        && (p.StartDate == null || p.StartDate <= now)
                        && (p.EndDate == null || p.EndDate >= now))
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                var earnFallback = false;
                if (earnPolicy == null)
                {
                    earnPolicy = await _context.LoyaltyEarnPolicies
                        .Where(p => p.IsActive && !p.IsCampaign)
                        .OrderByDescending(p => p.CreatedAt)
                        .FirstOrDefaultAsync();
                }

                Loyaltydtos.LoyaltyEarnPolicySummary earnSummary;
                if (earnPolicy == null)
                {
                    earnFallback = true;
                    earnSummary = new Loyaltydtos.LoyaltyEarnPolicySummary
                    {
                        PolicyID = 0,
                        Name = "Chính sách mặc định",
                        VndAmount = 1000.00m,
                        PointsEarned = 10,
                        Multiplier = 1.00m,
                        IsCampaign = false,
                        StartDate = null,
                        EndDate = null,
                        IsFallback = true
                    };
                }
                else
                {
                    earnSummary = new Loyaltydtos.LoyaltyEarnPolicySummary
                    {
                        PolicyID = earnPolicy.PolicyID,
                        Name = earnPolicy.Name,
                        VndAmount = earnPolicy.VndAmount,
                        PointsEarned = earnPolicy.PointsEarned,
                        Multiplier = earnPolicy.Multiplier,
                        IsCampaign = earnPolicy.IsCampaign,
                        StartDate = earnPolicy.StartDate,
                        EndDate = earnPolicy.EndDate,
                        IsFallback = earnFallback
                    };
                }

                var redeemPolicy = await _context.LoyaltyRedeemPolicies
                    .Include(p => p.Tier)
                    .Where(p => p.IsActive
                        && p.TierID == profile.CurrentTierID
                        && (p.StartDate == null || p.StartDate <= now)
                        && (p.EndDate == null || p.EndDate >= now))
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (redeemPolicy == null)
                {
                    redeemPolicy = await _context.LoyaltyRedeemPolicies
                        .Include(p => p.Tier)
                        .Where(p => p.IsActive
                            && p.TierID == null
                            && (p.StartDate == null || p.StartDate <= now)
                            && (p.EndDate == null || p.EndDate >= now))
                        .OrderByDescending(p => p.CreatedAt)
                        .FirstOrDefaultAsync();
                }

                Loyaltydtos.LoyaltyRedeemPolicySummary redeemSummary;
                if (redeemPolicy == null)
                {
                    redeemSummary = new Loyaltydtos.LoyaltyRedeemPolicySummary
                    {
                        PolicyID = 0,
                        Name = "Chính sách mặc định",
                        PointsToRedeem = 1,
                        DiscountVnd = 1.00m,
                        TierID = null,
                        TierName = "Tất cả hạng",
                        StartDate = null,
                        EndDate = null,
                        IsFallback = true
                    };
                }
                else
                {
                    redeemSummary = new Loyaltydtos.LoyaltyRedeemPolicySummary
                    {
                        PolicyID = redeemPolicy.PolicyID,
                        Name = redeemPolicy.Name,
                        PointsToRedeem = redeemPolicy.PointsToRedeem,
                        DiscountVnd = redeemPolicy.DiscountVnd,
                        TierID = redeemPolicy.TierID,
                        TierName = redeemPolicy.Tier?.TierName ?? (redeemPolicy.TierID == null ? "Tất cả hạng" : "Standard"),
                        StartDate = redeemPolicy.StartDate,
                        EndDate = redeemPolicy.EndDate,
                        IsFallback = false
                    };
                }

                var response = new Loyaltydtos.LoyaltyPolicySummaryResponse
                {
                    EarnPolicy = earnSummary,
                    RedeemPolicy = redeemSummary
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin chính sách loyalty");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải thông tin" });
            }
        }

        /// <summary>
        /// Lấy danh sách các hạng thành viên và đặc quyền tương ứng (dùng cho giao diện Client)
        /// </summary>
        [HttpGet("tiers")]
        public async Task<IActionResult> GetTiers()
        {
            try
            {
                var tiers = await _context.LoyaltyTiers
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.MinPoints)
                    .ToListAsync();

                var tierIds = tiers.Select(t => t.TierID).ToList();

                var privileges = await _context.LoyaltyTierPrivileges
                    .Where(p => p.IsActive && tierIds.Contains(p.TierID))
                    .ToListAsync();

                var result = tiers.Select(t => new
                {
                    t.TierID,
                    t.TierName,
                    t.MinPoints,
                    t.ColorHex,
                    t.BadgeIcon,
                    t.IsActive,
                    Privileges = privileges
                        .Where(p => p.TierID == t.TierID)
                        .Select(p => new
                        {
                            p.PrivilegeID,
                            p.Name,
                            p.PrivilegeType,
                            p.Value
                        })
                        .ToList()
                }).ToList();

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách hạng thành viên public");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống khi tải thông tin các hạng thành viên" });
            }
        }

        /// <summary>
        /// Lấy cấu hình Loyalty hiện tại
        /// </summary>
        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            try
            {
                var settings = await _context.LoyaltySettings.FirstOrDefaultAsync(s => s.Id == 1);
                if (settings == null)
                {
                    settings = new LoyaltySetting
                    {
                        Id = 1,
                        EnableReviewReward = true,
                        ReviewRewardPoints = 200,
                        MinimumReviewWords = 50,
                        RequiredRatingForReward = 5,
                        AllowMultipleRewardsPerProduct = false,
                        UpdatedAt = DateTime.Now
                    };
                }
                return Ok(new { success = true, data = settings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy cấu hình Loyalty");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống khi tải cấu hình" });
            }
        }

        /// <summary>
        /// Cập nhật cấu hình Loyalty (Chỉ dành cho Admin)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] LoyaltySetting request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var settings = await _context.LoyaltySettings.FirstOrDefaultAsync(s => s.Id == 1);
                var isNew = false;
                string oldValue = "N/A";

                if (settings == null)
                {
                    settings = new LoyaltySetting { Id = 1 };
                    isNew = true;
                }
                else
                {
                    oldValue = $"Enable: {settings.EnableReviewReward}, Points: {settings.ReviewRewardPoints}, MinWords: {settings.MinimumReviewWords}, Rating: {settings.RequiredRatingForReward}, Multiple: {settings.AllowMultipleRewardsPerProduct}";
                }

                settings.EnableReviewReward = request.EnableReviewReward;
                settings.ReviewRewardPoints = request.ReviewRewardPoints;
                settings.MinimumReviewWords = request.MinimumReviewWords;
                settings.RequiredRatingForReward = request.RequiredRatingForReward;
                settings.AllowMultipleRewardsPerProduct = request.AllowMultipleRewardsPerProduct;
                settings.UpdatedAt = DateTime.Now;

                if (isNew)
                {
                    _context.LoyaltySettings.Add(settings);
                }
                else
                {
                    _context.LoyaltySettings.Update(settings);
                }

                var newValue = $"Enable: {settings.EnableReviewReward}, Points: {settings.ReviewRewardPoints}, MinWords: {settings.MinimumReviewWords}, Rating: {settings.RequiredRatingForReward}, Multiple: {settings.AllowMultipleRewardsPerProduct}";
                
                await LogAuditAsync("UPDATE_LOYALTY_SETTINGS", "LoyaltySettings", "1", oldValue, newValue);

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật cấu hình thành công", data = settings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật cấu hình Loyalty");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống khi lưu cấu hình" });
            }
        }

        private string GetCurrentUserEmail()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "admin@lazpe.vn";
        }

        private async Task LogAuditAsync(string action, string entityName, string entityId, string? oldValue, string? newValue, string? notes = null)
        {
            var actorId = GetCurrentUserId();
            var actorEmail = GetCurrentUserEmail();

            var log = new LoyaltyAuditLog
            {
                Action = action,
                ActorID = actorId,
                ActorEmail = actorEmail,
                EntityName = entityName,
                EntityID = entityId,
                OldValue = oldValue,
                NewValue = newValue,
                Notes = notes,
                Timestamp = DateTime.Now
            };

            _context.LoyaltyAuditLogs.Add(log);
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }
    }
}

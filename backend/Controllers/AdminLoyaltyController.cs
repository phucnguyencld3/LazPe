using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminLoyaltyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminLoyaltyController> _logger;

        public AdminLoyaltyController(ApplicationDbContext context, ILogger<AdminLoyaltyController> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region 1. Dashboard Statistics
        /// <summary>
        /// Lấy tổng quan thống kê loyalty (điểm phát hành, điểm đã dùng, phân bố hạng, doanh thu, top khách hàng).
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                // 1. Tổng điểm đã phát hành
                var totalPointsIssued = await _context.LoyaltyPointHistories
                    .Where(h => h.Amount > 0 && h.TransactionType != "REFUND")
                    .SumAsync(h => h.Amount);

                // 2. Tổng điểm đã sử dụng
                var totalPointsSpent = await _context.LoyaltyPointHistories
                    .Where(h => h.Amount < 0 && h.TransactionType == "SPEND")
                    .SumAsync(h => Math.Abs(h.Amount));

                // 3. Tổng điểm đang tồn trong ví người dùng
                var totalPointsRemaining = await _context.LoyaltyProfiles
                    .SumAsync(p => p.AvailablePoints);

                // 4. Phân phối thành viên theo hạng
                var tiers = await _context.LoyaltyTiers.ToListAsync();
                var profilesGroup = await _context.LoyaltyProfiles
                    .GroupBy(p => p.CurrentTierID)
                    .Select(g => new { TierID = g.Key, Count = g.Count() })
                    .ToListAsync();

                var membersPerTier = tiers.Select(t => new
                {
                    t.TierID,
                    t.TierName,
                    t.ColorHex,
                    Count = profilesGroup.FirstOrDefault(g => g.TierID == t.TierID)?.Count ?? 0
                }).ToList();

                // 5. Tỷ lệ thăng hạng (thành viên hạng Silver, Gold, Diamond trên tổng thành viên)
                double upgradeRate = 0;
                var totalMembers = await _context.LoyaltyProfiles.CountAsync();
                if (totalMembers > 0)
                {
                    var upgradedMembers = await _context.LoyaltyProfiles.CountAsync(p => p.CurrentTierID > 1);
                    upgradeRate = Math.Round((double)upgradedMembers / totalMembers * 100, 2);
                }

                // 6. Tỷ lệ sử dụng voucher cấp từ Loyalty
                double voucherUsageRate = 0;
                var loyaltyVouchersQuery = _context.UserVouchers
                    .Where(uv => uv.SourceType == UserVoucherSource.DirectAssigned);
                var totalLoyaltyVouchers = await loyaltyVouchersQuery.CountAsync();
                if (totalLoyaltyVouchers > 0)
                {
                    var usedLoyaltyVouchers = await loyaltyVouchersQuery.CountAsync(uv => uv.Status == UserVoucherStatus.Used);
                    voucherUsageRate = Math.Round((double)usedLoyaltyVouchers / totalLoyaltyVouchers * 100, 2);
                }

                // 7. Doanh thu từ thành viên Loyalty
                // (Tổng tiền đơn hàng Completed của những người đã kích hoạt hồ sơ Loyalty)
                var memberUserIds = await _context.LoyaltyProfiles.Select(p => p.UserID).ToListAsync();
                var revenueFromLoyalty = await _context.Invoices
                    .Where(i => i.Status == OrderStatus.Completed && memberUserIds.Contains(i.UserID))
                    .SumAsync(i => i.TotalPrice);

                // 8. Top 10 khách hàng tích lũy điểm cao nhất
                var topCustomers = await _context.LoyaltyProfiles
                    .Include(p => p.User)
                    .Include(p => p.Tier)
                    .OrderByDescending(p => p.TotalPoints)
                    .Take(10)
                    .Select(p => new
                    {
                        p.UserID,
                        FullName = p.User != null ? p.User.FullName : "N/A",
                        Email = p.User != null ? p.User.Email : "N/A",
                        Avatar = p.User != null ? p.User.Avatar : null,
                        TierName = p.Tier != null ? p.Tier.TierName : "Standard",
                        p.AvailablePoints,
                        p.TotalPoints
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        totalPointsIssued,
                        totalPointsSpent,
                        totalPointsRemaining,
                        membersPerTier,
                        upgradeRate,
                        voucherUsageRate,
                        revenueFromLoyalty,
                        topCustomers
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy số liệu thống kê loyalty");
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ khi lấy dữ liệu thống kê" });
            }
        }
        #endregion

        #region 2. Earn Policies
        /// <summary>
        /// Lấy danh sách chính sách tích điểm (ưu tiên campaign, mới tạo trước).
        /// </summary>
        [HttpGet("earn-policies")]
        public async Task<IActionResult> GetEarnPolicies()
        {
            var policies = await _context.LoyaltyEarnPolicies
                .OrderByDescending(p => p.IsCampaign)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync();
            return Ok(new { success = true, data = policies });
        }

        /// <summary>
        /// Tạo chính sách tích điểm mới.
        /// </summary>
        [HttpPost("earn-policies")]
        public async Task<IActionResult> CreateEarnPolicy([FromBody] LoyaltyEarnPolicy policy)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            policy.CreatedAt = DateTime.Now;
            policy.CreatedBy = GetCurrentUserEmail();

            _context.LoyaltyEarnPolicies.Add(policy);
            await _context.SaveChangesAsync();

            await LogAuditAsync("CREATE_EARN_POLICY", "LoyaltyEarnPolicy", policy.PolicyID.ToString(), null, 
                $"VndAmount: {policy.VndAmount}, Points: {policy.PointsEarned}, IsCampaign: {policy.IsCampaign}");

            return Ok(new { success = true, data = policy });
        }

        /// <summary>
        /// Cập nhật chính sách tích điểm theo id.
        /// </summary>
        /// <param name="id">Id chính sách tích điểm.</param>
        [HttpPut("earn-policies/{id}")]
        public async Task<IActionResult> UpdateEarnPolicy(int id, [FromBody] LoyaltyEarnPolicy request)
        {
            var policy = await _context.LoyaltyEarnPolicies.FindAsync(id);
            if (policy == null) return NotFound();

            var oldValue = $"VndAmount: {policy.VndAmount}, Points: {policy.PointsEarned}, IsActive: {policy.IsActive}";

            policy.Name = request.Name;
            policy.VndAmount = request.VndAmount;
            policy.PointsEarned = request.PointsEarned;
            policy.StartDate = request.StartDate;
            policy.EndDate = request.EndDate;
            policy.IsActive = request.IsActive;
            policy.IsCampaign = request.IsCampaign;
            policy.Multiplier = request.Multiplier;

            await _context.SaveChangesAsync();

            var newValue = $"VndAmount: {policy.VndAmount}, Points: {policy.PointsEarned}, IsActive: {policy.IsActive}";
            await LogAuditAsync("UPDATE_EARN_POLICY", "LoyaltyEarnPolicy", policy.PolicyID.ToString(), oldValue, newValue);

            return Ok(new { success = true, data = policy });
        }

        /// <summary>
        /// Bật/tắt chính sách tích điểm (không áp dụng chính sách mặc định).
        /// </summary>
        /// <param name="id">Id chính sách tích điểm.</param>
        [HttpPut("earn-policies/{id}/toggle")]
        public async Task<IActionResult> ToggleEarnPolicy(int id)
        {
            var policy = await _context.LoyaltyEarnPolicies.FindAsync(id);
            if (policy == null) return NotFound();

            if (!policy.IsCampaign)
            {
                return BadRequest(new { success = false, message = "Không thể tắt chính sách tích điểm mặc định" });
            }

            policy.IsActive = !policy.IsActive;
            await _context.SaveChangesAsync();

            await LogAuditAsync("TOGGLE_EARN_POLICY", "LoyaltyEarnPolicy", policy.PolicyID.ToString(), 
                $"IsActive: {!policy.IsActive}", $"IsActive: {policy.IsActive}");

            return Ok(new { success = true, data = policy });
        }

        /// <summary>
        /// Xóa chính sách tích điểm (không áp dụng chính sách mặc định).
        /// </summary>
        /// <param name="id">Id chính sách tích điểm.</param>
        [HttpDelete("earn-policies/{id}")]
        public async Task<IActionResult> DeleteEarnPolicy(int id)
        {
            var policy = await _context.LoyaltyEarnPolicies.FindAsync(id);
            if (policy == null) return NotFound();

            if (!policy.IsCampaign)
            {
                return BadRequest(new { success = false, message = "Không thể xóa chính sách tích điểm mặc định" });
            }

            _context.LoyaltyEarnPolicies.Remove(policy);
            await _context.SaveChangesAsync();

            await LogAuditAsync("DELETE_EARN_POLICY", "LoyaltyEarnPolicy", id.ToString(), null, null, $"Tên: {policy.Name}");

            return Ok(new { success = true, message = "Xóa chính sách tích điểm thành công" });
        }
        #endregion

        #region 3. Redeem Policies
        /// <summary>
        /// Lấy danh sách quy tắc đổi điểm (kèm thông tin hạng).
        /// </summary>
        [HttpGet("redeem-policies")]
        public async Task<IActionResult> GetRedeemPolicies()
        {
            var policies = await _context.LoyaltyRedeemPolicies
                .Include(p => p.Tier)
                .OrderByDescending(p => p.TierID)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync();
            return Ok(new { success = true, data = policies });
        }

        /// <summary>
        /// Tạo quy tắc đổi điểm mới.
        /// </summary>
        [HttpPost("redeem-policies")]
        public async Task<IActionResult> CreateRedeemPolicy([FromBody] LoyaltyRedeemPolicy policy)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            policy.CreatedAt = DateTime.Now;
            policy.CreatedBy = GetCurrentUserEmail();

            _context.LoyaltyRedeemPolicies.Add(policy);
            await _context.SaveChangesAsync();

            await LogAuditAsync("CREATE_REDEEM_POLICY", "LoyaltyRedeemPolicy", policy.PolicyID.ToString(), null, 
                $"Points: {policy.PointsToRedeem}, DiscountVnd: {policy.DiscountVnd}, TierID: {policy.TierID}");

            return Ok(new { success = true, data = policy });
        }

        /// <summary>
        /// Cập nhật quy tắc đổi điểm theo id.
        /// </summary>
        /// <param name="id">Id quy tắc đổi điểm.</param>
        [HttpPut("redeem-policies/{id}")]
        public async Task<IActionResult> UpdateRedeemPolicy(int id, [FromBody] LoyaltyRedeemPolicy request)
        {
            var policy = await _context.LoyaltyRedeemPolicies.FindAsync(id);
            if (policy == null) return NotFound();

            var oldValue = $"Points: {policy.PointsToRedeem}, Discount: {policy.DiscountVnd}, Active: {policy.IsActive}";

            policy.Name = request.Name;
            policy.PointsToRedeem = request.PointsToRedeem;
            policy.DiscountVnd = request.DiscountVnd;
            policy.TierID = request.TierID;
            policy.StartDate = request.StartDate;
            policy.EndDate = request.EndDate;
            policy.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            var newValue = $"Points: {policy.PointsToRedeem}, Discount: {policy.DiscountVnd}, Active: {policy.IsActive}";
            await LogAuditAsync("UPDATE_REDEEM_POLICY", "LoyaltyRedeemPolicy", policy.PolicyID.ToString(), oldValue, newValue);

            return Ok(new { success = true, data = policy });
        }

        /// <summary>
        /// Bật/tắt quy tắc đổi điểm (không áp dụng quy tắc mặc định).
        /// </summary>
        /// <param name="id">Id quy tắc đổi điểm.</param>
        [HttpPut("redeem-policies/{id}/toggle")]
        public async Task<IActionResult> ToggleRedeemPolicy(int id)
        {
            var policy = await _context.LoyaltyRedeemPolicies.FindAsync(id);
            if (policy == null) return NotFound();

            if (policy.TierID == null || policy.Name.Contains("mặc định"))
            {
                return BadRequest(new { success = false, message = "Không thể tắt chính sách đổi điểm mặc định" });
            }

            policy.IsActive = !policy.IsActive;
            await _context.SaveChangesAsync();

            await LogAuditAsync("TOGGLE_REDEEM_POLICY", "LoyaltyRedeemPolicy", policy.PolicyID.ToString(), 
                $"IsActive: {!policy.IsActive}", $"IsActive: {policy.IsActive}");

            return Ok(new { success = true, data = policy });
        }

        /// <summary>
        /// Xóa quy tắc đổi điểm (không áp dụng quy tắc mặc định).
        /// </summary>
        /// <param name="id">Id quy tắc đổi điểm.</param>
        [HttpDelete("redeem-policies/{id}")]
        public async Task<IActionResult> DeleteRedeemPolicy(int id)
        {
            var policy = await _context.LoyaltyRedeemPolicies.FindAsync(id);
            if (policy == null) return NotFound();

            if (policy.TierID == null || policy.Name.Contains("mặc định"))
            {
                return BadRequest(new { success = false, message = "Không thể xóa chính sách đổi điểm mặc định" });
            }

            _context.LoyaltyRedeemPolicies.Remove(policy);
            await _context.SaveChangesAsync();

            await LogAuditAsync("DELETE_REDEEM_POLICY", "LoyaltyRedeemPolicy", id.ToString(), null, null, $"Tên: {policy.Name}");

            return Ok(new { success = true, message = "Xóa chính sách quy đổi điểm thành công" });
        }
        #endregion

        #region 4. Tiers & Badges
        /// <summary>
        /// Lấy danh sách hạng thành viên theo ngưỡng điểm tăng dần.
        /// </summary>
        [HttpGet("tiers")]
        public async Task<IActionResult> GetTiers()
        {
            var tiers = await _context.LoyaltyTiers
                .OrderBy(t => t.MinPoints)
                .ToListAsync();
            return Ok(new { success = true, data = tiers });
        }

        /// <summary>
        /// Tạo hạng thành viên mới.
        /// </summary>
        [HttpPost("tiers")]
        public async Task<IActionResult> CreateTier([FromBody] LoyaltyTier tier)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            tier.CreatedAt = DateTime.Now;
            tier.UpdatedAt = DateTime.Now;

            _context.LoyaltyTiers.Add(tier);
            await _context.SaveChangesAsync();

            await LogAuditAsync("CREATE_TIER", "LoyaltyTier", tier.TierID.ToString(), null, 
                $"Name: {tier.TierName}, MinPoints: {tier.MinPoints}, Color: {tier.ColorHex}");

            return Ok(new { success = true, data = tier });
        }

        /// <summary>
        /// Cập nhật hạng thành viên theo id.
        /// </summary>
        /// <param name="id">Id hạng thành viên.</param>
        [HttpPut("tiers/{id}")]
        public async Task<IActionResult> UpdateTier(int id, [FromBody] LoyaltyTier request)
        {
            var tier = await _context.LoyaltyTiers.FindAsync(id);
            if (tier == null) return NotFound();

            var oldValue = $"Name: {tier.TierName}, MinPoints: {tier.MinPoints}, Color: {tier.ColorHex}, Active: {tier.IsActive}";

            tier.TierName = request.TierName;
            tier.MinPoints = request.MinPoints;
            tier.ColorHex = request.ColorHex;
            tier.BadgeIcon = request.BadgeIcon;
            tier.IsActive = request.IsActive;
            tier.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            var newValue = $"Name: {tier.TierName}, MinPoints: {tier.MinPoints}, Color: {tier.ColorHex}, Active: {tier.IsActive}";
            await LogAuditAsync("UPDATE_TIER", "LoyaltyTier", tier.TierID.ToString(), oldValue, newValue);

            return Ok(new { success = true, data = tier });
        }

        /// <summary>
        /// Bật/tắt hạng thành viên.
        /// </summary>
        /// <param name="id">Id hạng thành viên.</param>
        [HttpPut("tiers/{id}/toggle")]
        public async Task<IActionResult> ToggleTier(int id)
        {
            var tier = await _context.LoyaltyTiers.FindAsync(id);
            if (tier == null) return NotFound();

            tier.IsActive = !tier.IsActive;
            tier.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            await LogAuditAsync("TOGGLE_TIER", "LoyaltyTier", tier.TierID.ToString(), 
                $"IsActive: {!tier.IsActive}", $"IsActive: {tier.IsActive}");

            return Ok(new { success = true, data = tier });
        }
        #endregion

        #region 5. Tier Privileges
        /// <summary>
        /// Lấy danh sách đặc quyền theo hạng thành viên.
        /// </summary>
        /// <param name="tierId">Id hạng thành viên.</param>
        [HttpGet("privileges/tier/{tierId}")]
        public async Task<IActionResult> GetPrivileges(int tierId)
        {
            var privileges = await _context.LoyaltyTierPrivileges
                .Where(p => p.TierID == tierId)
                .ToListAsync();
            return Ok(new { success = true, data = privileges });
        }

        /// <summary>
        /// Tạo đặc quyền mới cho hạng thành viên.
        /// </summary>
        [HttpPost("privileges")]
        public async Task<IActionResult> CreatePrivilege([FromBody] LoyaltyTierPrivilege privilege)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var validationError = await ValidatePrivilegeConfigAsync(privilege);
            if (validationError != null)
            {
                return BadRequest(new { success = false, message = validationError });
            }

            privilege.CreatedAt = DateTime.Now;
            privilege.CreatedBy = GetCurrentUserEmail();

            _context.LoyaltyTierPrivileges.Add(privilege);
            await _context.SaveChangesAsync();

            await LogAuditAsync("CREATE_PRIVILEGE", "LoyaltyTierPrivilege", privilege.PrivilegeID.ToString(), null, 
                $"Name: {privilege.Name}, Type: {privilege.PrivilegeType}, TierID: {privilege.TierID}");

            return Ok(new { success = true, data = privilege });
        }

        /// <summary>
        /// Cập nhật đặc quyền theo id.
        /// </summary>
        /// <param name="id">Id đặc quyền.</param>
        [HttpPut("privileges/{id}")]
        public async Task<IActionResult> UpdatePrivilege(int id, [FromBody] LoyaltyTierPrivilege request)
        {
            var privilege = await _context.LoyaltyTierPrivileges.FindAsync(id);
            if (privilege == null) return NotFound();

            var validationError = await ValidatePrivilegeConfigAsync(request);
            if (validationError != null)
            {
                return BadRequest(new { success = false, message = validationError });
            }

            var oldValue = $"Name: {privilege.Name}, Type: {privilege.PrivilegeType}, Value: {privilege.Value}, Active: {privilege.IsActive}";

            privilege.Name = request.Name;
            privilege.PrivilegeType = request.PrivilegeType;
            privilege.Value = request.Value;
            privilege.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            var newValue = $"Name: {privilege.Name}, Type: {privilege.PrivilegeType}, Value: {privilege.Value}, Active: {privilege.IsActive}";
            await LogAuditAsync("UPDATE_PRIVILEGE", "LoyaltyTierPrivilege", privilege.PrivilegeID.ToString(), oldValue, newValue);

            return Ok(new { success = true, data = privilege });
        }

        /// <summary>
        /// Xóa đặc quyền theo id.
        /// </summary>
        /// <param name="id">Id đặc quyền.</param>
        [HttpDelete("privileges/{id}")]
        public async Task<IActionResult> DeletePrivilege(int id)
        {
            var privilege = await _context.LoyaltyTierPrivileges.FindAsync(id);
            if (privilege == null) return NotFound();

            _context.LoyaltyTierPrivileges.Remove(privilege);
            await _context.SaveChangesAsync();

            await LogAuditAsync("DELETE_PRIVILEGE", "LoyaltyTierPrivilege", id.ToString(), null, null, $"Tên: {privilege.Name}");

            return Ok(new { success = true, message = "Xóa đặc quyền thành công" });
        }
        #endregion

        #region 6. Monthly Voucher Configurations
        /// <summary>
        /// Lấy danh sách cấu hình voucher phát hàng tháng theo hạng.
        /// </summary>
        [HttpGet("monthly-vouchers")]
        public async Task<IActionResult> GetMonthlyVoucherConfigs()
        {
            var configs = await _context.LoyaltyMonthlyVouchers
                .Include(c => c.Tier)
                .OrderBy(c => c.TierID)
                .ToListAsync();
            return Ok(new { success = true, data = configs });
        }

        /// <summary>
        /// Tạo hoặc cập nhật cấu hình voucher hàng tháng (có kiểm tra giới hạn đặc quyền).
        /// </summary>
        [HttpPost("monthly-vouchers")]
        public async Task<IActionResult> CreateOrUpdateMonthlyVoucherConfig([FromBody] LoyaltyMonthlyVoucher config)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // 1. Kiểm tra giới hạn số lượng voucher theo đặc quyền hạng
            var voucherPrivilege = await _context.LoyaltyTierPrivileges
                .FirstOrDefaultAsync(p => p.TierID == config.TierID && p.PrivilegeType == "VOUCHER" && p.IsActive);

            int maxVouchers = 0;
            if (voucherPrivilege != null && !string.IsNullOrEmpty(voucherPrivilege.Value))
            {
                int.TryParse(voucherPrivilege.Value, out maxVouchers);
            }

            if (maxVouchers <= 0)
            {
                return BadRequest(new { success = false, message = "Hạng thành viên này chưa được cấu hình đặc quyền nhận voucher hàng tháng, hoặc giới hạn voucher bằng 0." });
            }

            // Tính tổng số lượng voucher đã cấu hình của hạng này (ngoại trừ bản ghi hiện tại đang sửa đổi)
            var currentTotal = await _context.LoyaltyMonthlyVouchers
                .Where(c => c.TierID == config.TierID && c.VoucherConfigID != config.VoucherConfigID && c.IsActive)
                .SumAsync(c => c.VoucherCount);

            if (currentTotal + config.VoucherCount > maxVouchers)
            {
                return BadRequest(new { success = false, message = $"Tổng số lượng voucher cấu hình phát hàng tháng ({currentTotal + config.VoucherCount}) vượt quá giới hạn đặc quyền của hạng này (Tối đa: {maxVouchers})" });
            }

            if (config.VoucherConfigID > 0)
            {
                var existing = await _context.LoyaltyMonthlyVouchers
                    .FirstOrDefaultAsync(c => c.VoucherConfigID == config.VoucherConfigID);

                if (existing == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy cấu hình voucher cần cập nhật" });
                }

                var oldValue = $"Count: {existing.VoucherCount}, Value: {existing.DiscountValue}, Active: {existing.IsActive}";

                existing.TierID = config.TierID;
                existing.VoucherCount = config.VoucherCount;
                existing.DiscountType = config.DiscountType;
                existing.DiscountValue = config.DiscountValue;
                existing.MinOrderValue = config.MinOrderValue;
                existing.MaxDiscount = config.MaxDiscount;
                existing.ValidityDays = config.ValidityDays;
                existing.IsActive = config.IsActive;

                await _context.SaveChangesAsync();

                var newValue = $"Count: {existing.VoucherCount}, Value: {existing.DiscountValue}, Active: {existing.IsActive}";
                await LogAuditAsync("UPDATE_MONTHLY_VOUCHER_CONFIG", "LoyaltyMonthlyVoucher", existing.VoucherConfigID.ToString(), oldValue, newValue);

                return Ok(new { success = true, data = existing });
            }
            else
            {
                config.CreatedAt = DateTime.Now;
                _context.LoyaltyMonthlyVouchers.Add(config);
                await _context.SaveChangesAsync();

                await LogAuditAsync("CREATE_MONTHLY_VOUCHER_CONFIG", "LoyaltyMonthlyVoucher", config.VoucherConfigID.ToString(), null, 
                    $"TierID: {config.TierID}, Count: {config.VoucherCount}, Value: {config.DiscountValue}");

                return Ok(new { success = true, data = config });
            }
        }

        /// <summary>
        /// Xóa cấu hình voucher hàng tháng theo id.
        /// </summary>
        /// <param name="id">Id cấu hình voucher.</param>
        [HttpDelete("monthly-vouchers/{id}")]
        public async Task<IActionResult> DeleteMonthlyVoucherConfig(int id)
        {
            var config = await _context.LoyaltyMonthlyVouchers.FindAsync(id);
            if (config == null) return NotFound(new { success = false, message = "Không tìm thấy cấu hình voucher" });

            _context.LoyaltyMonthlyVouchers.Remove(config);
            await _context.SaveChangesAsync();

            await LogAuditAsync("DELETE_MONTHLY_VOUCHER_CONFIG", "LoyaltyMonthlyVoucher", id.ToString(), null, null, $"TierID: {config.TierID}");

            return Ok(new { success = true, message = "Xóa cấu hình voucher thành công" });
        }

        /// <summary>
        /// Chạy thủ công job phát voucher hàng tháng.
        /// </summary>
        [HttpPost("trigger-monthly-voucher-job")]
        public async Task<IActionResult> TriggerMonthlyVoucherJob([FromServices] PolyBabyAPI.Services.LoyaltyMonthlyVoucherJob job)
        {
            try
            {
                await job.ExecuteAsync();
                return Ok(new { success = true, message = "Kích hoạt job phát voucher hàng tháng thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi chạy thử nghiệm Job phát voucher");
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ khi chạy Job: " + ex.Message });
            }
        }
        #endregion

        #region 7. Points Manual Revocation
        public class ManualRevocationRequest
        {
            public string UserID { get; set; } = string.Empty;
            public int Amount { get; set; }
            public string Reason { get; set; } = string.Empty;
        }

        /// <summary>
        /// Thu hồi điểm thủ công cho thành viên (có ghi lịch sử và audit log).
        /// </summary>
        [HttpPost("revoke-points")]
        public async Task<IActionResult> RevokePoints([FromBody] ManualRevocationRequest request)
        {
            if (string.IsNullOrEmpty(request.UserID) || request.Amount <= 0 || string.IsNullOrEmpty(request.Reason))
            {
                return BadRequest(new { success = false, message = "Thông tin thu hồi điểm không hợp lệ" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Khóa bản ghi profile để cập nhật điểm an toàn
                var profile = await _context.LoyaltyProfiles
                    .FromSqlRaw("SELECT * FROM dbo.LoyaltyProfiles WITH (UPDLOCK, ROWLOCK) WHERE UserID = {0}", request.UserID)
                    .FirstOrDefaultAsync();

                if (profile == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hồ sơ Loyalty của người dùng" });
                }

                if (profile.AvailablePoints < request.Amount)
                {
                    return BadRequest(new { success = false, message = $"Số điểm thu hồi ({request.Amount}) vượt quá điểm khả dụng hiện có ({profile.AvailablePoints})" });
                }

                var oldAvailable = profile.AvailablePoints;
                var oldTotal = profile.TotalPoints;

                // Khấu trừ điểm và giảm luôn tổng tích lũy (TotalPoints) nếu cần xét hạ hạng
                profile.AvailablePoints = Math.Max(0, profile.AvailablePoints - request.Amount);
                profile.TotalPoints = Math.Max(0, profile.TotalPoints - request.Amount);
                profile.LastUpdated = DateTime.Now;

                // Xem xét hạ hạng thành viên (tìm hạng cao nhất thỏa mãn ngưỡng điểm mới)
                var newTierID = 1;
                var offset = profile.RankAdjustmentOffset;
                var matchingTier = await _context.LoyaltyTiers
                    .Where(t => t.IsActive && profile.TotalPoints >= (t.MinPoints - offset))
                    .OrderByDescending(t => t.MinPoints)
                    .ThenByDescending(t => t.TierID)
                    .FirstOrDefaultAsync();

                if (matchingTier != null)
                {
                    newTierID = matchingTier.TierID;
                }

                var tierChanged = newTierID != profile.CurrentTierID;
                var oldTierID = profile.CurrentTierID;
                profile.CurrentTierID = newTierID;

                // Tính lại PointsToNextTier
                var nextTier = await _context.LoyaltyTiers
                    .Where(t => t.IsActive && t.MinPoints > (matchingTier != null ? matchingTier.MinPoints : 0))
                    .OrderBy(t => t.MinPoints)
                    .FirstOrDefaultAsync();

                if (nextTier != null)
                {
                    profile.PointsToNextTier = Math.Max(0, (nextTier.MinPoints - offset) - profile.TotalPoints);
                }
                else
                {
                    profile.PointsToNextTier = 0;
                }

                _context.LoyaltyProfiles.Update(profile);

                // Ghi lịch sử biến động điểm
                var history = new LoyaltyPointHistory
                {
                    UserID = request.UserID,
                    TransactionType = "REVOKE",
                    Amount = -request.Amount,
                    Description = $"Thu hồi điểm thủ công. Lý do: {request.Reason}",
                    CreatedAt = DateTime.Now
                };
                _context.LoyaltyPointHistories.Add(history);

                // Nếu hạ hạng, ghi log hạ hạng
                if (tierChanged)
                {
                    var oldTierName = (await _context.LoyaltyTiers.FindAsync(oldTierID))?.TierName ?? "Standard";
                    var newTierName = matchingTier?.TierName ?? "Standard";
                    var historyBonus = new LoyaltyPointHistory
                    {
                        UserID = request.UserID,
                        TransactionType = "REVOKE",
                        Amount = 0,
                        Description = $"Hạ cấp thành viên từ {oldTierName} xuống {newTierName}",
                        CreatedAt = DateTime.Now
                    };
                    _context.LoyaltyPointHistories.Add(historyBonus);
                }

                // Ghi lưu chi tiết thu hồi thủ công
                var auditorId = GetCurrentUserId();
                var revocationLog = new LoyaltyManualRevocation
                {
                    UserID = request.UserID,
                    Amount = request.Amount,
                    Reason = request.Reason,
                    AuditorID = auditorId,
                    CreatedAt = DateTime.Now
                };
                _context.LoyaltyManualRevocations.Add(revocationLog);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Ghi log Audit hoạt động của Admin
                await LogAuditAsync("REVOKE_POINTS", "LoyaltyProfile", profile.UserID, 
                    $"Points: {oldAvailable}, Tier: {oldTierID}", 
                    $"Points: {profile.AvailablePoints}, Tier: {profile.CurrentTierID}", 
                    $"Thu hồi {request.Amount} điểm. Lý do: {request.Reason}");

                return Ok(new { success = true, message = "Thu hồi điểm thành công", data = profile });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi khi thu hồi điểm thủ công");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi thực hiện thu hồi điểm" });
            }
        }
        #endregion

        #region 8. Loyalty Transaction & Audit History
        /// <summary>
        /// Lấy lịch sử giao dịch điểm loyalty (lọc, phân trang).
        /// </summary>
        /// <param name="search">Từ khóa tìm kiếm (UserId, tên, email).</param>
        /// <param name="tierId">Id hạng thành viên hiện tại.</param>
        /// <param name="transactionType">Loại giao dịch (EARN/SPEND/REFUND/REVOKE/BONUS/RESET/ALL).</param>
        /// <param name="startDate">Ngày bắt đầu lọc.</param>
        /// <param name="endDate">Ngày kết thúc lọc.</param>
        /// <param name="page">Trang hiện tại.</param>
        /// <param name="pageSize">Số bản ghi mỗi trang.</param>
        [HttpGet("history")]
        public async Task<IActionResult> GetLoyaltyHistory(
            [FromQuery] string? search,
            [FromQuery] int? tierId,
            [FromQuery] string? transactionType,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15)
        {
            try
            {
                var query = _context.LoyaltyPointHistories
                    .Include(h => h.Profile).ThenInclude(p => p.User)
                    .AsQueryable();

                // Lọc theo từ khóa (UserId, tên, email)
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var kw = search.Trim().ToLower();
                    query = query.Where(h => h.UserID.Contains(kw) 
                        || (h.Profile != null && h.Profile.User != null && h.Profile.User.FullName != null && h.Profile.User.FullName.ToLower().Contains(kw))
                        || (h.Profile != null && h.Profile.User != null && h.Profile.User.Email != null && h.Profile.User.Email.ToLower().Contains(kw)));
                }

                // Lọc theo hạng thành viên hiện tại
                if (tierId.HasValue)
                {
                    query = query.Where(h => h.Profile != null && h.Profile.CurrentTierID == tierId.Value);
                }

                // Lọc theo loại giao dịch
                if (!string.IsNullOrEmpty(transactionType) && transactionType != "ALL")
                {
                    query = query.Where(h => h.TransactionType == transactionType);
                }

                // Lọc theo thời gian
                if (startDate.HasValue)
                {
                    query = query.Where(h => h.CreatedAt >= startDate.Value);
                }
                if (endDate.HasValue)
                {
                    query = query.Where(h => h.CreatedAt <= endDate.Value);
                }

                var totalItems = await query.CountAsync();
                var items = await query
                    .OrderByDescending(h => h.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(h => new
                    {
                        h.HistoryID,
                        h.UserID,
                        FullName = h.Profile != null && h.Profile.User != null ? h.Profile.User.FullName : "N/A",
                        Email = h.Profile != null && h.Profile.User != null ? h.Profile.User.Email : "N/A",
                        TierName = h.Profile != null && h.Profile.Tier != null ? h.Profile.Tier.TierName : "Standard",
                        h.TransactionType,
                        h.Amount,
                        h.InvoiceID,
                        h.Description,
                        h.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = items,
                    pagination = new
                    {
                        pageNumber = page,
                        pageSize,
                        totalItems,
                        totalPages = (int)Math.Ceiling((double)totalItems / pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy lịch sử giao dịch loyalty");
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ khi tải lịch sử giao dịch" });
            }
        }

        /// <summary>
        /// Lấy nhật ký audit hành động quản trị (lọc, phân trang).
        /// </summary>
        /// <param name="action">Mã hành động cần lọc.</param>
        /// <param name="search">Từ khóa tìm kiếm (email, entity, notes).</param>
        /// <param name="page">Trang hiện tại.</param>
        /// <param name="pageSize">Số bản ghi mỗi trang.</param>
        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] string? action,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15)
        {
            try
            {
                var query = _context.LoyaltyAuditLogs.AsQueryable();

                if (!string.IsNullOrEmpty(action))
                {
                    query = query.Where(l => l.Action == action);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var kw = search.Trim().ToLower();
                    query = query.Where(l => l.ActorEmail.ToLower().Contains(kw) 
                        || l.EntityName.ToLower().Contains(kw) 
                        || (l.Notes != null && l.Notes.ToLower().Contains(kw)));
                }

                var totalItems = await query.CountAsync();
                var items = await query
                    .OrderByDescending(l => l.Timestamp)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = items,
                    pagination = new
                    {
                        pageNumber = page,
                        pageSize,
                        totalItems,
                        totalPages = (int)Math.Ceiling((double)totalItems / pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy log audit");
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ khi tải log hoạt động" });
            }
        }
        #endregion

        #region 10. Birthday Gift Logs & Trigger
        /// <summary>
        /// Lấy danh sách log nhận quà sinh nhật.
        /// </summary>
        [HttpGet("birthday-gift-logs")]
        public async Task<IActionResult> GetBirthdayGiftLogs([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 15)
        {
            try
            {
                var query = _context.LoyaltyBirthdayGiftLogs
                    .Include(l => l.User)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var kw = search.Trim().ToLower();
                    query = query.Where(l => l.User != null && (l.User.FullName.ToLower().Contains(kw) || l.User.Email.ToLower().Contains(kw) || l.GiftType.ToLower().Contains(kw)));
                }

                var totalItems = await query.CountAsync();
                var items = await query
                    .OrderByDescending(l => l.ReceivedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(l => new
                    {
                        l.GiftLogID,
                        l.UserID,
                        FullName = l.User != null ? l.User.FullName : "N/A",
                        Email = l.User != null ? l.User.Email : "N/A",
                        l.Year,
                        l.GiftType,
                        l.GiftValue,
                        l.IssuedBy,
                        l.ReceivedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = items,
                    pagination = new
                    {
                        pageNumber = page,
                        pageSize,
                        totalItems,
                        totalPages = (int)Math.Ceiling((double)totalItems / pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy log nhận quà sinh nhật");
                return StatusCode(500, new { success = false, message = "Lỗi máy chủ khi tải log nhận quà sinh nhật" });
            }
        }

        public class ManualBirthdayGiftRequest
        {
            public string UserID { get; set; } = string.Empty;
        }

        /// <summary>
        /// Phát quà sinh nhật thủ công cho thành viên.
        /// </summary>
        [HttpPost("issue-birthday-gift-manual")]
        public async Task<IActionResult> IssueBirthdayGiftManual([FromBody] ManualBirthdayGiftRequest request, [FromServices] PolyBabyAPI.Services.LoyaltyBirthdayGiftJob job)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.UserID))
                {
                    return BadRequest(new { success = false, message = "UserId không được để trống" });
                }

                var user = await _context.Users.FindAsync(request.UserID);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
                }

                var year = DateTime.Today.Year;
                var adminEmail = GetCurrentUserEmail();

                // Kiểm tra xem đã nhận trong năm nay chưa
                var alreadyReceived = await _context.LoyaltyBirthdayGiftLogs
                    .AnyAsync(l => l.UserID == request.UserID && l.Year == year);
                if (alreadyReceived)
                {
                    return BadRequest(new { success = false, message = $"Thành viên này đã nhận quà sinh nhật của năm {year} rồi." });
                }

                var success = await job.IssueBirthdayGiftForUserAsync(request.UserID, year, adminEmail);
                if (success)
                {
                    return Ok(new { success = true, message = "Cấp phát quà sinh nhật thành công!" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Cấp phát thất bại. Vui lòng kiểm tra cấu hình đặc quyền quà sinh nhật của hạng thành viên hiện tại của người dùng." });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cấp phát quà sinh nhật thủ công");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
            }
        }

        /// <summary>
        /// Kích hoạt chạy job sinh nhật ngày hôm nay thủ công.
        /// </summary>
        [HttpPost("trigger-birthday-gift-job")]
        public async Task<IActionResult> TriggerBirthdayGiftJob([FromServices] PolyBabyAPI.Services.LoyaltyBirthdayGiftJob job)
        {
            try
            {
                await job.ExecuteAsync();
                return Ok(new { success = true, message = "Chạy Job phát quà sinh nhật tự động thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi chạy Job phát quà sinh nhật");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống khi chạy Job: " + ex.Message });
            }
        }
        #endregion

        #region Helpers
        private string GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
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
            await _context.SaveChangesAsync();
        }

        private async Task<string?> ValidatePrivilegeConfigAsync(LoyaltyTierPrivilege privilege)
        {
            if (privilege == null) return "Dữ liệu đặc quyền không hợp lệ";

            var allowedTypes = new[] { "VOUCHER", "FREESHIP", "DISCOUNT", "CASHBACK", "SUPPORT", "BIRTHDAY_GIFT" };
            if (!allowedTypes.Contains(privilege.PrivilegeType.ToUpper()))
            {
                return $"Loại đặc quyền '{privilege.PrivilegeType}' không hợp lệ. Phải thuộc: {string.Join(", ", allowedTypes)}";
            }

            // SUPPORT doesn't require complex value fields
            if (privilege.PrivilegeType.ToUpper() == "SUPPORT")
            {
                privilege.Value = "{}";
                return null;
            }

            if (string.IsNullOrWhiteSpace(privilege.Value))
            {
                return "Cấu hình chi tiết đặc quyền (Value) không được để trống";
            }

            try
            {
                using var jsonDoc = System.Text.Json.JsonDocument.Parse(privilege.Value);
                var root = jsonDoc.RootElement;

                switch (privilege.PrivilegeType.ToUpper())
                {
                    case "VOUCHER":
                        {
                            string mode = "EXISTING";
                            if (root.TryGetProperty("mode", out var modeProp))
                            {
                                mode = modeProp.GetString()?.ToUpper() ?? "EXISTING";
                            }

                            if (!root.TryGetProperty("voucherCode", out var codeProp) || string.IsNullOrWhiteSpace(codeProp.GetString()))
                                return "Thiếu mã voucher áp dụng (voucherCode)";
                            if (!root.TryGetProperty("quantity", out var qtyProp) || qtyProp.GetInt32() <= 0)
                                return "Số lượng voucher phát mỗi tháng (quantity) phải lớn hơn 0";
                            if (!root.TryGetProperty("validityDays", out var validityProp) || validityProp.GetInt32() <= 0)
                                return "Thời hạn sử dụng voucher (validityDays) phải lớn hơn 0";

                            if (mode == "EXISTING")
                            {
                                var voucherCode = codeProp.GetString()!;
                                var voucherExists = await _context.Vouchers.AnyAsync(v => v.Code == voucherCode);
                                if (!voucherExists)
                                    return $"Voucher với mã '{voucherCode}' không tồn tại trong hệ thống";
                            }
                            else if (mode == "CUSTOM")
                            {
                                if (!root.TryGetProperty("discountType", out var discTypeProp) || string.IsNullOrWhiteSpace(discTypeProp.GetString()))
                                    return "Thiếu kiểu giảm giá (discountType: PERCENT hoặc FIXED) cho voucher riêng";

                                var discType = discTypeProp.GetString()!.ToUpper();
                                if (discType != "PERCENT" && discType != "FIXED")
                                    return "Kiểu giảm giá (discountType) phải là PERCENT hoặc FIXED";

                                if (!root.TryGetProperty("discountValue", out var valProp) || valProp.GetDecimal() <= 0)
                                    return "Giá trị giảm (discountValue) phải lớn hơn 0";

                                if (discType == "PERCENT")
                                {
                                    var pct = valProp.GetDecimal();
                                    if (pct > 100)
                                        return "Tỷ lệ giảm giá (%) không được vượt quá 100%";
                                    if (!root.TryGetProperty("maxDiscount", out var maxProp) || maxProp.GetDecimal() < 0)
                                        return "Giá trị giảm tối đa (maxDiscount) không được âm";
                                }

                                if (!root.TryGetProperty("minOrderValue", out var minProp) || minProp.GetDecimal() < 0)
                                    return "Điều kiện đơn hàng tối thiểu (minOrderValue) không được âm";
                            }
                            else
                            {
                                return "Chế độ phát voucher (mode) không hợp lệ (Phải là EXISTING hoặc CUSTOM)";
                            }
                        }
                        break;

                    case "FREESHIP":
                        {
                            if (!root.TryGetProperty("quantity", out var qtyProp) || qtyProp.GetInt32() <= 0)
                                return "Số lượt miễn phí/tháng (quantity) phải lớn hơn 0";
                            if (!root.TryGetProperty("maxSupport", out var maxProp) || maxProp.GetDecimal() <= 0)
                                return "Giá trị hỗ trợ tối đa (maxSupport) phải lớn hơn 0";
                            if (!root.TryGetProperty("minOrderValue", out var minProp) || minProp.GetDecimal() < 0)
                                return "Điều kiện đơn hàng tối thiểu (minOrderValue) không được âm";
                        }
                        break;

                    case "DISCOUNT":
                        {
                            if (!root.TryGetProperty("discountType", out var typeProp) || string.IsNullOrWhiteSpace(typeProp.GetString()))
                                return "Thiếu kiểu giảm giá (discountType: PERCENT hoặc FIXED)";

                            var discType = typeProp.GetString()!.ToUpper();
                            if (discType != "PERCENT" && discType != "FIXED")
                                return "Kiểu giảm giá (discountType) phải là PERCENT hoặc FIXED";

                            if (!root.TryGetProperty("discountValue", out var valProp) || valProp.GetDecimal() <= 0)
                                return "Giá trị giảm (discountValue) phải lớn hơn 0";

                            if (discType == "PERCENT")
                            {
                                var pct = valProp.GetDecimal();
                                if (pct > 100)
                                    return "Tỷ lệ giảm giá (%) không được vượt quá 100%";

                                if (!root.TryGetProperty("maxDiscount", out var maxProp) || maxProp.GetDecimal() < 0)
                                    return "Giá trị giảm tối đa (maxDiscount) không được âm";
                            }
                        }
                        break;

                    case "CASHBACK":
                        {
                            if (!root.TryGetProperty("cashbackRate", out var rateProp) || rateProp.GetDecimal() <= 0 || rateProp.GetDecimal() > 100)
                                return "Tỷ lệ hoàn xu (cashbackRate) phải từ 1 đến 100%";
                            if (!root.TryGetProperty("maxCashback", out var maxProp) || maxProp.GetDecimal() <= 0)
                                return "Giới hạn hoàn xu (maxCashback) phải lớn hơn 0";
                        }
                        break;

                    case "BIRTHDAY_GIFT":
                        {
                            if (!root.TryGetProperty("giftType", out var gTypeProp) || string.IsNullOrWhiteSpace(gTypeProp.GetString()))
                                return "Thiếu loại quà tặng sinh nhật (giftType: VOUCHER, POINTS, COINS, PHYSICAL)";

                            var gType = gTypeProp.GetString()!.ToUpper();
                            var allowedGiftTypes = new[] { "VOUCHER", "POINTS", "COINS", "PHYSICAL" };
                            if (!allowedGiftTypes.Contains(gType))
                                return $"Loại quà tặng sinh nhật '{gType}' không hợp lệ. Phải thuộc: {string.Join(", ", allowedGiftTypes)}";

                            if (gType == "VOUCHER")
                            {
                                if (!root.TryGetProperty("voucherCode", out var codeProp) || string.IsNullOrWhiteSpace(codeProp.GetString()))
                                    return "Thiếu mã voucher sinh nhật (voucherCode)";
                                if (!root.TryGetProperty("quantity", out var qtyProp) || qtyProp.GetInt32() <= 0)
                                    return "Số lượng voucher (quantity) phải lớn hơn 0";

                                var voucherCode = codeProp.GetString()!;
                                var voucherExists = await _context.Vouchers.AnyAsync(v => v.Code == voucherCode);
                                if (!voucherExists)
                                    return $"Voucher sinh nhật với mã '{voucherCode}' không tồn tại trong hệ thống";
                            }
                            else if (gType == "POINTS")
                            {
                                if (!root.TryGetProperty("points", out var ptsProp) || ptsProp.GetInt32() <= 0)
                                    return "Số điểm tặng (points) phải lớn hơn 0";
                            }
                            else if (gType == "COINS")
                            {
                                if (!root.TryGetProperty("coins", out var coinsProp) || coinsProp.GetInt32() <= 0)
                                    return "Số xu tặng (coins) phải lớn hơn 0";
                            }
                            else if (gType == "PHYSICAL")
                            {
                                if (!root.TryGetProperty("giftName", out var nameProp) || string.IsNullOrWhiteSpace(nameProp.GetString()))
                                    return "Thiếu tên quà vật lý (giftName)";
                            }
                        }
                        break;
                }
            }
            catch (System.Text.Json.JsonException)
            {
                return "Cấu hình chi tiết đặc quyền (Value) không đúng định dạng JSON hợp lệ";
            }

            // Kiểm tra trùng đặc quyền loại & cấu hình trong cùng 1 hạng
            var isDuplicate = await _context.LoyaltyTierPrivileges.AnyAsync(p => 
                p.TierID == privilege.TierID 
                && p.PrivilegeType == privilege.PrivilegeType 
                && p.Value == privilege.Value 
                && p.PrivilegeID != privilege.PrivilegeID);

            if (isDuplicate)
            {
                return "Đặc quyền trùng loại và cùng cấu hình này đã tồn tại trong hạng thành viên";
            }

            return null;
        }
        #endregion
    }
}

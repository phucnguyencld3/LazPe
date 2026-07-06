using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace PolyBabyAPI.Controllers
{
    [Route("api/admin/loyalty/voucher-redemptions")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminLoyaltyVoucherRedemptionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminLoyaltyVoucherRedemptionController> _logger;

        public AdminLoyaltyVoucherRedemptionController(ApplicationDbContext context, ILogger<AdminLoyaltyVoucherRedemptionController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var list = await _context.LoyaltyVoucherRedemptions
                    .Include(r => r.Voucher)
                    .Include(r => r.Tier)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();
                    
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách cấu hình đổi voucher");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var redemption = await _context.LoyaltyVoucherRedemptions
                    .Include(r => r.Voucher)
                    .Include(r => r.Tier)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (redemption == null)
                    return NotFound(new { success = false, message = "Không tìm thấy cấu hình." });

                return Ok(new { success = true, data = redemption });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy chi tiết cấu hình đổi voucher");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LoyaltyVoucherRedemption redemption)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Kiểm tra voucher tồn tại
                var voucher = await _context.Vouchers.FindAsync(redemption.VoucherID);
                if (voucher == null)
                    return BadRequest(new { success = false, message = "Voucher không tồn tại." });

                if (redemption.TierID.HasValue)
                {
                    var tier = await _context.LoyaltyTiers.FindAsync(redemption.TierID.Value);
                    if (tier == null)
                        return BadRequest(new { success = false, message = "Hạng thành viên không tồn tại." });
                }

                redemption.CreatedAt = DateTime.Now;
                _context.LoyaltyVoucherRedemptions.Add(redemption);
                
                // Audit log
                var auditLog = new LoyaltyAuditLog
                {
                    Action = "CREATE_VOUCHER_REDEMPTION",
                    ActorID = User.FindFirst("UserId")?.Value ?? "",
                    EntityName = "LoyaltyVoucherRedemption",
                    EntityID = redemption.Id.ToString(),
                    Notes = $"VoucherID: {redemption.VoucherID}, PointCost: {redemption.PointCost}",
                    Timestamp = DateTime.Now
                };
                _context.LoyaltyAuditLogs.Add(auditLog);
                
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Thêm cấu hình đổi voucher thành công.", data = redemption });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo cấu hình đổi voucher");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] LoyaltyVoucherRedemption redemption)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var existing = await _context.LoyaltyVoucherRedemptions.FindAsync(id);
                if (existing == null)
                    return NotFound(new { success = false, message = "Không tìm thấy cấu hình." });

                existing.VoucherID = redemption.VoucherID;
                existing.PointCost = redemption.PointCost;
                existing.TierID = redemption.TierID;
                existing.LimitPerUserPerPeriod = redemption.LimitPerUserPerPeriod;
                existing.TotalQuotaPerPeriod = redemption.TotalQuotaPerPeriod;
                existing.ResetCycle = redemption.ResetCycle;
                existing.ResetDayOfMonth = redemption.ResetCycle == RedemptionResetCycle.Monthly ? 1 : null;
                existing.StartDate = redemption.StartDate;
                existing.EndDate = redemption.EndDate;
                existing.IsActive = redemption.IsActive;
                existing.UpdatedAt = DateTime.Now;

                _context.LoyaltyVoucherRedemptions.Update(existing);
                
                // Audit log
                var auditLog = new LoyaltyAuditLog
                {
                    Action = "UPDATE_VOUCHER_REDEMPTION",
                    ActorID = User.FindFirst("UserId")?.Value ?? "",
                    EntityName = "LoyaltyVoucherRedemption",
                    EntityID = id.ToString(),
                    Notes = $"VoucherID: {existing.VoucherID}, PointCost: {existing.PointCost}",
                    Timestamp = DateTime.Now
                };
                _context.LoyaltyAuditLogs.Add(auditLog);
                
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật cấu hình thành công.", data = existing });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật cấu hình đổi voucher");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var existing = await _context.LoyaltyVoucherRedemptions.FindAsync(id);
                if (existing == null)
                    return NotFound(new { success = false, message = "Không tìm thấy cấu hình." });

                _context.LoyaltyVoucherRedemptions.Remove(existing);
                
                // Audit log
                var auditLog = new LoyaltyAuditLog
                {
                    Action = "DELETE_VOUCHER_REDEMPTION",
                    ActorID = User.FindFirst("UserId")?.Value ?? "",
                    EntityName = "LoyaltyVoucherRedemption",
                    EntityID = id.ToString(),
                    Notes = $"Xóa cấu hình ID: {id}",
                    Timestamp = DateTime.Now
                };
                _context.LoyaltyAuditLogs.Add(auditLog);
                
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa cấu hình thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa cấu hình đổi voucher");
                return StatusCode(500, new { success = false, message = "Lỗi hệ thống" });
            }
        }
        
        [HttpGet("{id}/histories")]
        public async Task<IActionResult> GetRedemptionHistories(int id)
        {
             try
             {
                 var histories = await _context.LoyaltyVoucherRedemptionHistories
                     .Include(h => h.User)
                     .Where(h => h.VoucherID == _context.LoyaltyVoucherRedemptions.Where(r => r.Id == id).Select(r => r.VoucherID).FirstOrDefault())
                     .OrderByDescending(h => h.RedeemedAt)
                     .ToListAsync();
                     
                 return Ok(new { success = true, data = histories });
             }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "Lỗi khi lấy lịch sử đổi voucher");
                 return StatusCode(500, new { success = false, message = "Lỗi hệ thống" });
             }
        }
    }
}

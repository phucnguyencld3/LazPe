using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WithdrawController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<WithdrawController> _logger;
        private readonly PolyBabyAPI.Interfaces.IWalletSecurityService _walletSecurityService;
        private readonly PolyBabyAPI.Interfaces.IWithdrawEmailService _emailService;
        private readonly IConfiguration _configuration;

        public WithdrawController(
            ApplicationDbContext context, 
            UserManager<ApplicationUser> userManager, 
            ILogger<WithdrawController> logger,
            PolyBabyAPI.Interfaces.IWalletSecurityService walletSecurityService,
            PolyBabyAPI.Interfaces.IWithdrawEmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
            _walletSecurityService = walletSecurityService;
            _emailService = emailService;
            _configuration = configuration;
        }

        /// <summary>
        /// Tạo yêu cầu rút tiền mới (User)
        /// Tiền trong Ví sẽ bị trừ ngay lập tức để tạm giữ.
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateRequest([FromBody] CreateWithdrawRequestDto request)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

                // BẢO MẬT VÍ: Kiểm tra mã PIN
                if (string.IsNullOrEmpty(request.PaymentPin))
                    return BadRequest(new { message = "Vui lòng nhập mã PIN thanh toán" });

                var validationResult = await _walletSecurityService.ValidatePaymentPinWithLockoutAsync(user, request.PaymentPin);
                if (!validationResult.Success)
                    return BadRequest(new { message = validationResult.Message, isLocked = validationResult.IsLocked, failedCount = validationResult.FailedCount });

                // BẢO MẬT VÍ: Kiểm tra toàn vẹn dữ liệu
                if (!_walletSecurityService.ValidateSignature(user))
                    return BadRequest(new { message = "Dữ liệu ví không hợp lệ hoặc đã bị can thiệp. Vui lòng liên hệ CSKH." });

                if (user.WalletBalance < request.Amount)
                    return BadRequest(new { message = "Số dư Ví không đủ để thực hiện yêu cầu này" });

                // GIỚI HẠN RÚT TIỀN: Tối đa 10,000,000 VND mỗi lần
                if (request.Amount > 10_000_000)
                    return BadRequest(new { message = "Số tiền rút mỗi lần tối đa là 10.000.000 VNĐ" });

                // GIỚI HẠN RÚT TIỀN: Tối đa 3 lần mỗi ngày
                var today = DateTime.Now.Date;
                var todayWithdrawCount = await _context.WithdrawRequests
                    .CountAsync(w => w.UserID == user.Id && w.CreatedAt.Date == today);
                
                if (todayWithdrawCount >= 3)
                    return BadRequest(new { message = "Bạn đã vượt quá giới hạn 3 lần rút tiền trong ngày hôm nay" });

                using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    // 1. Tạo yêu cầu rút tiền
                    var withdraw = new WithdrawRequest
                    {
                        UserID = user.Id,
                        Amount = request.Amount,
                        BankName = request.BankName,
                        BankAccount = request.BankAccount,
                        BankOwnerName = request.BankOwnerName,
                        Status = "Pending",
                        CreatedAt = DateTime.Now
                    };
                    _context.WithdrawRequests.Add(withdraw);
                    await _context.SaveChangesAsync(); // Để lấy RequestID

                    // 2. Trừ tiền Ví tạm giữ
                    user.WalletBalance -= request.Amount;

                    // BẢO MẬT VÍ: Ký lại dữ liệu ví sau khi trừ tiền
                    user.WalletSignature = _walletSecurityService.GenerateSignature(user.Id, user.WalletBalance, user.CoinsBalance);

                    // 3. Ghi log BalanceTransaction
                    string idempotencyKey = $"WITHDRAW_REQ_{withdraw.RequestID}";
                    _context.BalanceTransactions.Add(new BalanceTransaction
                    {
                        UserID = user.Id,
                        Amount = request.Amount,
                        Direction = BalanceTransactionDirection.Debit,
                        SourceType = BalanceSourceType.Wallet,
                        Reason = $"Tạm giữ số dư cho Yêu cầu Rút tiền #{withdraw.RequestID}",
                        IdempotencyKey = idempotencyKey,
                        HashSignature = "" // Sẽ cần cập nhật HMAC sau
                    });

                    await _context.SaveChangesAsync();
                    await tx.CommitAsync();

                    // Gửi email cho Admin
                    try
                    {
                        string adminEmail = _configuration["EmailSettings:AdminEmail"] ?? "admin@lazpe.com";
                        await _emailService.SendNewRequestAdminEmailAsync(adminEmail, user.FullName ?? "Người dùng", withdraw.Amount, withdraw.CreatedAt);
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogWarning(emailEx, "Lỗi khi gửi email thông báo cho Admin.");
                    }

                    return Ok(new { message = "Tạo yêu cầu rút tiền thành công", requestId = withdraw.RequestID });
                }
                catch (Exception ex)
                {
                    await tx.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo yêu cầu rút tiền");
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách yêu cầu rút tiền của bản thân (User)
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetMyRequests()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

            var requests = await _context.WithdrawRequests
                .Where(w => w.UserID == user.Id)
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();

            return Ok(requests);
        }

        /// <summary>
        /// Lấy lịch sử biến động số dư (BalanceTransaction) của User
        /// </summary>
        [HttpGet("balance-history")]
        public async Task<IActionResult> GetBalanceHistory()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

            var transactions = await _context.BalanceTransactions
                .Where(t => t.UserID == user.Id)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(transactions);
        }

        /// <summary>
        /// Lấy toàn bộ danh sách yêu cầu rút tiền (Admin)
        /// </summary>
        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllRequests([FromQuery] string? status)
        {
            var query = _context.WithdrawRequests.Include(w => w.User).AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(w => w.Status == status);
            }

            var requests = await query.OrderByDescending(w => w.CreatedAt).ToListAsync();
            return Ok(requests);
        }

        /// <summary>
        /// Xử lý (Duyệt/Từ chối) yêu cầu rút tiền (Admin)
        /// </summary>
        [HttpPost("admin/process/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ProcessRequest(int id, [FromBody] ProcessWithdrawRequestDto request)
        {
            try
            {
                var withdraw = await _context.WithdrawRequests
                    .Include(w => w.User)
                    .FirstOrDefaultAsync(w => w.RequestID == id);

                if (withdraw == null)
                    return NotFound(new { message = "Không tìm thấy yêu cầu rút tiền" });

                if (withdraw.Status != "Pending")
                    return BadRequest(new { message = $"Yêu cầu rút tiền này đã được xử lý ({withdraw.Status})" });

                using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    if (request.IsApproved)
                    {
                        withdraw.Status = "Approved";
                        withdraw.AdminNote = request.AdminNote;
                        withdraw.ProcessedAt = DateTime.Now;
                    }
                    else
                    {
                        withdraw.Status = "Rejected";
                        withdraw.AdminNote = request.AdminNote;
                        withdraw.ProcessedAt = DateTime.Now;

                        // Nếu từ chối, hoàn lại số tiền vào Ví
                        if (withdraw.User != null)
                        {
                            withdraw.User.WalletBalance += withdraw.Amount;

                            string idempotencyKey = $"WITHDRAW_REJ_{withdraw.RequestID}";
                            _context.BalanceTransactions.Add(new BalanceTransaction
                            {
                                UserID = withdraw.UserID,
                                Amount = withdraw.Amount,
                                Direction = BalanceTransactionDirection.Credit,
                                SourceType = BalanceSourceType.Wallet,
                                Reason = $"Hoàn tiền do Từ chối Yêu cầu Rút tiền #{withdraw.RequestID}",
                                IdempotencyKey = idempotencyKey,
                                HashSignature = "" // Sẽ cần cập nhật HMAC sau
                            });

                            // BẢO MẬT VÍ: Ký lại dữ liệu ví sau khi hoàn tiền
                            withdraw.User.WalletSignature = _walletSecurityService.GenerateSignature(withdraw.User.Id, withdraw.User.WalletBalance, withdraw.User.CoinsBalance);
                        }
                    }

                    await _context.SaveChangesAsync();
                    await tx.CommitAsync();

                    // Gửi email cho User
                    try
                    {
                        if (withdraw.User != null && !string.IsNullOrEmpty(withdraw.User.Email))
                        {
                            await _emailService.SendProcessRequestUserEmailAsync(
                                withdraw.User.Email,
                                withdraw.User.FullName ?? "Quý khách",
                                withdraw.Amount,
                                request.IsApproved,
                                request.AdminNote,
                                withdraw.ProcessedAt.Value
                            );
                        }
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogWarning(emailEx, "Lỗi khi gửi email thông báo kết quả cho User.");
                    }

                    return Ok(new { message = request.IsApproved ? "Đã duyệt yêu cầu rút tiền" : "Đã từ chối yêu cầu rút tiền và hoàn lại số dư" });
                }
                catch (Exception ex)
                {
                    await tx.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý yêu cầu rút tiền");
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống", error = ex.Message });
            }
        }
    }
}

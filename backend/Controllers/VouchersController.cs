using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.DTOs;
using static PolyBabyAPI.DTOs.Voucherdtos;
using System.Security.Claims;

namespace PolyBabyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VouchersController : ControllerBase
    {
        private readonly IVoucherService _voucherService;
        private readonly ApplicationDbContext _context;

        public VouchersController(IVoucherService voucherService, ApplicationDbContext context)
        {
            _voucherService = voucherService;
            _context = context;
        }

        // GET: api/vouchers
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var vouchers = await _voucherService.GetAllVouchersAsync();
            var result = vouchers.Select(v => new
            {
                v.VoucherID,
                v.Code,
                v.Name,
                v.DiscountType,
                v.DiscountValue,
                v.MinOrderValue,
                v.MaxDiscount,
                v.StartDate,
                v.EndDate,
                v.TotalQuantity,
                v.UsedQuantity,
                v.Status,
                v.VisibilityType,
                v.ExclusiveType,
                v.VoucherType,
                v.IsFreeShipping,
                v.MaxShippingDiscount,
                v.UsageLimitPerUser
            });
            return Ok(result);
        }

        // GET: api/vouchers/public
        [HttpGet("public")]
        public async Task<IActionResult> GetPublicVouchers()
        {
            var now = DateTime.Now;
            var userId = GetCurrentUserId();

            var query = _context.Vouchers
                .Where(v => v.Status
                    && v.VisibilityType == VoucherVisibilityType.Public
                    && v.ExclusiveType != ExclusiveDistributionType.DirectAssign
                    && v.StartDate <= now
                    && v.EndDate >= now
                    && v.UsedQuantity < v.TotalQuantity)
                .OrderByDescending(v => v.StartDate)
                .AsQueryable();

            var vouchers = await query.Select(v => new
            {
                v.VoucherID,
                v.Code,
                v.Name,
                v.DiscountType,
                v.DiscountValue,
                v.MinOrderValue,
                v.MaxDiscount,
                v.TotalQuantity,
                v.UsedQuantity,
                v.StartDate,
                v.EndDate,
                RemainingQuantity = v.TotalQuantity - v.UsedQuantity,
                VisibilityType = v.VisibilityType.ToString(),
                VoucherType = (int)v.VoucherType,
                v.IsFreeShipping,
                v.MaxShippingDiscount
            }).ToListAsync();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Ok(vouchers.Select(v => new
                {
                    v.VoucherID,
                    v.Code,
                    v.Name,
                    v.DiscountType,
                    v.DiscountValue,
                    v.MinOrderValue,
                    v.MaxDiscount,
                    v.TotalQuantity,
                    v.UsedQuantity,
                    v.StartDate,
                    v.EndDate,
                    v.RemainingQuantity,
                    v.VisibilityType,
                    IsCollected = false,
                    v.VoucherType,
                    v.IsFreeShipping,
                    v.MaxShippingDiscount
                }));
            }

            var collectedVoucherIds = await _context.UserVouchers
                .Where(uv => uv.UserID == userId && uv.Status == UserVoucherStatus.Unused)
                .Select(uv => uv.VoucherID)
                .ToListAsync();

            return Ok(vouchers.Select(v => new
            {
                v.VoucherID,
                v.Code,
                v.Name,
                v.DiscountType,
                v.DiscountValue,
                v.MinOrderValue,
                v.MaxDiscount,
                v.TotalQuantity,
                v.UsedQuantity,
                v.StartDate,
                v.EndDate,
                v.RemainingQuantity,
                v.VisibilityType,
                IsCollected = collectedVoucherIds.Contains(v.VoucherID),
                v.VoucherType,
                v.IsFreeShipping,
                v.MaxShippingDiscount
            }));
        }

        // GET: api/vouchers/search-users?keyword=
        [Authorize]
        [HttpGet("search-users")]
        public async Task<IActionResult> SearchUsers([FromQuery] string? keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword) || keyword.Trim().Length < 3)
            {
                return Ok(new List<object>());
            }

            var q = keyword.Trim();
            var normalizedKeyword = q.ToUpper();
            var pattern = $"%{q}%";
            var phoneDigits = new string(q.Where(char.IsDigit).ToArray());

            var users = await _context.Users
                .AsNoTracking()
                .Where(u => EF.Functions.Like(u.Id, pattern)
                    || (u.FullName != null && EF.Functions.Like(u.FullName, pattern))
                    || (u.PhoneNumber != null && EF.Functions.Like(u.PhoneNumber, pattern))
                    || (u.Email != null && EF.Functions.Like(u.Email, pattern))
                    || (u.NormalizedEmail != null && u.NormalizedEmail.Contains(normalizedKeyword))
                    || (!string.IsNullOrEmpty(phoneDigits) && u.PhoneNumber != null && u.PhoneNumber.Contains(phoneDigits)))
                .OrderBy(u => u.FullName)
                .Take(15)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.PhoneNumber
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/vouchers/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var voucher = await _voucherService.GetVoucherByIdAsync(id);
            if (voucher == null)
                return NotFound();

            return Ok(new
            {
                voucher.VoucherID,
                voucher.Code,
                voucher.Name,
                voucher.DiscountType,
                voucher.DiscountValue,
                voucher.MinOrderValue,
                voucher.MaxDiscount,
                voucher.StartDate,
                voucher.EndDate,
                voucher.TotalQuantity,
                voucher.UsedQuantity,
                voucher.Status,
                voucher.VisibilityType,
                voucher.ExclusiveType,
                voucher.VoucherType,
                voucher.IsFreeShipping,
                voucher.MaxShippingDiscount,
                voucher.UsageLimitPerUser
            });
        }

        // GET: api/vouchers/5/usages
        [HttpGet("{id}/usages")]
        public async Task<IActionResult> GetUsages(int id)
        {
            var voucher = await _voucherService.GetVoucherByIdAsync(id);
            if (voucher == null)
                return NotFound();

            var usages = await _context.VoucherUsages
                .Where(vu => vu.VoucherID == id)
                .Include(vu => vu.User)
                .Include(vu => vu.Invoice)
                .OrderByDescending(vu => vu.UsedAt)
                .Select(vu => new
                {
                    vu.VoucherID,
                    vu.UserID,
                    UserFullName = vu.User != null ? vu.User.FullName : "N/A",
                    UserEmail = vu.User != null ? vu.User.Email : "N/A",
                    vu.InvoiceID,
                    InvoiceStatus = vu.Invoice != null ? vu.Invoice.Status.ToString() : null,
                    vu.DiscountAmount,
                    vu.OrderValue,
                    vu.UsedAt
                })
                .ToListAsync();

            return Ok(new
            {
                voucher = new
                {
                    voucher.VoucherID,
                    voucher.Code,
                    voucher.Name,
                    voucher.DiscountType,
                    voucher.DiscountValue,
                    voucher.MinOrderValue,
                    voucher.MaxDiscount,
                    voucher.TotalQuantity,
                    voucher.UsedQuantity,
                    voucher.Status,
                    voucher.StartDate,
                    voucher.EndDate
                },
                usages,
                totalUsages = usages.Count,
                totalDiscountGiven = usages.Sum(u => u.DiscountAmount)
            });
        }

        // POST: api/vouchers
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateVoucherRequest request)
        {
            var visibilityType = Enum.IsDefined(typeof(VoucherVisibilityType), request.VisibilityType)
                ? (VoucherVisibilityType)request.VisibilityType
                : VoucherVisibilityType.Public;

            var exclusiveType = Enum.IsDefined(typeof(ExclusiveDistributionType), request.ExclusiveType)
                ? (ExclusiveDistributionType)request.ExclusiveType
                : ExclusiveDistributionType.None;

            if (visibilityType == VoucherVisibilityType.Public && exclusiveType == ExclusiveDistributionType.ManualCode)
            {
                exclusiveType = ExclusiveDistributionType.None;
            }

            var voucher = new Voucher
            {
                Code = string.IsNullOrWhiteSpace(request.Code)
                    ? await _voucherService.GenerateUniqueVoucherCodeAsync()
                    : request.Code.ToUpper().Trim(),
                Name = request.Name,
                DiscountValue = request.DiscountValue,
                DiscountType = request.DiscountType,
                MinOrderValue = request.MinOrderValue,
                MaxDiscount = request.MaxDiscount,
                TotalQuantity = request.TotalQuantity,
                UsedQuantity = 0,
                Status = request.Status,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                VisibilityType = visibilityType,
                ExclusiveType = exclusiveType,
                VoucherType = Enum.IsDefined(typeof(VoucherType), request.VoucherType)
                    ? (VoucherType)request.VoucherType
                    : VoucherType.ProductDiscount,
                IsFreeShipping = request.IsFreeShipping,
                MaxShippingDiscount = request.MaxShippingDiscount,
                UsageLimitPerUser = request.UsageLimitPerUser
            };

            await _voucherService.CreateVoucherAsync(voucher);

            var autoAssignedCount = 0;
            if (voucher.VisibilityType == VoucherVisibilityType.Public
                && voucher.ExclusiveType == ExclusiveDistributionType.DirectAssign)
            {
                autoAssignedCount = await AssignPublicVoucherToAllUsersAsync(voucher);
            }

            return CreatedAtAction(nameof(GetById), new { id = voucher.VoucherID }, new
            {
                voucher = new
                {
                    voucher.VoucherID,
                    voucher.Code,
                    voucher.Name,
                    voucher.DiscountType,
                    voucher.DiscountValue,
                    voucher.MinOrderValue,
                    voucher.MaxDiscount,
                    voucher.StartDate,
                    voucher.EndDate,
                    voucher.TotalQuantity,
                    voucher.UsedQuantity,
                    voucher.Status,
                    voucher.VisibilityType,
                    voucher.ExclusiveType,
                    voucher.VoucherType,
                    voucher.IsFreeShipping,
                    voucher.MaxShippingDiscount,
                    voucher.UsageLimitPerUser
                },
                autoAssignedCount,
                message = autoAssignedCount > 0
                    ? $"Tạo voucher thành công. Đã tự động phát {autoAssignedCount} voucher vào ví người dùng."
                    : "Tạo voucher thành công."
            });
        }

        // PUT: api/vouchers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateVoucherRequest request)
        {
            var voucher = await _voucherService.GetVoucherByIdAsync(id);
            if (voucher == null)
                return NotFound();

            voucher.Name = request.Name ?? voucher.Name;
            voucher.DiscountValue = request.DiscountValue;
            voucher.DiscountType = request.DiscountType;
            voucher.MinOrderValue = request.MinOrderValue;
            voucher.MaxDiscount = request.MaxDiscount;
            voucher.TotalQuantity = request.TotalQuantity;
            voucher.Status = request.Status;
            voucher.StartDate = (DateTime)request.StartDate;
            voucher.EndDate = (DateTime)request.EndDate;
            voucher.VisibilityType = Enum.IsDefined(typeof(VoucherVisibilityType), request.VisibilityType)
                ? (VoucherVisibilityType)request.VisibilityType
                : voucher.VisibilityType;
            voucher.ExclusiveType = Enum.IsDefined(typeof(ExclusiveDistributionType), request.ExclusiveType)
                ? (ExclusiveDistributionType)request.ExclusiveType
                : voucher.ExclusiveType;

            if (voucher.VisibilityType == VoucherVisibilityType.Public && voucher.ExclusiveType == ExclusiveDistributionType.ManualCode)
            {
                voucher.ExclusiveType = ExclusiveDistributionType.None;
            }

            voucher.VoucherType = Enum.IsDefined(typeof(VoucherType), request.VoucherType)
                ? (VoucherType)request.VoucherType
                : voucher.VoucherType;
            voucher.IsFreeShipping = request.IsFreeShipping;
            voucher.MaxShippingDiscount = request.MaxShippingDiscount;
            voucher.UsageLimitPerUser = request.UsageLimitPerUser;

            await _voucherService.UpdateVoucherAsync(voucher);

            var autoAssignedCount = 0;
            if (voucher.VisibilityType == VoucherVisibilityType.Public
                && voucher.ExclusiveType == ExclusiveDistributionType.DirectAssign)
            {
                autoAssignedCount = await AssignPublicVoucherToAllUsersAsync(voucher);
            }

            return Ok(new
            {
                voucher = new
                {
                    voucher.VoucherID,
                    voucher.Code,
                    voucher.Name,
                    voucher.DiscountType,
                    voucher.DiscountValue,
                    voucher.MinOrderValue,
                    voucher.MaxDiscount,
                    voucher.StartDate,
                    voucher.EndDate,
                    voucher.TotalQuantity,
                    voucher.UsedQuantity,
                    voucher.Status,
                    voucher.VisibilityType,
                    voucher.ExclusiveType,
                    voucher.VoucherType,
                    voucher.IsFreeShipping,
                    voucher.MaxShippingDiscount,
                    voucher.UsageLimitPerUser
                },
                autoAssignedCount,
                message = autoAssignedCount > 0
                    ? $"Cập nhật thành công. Đã tự động phát thêm {autoAssignedCount} voucher vào ví người dùng."
                    : "Cập nhật voucher thành công."
            });
        }

        // GET: api/vouchers/wallet
        [Authorize]
        [HttpGet("wallet")]
        public async Task<IActionResult> GetWallet()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { message = "Người dùng chưa đăng nhập." });
            }

            var now = DateTime.Now;
            var expiredEntries = await _context.UserVouchers
                .Include(uv => uv.Voucher)
                .Where(uv => uv.UserID == userId
                    && uv.Status == UserVoucherStatus.Unused
                    && uv.Voucher != null
                    && uv.Voucher.EndDate < now)
                .ToListAsync();

            if (expiredEntries.Any())
            {
                foreach (var entry in expiredEntries)
                {
                    entry.Status = UserVoucherStatus.Expired;
                }

                await _context.SaveChangesAsync();
            }

            var wallet = await _context.UserVouchers
                .Where(uv => uv.UserID == userId)
                .Include(uv => uv.Voucher)
                .OrderByDescending(uv => uv.CollectedAt)
                .Select(uv => new
                {
                    uv.UserVoucherID,
                    uv.VoucherID,
                    VoucherCode = uv.Voucher != null ? uv.Voucher.Code : string.Empty,
                    VoucherName = uv.Voucher != null ? uv.Voucher.Name : string.Empty,
                    DiscountType = uv.Voucher != null ? uv.Voucher.DiscountType : 0,
                    DiscountValue = uv.Voucher != null ? uv.Voucher.DiscountValue : 0,
                    MinOrderValue = uv.Voucher != null ? uv.Voucher.MinOrderValue : 0,
                    MaxDiscount = uv.Voucher != null ? uv.Voucher.MaxDiscount : 0,
                    StartDate = uv.Voucher != null ? uv.Voucher.StartDate : uv.CollectedAt,
                    EndDate = uv.Voucher != null ? uv.Voucher.EndDate : uv.CollectedAt,
                    VoucherType = uv.Voucher != null && uv.Voucher.VisibilityType == VoucherVisibilityType.Public
                        ? "Public"
                        : "Exclusive",
                    SourceType = uv.SourceType.ToString(),
                    Status = uv.Status.ToString(),
                    uv.CollectedAt,
                    uv.UsedAt
                })
                .ToListAsync();

            return Ok(wallet);
        }

        // POST: api/vouchers/{id}/collect
        [Authorize]
        [HttpPost("{id}/collect")]
        public async Task<IActionResult> CollectPublicVoucher(int id)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { message = "Người dùng chưa đăng nhập." });
            }

            var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.VoucherID == id);
            if (voucher == null)
            {
                return NotFound(new { message = "Không tìm thấy voucher." });
            }

            if (voucher.VisibilityType != VoucherVisibilityType.Public)
            {
                return BadRequest(new { message = "Voucher này không phải voucher công khai." });
            }

            if (voucher.ExclusiveType == ExclusiveDistributionType.DirectAssign)
            {
                return BadRequest(new { message = "Voucher này được phát tự động vào ví, không cần lưu thủ công." });
            }

            var validation = await _voucherService.ValidateVoucherAsync(voucher.Code, voucher.MinOrderValue, userId);
            if (!validation.IsValid)
            {
                return BadRequest(new { message = validation.Message });
            }

            var hasUnused = await _context.UserVouchers
                .AnyAsync(uv => uv.UserID == userId && uv.VoucherID == id && uv.Status == UserVoucherStatus.Unused);

            if (hasUnused)
            {
                return BadRequest(new { message = "Voucher đã có trong ví của bạn." });
            }

            _context.UserVouchers.Add(new UserVoucher
            {
                UserID = userId,
                VoucherID = id,
                SourceType = UserVoucherSource.PublicSaved,
                Status = UserVoucherStatus.Unused,
                CollectedAt = DateTime.Now
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Lưu voucher thành công." });
        }

        // POST: api/vouchers/activate-code
        [Authorize]
        [HttpPost("activate-code")]
        public async Task<IActionResult> ActivateExclusiveCode([FromBody] ActivateExclusiveVoucherRequest request)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { message = "Người dùng chưa đăng nhập." });
            }

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Vui lòng nhập mã voucher." });
            }

            var code = request.Code.Trim().ToUpper();
            var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == code);
            if (voucher == null)
            {
                return BadRequest(new { message = "Mã voucher không tồn tại." });
            }

            if (voucher.VisibilityType != VoucherVisibilityType.Exclusive || voucher.ExclusiveType != ExclusiveDistributionType.ManualCode)
            {
                return BadRequest(new { message = "Voucher này không hỗ trợ kích hoạt bằng mã." });
            }

            var validation = await _voucherService.ValidateVoucherAsync(voucher.Code, voucher.MinOrderValue, userId);
            if (!validation.IsValid)
            {
                return BadRequest(new { message = validation.Message });
            }

            var hasUnused = await _context.UserVouchers
                .AnyAsync(uv => uv.UserID == userId && uv.VoucherID == voucher.VoucherID && uv.Status == UserVoucherStatus.Unused);

            if (hasUnused)
            {
                return BadRequest(new { message = "Voucher đã có trong ví của bạn." });
            }

            _context.UserVouchers.Add(new UserVoucher
            {
                UserID = userId,
                VoucherID = voucher.VoucherID,
                SourceType = UserVoucherSource.ExclusiveCode,
                Status = UserVoucherStatus.Unused,
                CollectedAt = DateTime.Now
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Kích hoạt voucher thành công." });
        }

        // POST: api/vouchers/assign-direct
        [Authorize]
        [HttpPost("assign-direct")]
        public async Task<IActionResult> AssignDirect([FromBody] AssignExclusiveVoucherRequest request)
        {
            if (request.UserIDs == null || request.UserIDs.Count == 0)
            {
                return BadRequest(new { message = "Danh sách người dùng trống." });
            }

            var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.VoucherID == request.VoucherID);
            if (voucher == null)
            {
                return NotFound(new { message = "Không tìm thấy voucher." });
            }

            if (voucher.VisibilityType != VoucherVisibilityType.Exclusive || voucher.ExclusiveType != ExclusiveDistributionType.DirectAssign)
            {
                return BadRequest(new { message = "Voucher này không thuộc loại phân phối trực tiếp." });
            }

            var users = request.UserIDs
                .Where(u => !string.IsNullOrWhiteSpace(u))
                .Select(u => u.Trim())
                .Distinct()
                .ToList();

            if (users.Count == 0)
            {
                return BadRequest(new { message = "Danh sách người dùng không hợp lệ." });
            }

            var validUserIds = await _context.Users
                .AsNoTracking()
                .Where(u => users.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();

            if (validUserIds.Count == 0)
            {
                return BadRequest(new { message = "Không tìm thấy người dùng hợp lệ để phân phối." });
            }

            var existedUserIds = await _context.UserVouchers
                .AsNoTracking()
                .Where(uv => uv.VoucherID == request.VoucherID
                    && uv.Status == UserVoucherStatus.Unused
                    && validUserIds.Contains(uv.UserID))
                .Select(uv => uv.UserID)
                .ToListAsync();

            var toAssignUserIds = validUserIds
                .Except(existedUserIds)
                .ToList();

            if (toAssignUserIds.Count == 0)
            {
                return Ok(new { message = "Tất cả người dùng đã có voucher này trong ví." });
            }

            var issuedCount = await _context.UserVouchers
                .AsNoTracking()
                .CountAsync(uv => uv.VoucherID == request.VoucherID);

            var remainingQuota = Math.Max(0, voucher.TotalQuantity - issuedCount);
            if (remainingQuota <= 0)
            {
                return BadRequest(new
                {
                    message = "Voucher đã phát hành đủ số lượng.",
                    assignedCount = 0,
                    skippedCount = existedUserIds.Count,
                    invalidCount = users.Count - validUserIds.Count,
                    remainingQuota = 0
                });
            }

            if (toAssignUserIds.Count > remainingQuota)
            {
                toAssignUserIds = toAssignUserIds.Take(remainingQuota).ToList();
            }

            var now = DateTime.Now;
            var userVouchers = toAssignUserIds.Select(userId => new UserVoucher
                {
                    UserID = userId,
                    VoucherID = request.VoucherID,
                    IssuedCode = $"{voucher.Code}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}",
                    SourceType = UserVoucherSource.DirectAssigned,
                    Status = UserVoucherStatus.Unused,
                    CollectedAt = now
                })
                .ToList();

            _context.UserVouchers.AddRange(userVouchers);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Đã phân phối {userVouchers.Count} voucher vào ví người dùng.",
                assignedCount = userVouchers.Count,
                assignedUserIds = toAssignUserIds,
                skippedCount = existedUserIds.Count,
                invalidCount = users.Count - validUserIds.Count,
                remainingQuota = Math.Max(0, remainingQuota - userVouchers.Count)
            });
        }

        // GET: api/vouchers/{id}/direct-assignments
        [Authorize]
        [HttpGet("{id}/direct-assignments")]
        public async Task<IActionResult> GetDirectAssignments(int id)
        {
            var voucher = await _context.Vouchers.AsNoTracking().FirstOrDefaultAsync(v => v.VoucherID == id);
            if (voucher == null)
            {
                return NotFound(new { message = "Không tìm thấy voucher." });
            }

            var assignments = await _context.UserVouchers
                .AsNoTracking()
                .Where(uv => uv.VoucherID == id && uv.SourceType == UserVoucherSource.DirectAssigned)
                .Include(uv => uv.User)
                .OrderByDescending(uv => uv.CollectedAt)
                .Select(uv => new
                {
                    uv.UserVoucherID,
                    uv.UserID,
                    UserFullName = uv.User != null ? uv.User.FullName : string.Empty,
                    UserEmail = uv.User != null ? uv.User.Email : string.Empty,
                    UserPhone = uv.User != null ? uv.User.PhoneNumber : string.Empty,
                    Status = uv.Status.ToString(),
                    uv.IssuedCode,
                    uv.CollectedAt,
                    uv.UsedAt
                })
                .ToListAsync();

            var totalIssued = await _context.UserVouchers
                .AsNoTracking()
                .CountAsync(uv => uv.VoucherID == id);

            var remainingQuota = Math.Max(0, voucher.TotalQuantity - totalIssued);

            return Ok(new
            {
                data = assignments,
                remainingQuota,
                totalAssigned = assignments.Count
            });
        }

        // DELETE: api/vouchers/direct-assignments/{userVoucherId}
        [Authorize]
        [HttpDelete("direct-assignments/{userVoucherId}")]
        public async Task<IActionResult> RevokeDirectAssignment(int userVoucherId)
        {
            var userVoucher = await _context.UserVouchers
                .Include(uv => uv.Voucher)
                .FirstOrDefaultAsync(uv => uv.UserVoucherID == userVoucherId);

            if (userVoucher == null)
            {
                return NotFound(new { message = "Không tìm thấy bản ghi phân phối voucher." });
            }

            if (userVoucher.SourceType != UserVoucherSource.DirectAssigned)
            {
                return BadRequest(new { message = "Chỉ hỗ trợ thu hồi voucher được phân phối trực tiếp." });
            }

            if (userVoucher.Status != UserVoucherStatus.Unused)
            {
                return BadRequest(new { message = "Không thể thu hồi voucher đã dùng hoặc đã hết hạn." });
            }

            var voucherId = userVoucher.VoucherID;
            _context.UserVouchers.Remove(userVoucher);
            await _context.SaveChangesAsync();

            var voucher = await _context.Vouchers.AsNoTracking().FirstOrDefaultAsync(v => v.VoucherID == voucherId);
            var totalIssued = await _context.UserVouchers
                .AsNoTracking()
                .CountAsync(uv => uv.VoucherID == voucherId);

            var remainingQuota = voucher == null ? 0 : Math.Max(0, voucher.TotalQuantity - totalIssued);

            return Ok(new
            {
                message = "Đã thu hồi voucher khỏi ví người dùng.",
                voucherId,
                remainingQuota
            });
        }

        // PUT: api/vouchers/5/toggle-status
        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var voucher = await _voucherService.GetVoucherByIdAsync(id);
            if (voucher == null)
                return NotFound();

            voucher.Status = !voucher.Status;
            await _voucherService.UpdateVoucherAsync(voucher);
            return Ok(new { voucher.VoucherID, voucher.Status, message = voucher.Status ? "Đã mở khóa voucher." : "Đã khóa voucher." });
        }

        // DELETE: api/vouchers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var voucher = await _voucherService.GetVoucherByIdAsync(id);
            if (voucher == null)
                return NotFound();

            // Kiểm tra đã sử dụng chưa
            if (voucher.UsedQuantity > 0)
            {
                return BadRequest(new { message = "Không thể xóa voucher đã được sử dụng. Hãy khóa voucher thay vì xóa." });
            }

            await _voucherService.DeleteVoucherAsync(id);
            return NoContent();
        }

        // POST: api/vouchers/generate-code
        [HttpPost("generate-code")]
        public async Task<IActionResult> GenerateCode()
        {
            var code = await _voucherService.GenerateUniqueVoucherCodeAsync();
            return Ok(new { code });
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? string.Empty;
        }

        private async Task<int> AssignPublicVoucherToAllUsersAsync(Voucher voucher)
        {
            var issuedCount = await _context.UserVouchers
                .AsNoTracking()
                .CountAsync(uv => uv.VoucherID == voucher.VoucherID);

            var remainingQuota = Math.Max(0, voucher.TotalQuantity - issuedCount);
            if (remainingQuota <= 0)
            {
                return 0;
            }

            var existingUserIds = await _context.UserVouchers
                .AsNoTracking()
                .Where(uv => uv.VoucherID == voucher.VoucherID)
                .Select(uv => uv.UserID)
                .Distinct()
                .ToListAsync();

            var targetUserIds = await _context.Users
                .AsNoTracking()
                .Where(u => !existingUserIds.Contains(u.Id))
                .OrderBy(u => u.Id)
                .Select(u => u.Id)
                .Take(remainingQuota)
                .ToListAsync();

            if (targetUserIds.Count == 0)
            {
                return 0;
            }

            var now = DateTime.Now;
            var assignments = targetUserIds.Select(userId => new UserVoucher
            {
                UserID = userId,
                VoucherID = voucher.VoucherID,
                IssuedCode = $"{voucher.Code}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}",
                SourceType = UserVoucherSource.DirectAssigned,
                Status = UserVoucherStatus.Unused,
                CollectedAt = now
            }).ToList();

            _context.UserVouchers.AddRange(assignments);
            await _context.SaveChangesAsync();

            return assignments.Count;
        }
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Interfaces;
using System.Collections.Generic;
using System.Security.Claims;
using PolyBabyAPI.Models;
using Microsoft.Extensions.Caching.Memory;
using PolyBabyAPI.Filters;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<InvoiceController> _logger;
        private readonly ApplicationDbContext _context;
        private readonly IVnPayService _vnPayService;
        private readonly INotificationService _notificationService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IIpBlockService _ipBlockService;
        private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;

        public InvoiceController(
            IInvoiceService invoiceService,
            UserManager<ApplicationUser> userManager,
            ILogger<InvoiceController> logger,
            ApplicationDbContext context,
            IVnPayService vnPayService,
            INotificationService notificationService,
            ICloudinaryService cloudinaryService,
            IIpBlockService ipBlockService,
            Microsoft.Extensions.Caching.Memory.IMemoryCache cache)
        {
            _invoiceService = invoiceService;
            _userManager = userManager;
            _logger = logger;
            _context = context;
            _vnPayService = vnPayService;
            _notificationService = notificationService;
            _cloudinaryService = cloudinaryService;
            _ipBlockService = ipBlockService;
            _cache = cache;
        }

        // ======================== GET ENDPOINTS ============================

        /// <summary>
        /// Lấy danh sách tất cả hóa đơn (Admin only)
        /// </summary>
        [HttpGet]
        //[Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            try
            {
                var invoices = await _invoiceService.GetAllAsync();
                var result = invoices.Select(MapInvoiceToResponse);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all invoices");
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách hóa đơn", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách hóa đơn của người dùng hiện tại
        /// </summary>
        [HttpGet("my-invoices")]
        //[Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetByCurrentUser()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

                var invoices = await _invoiceService.GetByUserAsync(user.Id);
                var result = invoices.Select(MapInvoiceToResponse);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user invoices");
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách hóa đơn", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thống kê tổng quan hóa đơn cho trang quản trị
        /// </summary>
        [HttpGet("metrics")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetOrderMetrics()
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                var today = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;
                var invoices = await _context.Invoices.AsNoTracking().Where(i => !i.IsDeleted).ToListAsync();
                
                var result = new
                {
                    totalOrders = invoices.Count,
                    pending = invoices.Count(i => i.Status == OrderStatus.Pending),
                    processing = invoices.Count(i => i.Status == OrderStatus.Confirmed),
                    shipping = invoices.Count(i => i.Status == OrderStatus.Shipped),
                    completed = invoices.Count(i => i.Status == OrderStatus.Completed),
                    cancelled = invoices.Count(i => i.Status == OrderStatus.Cancelled),
                    cancelRequested = invoices.Count(i => i.Status == OrderStatus.CancelRequested),
                    returnRequested = invoices.Count(i => i.Status == OrderStatus.ReturnRequested),
                    returnedRefunded = invoices.Count(i => i.Status == OrderStatus.ReturnedRefunded),
                    cancelledRefunded = invoices.Count(i => i.Status == OrderStatus.CancelledRefunded),
                    returnApproved = invoices.Count(i => i.Status == OrderStatus.ReturnApproved),
                    returnRejected = invoices.Count(i => i.Status == OrderStatus.ReturnRejected),
                    todayRevenue = invoices
                        .Where(i => i.CreatedAt.HasValue && i.CreatedAt.Value.Date == today && i.Status != OrderStatus.Cancelled)
                        .Sum(i => i.TotalPrice),
                    totalRevenue = invoices
                        .Where(i => i.Status == OrderStatus.Completed)
                        .Sum(i => i.TotalPrice)
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order metrics");
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê hóa đơn", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách hóa đơn của một người dùng cụ thể (Admin only)
        /// </summary>
        [HttpGet("user/{userId}")]
        //[Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetByUser(
            string userId, 
            [FromQuery] OrderStatus? status = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var (invoices, totalCount) = await _invoiceService.GetByUserPaginatedAsync(userId, status, search, page, pageSize);
                var result = invoices.Select(MapInvoiceToClientListResponse);
                return Ok(new
                {
                    Items = result,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invoices for user {UserId}", userId);
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách hóa đơn", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}/status-counts")]
        public async Task<IActionResult> GetUserStatusCounts(string userId)
        {
            try
            {
                var grouped = await _context.Invoices
                    .AsNoTracking()
                    .Where(i => i.UserID == userId && !i.IsDeleted)
                    .GroupBy(i => i.Status)
                    .Select(g => new
                    {
                        StatusCode = (int)g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                var counts = grouped.ToDictionary(x => x.StatusCode, x => x.Count);
                var total = counts.Values.Sum();

                return Ok(new
                {
                    total,
                    counts
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invoice status counts for user {UserId}", userId);
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê trạng thái đơn hàng", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}/status-list")]
        public async Task<IActionResult> GetUserStatusList(string userId)
        {
            try
            {
                var statuses = await _context.Invoices
                    .AsNoTracking()
                    .Where(i => i.UserID == userId && !i.IsDeleted)
                    .Select(i => new
                    {
                        i.InvoiceID,
                        StatusCode = (int)i.Status
                    })
                    .ToListAsync();

                return Ok(statuses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invoice status list for user {UserId}", userId);
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách trạng thái đơn hàng", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy chi tiết hóa đơn theo ID (bao gồm thông tin voucher + lịch sử sử dụng)
        /// </summary>
        [HttpGet("{id}")]
        //[Authorize]
        public async Task<ActionResult<object>> GetById(string id)
        {
            try
            {
                int numericId;
                if (!int.TryParse(id, out numericId))
                {
                    var foundId = await _context.Invoices
                        .Where(i => i.InvoiceCode == id || i.TrackingCode == id)
                        .Select(i => i.InvoiceID)
                        .FirstOrDefaultAsync();
                        
                    if (foundId == 0)
                        return NotFound(new { message = "Không tìm thấy hóa đơn" });
                        
                    numericId = foundId;
                }

                var invoice = await _invoiceService.GetByIdAsync(numericId);
                if (invoice == null)
                    return NotFound(new { message = "Không tìm thấy hóa đơn" });

                var user = await _userManager.GetUserAsync(User);
                if (User.Identity?.IsAuthenticated == true && invoice.UserID != user?.Id && !User.IsInRole("Admin"))
                    return Forbid();

                return Ok(MapInvoiceToDetailResponse(invoice));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin hóa đơn", error = ex.Message });
            }
        }

        /// <summary>
        /// Truy vấn hóa đơn với phân trang, lọc và sắp xếp
        /// </summary>
        [HttpGet("search")]
        //[Authorize]
        public async Task<ActionResult<object>> Search(
            [FromQuery] string? search,
            [FromQuery] OrderStatus? status,
            [FromQuery] string? sortBy,
            [FromQuery] bool desc = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var (items, totalCount) = await _invoiceService.QueryAsync(search, status, sortBy, desc, page, pageSize, minPrice, maxPrice);
                var invoiceIds = items.Select(i => i.InvoiceID).ToList();
                var itemCountMap = await _context.InvoiceDetails
                    .AsNoTracking()
                    .Where(d => invoiceIds.Contains(d.InvoiceID))
                    .GroupBy(d => d.InvoiceID)
                    .Select(g => new { InvoiceID = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.InvoiceID, x => x.Count);

                var result = new
                {
                    Items = items.Select(i => MapInvoiceToSummaryResponse(i, itemCountMap.TryGetValue(i.InvoiceID, out var c) ? c : 0)),
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    Search = search,
                    Status = status,
                    SortBy = sortBy,
                    Desc = desc
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching invoices");
                return StatusCode(500, new { message = "Lỗi khi tìm kiếm hóa đơn", error = ex.Message });
            }
        }

        /// <summary>
        /// Xuất danh sách hóa đơn ra Excel
        /// </summary>
        [HttpGet("export")]
        [Authorize(Roles = "Admin")]
        [Permission("Order.Read")]
        public async Task<IActionResult> ExportExcel(
            [FromQuery] string? search,
            [FromQuery] OrderStatus? status,
            [FromQuery] string? sortBy,
            [FromQuery] bool desc = false,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? dateRange = null)
        {
            try
            {
                var excelData = await _invoiceService.ExportExcelAsync(search, status, sortBy, desc, minPrice, maxPrice, dateRange);
                string fileName = $"DanhSachDonHang_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                return File(excelData, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error exporting invoices to Excel");
                return StatusCode(500, new { message = "Lỗi khi xuất danh sách đơn hàng", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy lịch sử sử dụng voucher của một đơn hàng
        /// </summary>
        [HttpGet("{id}/voucher-usage")]
        //[Authorize]
        public async Task<IActionResult> GetVoucherUsage(int id)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(id);
                if (invoice == null)
                    return NotFound(new { message = "Không tìm thấy hóa đơn" });

                var user = await _userManager.GetUserAsync(User);
                if (User.Identity?.IsAuthenticated == true && invoice.UserID != user?.Id && !User.IsInRole("Admin"))
                    return Forbid();

                var usages = invoice.VoucherUsages?.Select(vu => new
                {
                    vu.VoucherID,
                    VoucherCode = vu.Voucher?.Code,
                    VoucherName = vu.Voucher?.Name,
                    vu.DiscountAmount,
                    vu.OrderValue,
                    vu.UsedAt,
                    vu.UserID
                }).ToList();

                return Ok(new
                {
                    invoiceId = id,
                    hasVoucher = invoice.VoucherID.HasValue,
                    voucher = invoice.Voucher != null ? new
                    {
                        invoice.Voucher.VoucherID,
                        invoice.Voucher.Code,
                        invoice.Voucher.Name,
                        invoice.Voucher.DiscountType,
                        invoice.Voucher.DiscountValue
                    } : null,
                    subTotal = invoice.SubTotal,
                    discountAmount = invoice.DiscountAmount,
                    totalPrice = invoice.TotalPrice,
                    usageHistory = usages
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting voucher usage for invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin voucher", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy lịch sử sử dụng voucher của người dùng hiện tại
        /// </summary>
        [HttpGet("my-voucher-history")]
        //[Authorize]
        public async Task<IActionResult> GetMyVoucherHistory()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

                var usages = await _context.VoucherUsages
                    .Where(vu => vu.UserID == user.Id && vu.InvoiceID != null)
                    .Include(vu => vu.Voucher)
                    .Include(vu => vu.Invoice)
                    .OrderByDescending(vu => vu.UsedAt)
                    .Select(vu => new
                    {
                        vu.VoucherID,
                        VoucherCode = vu.Voucher.Code,
                        VoucherName = vu.Voucher.Name,
                        vu.DiscountAmount,
                        vu.OrderValue,
                        vu.UsedAt,
                        vu.InvoiceID,
                        InvoiceStatus = vu.Invoice != null ? vu.Invoice.Status.GetDisplayName() : null
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalUsed = usages.Count,
                    totalSaved = usages.Sum(u => u.DiscountAmount),
                    history = usages
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting voucher history");
                return StatusCode(500, new { message = "Lỗi khi lấy lịch sử voucher", error = ex.Message });
            }
        }

        /// <summary>
        /// Tra cứu đơn hàng công khai qua InvoiceCode hoặc TrackingCode
        /// </summary>
        [HttpGet("public-tracking/{code}")]
        [AllowAnonymous]
        public async Task<IActionResult> PublicTracking(string code)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(code))
                    return BadRequest(new { message = "Vui lòng nhập mã đơn hàng hoặc mã vận đơn" });

                var codeLower = code.Trim().ToLower();

                // Tìm kiếm hóa đơn theo InvoiceCode, TrackingCode hoặc InvoiceID
                var invoiceQuery = _context.Invoices
                    .Include(i => i.InvoiceDetails)
                        .ThenInclude(d => d.Variant)
                            .ThenInclude(v => v.Product)
                    .Include(i => i.InvoiceDetails)
                        .ThenInclude(d => d.Bundle)
                    .Where(i => !i.IsDeleted && (
                        (i.InvoiceCode != null && i.InvoiceCode.ToLower() == codeLower) ||
                        (i.TrackingCode != null && i.TrackingCode.ToLower() == codeLower) ||
                        i.InvoiceID.ToString() == codeLower
                    ));

                var invoice = await invoiceQuery.AsNoTracking().FirstOrDefaultAsync();

                if (invoice == null)
                    return NotFound(new { message = "Không tìm thấy đơn hàng với mã này" });

                var response = new InvoiceDtos.PublicTrackingResponse
                {
                    InvoiceID = invoice.InvoiceID,
                    InvoiceCode = invoice.InvoiceCode,
                    TrackingCode = invoice.TrackingCode,
                    Status = invoice.Status.GetDisplayName(),
                    StatusCode = (int)invoice.Status,
                    TotalPrice = invoice.TotalPrice,
                    CreatedAt = invoice.CreatedAt,
                    Items = invoice.InvoiceDetails.Select(d => new InvoiceDtos.PublicTrackingItemDto
                    {
                        ProductName = d.Variant != null ? (d.Variant.Product?.ProductName ?? "Sản phẩm") : (d.Bundle?.Name ?? "Combo không xác định"),
                        VariantName = d.Variant?.VariantName,
                        Quantity = d.Quantity,
                        Price = d.UnitPrice,
                        ImageUrl = d.Variant != null ? (d.Variant.ImageUrl ?? d.Variant.Product?.Images?.FirstOrDefault()?.ImageUrl) : d.Bundle?.ImageUrl
                    }).ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public tracking for code {Code}", code);
                return StatusCode(500, new { message = "Lỗi khi tra cứu đơn hàng", error = ex.Message });
            }
        }

        // ======================== ADDRESS ENDPOINTS ============================

        /// <summary>
        /// Lấy danh sách địa chỉ đã lưu của người dùng hiện tại
        /// </summary>
        [HttpGet("my-addresses")]
        //[Authorize]
        public async Task<IActionResult> GetMyAddresses()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

                var addresses = await _context.UserAddresses
                    .Where(a => a.UserID == user.Id)
                    .Include(a => a.Province)
                    .Include(a => a.District)
                    .Include(a => a.Ward)
                    .OrderByDescending(a => a.IsDefault)
                    .AsNoTracking()
                    .Select(a => new
                    {
                        a.AddressID,
                        a.PhoneNumber,
                        a.StreetAddress,
                        a.IsDefault,
                        ProvinceName = a.Province != null ? a.Province.Name : "",
                        DistrictName = a.District != null ? a.District.Name : "",
                        WardName = a.Ward != null ? a.Ward.Name : "",
                        FullAddress = $"{a.StreetAddress}, {(a.Ward != null ? a.Ward.Name : "")}, {(a.District != null ? a.District.Name : "")}, {(a.Province != null ? a.Province.Name : "")}"
                    })
                    .ToListAsync();

                return Ok(addresses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user addresses");
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách địa chỉ", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy địa chỉ mặc định của người dùng hiện tại
        /// </summary>
        [HttpGet("default-address")]
        //[Authorize]
        public async Task<IActionResult> GetDefaultAddress()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

                var defaultAddress = await _context.UserAddresses
                    .Where(a => a.UserID == user.Id && a.IsDefault)
                    .Include(a => a.Province)
                    .Include(a => a.District)
                    .Include(a => a.Ward)
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                if (defaultAddress == null)
                {
                    defaultAddress = await _context.UserAddresses
                        .Where(a => a.UserID == user.Id)
                        .Include(a => a.Province)
                        .Include(a => a.District)
                        .Include(a => a.Ward)
                        .AsNoTracking()
                        .FirstOrDefaultAsync();
                }

                if (defaultAddress == null)
                    return NotFound(new { message = "Người dùng chưa có địa chỉ nào" });

                var result = new
                {
                    defaultAddress.AddressID,
                    defaultAddress.PhoneNumber,
                    defaultAddress.StreetAddress,
                    defaultAddress.IsDefault,
                    ProvinceName = defaultAddress.Province?.Name ?? "",
                    DistrictName = defaultAddress.District?.Name ?? "",
                    WardName = defaultAddress.Ward?.Name ?? "",
                    FullAddress = GetFullAddressFromUserAddress(defaultAddress)
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving default address");
                return StatusCode(500, new { message = "Lỗi khi lấy địa chỉ mặc định", error = ex.Message });
            }
        }

        // ======================== CREATE ENDPOINTS ============================

        /// <summary>
        /// Tạo hóa đơn từ giỏ hàng (hỗ trợ chọn item + voucher tự động + points quy đổi)
        /// </summary>
        [HttpPost("create-from-cart/{cartId}")]
        [TypeFilter(typeof(AntiSpamCheckoutFilter))]
        //[Authorize]
        public async Task<ActionResult<object>> CreateFromCart(
            int cartId,
            [FromQuery] PayMethod? payMethod,
            [FromQuery] int? addressId,
            [FromQuery] string? shippingAddress,
            [FromBody] InvoiceDtos.CheckoutRequestDto? body)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "UnknownIP";

                // Shadow Ban Check
                bool isShadowBan = HttpContext.Items["IsShadowBan"] as bool? ?? false;

                // Xác định địa chỉ giao hàng
                string address;
                UserAddress? matchedAddress = null;

                if (!string.IsNullOrWhiteSpace(shippingAddress))
                {
                    address = shippingAddress;
                }
                else if (addressId.HasValue)
                {
                    var selectedAddress = await _context.UserAddresses
                        .Where(a => a.AddressID == addressId.Value && a.UserID == user.Id)
                        .Include(a => a.Province)
                        .Include(a => a.District)
                        .Include(a => a.Ward)
                        .AsNoTracking()
                        .FirstOrDefaultAsync();

                    if (selectedAddress == null)
                        return BadRequest(new { message = "Địa chỉ không tồn tại hoặc không thuộc về người dùng" });

                    address = GetFullAddressFromUserAddress(selectedAddress);
                    matchedAddress = selectedAddress;
                }
                else
                {
                    var defaultAddress = await _context.UserAddresses
                        .Where(a => a.UserID == user.Id && a.IsDefault)
                        .Include(a => a.Province)
                        .Include(a => a.District)
                        .Include(a => a.Ward)
                        .AsNoTracking()
                        .FirstOrDefaultAsync();

                    if (defaultAddress == null)
                    {
                        defaultAddress = await _context.UserAddresses
                            .Where(a => a.UserID == user.Id)
                            .Include(a => a.Province)
                            .Include(a => a.District)
                            .Include(a => a.Ward)
                            .AsNoTracking()
                            .FirstOrDefaultAsync();
                    }

                    if (defaultAddress == null)
                        return BadRequest(new { message = "Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng" });

                    address = GetFullAddressFromUserAddress(defaultAddress);
                    matchedAddress = defaultAddress;
                }

                // Lấy selectedCartDetailIds từ body (nếu có)
                var selectedIds = body?.SelectedCartDetailIds;

                if (isShadowBan)
                {
                    // Đòn tâm lý: Xóa luôn giỏ hàng của kẻ tấn công để chúng tin chắc 100% là đã đặt hàng thành công
                    if (selectedIds != null && selectedIds.Any())
                    {
                        var itemsToRemove = await _context.CartDetails
                            .Where(cd => cd.CartID == cartId && selectedIds.Contains(cd.CartDetailID))
                            .ToListAsync();
                        if (itemsToRemove.Any())
                        {
                            _context.CartDetails.RemoveRange(itemsToRemove);
                            await _context.SaveChangesAsync();
                        }
                    }
                    else
                    {
                        var itemsToRemove = await _context.CartDetails
                            .Where(cd => cd.CartID == cartId)
                            .ToListAsync();
                        if (itemsToRemove.Any())
                        {
                            _context.CartDetails.RemoveRange(itemsToRemove);
                            await _context.SaveChangesAsync();
                        }
                    }

                    // Lừa bot bằng cách trả về thành công ảo, tiết kiệm tài nguyên Server
                    return Ok(new
                    {
                        success = true,
                        message = "Đặt hàng thành công!",
                        data = new { 
                            InvoiceID = 0, 
                            InvoiceCode = "INV" + DateTime.Now.ToString("MMddHHmmss"),
                            Status = "Chờ xác nhận" 
                        },
                        paymentUrl = (string?)null
                    });
                }

                var invoice = await _invoiceService.CreateFromCartAsync(cartId, payMethod, address, matchedAddress, body);

                _logger.LogInformation(
                    "Invoice {InvoiceId} created. SubTotal: {SubTotal}, Discount: {Discount}, Total: {Total}, Voucher: {VoucherId}",
                    invoice.InvoiceID, invoice.SubTotal, invoice.DiscountAmount, invoice.TotalPrice, invoice.VoucherID);

                string? paymentUrl = null;

                if (invoice.PayMethod == PayMethod.MobilePayment)
                {
                    var amountToPay = invoice.TotalPrice + invoice.ShippingFee - invoice.ShippingDiscountAmount;
                    var txnRef = $"{(invoice.InvoiceCode ?? invoice.InvoiceID.ToString())}_{DateTime.Now.Ticks}";
                    paymentUrl = _vnPayService.CreatePaymentUrl(
                        HttpContext,
                        txnRef,
                        amountToPay,
                        $"ThanhToanDonHang_{txnRef}",
                        "");
                }
 
                try
                {
                    var displayCode = !string.IsNullOrEmpty(invoice.InvoiceCode) ? invoice.InvoiceCode : invoice.InvoiceID.ToString();
                    var notifDto = new CreateNotificationDto
                    {
                        Title = "Đơn hàng mới",
                        ShortDescription = $"Khách hàng {user.FullName} vừa đặt đơn hàng #{displayCode}",
                        Content = $"<p>Đơn hàng mới <strong>#{displayCode}</strong> đã được đặt thành công bởi khách hàng <strong>{user.FullName}</strong> ({user.Email}).</p><p>Tổng giá trị: {invoice.TotalPrice:N0} đ.</p>",
                        Type = NotificationType.Order,
                        Priority = NotificationPriority.High,
                        ActionType = ActionType.CustomUrl,
                        ActionUrl = $"/admin/orders/{invoice.InvoiceID}",
                        TargetType = TargetType.Role,
                        TargetValue = "Admin",
                        PublishedAt = DateTime.Now
                    };
                    await _notificationService.CreateNotificationAsync(notifDto, "System");
                }
                catch (Exception nEx)
                {
                    _logger.LogError(nEx, "Error sending order notification to admin");
                }

                return CreatedAtAction(nameof(GetById), new { id = invoice.InvoiceID }, new
                {
                    success = true,
                    message = "Đặt hàng thành công!",
                    data = MapInvoiceToDetailResponse(invoice),
                    paymentUrl = paymentUrl
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation creating invoice from cart {CartId}", cartId);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invoice from cart {CartId}", cartId);
                var errorMsg = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                return StatusCode(500, new { success = false, message = "Lỗi khi tạo hóa đơn", error = errorMsg });
            }
        }

        // ======================== UPDATE ENDPOINTS ============================

        /// <summary>
        /// Cập nhật thông tin hóa đơn (Admin only)
        /// </summary>
        [HttpPut("{id}")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] Invoice invoice)
        {
            try
            {
                if (id != invoice.InvoiceID)
                    return BadRequest(new { message = "ID hóa đơn không khớp" });

                var existingInvoice = await _invoiceService.GetByIdAsync(id);
                if (existingInvoice == null)
                    return NotFound(new { message = "Không tìm thấy hóa đơn" });

                await _invoiceService.UpdateAsync(invoice);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi cập nhật hóa đơn", error = ex.Message });
            }
        }

        /// <summary>
        /// Tính toán lại tổng tiền hóa đơn
        /// </summary>
        [HttpPost("{id}/recalculate")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> RecalculateTotal(int id)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(id);
                if (invoice == null)
                    return NotFound(new { message = "Không tìm thấy hóa đơn" });

                await _invoiceService.RecalculateTotalAsync(id);
                return Ok(new { message = "Tính toán lại thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recalculating invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi tính toán lại", error = ex.Message });
            }
        }

        // ======================== STATUS CHANGE ENDPOINTS ============================

        /// <summary>
        /// Xác nhận đơn hàng (chuyển trạng thái từ Pending sang Confirmed) 
        /// </summary>

        [HttpPost("{id}/confirm")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> Confirm(int id)
        {
            try
            {
                var result = await _invoiceService.ConfirmAsync(id);
                if (!result)
                    return BadRequest(new { message = "Không thể xác nhận đơn hàng. Kiểm tra lại trạng thái." });

                try
                {
                    var invoice = await _invoiceService.GetByIdAsync(id);
                    if (invoice != null)
                    {
                        var displayCode = !string.IsNullOrEmpty(invoice.InvoiceCode) ? invoice.InvoiceCode : invoice.InvoiceID.ToString();
                        var notifDto = new CreateNotificationDto
                        {
                            Title = "Đơn hàng đã được xác nhận",
                            ShortDescription = $"Đơn hàng #{displayCode} đã được xác nhận.",
                            Content = $"<p>Đơn hàng <strong>#{displayCode}</strong> của bạn đã được xác nhận thành công và đang chuẩn bị giao hàng.</p>",
                            Type = NotificationType.Order,
                            Priority = NotificationPriority.Medium,
                            ActionType = ActionType.CustomUrl,
                            ActionUrl = $"/profile?tab=orders&id={invoice.InvoiceID}",
                            TargetType = TargetType.SpecificUsers,
                            TargetValue = invoice.UserID,
                            PublishedAt = DateTime.Now
                        };
                        await _notificationService.CreateNotificationAsync(notifDto, "System");
                    }
                }
                catch (Exception nEx)
                {
                    _logger.LogError(nEx, "Error sending order confirmation notification to user");
                }

                return Ok(new { message = "Xác nhận đơn hàng thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi xác nhận đơn hàng", error = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái đơn hàng thành đã giao (Admin only)
        /// </summary>

        [HttpPost("{id}/mark-shipped")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> MarkShipped(int id)
        {
            try
            {
                var result = await _invoiceService.MarkShippedAsync(id);
                if (!result)
                    return BadRequest(new { message = "Không thể cập nhật trạng thái giao hàng. Kiểm tra lại trạng thái." });

                try
                {
                    var invoice = await _invoiceService.GetByIdAsync(id);
                    if (invoice != null)
                    {
                        var displayCode = !string.IsNullOrEmpty(invoice.InvoiceCode) ? invoice.InvoiceCode : invoice.InvoiceID.ToString();
                        var notifDto = new CreateNotificationDto
                        {
                            Title = "Đơn hàng đang được vận chuyển",
                            ShortDescription = $"Đơn hàng #{displayCode} đã bắt đầu được vận chuyển.",
                            Content = $"<p>Đơn hàng <strong>#{displayCode}</strong> của bạn đã được bàn giao cho đối tác vận chuyển và đang được giao đến bạn.</p>",
                            Type = NotificationType.Order,
                            Priority = NotificationPriority.Medium,
                            ActionType = ActionType.CustomUrl,
                            ActionUrl = $"/profile?tab=orders&id={invoice.InvoiceID}",
                            TargetType = TargetType.SpecificUsers,
                            TargetValue = invoice.UserID,
                            PublishedAt = DateTime.Now
                        };
                        await _notificationService.CreateNotificationAsync(notifDto, "System");
                    }
                }
                catch (Exception nEx)
                {
                    _logger.LogError(nEx, "Error sending order shipping notification to user");
                }

                return Ok(new { message = "Cập nhật trạng thái giao hàng thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking invoice as shipped {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi cập nhật trạng thái", error = ex.Message });
            }
        }

        /// <summary>
        /// Xác nhận đã nhận hàng (chuyển trạng thái từ Shipped sang Completed) - Người dùng tự xác nhận
        /// </summary>

        [HttpPost("{id}/mark-completed")]
        //[Authorize]
        public async Task<IActionResult> MarkCompleted(int id)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

                var result = await _invoiceService.MarkCompletedByUserAsync(id, user.Id);
                if (!result)
                    return BadRequest(new { message = "Không thể xác nhận nhận hàng. Kiểm tra lại trạng thái hoặc quyền." });
                return Ok(new { message = "Xác nhận nhận hàng thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking invoice as completed {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi xác nhận nhận hàng", error = ex.Message });
            }
        }

        /// <summary>
        /// Thanh toán lại đơn hàng qua VNPay (chỉ áp dụng cho đơn hàng sử dụng phương thức MobilePayment và đang ở trạng thái Pending)
        /// </summary>

        [HttpPost("{id}/retry-vnpay")]
        //[Authorize]
        public async Task<IActionResult> RetryVnPay(int id)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(id);
                if (invoice == null)
                    return NotFound(new { message = "Không tìm thấy hóa đơn" });

                if (invoice.PayMethod != PayMethod.MobilePayment)
                    return BadRequest(new { message = "Đơn hàng không sử dụng phương thức thanh toán VNPay." });

                if (invoice.Status != OrderStatus.Pending)
                    return BadRequest(new { message = "Chỉ có thể thanh toán lại khi đơn hàng đang chờ xác nhận." });

                var hasSuccessPayment = invoice.PaymentTransactions.Any(pt => pt.Status == PaymentTransactionStatus.Success);
                if (hasSuccessPayment)
                    return BadRequest(new { message = "Đơn hàng đã được thanh toán thành công." });

                var latestPending = invoice.PaymentTransactions
                    .Where(pt => pt.Status == PaymentTransactionStatus.Pending)
                    .OrderByDescending(pt => pt.CreatedAt)
                    .FirstOrDefault();

                if (latestPending == null)
                    return BadRequest(new { message = "Không có giao dịch chờ thanh toán để thực hiện lại." });

                if (latestPending.CreatedAt.AddHours(24) < DateTime.Now)
                    return BadRequest(new { message = "Đã quá hạn 24 giờ thanh toán. Vui lòng tạo đơn hàng mới." });

                var amountToPay = invoice.TotalPrice + invoice.ShippingFee - invoice.ShippingDiscountAmount;
                var txnRef = $"{(invoice.InvoiceCode ?? invoice.InvoiceID.ToString())}_{DateTime.Now.Ticks}";
                var paymentUrl = _vnPayService.CreatePaymentUrl(
                    HttpContext,
                    txnRef,
                    amountToPay,
                    $"Thanh toan lai don hang {invoice.InvoiceCode ?? invoice.InvoiceID.ToString()}");

                _context.PaymentTransactions.Add(new PaymentTransaction
                {
                    InvoiceID = invoice.InvoiceID,
                    TxnRef = txnRef,
                    Status = PaymentTransactionStatus.Pending,
                    CreatedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    paymentUrl
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrying VNPay for invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi tạo lại giao dịch VNPay", error = ex.Message });
            }
        }

        /// <summary>
        /// Xác nhận nhiều đơn hàng cùng lúc (chuyển trạng thái từ Pending sang Confirmed)
        /// </summary>
        [HttpPost("bulk-confirm")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> BulkConfirm([FromBody] BulkOrderRequest request)
        {
            if (request.InvoiceIDs == null || request.InvoiceIDs.Count == 0)
                return BadRequest(new { message = "Không có đơn hàng nào được chọn." });

            if (request.InvoiceIDs.Count > 10)
                return BadRequest(new { message = "Chỉ được phép thao tác tối đa 10 đơn hàng cùng lúc." });

            var successCount = 0;
            var errors = new List<string>();

            foreach (var id in request.InvoiceIDs)
            {
                try
                {
                    var result = await _invoiceService.ConfirmAsync(id);
                    if (result)
                    {
                        successCount++;
                        try
                        {
                            var invoice = await _invoiceService.GetByIdAsync(id);
                            if (invoice != null)
                            {
                                var displayCode = !string.IsNullOrEmpty(invoice.InvoiceCode) ? invoice.InvoiceCode : invoice.InvoiceID.ToString();
                                var notifDto = new CreateNotificationDto
                                {
                                    Title = "Đơn hàng đã được xác nhận",
                                    ShortDescription = $"Đơn hàng #{displayCode} đã được xác nhận.",
                                    Content = $"<p>Đơn hàng <strong>#{displayCode}</strong> của bạn đã được xác nhận thành công và đang chuẩn bị giao hàng.</p>",
                                    Type = NotificationType.Order,
                                    Priority = NotificationPriority.Medium,
                                    ActionType = ActionType.CustomUrl,
                                    ActionUrl = $"/profile?tab=orders&id={invoice.InvoiceID}",
                                    TargetType = TargetType.SpecificUsers,
                                    TargetValue = invoice.UserID,
                                    PublishedAt = DateTime.Now
                                };
                                await _notificationService.CreateNotificationAsync(notifDto, "System");
                            }
                        }
                        catch (Exception nEx)
                        {
                            _logger.LogError(nEx, "Error sending order confirmation notification to user for InvoiceId {InvoiceId}", id);
                        }
                    }
                    else
                    {
                        errors.Add($"Đơn hàng #{id} không thể xác nhận (sai trạng thái).");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error confirming invoice {InvoiceId}", id);
                    errors.Add($"Đơn hàng #{id} bị lỗi hệ thống.");
                }
            }

            return Ok(new
            {
                message = $"Đã xác nhận thành công {successCount}/{request.InvoiceIDs.Count} đơn hàng.",
                errors = errors.Count > 0 ? errors : null
            });
        }

        /// <summary>
        /// Cập nhật nhiều đơn hàng thành đã giao cùng lúc (Admin only)
        /// </summary>
        [HttpPost("bulk-mark-shipped")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> BulkMarkShipped([FromBody] BulkOrderRequest request)
        {
            if (request.InvoiceIDs == null || request.InvoiceIDs.Count == 0)
                return BadRequest(new { message = "Không có đơn hàng nào được chọn." });

            if (request.InvoiceIDs.Count > 10)
                return BadRequest(new { message = "Chỉ được phép thao tác tối đa 10 đơn hàng cùng lúc." });

            var successCount = 0;
            var errors = new List<string>();

            foreach (var id in request.InvoiceIDs)
            {
                try
                {
                    var result = await _invoiceService.MarkShippedAsync(id);
                    if (result)
                    {
                        successCount++;
                        try
                        {
                            var invoice = await _invoiceService.GetByIdAsync(id);
                            if (invoice != null)
                            {
                                var displayCode = !string.IsNullOrEmpty(invoice.InvoiceCode) ? invoice.InvoiceCode : invoice.InvoiceID.ToString();
                                var notifDto = new CreateNotificationDto
                                {
                                    Title = "Đơn hàng đang được vận chuyển",
                                    ShortDescription = $"Đơn hàng #{displayCode} đã bắt đầu được vận chuyển.",
                                    Content = $"<p>Đơn hàng <strong>#{displayCode}</strong> của bạn đã được bàn giao cho đối tác vận chuyển và đang được giao đến bạn.</p>",
                                    Type = NotificationType.Order,
                                    Priority = NotificationPriority.Medium,
                                    ActionType = ActionType.CustomUrl,
                                    ActionUrl = $"/profile?tab=orders&id={invoice.InvoiceID}",
                                    TargetType = TargetType.SpecificUsers,
                                    TargetValue = invoice.UserID,
                                    PublishedAt = DateTime.Now
                                };
                                await _notificationService.CreateNotificationAsync(notifDto, "System");
                            }
                        }
                        catch (Exception nEx)
                        {
                            _logger.LogError(nEx, "Error sending order shipping notification to user for InvoiceId {InvoiceId}", id);
                        }
                    }
                    else
                    {
                        errors.Add($"Đơn hàng #{id} không thể cập nhật (sai trạng thái).");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error marking invoice as shipped {InvoiceId}", id);
                    errors.Add($"Đơn hàng #{id} bị lỗi hệ thống.");
                }
            }

            return Ok(new
            {
                message = $"Đã cập nhật trạng thái giao hàng thành công {successCount}/{request.InvoiceIDs.Count} đơn hàng.",
                errors = errors.Count > 0 ? errors : null
            });
        }

        // ======================== CANCEL ENDPOINTS ============================

        /// <summary>
        /// Người dùng gửi yêu cầu hủy đơn hàng (chỉ áp dụng cho đơn hàng đang ở trạng thái Pending hoặc Confirmed)
        /// </summary>

        [HttpPost("{id}/request-cancel")]
        //[Authorize]
        public async Task<IActionResult> RequestCancel(int id, [FromBody] InvoiceDtos.CancelRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { message = "Lý do hủy tối đa 500 ký tự." });

                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

                var newStatus = await _invoiceService.RequestCancelAsync(id, user.Id, request?.Reason);
                if (newStatus == null)
                    return BadRequest(new { message = "Không thể hủy đơn hàng. Kiểm tra lại trạng thái đơn hàng." });

                if (newStatus == OrderStatus.Cancelled)
                {
                    return Ok(new { success = true, message = "Hủy đơn hàng thành công!" });
                }
                else
                {
                    return Ok(new { success = true, message = "Gửi yêu cầu hủy thành công. Vui lòng chờ phê duyệt." });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error requesting cancel for invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi gửi yêu cầu hủy", error = ex.Message });
            }
        }

        /// <summary>
        /// Admin phê duyệt hủy đơn hàng (chuyển trạng thái sang Cancelled, hoàn trả hàng và voucher nếu có)
        /// </summary>

        [HttpPost("{id}/admin-cancel")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminCancel(int id, [FromBody] InvoiceDtos.CancelRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { message = "Lý do hủy tối đa 500 ký tự." });

                var invoice = await _invoiceService.GetByIdAsync(id);

                var result = await _invoiceService.AdminCancelAsync(id, request?.Reason);
                if (!result)
                    return BadRequest(new { message = "Không thể hủy đơn hàng. Kiểm tra lại trạng thái." });

                if (invoice != null)
                {
                    try
                    {
                        var displayCode = !string.IsNullOrEmpty(invoice.InvoiceCode) ? invoice.InvoiceCode : invoice.InvoiceID.ToString();
                        var notifDto = new CreateNotificationDto
                        {
                            Title = "Đơn hàng đã bị hủy",
                            ShortDescription = $"Đơn hàng #{displayCode} của bạn đã bị hủy.",
                            Content = $"<p>Đơn hàng <strong>#{displayCode}</strong> của bạn đã bị hủy bởi quản trị viên.</p><p>Lý do: {request?.Reason ?? "Không có lý do cụ thể"}</p>",
                            Type = NotificationType.Order,
                            Priority = NotificationPriority.High,
                            ActionType = ActionType.CustomUrl,
                            ActionUrl = $"/profile?tab=orders&id={invoice.InvoiceID}",
                            TargetType = TargetType.SpecificUsers,
                            TargetValue = invoice.UserID,
                            PublishedAt = DateTime.Now
                        };
                        await _notificationService.CreateNotificationAsync(notifDto, "System");
                    }
                    catch (Exception nEx)
                    {
                        _logger.LogError(nEx, "Error sending order cancellation notification to user");
                    }
                }

                return Ok(new { message = "Hủy đơn hàng thành công. Hàng và voucher đã được hoàn trả." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error admin canceling invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi hủy đơn hàng", error = ex.Message });
            }
        }

        /// <summary>
        /// Admin phê duyệt hủy đơn hàng (chuyển trạng thái sang Cancelled, hoàn trả hàng và voucher nếu có)
        /// </summary>

        [HttpPost("{id}/approve-cancel")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveCancel(int id)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(id);

                var result = await _invoiceService.ApproveCancelAsync(id, null);
                if (!result)
                    return BadRequest(new { message = "Không thể phê duyệt hủy. Kiểm tra lại trạng thái." });

                if (invoice != null)
                {
                    try
                    {
                        var displayCode = !string.IsNullOrEmpty(invoice.InvoiceCode) ? invoice.InvoiceCode : invoice.InvoiceID.ToString();
                        var notifDto = new CreateNotificationDto
                        {
                            Title = "Yêu cầu hủy đơn được chấp nhận",
                            ShortDescription = $"Yêu cầu hủy đơn hàng #{displayCode} đã được phê duyệt.",
                            Content = $"<p>Yêu cầu hủy đơn hàng <strong>#{displayCode}</strong> của bạn đã được phê duyệt thành công. Tiền, hàng và voucher (nếu có) đã được xử lý hoàn trả.</p>",
                            Type = NotificationType.Order,
                            Priority = NotificationPriority.Medium,
                            ActionType = ActionType.CustomUrl,
                            ActionUrl = $"/profile?tab=orders&id={invoice.InvoiceID}",
                            TargetType = TargetType.SpecificUsers,
                            TargetValue = invoice.UserID,
                            PublishedAt = DateTime.Now
                        };
                        await _notificationService.CreateNotificationAsync(notifDto, "System");
                    }
                    catch (Exception nEx)
                    {
                        _logger.LogError(nEx, "Error sending cancel approval notification to user");
                    }
                }

                return Ok(new { message = "Phê duyệt hủy đơn hàng thành công. Hàng và voucher đã được hoàn trả." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving cancel for invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi phê duyệt hủy", error = ex.Message });
            }
        }

        /// <summary>
        /// Admin từ chối yêu cầu hủy đơn hàng (trạng thái đơn hàng trở lại như cũ, không hoàn trả hàng hay voucher)
        /// </summary>

        [HttpPost("{id}/reject-cancel")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectCancel(int id)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(id);

                var result = await _invoiceService.RejectCancelAsync(id);
                if (!result)
                    return BadRequest(new { message = "Không thể từ chối hủy. Kiểm tra lại trạng thái." });

                if (invoice != null)
                {
                    try
                    {
                        var displayCode = !string.IsNullOrEmpty(invoice.InvoiceCode) ? invoice.InvoiceCode : invoice.InvoiceID.ToString();
                        var notifDto = new CreateNotificationDto
                        {
                            Title = "Yêu cầu hủy đơn bị từ chối",
                            ShortDescription = $"Yêu cầu hủy đơn hàng #{displayCode} đã bị từ chối.",
                            Content = $"<p>Yêu cầu hủy đơn hàng <strong>#{displayCode}</strong> của bạn đã bị từ chối. Đơn hàng của bạn sẽ tiếp tục được xử lý và giao đến bạn.</p>",
                            Type = NotificationType.Order,
                            Priority = NotificationPriority.Medium,
                            ActionType = ActionType.CustomUrl,
                            ActionUrl = $"/profile?tab=orders&id={invoice.InvoiceID}",
                            TargetType = TargetType.SpecificUsers,
                            TargetValue = invoice.UserID,
                            PublishedAt = DateTime.Now
                        };
                        await _notificationService.CreateNotificationAsync(notifDto, "System");
                    }
                    catch (Exception nEx)
                    {
                        _logger.LogError(nEx, "Error sending cancel rejection notification to user");
                    }
                }

                return Ok(new { message = "Từ chối hủy đơn hàng thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting cancel for invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi từ chối hủy", error = ex.Message });
            }
        }

        // ======================== DELETE ENDPOINT ============================

        /// <summary>
        /// Xóa hóa đơn (Admin only) - Thực chất là đánh dấu IsDeleted = true, không xóa cứng để giữ lại lịch sử và tránh lỗi ràng buộc khóa ngoại
        /// </summary>

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var invoice = await _invoiceService.GetByIdAsync(id);
                if (invoice == null)
                    return NotFound(new { message = "Không tìm thấy hóa đơn" });

                await _invoiceService.DeleteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi khi xóa hóa đơn", error = ex.Message });
            }
        }

        /// <summary>
        /// Upload PDF phiếu in lên Cloudinary và lưu vào PrintTicketUrl
        /// </summary>
        [HttpPost("{id}/upload-pdf")]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<IActionResult> UploadPdf(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File PDF không hợp lệ" });

            try
            {
                var invoice = await _context.Invoices.FindAsync(id);
                if (invoice == null)
                    return NotFound(new { message = "Không tìm thấy hóa đơn" });

                // Lưu file PDF vào server thay vì Cloudinary để tránh lỗi bảo mật (untrusted account)
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "invoices");
                Directory.CreateDirectory(uploadsPath);

                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"invoice_{invoice.InvoiceID}_{Guid.NewGuid():N}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Trả về URL tương đối để frontend có thể tự xử lý tên miền (chuẩn nhất cho deploy)
                var pdfUrl = $"/uploads/invoices/{fileName}";

                invoice.PrintTicketUrl = pdfUrl;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, url = pdfUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading PDF for invoice {InvoiceId}", id);
                return StatusCode(500, new { message = "Lỗi hệ thống khi upload PDF", error = ex.Message });
            }
        }

        // ======================== HELPER METHODS ============================

        /// <summary>
        /// Hàm helper để lấy địa chỉ đầy đủ từ UserAddress (kết hợp StreetAddress + Ward + Province)
        /// </summary>

        private static string GetFullAddressFromUserAddress(UserAddress userAddress)
        {
            var parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(userAddress.StreetAddress))
                parts.Add(userAddress.StreetAddress);

            if (userAddress.Ward != null && !string.IsNullOrWhiteSpace(userAddress.Ward.Name))
                parts.Add(userAddress.Ward.Name);

            if (userAddress.District != null && !string.IsNullOrWhiteSpace(userAddress.District.Name))
                parts.Add(userAddress.District.Name);

            if (userAddress.Province != null && !string.IsNullOrWhiteSpace(userAddress.Province.Name))
                parts.Add(userAddress.Province.Name);

            return string.Join(", ", parts);
        }

        /// <summary>
        /// Map Invoice sang response object (danh sách)
        /// </summary>
        private static object MapInvoiceToResponse(Invoice invoice)
        {
            return new
            {
                invoice.InvoiceID,
                invoice.InvoiceCode,
                invoice.TrackingCode,
                invoice.UserID,
                UserName = invoice.User?.UserName,
                UserFullName = invoice.User?.FullName,
                UserEmail = invoice.User?.Email,
                UserPhone = invoice.User?.PhoneNumber,
                UserAvatar = invoice.User?.Avatar,
                invoice.SubTotal,
                invoice.DiscountAmount,
                invoice.VoucherDiscountAmount,
                invoice.PointsDiscountAmount,
                invoice.CoinsDiscountAmount,
                invoice.WalletDiscountAmount,
                invoice.ShippingDiscountAmount,
                invoice.TotalPrice,
                invoice.ShippingFee,
                invoice.ShippingAddress,
                ShippingRecipientName = invoice.ShippingRecipientName ?? invoice.User?.FullName,
                ShippingPhone = invoice.ShippingPhone ?? invoice.User?.PhoneNumber,
                PayMethod = invoice.PayMethod?.GetDisplayName(),
                PayMethodCode = (int?)invoice.PayMethod,
                Status = invoice.Status.GetDisplayName(),
                StatusCode = (int)invoice.Status,
                invoice.PrintTicketUrl,
                invoice.CreatedAt,
                HasVoucher = invoice.VoucherID.HasValue,
                VoucherCode = invoice.Voucher?.Code,
                VoucherName = invoice.Voucher?.Name,
                HasShippingVoucher = invoice.ShippingVoucherID.HasValue,
                ShippingVoucherCode = invoice.ShippingVoucher?.Code,
                ShippingVoucherName = invoice.ShippingVoucher?.Name,
                ItemCount = invoice.InvoiceDetails?.Count ?? 0,
                InvoiceDetails = invoice.InvoiceDetails?.Select(d => new
                {
                    d.InvoiceDetailID,
                    d.VariantID,
                    d.BundleID,
                    d.Quantity,
                    d.UnitPrice,
                    d.TotalPrice,
                    ProductName = d.Variant?.Product?.ProductName ?? d.Bundle?.Name ?? "N/A",
                    VariantName = d.Variant?.VariantName,
                    CategoryName = d.Variant?.Product?.Category?.CategoryName,
                    SupplierName = d.Variant?.Product?.Supplier?.SupplierName,
                    ImageUrl = !string.IsNullOrEmpty(d.Variant?.ImageUrl) ? d.Variant.ImageUrl : (d.Variant?.Product?.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl ?? d.Bundle?.ImageUrl)
                }).ToList(),
                PaymentTransactions = invoice.PaymentTransactions?
                    .OrderByDescending(pt => pt.CreatedAt)
                    .Select(pt => new
                    {
                        pt.PaymentTransactionId,
                        pt.InvoiceID,
                        pt.TxnRef,
                        pt.VnPayTransactionNo,
                        pt.ResponseCode,
                        Status = pt.Status.ToString(),
                        StatusCode = (int)pt.Status,
                        StatusLabel = pt.Status switch
                        {
                            PaymentTransactionStatus.Pending => "Đang chờ",
                            PaymentTransactionStatus.Success => "Thành công",
                            PaymentTransactionStatus.Failed => "Thất bại",
                            _ => "Không xác định"
                        },
                        pt.CreatedAt,
                        pt.PaidAt
                    })
                    .ToList()
            };
        }

        private static object MapInvoiceToClientListResponse(Invoice invoice)
        {
            return new
            {
                invoice.InvoiceID,
                invoice.InvoiceCode,
                invoice.SubTotal,
                invoice.DiscountAmount,
                invoice.TotalPrice,
                invoice.ShippingFee,
                invoice.ShippingDiscountAmount,
                PayMethodCode = (int?)invoice.PayMethod,
                Status = invoice.Status.GetDisplayName(),
                StatusCode = (int)invoice.Status,
                invoice.CreatedAt,
                InvoiceDetails = invoice.InvoiceDetails?.Select(d => new
                {
                    d.InvoiceDetailID,
                    d.VariantID,
                    d.BundleID,
                    d.Quantity,
                    d.UnitPrice,
                    d.TotalPrice,
                    ProductName = d.Variant?.Product?.ProductName ?? d.Bundle?.Name ?? "N/A",
                    VariantName = d.Variant?.VariantName,
                    ImageUrl = !string.IsNullOrEmpty(d.Variant?.ImageUrl) ? d.Variant.ImageUrl 
                        : (d.Variant?.Product?.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl 
                        ?? d.Variant?.Product?.Variants?.FirstOrDefault(v => !string.IsNullOrEmpty(v.ImageUrl))?.ImageUrl 
                        ?? d.Bundle?.ImageUrl 
                        ?? "")
                }).ToList()
            };
        }

        /// <summary>
        /// Lấy dữ liệu thống kê chi tiêu cá nhân của khách hàng hiện tại
        /// </summary>
        [HttpGet("spending-dashboard")]
        //[Authorize]
        public async Task<IActionResult> GetSpendingDashboard()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });

                var userId = user.Id;

                // Lấy tất cả hóa đơn hoàn thành và không bị xóa mềm
                var invoices = await _context.Invoices
                    .Where(i => i.UserID == userId && !i.IsDeleted && i.Status == OrderStatus.Completed)
                    .Include(i => i.InvoiceDetails)
                        .ThenInclude(d => d.Variant)
                            .ThenInclude(v => v.Product)
                                .ThenInclude(p => p.Category)
                    .Include(i => i.InvoiceDetails)
                        .ThenInclude(d => d.Bundle)
                    .ToListAsync();

                // Tính toán KPI cơ bản
                var totalSpent = invoices.Sum(i => i.TotalPrice);
                var totalOrders = invoices.Count;
                var totalSaved = invoices.Sum(i => i.DiscountAmount + i.TierDiscountAmount);

                // Lấy thông tin Loyalty
                var loyaltyProfile = await _context.LoyaltyProfiles
                    .Include(lp => lp.Tier)
                    .FirstOrDefaultAsync(lp => lp.UserID == userId);

                var availablePoints = loyaltyProfile?.AvailablePoints ?? 0;
                var vipTier = loyaltyProfile?.Tier?.TierName ?? "Thành viên mới";
                var vipColor = loyaltyProfile?.Tier?.ColorHex ?? "#64748b";

                // Thống kê chi tiêu theo tháng trong năm hiện tại
                var currentYear = DateTime.Now.Year;
                var monthlySpending = invoices
                    .Where(i => i.CreatedAt.HasValue && i.CreatedAt.Value.Year == currentYear)
                    .GroupBy(i => i.CreatedAt!.Value.Month)
                    .Select(g => new InvoiceDtos.MonthlySpendingDto
                    {
                        Month = g.Key,
                        Year = currentYear,
                        Amount = g.Sum(i => i.TotalPrice)
                    })
                    .OrderBy(x => x.Month)
                    .ToList();

                // Đảm bảo trả về đủ 12 tháng, tháng nào không có chi tiêu thì đặt Amount = 0
                for (int m = 1; m <= 12; m++)
                {
                    if (!monthlySpending.Any(x => x.Month == m))
                    {
                        monthlySpending.Add(new InvoiceDtos.MonthlySpendingDto
                        {
                            Month = m,
                            Year = currentYear,
                            Amount = 0
                        });
                    }
                }
                monthlySpending = monthlySpending.OrderBy(x => x.Month).ToList();

                // Thống kê chi tiêu theo danh mục sản phẩm
                var categorySpendingList = new List<InvoiceDtos.CategorySpendingDto>();
                
                // Trích xuất các chi tiết hóa đơn
                var details = invoices.SelectMany(i => i.InvoiceDetails).ToList();

                // Group theo danh mục cho các sản phẩm đơn lẻ (có Variant)
                var productDetails = details.Where(d => d.Variant != null && d.Variant.Product != null && d.Variant.Product.Category != null).ToList();
                var groupedByCat = productDetails
                    .GroupBy(d => new { 
                        CategoryID = d.Variant.Product.CategoryID, 
                        CategoryName = d.Variant.Product.Category.CategoryName 
                    })
                    .Select(g => new InvoiceDtos.CategorySpendingDto
                    {
                        CategoryID = g.Key.CategoryID,
                        CategoryName = g.Key.CategoryName,
                        Amount = g.Sum(d => d.TotalPrice),
                        Percentage = 0
                    })
                    .ToList();

                // Xử lý các Combo/Bundle
                var bundleDetails = details.Where(d => d.BundleID.HasValue).ToList();
                if (bundleDetails.Any())
                {
                    groupedByCat.Add(new InvoiceDtos.CategorySpendingDto
                    {
                        CategoryID = -1,
                        CategoryName = "Combo Khuyến Mãi",
                        Amount = bundleDetails.Sum(d => d.TotalPrice),
                        Percentage = 0
                    });
                }

                var totalCategoryAmount = groupedByCat.Sum(c => c.Amount);
                if (totalCategoryAmount > 0)
                {
                    foreach (var cat in groupedByCat)
                    {
                        cat.Percentage = Math.Round((double)(cat.Amount / totalCategoryAmount) * 100, 1);
                    }
                }
                categorySpendingList = groupedByCat.OrderByDescending(c => c.Amount).ToList();

                // Top 5 sản phẩm mua nhiều nhất
                var topProducts = new List<InvoiceDtos.TopProductDto>();

                var productGroup = productDetails
                    .GroupBy(d => new
                    {
                        ProductID = d.Variant.ProductID,
                        ProductName = d.Variant.Product.ProductName
                    })
                    .Select(g => new InvoiceDtos.TopProductDto
                    {
                        ProductID = g.Key.ProductID,
                        ProductName = g.Key.ProductName,
                        Quantity = g.Sum(d => d.Quantity),
                        TotalPrice = g.Sum(d => d.TotalPrice),
                        ImageUrl = productDetails.FirstOrDefault(d => d.Variant.ProductID == g.Key.ProductID)?.Variant?.ImageUrl 
                                   ?? productDetails.FirstOrDefault(d => d.Variant.ProductID == g.Key.ProductID)?.Variant?.Product?.Images?.FirstOrDefault()?.ImageUrl
                    })
                    .ToList();

                if (bundleDetails.Any())
                {
                    var bundleGroup = bundleDetails
                        .GroupBy(d => new
                        {
                            BundleID = d.BundleID.Value,
                            BundleName = d.Bundle?.Name ?? "Combo khuyến mãi"
                        })
                        .Select(g => new InvoiceDtos.TopProductDto
                        {
                            ProductID = -g.Key.BundleID,
                            ProductName = g.Key.BundleName,
                            Quantity = g.Sum(d => d.Quantity),
                            TotalPrice = g.Sum(d => d.TotalPrice),
                            ImageUrl = bundleDetails.FirstOrDefault(d => d.BundleID == g.Key.BundleID)?.Bundle?.ImageUrl
                        })
                        .ToList();

                    productGroup.AddRange(bundleGroup);
                }

                topProducts = productGroup
                    .OrderByDescending(p => p.Quantity)
                    .Take(5)
                    .ToList();

                var dashboardData = new InvoiceDtos.UserSpendingDashboardDto
                {
                    TotalSpent = totalSpent,
                    TotalOrders = totalOrders,
                    TotalSaved = totalSaved,
                    AvailablePoints = availablePoints,
                    VipTier = vipTier,
                    VipColor = vipColor,
                    MonthlySpending = monthlySpending,
                    CategorySpending = categorySpendingList,
                    TopProducts = topProducts
                };

                return Ok(new
                {
                    success = true,
                    data = dashboardData,
                    message = "Lấy dữ liệu phân tích chi tiêu cá nhân thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user spending dashboard data");
                return StatusCode(500, new { message = "Lỗi khi lấy dữ liệu phân tích chi tiêu", error = ex.Message });
            }
        }

        /// <summary>
        /// Map Invoice sang response nhẹ cho danh sách/phân trang
        /// </summary>
        private static object MapInvoiceToSummaryResponse(Invoice invoice, int itemCount)
        {
            return new
            {
                invoice.InvoiceID,
                invoice.InvoiceCode,
                invoice.TrackingCode,
                invoice.UserID,
                UserName = invoice.User?.UserName,
                UserFullName = invoice.User?.FullName,
                UserEmail = invoice.User?.Email,
                UserPhone = invoice.User?.PhoneNumber,
                UserAvatar = invoice.User?.Avatar,
                invoice.SubTotal,
                invoice.DiscountAmount,
                invoice.VoucherDiscountAmount,
                invoice.PointsDiscountAmount,
                invoice.CoinsDiscountAmount,
                invoice.WalletDiscountAmount,
                invoice.ShippingDiscountAmount,
                invoice.TotalPrice,
                invoice.ShippingFee,
                invoice.ShippingAddress,
                PayMethod = invoice.PayMethod?.GetDisplayName(),
                PayMethodCode = (int?)invoice.PayMethod,
                Status = invoice.Status.GetDisplayName(),
                StatusCode = (int)invoice.Status,
                invoice.CreatedAt,
                HasVoucher = invoice.VoucherID.HasValue,
                VoucherCode = invoice.Voucher?.Code,
                VoucherName = invoice.Voucher?.Name,
                HasShippingVoucher = invoice.ShippingVoucherID.HasValue,
                ShippingVoucherCode = invoice.ShippingVoucher?.Code,
                ShippingVoucherName = invoice.ShippingVoucher?.Name,
                invoice.PrintTicketUrl,
                ItemCount = itemCount
            };
        }

        /// <summary>
        /// Map Invoice sang response chi tiết (bao gồm voucher usage history)
        /// </summary>
        /// <summary>
        /// Map Invoice sang response chi tiết (bao gồm voucher usage history)
        /// </summary>

        private static object MapInvoiceToDetailResponse(Invoice invoice)
        {
            return new
            {
                invoice.InvoiceID,
                invoice.InvoiceCode,
                invoice.TrackingCode,
                invoice.UserID,
                UserName = invoice.User?.UserName,
                UserFullName = invoice.User?.FullName,
                UserEmail = invoice.User?.Email,
                UserPhone = invoice.User?.PhoneNumber,
                UserAvatar = invoice.User?.Avatar,

                invoice.SubTotal,
                invoice.DiscountAmount,
                invoice.VoucherDiscountAmount,
                invoice.PointsDiscountAmount,
                invoice.CoinsDiscountAmount,
                invoice.WalletDiscountAmount,
                invoice.ShippingDiscountAmount,
                invoice.TotalPrice,
                invoice.ShippingFee,
                FinalAmount = invoice.TotalPrice + invoice.ShippingFee - invoice.ShippingDiscountAmount,

                invoice.ShippingAddress,
                ShippingRecipientName = invoice.ShippingRecipientName ?? invoice.User?.FullName,
                ShippingPhone = invoice.ShippingPhone ?? invoice.User?.PhoneNumber,
                PayMethod = invoice.PayMethod?.GetDisplayName(),
                PayMethodCode = (int?)invoice.PayMethod,
                Status = invoice.Status.GetDisplayName(),
                StatusCode = (int)invoice.Status,
                invoice.PrintTicketUrl,

                HasVoucher = invoice.VoucherID.HasValue,
                Voucher = invoice.Voucher != null ? new
                {
                    invoice.Voucher.VoucherID,
                    invoice.Voucher.Code,
                    invoice.Voucher.Name,
                    invoice.Voucher.DiscountType,
                    invoice.Voucher.DiscountValue,
                    DiscountTypeLabel = invoice.Voucher.DiscountType == 1 ? "Phần trăm" : "Tiền cố định"
                } : null,

                HasShippingVoucher = invoice.ShippingVoucherID.HasValue,
                ShippingVoucher = invoice.ShippingVoucher != null ? new
                {
                    invoice.ShippingVoucher.VoucherID,
                    invoice.ShippingVoucher.Code,
                    invoice.ShippingVoucher.Name,
                    invoice.ShippingVoucher.DiscountType,
                    invoice.ShippingVoucher.DiscountValue,
                    invoice.ShippingVoucher.IsFreeShipping,
                    invoice.ShippingVoucher.MaxShippingDiscount,
                    DiscountTypeLabel = invoice.ShippingVoucher.DiscountType == 1 ? "Phần trăm" : "Tiền cố định"
                } : null,

                VoucherUsages = invoice.VoucherUsages?.Select(vu => new
                {
                    vu.VoucherID,
                    VoucherCode = vu.Voucher?.Code,
                    vu.DiscountAmount,
                    vu.OrderValue,
                    vu.UsedAt
                }).ToList(),

                PaymentTransactions = invoice.PaymentTransactions?
                    .OrderByDescending(pt => pt.CreatedAt)
                    .Select(pt => new
                    {
                        pt.PaymentTransactionId,
                        pt.InvoiceID,
                        pt.TxnRef,
                        pt.VnPayTransactionNo,
                        pt.ResponseCode,
                        Status = pt.Status.ToString(),
                        StatusCode = (int)pt.Status,
                        StatusLabel = pt.Status switch
                        {
                            PaymentTransactionStatus.Pending => "Đang chờ",
                            PaymentTransactionStatus.Success => "Thành công",
                            PaymentTransactionStatus.Failed => "Thất bại",
                            _ => "Không xác định"
                        },
                        pt.CreatedAt,
                        pt.PaidAt
                    })
                    .ToList(),

                invoice.CreatedAt,
                invoice.ConfirmedAt,
                invoice.ShippedAt,
                invoice.CompletedAt,
                invoice.CancelledAt,
                invoice.CancelReason,
                invoice.Note,
                invoice.IsDeleted,
                invoice.ReturnReason,
                invoice.ReturnDescription,
                invoice.ReturnImageUrls,
                invoice.RefundMethod,

                InvoiceDetails = invoice.InvoiceDetails?.Select(d => new
                {
                    d.InvoiceDetailID,
                    d.VariantID,
                    d.BundleID,
                    d.Quantity,
                    d.UnitPrice,
                    d.TotalPrice,
                    ProductName = d.Variant?.Product?.ProductName ?? d.Bundle?.Name ?? "N/A",
                    VariantName = d.Variant?.VariantName,
                    ImageUrl = !string.IsNullOrEmpty(d.Variant?.ImageUrl) ? d.Variant.ImageUrl 
                        : (d.Variant?.Product?.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl 
                        ?? d.Variant?.Product?.Variants?.FirstOrDefault(v => !string.IsNullOrEmpty(v.ImageUrl))?.ImageUrl 
                        ?? d.Bundle?.ImageUrl 
                        ?? "")
                }).ToList()
            };
        }



        // ======== Return Workflow ========
        [Authorize]
        [HttpPost("upload-return-image")]
        public async Task<IActionResult> UploadReturnImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "Không có file được chọn." });

                var url = await _cloudinaryService.UploadImageAsync(file, "returns");
                if (string.IsNullOrEmpty(url))
                    return BadRequest(new { message = "Upload ảnh thất bại." });

                return Ok(new { success = true, url = url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống.", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("{id}/request-return")]
        public async Task<IActionResult> RequestReturn(int id, [FromBody] ReturnRequestDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var success = await _invoiceService.RequestReturnAsync(id, userId, request.Reason, request.Description ?? "", request.ImageUrls ?? "", request.RefundMethod);
            if (!success) return BadRequest(new { message = "Không thể yêu cầu hoàn trả cho đơn hàng này." });

            return Ok(new { message = "Yêu cầu hoàn trả đã được gửi thành công." });
        }

        [Authorize]
        [HttpPost("{id}/cancel-return-request")]
        public async Task<IActionResult> CancelReturnRequest(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var success = await _invoiceService.CancelReturnRequestAsync(id, userId);
            if (!success) return BadRequest(new { message = "Không thể hủy yêu cầu hoàn trả cho đơn hàng này." });

            return Ok(new { message = "Hủy yêu cầu hoàn trả thành công." });
        }

        [Authorize(Roles = "Admin,Employee")]
        [HttpPost("{id}/approve-return")]
        public async Task<IActionResult> ApproveReturn(int id, [FromBody] ReturnApprovalDto request)
        {
            var success = await _invoiceService.ApproveReturnAsync(id, request.IsRefundToCoins);
            if (!success) return BadRequest(new { message = "Không thể duyệt hoàn trả đơn hàng này." });

            return Ok(new { message = "Duyệt hoàn trả thành công. Chờ khách gửi hàng về." });
        }

        [Authorize(Roles = "Admin,Employee")]
        [HttpPost("{id}/reject-return")]
        public async Task<IActionResult> RejectReturn(int id, [FromBody] ReturnRejectionDto request)
        {
            var success = await _invoiceService.RejectReturnAsync(id, request.RejectReason);
            if (!success) return BadRequest(new { message = "Không thể từ chối yêu cầu hoàn trả này." });

            return Ok(new { message = "Từ chối trả hàng thành công." });
        }

        [Authorize(Roles = "Admin,Employee")]
        [HttpPost("{id}/confirm-return-received")]
        public async Task<IActionResult> ConfirmReturnReceived(int id, [FromBody] ConfirmReturnReceivedDto request)
        {
            try
            {
                var success = await _invoiceService.ConfirmReturnReceivedAsync(id, request.IsRestockable);
                if (!success) return BadRequest(new { message = "Không thể xác nhận nhận hàng hoặc đơn hàng chưa được hoàn trả." });
                return Ok(new { message = "Đã xác nhận nhận hàng hoàn và hoàn tiền cho khách." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xác nhận nhận hàng hoàn: {InvoiceId}", id);
                return StatusCode(500, new { message = "Đã xảy ra lỗi nội bộ." });
            }
        }

    }
}

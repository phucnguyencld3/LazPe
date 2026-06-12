using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<InvoiceService> _logger;
        private readonly ILoyaltyService _loyaltyService;
        private readonly IVoucherService _voucherService;
        private readonly IRecommendationService _recommendationService;

        public InvoiceService(ApplicationDbContext context, ILogger<InvoiceService> logger, ILoyaltyService loyaltyService, IVoucherService voucherService, IRecommendationService recommendationService)
        {
            _context = context;
            _logger = logger;
            _loyaltyService = loyaltyService;
            _voucherService = voucherService;
            _recommendationService = recommendationService;
        }

        // ======== Lấy danh sách hóa đơn ========
        public async Task<IEnumerable<Invoice>> GetAllAsync()
        {
            return await _context.Invoices
                .AsNoTracking()
                .AsSplitQuery()
                .Where(i => !i.IsDeleted)
                .Include(i => i.User)
                .Include(i => i.Voucher)
                .Include(i => i.ShippingVoucher)
                .Include(i => i.PaymentTransactions)
                .Include(i => i.VoucherUsages).ThenInclude(vu => vu.Voucher)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product).ThenInclude(p => p.Category)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product).ThenInclude(p => p.Supplier)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Bundle)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        // ======== Lấy hóa đơn theo người dùng ========
        public async Task<IEnumerable<Invoice>> GetByUserAsync(string userId, OrderStatus? status = null)
        {
            var query = _context.Invoices
                .AsNoTracking()
                .AsSplitQuery()
                .Where(i => i.UserID == userId && !i.IsDeleted);

            if (status.HasValue)
            {
                query = query.Where(i => i.Status == status.Value);
            }

            return await query
                .Include(i => i.PaymentTransactions)
                .Include(i => i.Voucher)
                .Include(i => i.ShippingVoucher)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Bundle)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        // ======== Lấy hóa đơn theo ID ========
        public async Task<Invoice?> GetByIdAsync(int id)
        {
            return await _context.Invoices
                .AsNoTracking()
                .AsSplitQuery()
                .Include(i => i.User)
                .Include(i => i.Voucher)
                .Include(i => i.ShippingVoucher)
                .Include(i => i.VoucherUsages).ThenInclude(vu => vu.Voucher)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Bundle)
                .Include(i => i.PaymentTransactions)
                .FirstOrDefaultAsync(i => i.InvoiceID == id && !i.IsDeleted);
        }

        // ======== Thêm hóa đơn mới ========
        public async Task AddAsync(Invoice invoice)
        {
            if (invoice.InvoiceDetails?.Any() == true)
            {
                invoice.SubTotal = invoice.InvoiceDetails.Sum(d => d.TotalPrice);
                invoice.TotalPrice = invoice.SubTotal - invoice.DiscountAmount;
                if (invoice.TotalPrice < 0) invoice.TotalPrice = 0;
            }

            invoice.CreatedAt = DateTime.Now;
            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
        }

        // ======== Cập nhật hóa đơn ========
        public async Task UpdateAsync(Invoice invoice)
        {
            _context.Invoices.Update(invoice);
            await _context.SaveChangesAsync();
        }

        // ======== Xóa mềm hóa đơn ========
        public async Task DeleteAsync(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return;

            invoice.IsDeleted = true;
            await _context.SaveChangesAsync();
        }

        // ======== Tạo hóa đơn từ giỏ hàng (có voucher) ========
        public async Task<Invoice> CreateFromCartAsync(int cartId, PayMethod? payMethod, string shippingAddress, List<int>? selectedCartDetailIds = null, UserAddress? userAddress = null, int pointsToUse = 0)
        {
            var cart = await _context.Carts
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Variant)
                    .ThenInclude(v => v.Product)
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Bundle)
                .Include(c => c.Voucher) // ✅ Include Voucher từ Cart
                .Include(c => c.ShippingVoucher) // Include ShippingVoucher từ Cart
                .FirstOrDefaultAsync(c => c.CartID == cartId);

            if (cart == null)
                throw new InvalidOperationException("Không tìm thấy giỏ hàng.");

            if (cart.CartDetails == null || !cart.CartDetails.Any())
                throw new InvalidOperationException("Giỏ hàng trống.");

            // Xác định items cần checkout
            var itemsToCheckout = selectedCartDetailIds != null && selectedCartDetailIds.Count > 0
                ? cart.CartDetails.Where(cd => selectedCartDetailIds.Contains(cd.CartDetailID)).ToList()
                : cart.CartDetails.ToList();

            if (itemsToCheckout.Count == 0)
                throw new InvalidOperationException("Không tìm thấy sản phẩm đã chọn trong giỏ hàng.");

            var remainingItems = cart.CartDetails.Except(itemsToCheckout).ToList();
            var isPartialCheckout = remainingItems.Count > 0;

            // ✅ Tính SubTotal từ items checkout
            decimal subTotal = itemsToCheckout.Sum(item => item.TotalPrice);

            // ✅ Tính DiscountAmount từ voucher của Cart
            decimal discountAmount = 0;
            Voucher? appliedVoucher = null;

            if (cart.VoucherID.HasValue && cart.Voucher != null)
            {
                appliedVoucher = cart.Voucher;

                // Tính lại discount cho subTotal của items được checkout
                if (appliedVoucher.DiscountType == 1) // Phần trăm
                {
                    discountAmount = subTotal * (appliedVoucher.DiscountValue / 100);
                }
                else // Tiền cố định
                {
                    discountAmount = appliedVoucher.DiscountValue;
                }

                // Kiểm tra giảm tối đa
                if (appliedVoucher.MaxDiscount > 0 && discountAmount > appliedVoucher.MaxDiscount)
                {
                    discountAmount = appliedVoucher.MaxDiscount;
                }

                // Không giảm quá giá trị đơn hàng
                if (discountAmount > subTotal)
                {
                    discountAmount = subTotal;
                }

                // Kiểm tra đơn hàng tối thiểu
                if (subTotal < appliedVoucher.MinOrderValue)
                {
                    discountAmount = 0;
                    appliedVoucher = null;
                    _logger.LogWarning("Voucher {VoucherId} không đủ điều kiện: SubTotal {SubTotal} < MinOrderValue {MinOrder}",
                        cart.VoucherID, subTotal, cart.Voucher.MinOrderValue);
                }
            }

            // ✅ Kiểm tra và áp dụng Loyalty Points nếu có
            decimal pointsDiscount = 0;
            if (pointsToUse > 0)
            {
                var isPointsValid = await _loyaltyService.ValidatePointsRedemptionAsync(cart.UserID, pointsToUse, subTotal - discountAmount);
                if (!isPointsValid)
                {
                    throw new InvalidOperationException("Số điểm quy đổi sử dụng không hợp lệ hoặc vượt quá số dư khả dụng.");
                }
                pointsDiscount = await _loyaltyService.CalculateRedemptionDiscountAsync(cart.UserID, pointsToUse);
            }

            // ✅ Tính phí ship gốc dựa trên tổng tiền sau khi trừ giảm giá sản phẩm & điểm loyalty
            decimal netTotalPrice = subTotal - (discountAmount + pointsDiscount);
            if (netTotalPrice < 0) netTotalPrice = 0;
            decimal originalShippingFee = CalculateShippingFee(netTotalPrice);

            // ✅ Tính ShippingDiscountAmount từ shipping voucher của Cart
            decimal shippingDiscountAmount = 0;
            Voucher? appliedShippingVoucher = null;

            if (cart.ShippingVoucherID.HasValue && cart.ShippingVoucher != null)
            {
                appliedShippingVoucher = cart.ShippingVoucher;

                // Kiểm tra đơn hàng tối thiểu hoặc phí ship gốc đã bằng 0
                if (subTotal < appliedShippingVoucher.MinOrderValue || originalShippingFee == 0)
                {
                    appliedShippingVoucher = null;
                    shippingDiscountAmount = 0;
                    _logger.LogWarning("Shipping Voucher {VoucherId} không đủ điều kiện hoặc phí ship bằng 0.", cart.ShippingVoucherID);
                }
                else
                {
                    shippingDiscountAmount = _voucherService.CalculateShippingDiscount(appliedShippingVoucher, originalShippingFee);
                }
            }

            // ✅ Tạo Invoice với thông tin voucher + điểm loyalty
            var invoice = new Invoice
            {
                UserID = cart.UserID,
                VoucherID = appliedVoucher?.VoucherID,
                ShippingVoucherID = appliedShippingVoucher?.VoucherID,
                PayMethod = payMethod,
                CreatedAt = DateTime.Now,
                Status = OrderStatus.Pending,
                ShippingAddress = shippingAddress,
                ShippingProvince = userAddress?.Province?.Name,
                ShippingDistrict = userAddress?.District?.Name,
                ShippingWard = userAddress?.Ward?.Name,
                ShippingStreetAddress = userAddress?.StreetAddress,
                ShippingRecipientName = userAddress?.RecipientName,
                ShippingPhone = userAddress?.PhoneNumber,
                SubTotal = subTotal,
                DiscountAmount = discountAmount + pointsDiscount,
                ShippingDiscountAmount = shippingDiscountAmount,
            };

            foreach (var item in itemsToCheckout)
            {
                var detail = new InvoiceDetail
                {
                    VariantID = item.VariantID,
                    BundleID = item.BundleID,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice
                };
                invoice.InvoiceDetails.Add(detail);

                // Trừ tồn kho & Xử lý Flash Sale
                if (item.VariantID.HasValue && item.Variant != null)
                {
                    item.Variant.Stock -= item.Quantity;
                    _logger.LogInformation("Đã trừ {Quantity} sp từ Variant {VariantId}. Tồn kho mới: {NewStock}",
                        item.Quantity, item.Variant.VariantID, item.Variant.Stock);

                    // Trừ số lượng Flash Sale (nếu có chiến dịch đang diễn ra)
                    await HandleFlashSaleCheckoutDeductionAsync(cart.UserID, item.VariantID.Value, null, item.Quantity);

                    // Thêm Log AI Purchase
                    await _recommendationService.LogInteractionAsync(cart.UserID, item.Variant.ProductID, PolyBabyAPI.Models.Mongo.InteractionType.Purchase);
                }
                else if (item.BundleID.HasValue && item.Bundle != null)
                {
                    var bundle = await _context.Bundles
                        .Include(b => b.BundleItems)
                        .ThenInclude(bi => bi.Variant)
                        .FirstOrDefaultAsync(b => b.BundleID == item.BundleID);
 
                    if (bundle != null)
                    {
                        foreach (var bundleItem in bundle.BundleItems)
                        {
                            var deductQty = bundleItem.Quantity * item.Quantity;
                            bundleItem.Variant.Stock -= deductQty;
                        }
                    }

                    // Trừ số lượng Flash Sale Bundle
                    await HandleFlashSaleCheckoutDeductionAsync(cart.UserID, null, item.BundleID.Value, item.Quantity);
                }
            }

            // ✅ Tính TotalPrice = SubTotal - DiscountAmount (bao gồm cả Voucher + Loyalty Points)
            invoice.TotalPrice = subTotal - invoice.DiscountAmount;
            if (invoice.TotalPrice < 0) invoice.TotalPrice = 0;
            invoice.ShippingFee = originalShippingFee;

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync(); // Cần save trước để có InvoiceID

                // ✅ Khấu trừ điểm trong LoyaltyProfile & Ghi log lịch sử điểm
                if (pointsToUse > 0)
                {
                    var deductResult = await _loyaltyService.ApplyPointsRedemptionAsync(cart.UserID, pointsToUse, invoice.InvoiceID);
                    if (!deductResult)
                    {
                        throw new InvalidOperationException("Khấu trừ điểm Loyalty thất bại. Vui lòng kiểm tra lại số dư điểm.");
                    }
                }

                if (payMethod == PayMethod.MobilePayment)
                {
                    _context.PaymentTransactions.Add(new PaymentTransaction
                    {
                        InvoiceID = invoice.InvoiceID,
                        TxnRef = invoice.InvoiceID.ToString(),
                        Status = PaymentTransactionStatus.Pending,
                        CreatedAt = DateTime.Now
                    });
                }

                // ✅ Ghi lịch sử sử dụng voucher vào VoucherUsages
                if (appliedVoucher != null)
                {
                    var userVoucher = await _context.UserVouchers
                        .Where(uv => uv.UserID == cart.UserID
                            && uv.VoucherID == appliedVoucher.VoucherID
                            && uv.Status == UserVoucherStatus.Unused)
                        .OrderBy(uv => uv.CollectedAt)
                        .FirstOrDefaultAsync();

                    if (userVoucher == null)
                    {
                        throw new InvalidOperationException("Voucher chưa tồn tại trong ví hoặc đã được sử dụng.");
                    }

                    userVoucher.Status = UserVoucherStatus.Used;
                    userVoucher.UsedAt = DateTime.Now;
                    userVoucher.InvoiceID = invoice.InvoiceID;

                    var voucherUsage = new VoucherUsage
                    {
                        VoucherID = appliedVoucher.VoucherID,
                        UserID = cart.UserID,
                        InvoiceID = invoice.InvoiceID,
                        UsedAt = DateTime.Now,
                        DiscountAmount = discountAmount,
                        OrderValue = subTotal
                    };
                    _context.VoucherUsages.Add(voucherUsage);

                    // ✅ Tăng UsedQuantity của voucher
                    appliedVoucher.UsedQuantity += 1;

                    _logger.LogInformation(
                        "Voucher {Code} (ID:{VoucherId}) đã được sử dụng bởi User {UserId} cho Invoice {InvoiceId}. Giảm: {Discount}đ / Đơn hàng: {OrderValue}đ",
                        appliedVoucher.Code, appliedVoucher.VoucherID, cart.UserID, invoice.InvoiceID, discountAmount, subTotal);
                }

                // ✅ Ghi lịch sử sử dụng voucher vận chuyển vào VoucherUsages
                if (appliedShippingVoucher != null)
                {
                    var userVoucher = await _context.UserVouchers
                        .Where(uv => uv.UserID == cart.UserID
                            && uv.VoucherID == appliedShippingVoucher.VoucherID
                            && uv.Status == UserVoucherStatus.Unused)
                        .OrderBy(uv => uv.CollectedAt)
                        .FirstOrDefaultAsync();

                    if (userVoucher == null)
                    {
                        throw new InvalidOperationException("Voucher vận chuyển chưa tồn tại trong ví hoặc đã được sử dụng.");
                    }

                    userVoucher.Status = UserVoucherStatus.Used;
                    userVoucher.UsedAt = DateTime.Now;
                    userVoucher.InvoiceID = invoice.InvoiceID;

                    var voucherUsage = new VoucherUsage
                    {
                        VoucherID = appliedShippingVoucher.VoucherID,
                        UserID = cart.UserID,
                        InvoiceID = invoice.InvoiceID,
                        UsedAt = DateTime.Now,
                        DiscountAmount = shippingDiscountAmount,
                        OrderValue = subTotal
                    };
                    _context.VoucherUsages.Add(voucherUsage);

                    // ✅ Tăng UsedQuantity của voucher vận chuyển
                    appliedShippingVoucher.UsedQuantity += 1;

                    _logger.LogInformation(
                        "Shipping Voucher {Code} (ID:{VoucherId}) đã được sử dụng bởi User {UserId} cho Invoice {InvoiceId}. Giảm ship: {Discount}đ / Đơn hàng: {OrderValue}đ",
                        appliedShippingVoucher.Code, appliedShippingVoucher.VoucherID, cart.UserID, invoice.InvoiceID, shippingDiscountAmount, subTotal);
                }

                // Xóa CartDetails đã checkout
                _context.CartDetails.RemoveRange(itemsToCheckout);

                if (isPartialCheckout)
                {
                    // Còn items → cập nhật lại giỏ hàng
                    cart.SubTotal = remainingItems.Sum(r => r.TotalPrice);
                    cart.TotalAmount = cart.SubTotal;
                    // Xóa voucher khỏi cart vì đã dùng cho invoice
                    cart.VoucherID = null;
                    cart.DiscountAmount = 0;
                    cart.ShippingVoucherID = null;
                    cart.ShippingDiscountAmount = 0;

                    _logger.LogInformation("Checkout 1 phần: giữ lại {Count} sp trong giỏ {CartId}",
                        remainingItems.Count, cartId);
                }
                else
                {
                    // Giải phóng tham chiếu từ VoucherUsages trước khi xóa giỏ hàng để tránh lỗi khóa ngoại
                    var relatedUsages = await _context.VoucherUsages.Where(vu => vu.CartID == cart.CartID).ToListAsync();
                    foreach (var usage in relatedUsages)
                    {
                        usage.CartID = null;
                    }

                    // Hết items → xóa giỏ hàng
                    _context.Carts.Remove(cart);
                    _logger.LogInformation("Checkout toàn bộ: đã xóa giỏ hàng {CartId}", cartId);
                }

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                _logger.LogInformation(
                    "Tạo hóa đơn {InvoiceId} thành công. SubTotal: {SubTotal}đ, Giảm: {Discount}đ, TotalPrice: {Total}đ, Ship: {Ship}đ",
                    invoice.InvoiceID, subTotal, discountAmount, invoice.TotalPrice, invoice.ShippingFee);

                return invoice;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                _logger.LogError(ex, "Không thể tạo hóa đơn từ giỏ hàng {CartId}", cartId);
                throw;
            }
        }

        // ======== Tính lại tổng tiền ========
        public async Task RecalculateTotalAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceDetails)
                .Include(i => i.ShippingVoucher)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId);

            if (invoice == null) return;

            invoice.SubTotal = invoice.InvoiceDetails.Sum(d => d.TotalPrice);
            invoice.TotalPrice = invoice.SubTotal - invoice.DiscountAmount;
            if (invoice.TotalPrice < 0) invoice.TotalPrice = 0;
            
            invoice.ShippingFee = CalculateShippingFee(invoice.TotalPrice);

            if (invoice.ShippingVoucherID.HasValue)
            {
                var shippingVoucher = invoice.ShippingVoucher ?? await _context.Vouchers.FindAsync(invoice.ShippingVoucherID.Value);
                if (shippingVoucher != null)
                {
                    invoice.ShippingDiscountAmount = _voucherService.CalculateShippingDiscount(shippingVoucher, invoice.ShippingFee);
                }
            }
            else
            {
                invoice.ShippingDiscountAmount = 0;
            }

            await _context.SaveChangesAsync();
        }

        // ======== Tìm kiếm / sắp xếp / phân trang ========
        public async Task<(IEnumerable<Invoice> Items, int TotalCount)> QueryAsync(
            string? search, OrderStatus? status, string? sortBy, bool desc, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;

            IQueryable<Invoice> q = _context.Invoices
                .AsNoTracking()
                .Where(i => !i.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                q = q.Where(i => i.InvoiceID.ToString().Contains(s)
                              || (i.User != null && i.User.FullName != null && i.User.FullName.ToLower().Contains(s))
                              || (i.User != null && i.User.Email != null && i.User.Email.ToLower().Contains(s)));
            }

            if (status.HasValue)
                q = q.Where(i => i.Status == status.Value);

            var sortedQuery = (sortBy, desc) switch
            {
                ("created", true) => q.OrderByDescending(i => i.CreatedAt),
                ("created", false) => q.OrderBy(i => i.CreatedAt),
                ("total", true) => q.OrderByDescending(i => i.TotalPrice),
                ("total", false) => q.OrderBy(i => i.TotalPrice),
                ("status", true) => q.OrderByDescending(i => i.Status),
                ("status", false) => q.OrderBy(i => i.Status),
                _ when desc => q.OrderByDescending(i => i.InvoiceID),
                _ => q.OrderBy(i => i.InvoiceID)
            };

            var total = await q.CountAsync();
            var items = await sortedQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsSplitQuery()
                .Include(i => i.User)
                .Include(i => i.Voucher)
                .ToListAsync();

            return (items, total);
        }

        // ======== Xác nhận đơn hàng ========
        public async Task<bool> ConfirmAsync(int invoiceId)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);
            if (invoice == null || invoice.Status != OrderStatus.Pending) return false;

            invoice.Status = OrderStatus.Confirmed;
            invoice.ConfirmedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Đơn hàng {InvoiceId} đã được xác nhận", invoiceId);
            return true;
        }

        // ======== Cập nhật đang giao ========
        public async Task<bool> MarkShippedAsync(int invoiceId)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);
            if (invoice == null || invoice.Status != OrderStatus.Confirmed) return false;

            invoice.Status = OrderStatus.Shipped;
            invoice.ShippedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Đơn hàng {InvoiceId} đã chuyển sang trạng thái đang giao", invoiceId);
            return true;
        }

        // ======== Khách xác nhận đã nhận hàng ========
        public async Task<bool> MarkCompletedByUserAsync(int invoiceId, string userId)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i =>
                i.InvoiceID == invoiceId && i.UserID == userId && !i.IsDeleted);

            if (invoice == null || invoice.Status != OrderStatus.Shipped) return false;

            invoice.Status = OrderStatus.Completed;
            invoice.CompletedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Đơn hàng {InvoiceId} đã hoàn thành bởi người dùng {UserId}", invoiceId, userId);

            try
            {
                if (!string.IsNullOrEmpty(invoice.UserID))
                {
                    await _loyaltyService.EarnPointsAsync(invoice.UserID, invoice.InvoiceID, invoice.TotalPrice);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi tích điểm Loyalty khi hoàn thành đơn hàng {InvoiceId}", invoiceId);
            }

            return true;
        }

        // ======== Người dùng yêu cầu hủy ========
        public async Task<OrderStatus?> RequestCancelAsync(int invoiceId, string userId, string? reason)
        {
            var invoice = await _context.Invoices
                .AsSplitQuery()
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Variant)
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Bundle)
                        .ThenInclude(b => b.BundleItems)
                            .ThenInclude(bi => bi.Variant)
                .Include(i => i.VoucherUsages)
                .Include(i => i.Voucher)
                .Include(i => i.PaymentTransactions)
                .FirstOrDefaultAsync(i =>
                    i.InvoiceID == invoiceId && i.UserID == userId && !i.IsDeleted);

            if (invoice == null) return null;
            if (invoice.Status == OrderStatus.Shipped || invoice.Status == OrderStatus.Completed || invoice.Status == OrderStatus.Cancelled)
                return null;

            if (invoice.Status == OrderStatus.Pending)
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    await RestoreStockAsync(invoice);
                    await RestoreVoucherAsync(invoice);
                    await HandleLoyaltyOnCancelAsync(invoice);

                    invoice.Status = OrderStatus.Cancelled;
                    invoice.CancelReason = reason;
                    invoice.CancelledAt = DateTime.Now;

                    MarkPendingPaymentsAsFailed(invoice, "CANCELLED");

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation("Người dùng {UserId} tự hủy đơn hàng {InvoiceId} thành công (đơn hàng ở trạng thái Chờ xác nhận). Hàng + Voucher đã được hoàn trả. Lý do: {Reason}",
                        userId, invoiceId, reason);

                    return OrderStatus.Cancelled;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Lỗi khi tự động hủy đơn hàng {InvoiceId} của người dùng", invoiceId);
                    throw;
                }
            }
            else
            {
                invoice.Status = OrderStatus.CancelRequested;
                invoice.CancelReason = reason;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Người dùng {UserId} yêu cầu hủy đơn hàng {InvoiceId} ở trạng thái Đã xác nhận (chờ Admin duyệt). Lý do: {Reason}",
                    userId, invoiceId, reason);

                return OrderStatus.CancelRequested;
            }
        }

        // ======== Admin hủy đơn (CÓ HOÀN TRẢ KHO + VOUCHER) ========
        public async Task<bool> AdminCancelAsync(int invoiceId, string? reason)
        {
            var invoice = await _context.Invoices
                .AsSplitQuery()
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Variant)
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Bundle)
                        .ThenInclude(b => b.BundleItems)
                            .ThenInclude(bi => bi.Variant)
                .Include(i => i.VoucherUsages)
                .Include(i => i.Voucher)
                .Include(i => i.PaymentTransactions)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);

            if (invoice == null || (invoice.Status != OrderStatus.Pending && invoice.Status != OrderStatus.Confirmed))
                return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await RestoreStockAsync(invoice);
                await RestoreVoucherAsync(invoice);
                await HandleLoyaltyOnCancelAsync(invoice);

                invoice.Status = OrderStatus.Cancelled;
                invoice.CancelReason = reason;
                invoice.CancelledAt = DateTime.Now;

                MarkPendingPaymentsAsFailed(invoice, "CANCELLED");

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Admin đã hủy đơn hàng {InvoiceId}. Hàng + Voucher đã được hoàn trả. Lý do: {Reason}",
                    invoiceId, reason);

                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Không thể hủy đơn hàng {InvoiceId}", invoiceId);
                throw;
            }
        }

        // ======== Duyệt yêu cầu hủy (CÓ HOÀN TRẢ KHO + VOUCHER) ========
        public async Task<bool> ApproveCancelAsync(int invoiceId, string? reason)
        {
            var invoice = await _context.Invoices
                .AsSplitQuery()
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Variant)
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Bundle)
                        .ThenInclude(b => b.BundleItems)
                            .ThenInclude(bi => bi.Variant)
                .Include(i => i.VoucherUsages)
                .Include(i => i.Voucher)
                .Include(i => i.PaymentTransactions)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);

            if (invoice == null || invoice.Status != OrderStatus.CancelRequested)
                return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await RestoreStockAsync(invoice);
                await RestoreVoucherAsync(invoice);
                await HandleLoyaltyOnCancelAsync(invoice);

                invoice.Status = OrderStatus.Cancelled;
                invoice.CancelReason = reason ?? invoice.CancelReason;
                invoice.CancelledAt = DateTime.Now;

                MarkPendingPaymentsAsFailed(invoice, "CANCELLED");

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Đã duyệt hủy đơn {InvoiceId}. Hàng + Voucher đã được hoàn trả. Lý do: {Reason}",
                    invoiceId, reason);

                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Không thể duyệt yêu cầu hủy đơn hàng {InvoiceId}", invoiceId);
                throw;
            }
        }

        // ======== Từ chối yêu cầu hủy ========
        public async Task<bool> RejectCancelAsync(int invoiceId)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);
            if (invoice == null || invoice.Status != OrderStatus.CancelRequested) return false;

            invoice.Status = invoice.ConfirmedAt.HasValue ? OrderStatus.Confirmed : OrderStatus.Pending;
            invoice.CancelReason = null;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Đã từ chối yêu cầu hủy đơn hàng {InvoiceId}. Khôi phục về trạng thái {Status}",
                invoiceId, invoice.Status);
            return true;
        }

        // ======== PRIVATE: HOÀN TRẢ SẢN PHẨM VỀ KHO ========
        private async Task RestoreStockAsync(Invoice invoice)
        {
            if (invoice.InvoiceDetails == null || !invoice.InvoiceDetails.Any())
            {
                _logger.LogWarning("Đơn hàng {InvoiceId} không có chi tiết sản phẩm để hoàn trả", invoice.InvoiceID);
                return;
            }
 
            foreach (var detail in invoice.InvoiceDetails)
            {
                if (detail.VariantID.HasValue && detail.Variant != null)
                {
                    var oldStock = detail.Variant.Stock;
                    detail.Variant.Stock += detail.Quantity;
                    _logger.LogInformation("Hoàn trả {Qty} sp cho Variant {VId}. Kho: {Old} → {New}",
                        detail.Quantity, detail.Variant.VariantID, oldStock, detail.Variant.Stock);

                    // Khôi phục số lượng Flash Sale đã bán
                    await RestoreFlashSaleSoldQuantityAsync(detail.VariantID.Value, null, detail.Quantity, invoice.CreatedAt ?? DateTime.Now);
                }
                else if (detail.BundleID.HasValue && detail.Bundle != null)
                {
                    foreach (var bundleItem in detail.Bundle.BundleItems)
                    {
                        var restoreQty = bundleItem.Quantity * detail.Quantity;
                        var oldStock = bundleItem.Variant.Stock;
                        bundleItem.Variant.Stock += restoreQty;
                        _logger.LogInformation("Hoàn trả {Qty} sp cho Bundle Variant {VId}. Kho: {Old} → {New}",
                            restoreQty, bundleItem.Variant.VariantID, oldStock, bundleItem.Variant.Stock);
                    }

                    // Khôi phục số lượng Flash Sale Bundle đã bán
                    await RestoreFlashSaleSoldQuantityAsync(null, detail.BundleID.Value, detail.Quantity, invoice.CreatedAt ?? DateTime.Now);
                }
            }
 
            await _context.SaveChangesAsync();
            _logger.LogInformation("Hoàn trả kho thành công cho đơn {InvoiceId}", invoice.InvoiceID);
        }

        // ✅ ======== PRIVATE: HOÀN TRẢ VOUCHER KHI HỦY ĐƠN ========
        private async Task RestoreVoucherAsync(Invoice invoice)
        {
            if (!invoice.VoucherID.HasValue && !invoice.ShippingVoucherID.HasValue) return;

            // Hoàn lại UsedQuantity cho voucher sản phẩm
            if (invoice.VoucherID.HasValue)
            {
                var voucher = invoice.Voucher ?? await _context.Vouchers.FindAsync(invoice.VoucherID.Value);
                if (voucher != null)
                {
                    voucher.UsedQuantity = Math.Max(0, voucher.UsedQuantity - 1);
                    _logger.LogInformation("Hoàn trả voucher {Code} (ID:{VId}). UsedQuantity: {Used}",
                        voucher.Code, voucher.VoucherID, voucher.UsedQuantity);
                }
            }

            // Hoàn lại UsedQuantity cho voucher vận chuyển
            if (invoice.ShippingVoucherID.HasValue)
            {
                var shippingVoucher = await _context.Vouchers.FindAsync(invoice.ShippingVoucherID.Value);
                if (shippingVoucher != null)
                {
                    shippingVoucher.UsedQuantity = Math.Max(0, shippingVoucher.UsedQuantity - 1);
                    _logger.LogInformation("Hoàn trả shipping voucher {Code} (ID:{VId}). UsedQuantity: {Used}",
                        shippingVoucher.Code, shippingVoucher.VoucherID, shippingVoucher.UsedQuantity);
                }
            }

            // Xóa bản ghi VoucherUsage liên quan đến invoice này
            var usages = invoice.VoucherUsages?.ToList()
                ?? await _context.VoucherUsages
                    .Where(vu => vu.InvoiceID == invoice.InvoiceID)
                    .ToListAsync();

            if (usages.Any())
            {
                _context.VoucherUsages.RemoveRange(usages);
                _logger.LogInformation("Xóa {Count} bản ghi VoucherUsage cho đơn {InvoiceId}",
                    usages.Count, invoice.InvoiceID);
            }

            var userVouchers = await _context.UserVouchers
                .Where(uv => uv.InvoiceID == invoice.InvoiceID && uv.Status == UserVoucherStatus.Used)
                .ToListAsync();

            foreach (var userVoucher in userVouchers)
            {
                userVoucher.Status = UserVoucherStatus.Unused;
                userVoucher.InvoiceID = null;
                userVoucher.UsedAt = null;
            }

            // Xóa khỏi invoice
            invoice.VoucherID = null;
            invoice.DiscountAmount = 0;
            invoice.ShippingVoucherID = null;
            invoice.ShippingDiscountAmount = 0;

            // Tính lại TotalPrice
            invoice.TotalPrice = invoice.SubTotal;
            invoice.ShippingFee = CalculateShippingFee(invoice.TotalPrice);

            await _context.SaveChangesAsync();
        }

        // ======== Helper tính phí ship ========
        private static decimal CalculateShippingFee(decimal total)
        {
            return 25000;
        }

        private static void MarkPendingPaymentsAsFailed(Invoice invoice, string responseCode)
        {
            if (invoice.PaymentTransactions == null || !invoice.PaymentTransactions.Any())
            {
                return;
            }

            foreach (var payment in invoice.PaymentTransactions.Where(p => p.Status == PaymentTransactionStatus.Pending))
            {
                payment.Status = PaymentTransactionStatus.Failed;
                payment.ResponseCode = string.IsNullOrWhiteSpace(payment.ResponseCode)
                    ? responseCode
                    : payment.ResponseCode;
            }
        }
        // ======== PRIVATE: Xử lý Loyalty (Hoàn/Thu hồi điểm) khi hủy đơn ========
        private async Task HandleLoyaltyOnCancelAsync(Invoice invoice)
        {
            if (invoice == null || string.IsNullOrEmpty(invoice.UserID)) return;
 
            try
            {
                // 1. Thu hồi điểm đã tích lũy (nếu có)
                await _loyaltyService.RevokePointsAsync(invoice.UserID, invoice.InvoiceID);
 
                // 2. Tìm kiếm xem đơn hàng này có dùng điểm để thanh toán không và hoàn lại
                var spendHistory = await _context.LoyaltyPointHistories
                    .FirstOrDefaultAsync(h => h.InvoiceID == invoice.InvoiceID && h.TransactionType == "SPEND");
 
                if (spendHistory != null)
                {
                    int pointsToRefund = Math.Abs(spendHistory.Amount);
                    await _loyaltyService.RefundPointsAsync(invoice.UserID, pointsToRefund, invoice.InvoiceID);
                    _logger.LogInformation("Đã hoàn lại {Points} điểm cho user {UserId} từ đơn hàng hủy {InvoiceId}", 
                        pointsToRefund, invoice.UserID, invoice.InvoiceID);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xử lý Loyalty hoàn trả/thu hồi điểm khi hủy đơn {InvoiceId}", invoice.InvoiceID);
            }
        }

        // ======== PRIVATE: XỬ LÝ KHẤU TRỪ VÀ KIỂM TRA FLASH SALE KHI THANH TOÁN ========
        private async Task HandleFlashSaleCheckoutDeductionAsync(string userId, int? variantId, int? bundleId, int quantity)
        {
            var now = DateTime.Now;

            if (bundleId.HasValue)
            {
                var fsItem = await _context.FlashSaleItems
                    .Include(fsi => fsi.FlashSale)
                    .Where(fsi => fsi.FlashSale.IsActive
                        && fsi.FlashSale.StartTime <= now
                        && fsi.FlashSale.EndTime >= now
                        && fsi.ItemType == FlashSaleItemType.Bundle
                        && fsi.ReferenceId == bundleId.Value)
                    .FirstOrDefaultAsync();

                if (fsItem != null)
                {
                    if (fsItem.SoldQuantity + quantity > fsItem.TotalQuantity)
                    {
                        throw new InvalidOperationException($"Combo sản phẩm đã đạt giới hạn số lượng Flash Sale. Chỉ còn {fsItem.TotalQuantity - fsItem.SoldQuantity} sản phẩm.");
                    }

                    if (fsItem.MaxQuantityPerUser > 0)
                    {
                        var userBoughtCount = await GetUserFlashSaleBoughtCountAsync(userId, fsItem.Id);
                        if (userBoughtCount + quantity > fsItem.MaxQuantityPerUser)
                        {
                            throw new InvalidOperationException($"Bạn đã vượt quá số lượng mua tối đa cho Combo này trong đợt Flash Sale (Tối đa: {fsItem.MaxQuantityPerUser}).");
                        }
                    }

                    fsItem.SoldQuantity += quantity;
                }
            }
            else if (variantId.HasValue)
            {
                var variant = await _context.Variants.FindAsync(variantId.Value);
                if (variant == null) return;

                // Check Variant Sale
                var fsItem = await _context.FlashSaleItems
                    .Include(fsi => fsi.FlashSale)
                    .Where(fsi => fsi.FlashSale.IsActive
                        && fsi.FlashSale.StartTime <= now
                        && fsi.FlashSale.EndTime >= now
                        && fsi.ItemType == FlashSaleItemType.Variant
                        && fsi.ReferenceId == variantId.Value)
                    .FirstOrDefaultAsync();

                // If not found, check Product Sale
                if (fsItem == null)
                {
                    fsItem = await _context.FlashSaleItems
                        .Include(fsi => fsi.FlashSale)
                        .Where(fsi => fsi.FlashSale.IsActive
                            && fsi.FlashSale.StartTime <= now
                            && fsi.FlashSale.EndTime >= now
                            && fsi.ItemType == FlashSaleItemType.Product
                            && fsi.ReferenceId == variant.ProductID)
                        .FirstOrDefaultAsync();
                }

                if (fsItem != null)
                {
                    if (fsItem.SoldQuantity + quantity > fsItem.TotalQuantity)
                    {
                        throw new InvalidOperationException($"Sản phẩm đã đạt giới hạn số lượng Flash Sale. Chỉ còn {fsItem.TotalQuantity - fsItem.SoldQuantity} sản phẩm.");
                    }

                    if (fsItem.MaxQuantityPerUser > 0)
                    {
                        var userBoughtCount = await GetUserFlashSaleBoughtCountAsync(userId, fsItem.Id);
                        if (userBoughtCount + quantity > fsItem.MaxQuantityPerUser)
                        {
                            throw new InvalidOperationException($"Bạn đã vượt quá số lượng mua tối đa cho sản phẩm này trong đợt Flash Sale (Tối đa: {fsItem.MaxQuantityPerUser}).");
                        }
                    }

                    fsItem.SoldQuantity += quantity;
                }
            }
        }

        private async Task<int> GetUserFlashSaleBoughtCountAsync(string userId, int flashSaleItemId)
        {
            var fsItem = await _context.FlashSaleItems.FindAsync(flashSaleItemId);
            if (fsItem == null) return 0;

            var invoiceDetails = await _context.InvoiceDetails
                .Include(id => id.Invoice)
                .Where(id => id.Invoice.UserID == userId 
                    && id.Invoice.Status != OrderStatus.Cancelled
                    && !id.Invoice.IsDeleted)
                .ToListAsync();

            int count = 0;
            foreach (var detail in invoiceDetails)
            {
                if (fsItem.ItemType == FlashSaleItemType.Bundle && detail.BundleID == fsItem.ReferenceId)
                {
                    count += detail.Quantity;
                }
                else if (fsItem.ItemType == FlashSaleItemType.Variant && detail.VariantID == fsItem.ReferenceId)
                {
                    count += detail.Quantity;
                }
                else if (fsItem.ItemType == FlashSaleItemType.Product && detail.VariantID.HasValue)
                {
                    var variant = await _context.Variants.FindAsync(detail.VariantID.Value);
                    if (variant != null && variant.ProductID == fsItem.ReferenceId)
                    {
                        count += detail.Quantity;
                    }
                }
            }

            return count;
        }

        // ======== PRIVATE: KHÔI PHỤC SỐ LƯỢNG FLASH SALE KHI HỦY HÓA ĐƠN ========
        private async Task RestoreFlashSaleSoldQuantityAsync(int? variantId, int? bundleId, int quantity, DateTime invoiceCreatedAt)
        {
            if (bundleId.HasValue)
            {
                var fsItem = await _context.FlashSaleItems
                    .Include(fsi => fsi.FlashSale)
                    .Where(fsi => fsi.FlashSale.StartTime <= invoiceCreatedAt
                        && fsi.FlashSale.EndTime >= invoiceCreatedAt
                        && fsi.ItemType == FlashSaleItemType.Bundle
                        && fsi.ReferenceId == bundleId.Value)
                    .FirstOrDefaultAsync();

                if (fsItem != null)
                {
                    fsItem.SoldQuantity = Math.Max(0, fsItem.SoldQuantity - quantity);
                }
            }
            else if (variantId.HasValue)
            {
                var variant = await _context.Variants.FindAsync(variantId.Value);
                if (variant == null) return;

                var fsItem = await _context.FlashSaleItems
                    .Include(fsi => fsi.FlashSale)
                    .Where(fsi => fsi.FlashSale.StartTime <= invoiceCreatedAt
                        && fsi.FlashSale.EndTime >= invoiceCreatedAt
                        && fsi.ItemType == FlashSaleItemType.Variant
                        && fsi.ReferenceId == variantId.Value)
                    .FirstOrDefaultAsync();

                if (fsItem == null)
                {
                    fsItem = await _context.FlashSaleItems
                        .Include(fsi => fsi.FlashSale)
                        .Where(fsi => fsi.FlashSale.StartTime <= invoiceCreatedAt
                            && fsi.FlashSale.EndTime >= invoiceCreatedAt
                            && fsi.ItemType == FlashSaleItemType.Product
                            && fsi.ReferenceId == variant.ProductID)
                        .FirstOrDefaultAsync();
                }

                if (fsItem != null)
                {
                    fsItem.SoldQuantity = Math.Max(0, fsItem.SoldQuantity - quantity);
                }
            }
        }

        // ======== TỰ ĐỘNG HOÀN TẤT ĐƠN HÀNG SAU 7 NGÀY ĐANG GIAO ========
        public async Task AutoCompleteShippedOrdersAsync(CancellationToken cancellationToken)
        {
            var sevenDaysAgo = DateTime.Now.AddDays(-7);

            var ordersToComplete = await _context.Invoices
                .Where(i => i.Status == OrderStatus.Shipped 
                            && i.ShippedAt.HasValue 
                            && i.ShippedAt.Value <= sevenDaysAgo 
                            && !i.IsDeleted)
                .ToListAsync(cancellationToken);

            if (ordersToComplete.Count == 0) return;

            _logger.LogInformation("Tìm thấy {Count} đơn hàng đang giao hơn 7 ngày cần tự động hoàn tất.", ordersToComplete.Count);

            foreach (var invoice in ordersToComplete)
            {
                try
                {
                    invoice.Status = OrderStatus.Completed;
                    invoice.CompletedAt = DateTime.Now;

                    _logger.LogInformation("Tự động hoàn tất hóa đơn {InvoiceId}", invoice.InvoiceID);

                    // Tích lũy điểm Loyalty
                    if (!string.IsNullOrEmpty(invoice.UserID))
                    {
                        try
                        {
                            await _loyaltyService.EarnPointsAsync(invoice.UserID, invoice.InvoiceID, invoice.TotalPrice);
                        }
                        catch (Exception lEx)
                        {
                            _logger.LogError(lEx, "Lỗi tích điểm Loyalty khi tự động hoàn thành đơn hàng {InvoiceId}", invoice.InvoiceID);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi tự động hoàn tất hóa đơn {InvoiceId}", invoice.InvoiceID);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
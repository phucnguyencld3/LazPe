using System.IO;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
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
        private readonly IAuditLogService _auditLogService;
        private readonly ICartService _cartService;
        private readonly IWalletSecurityService _walletSecurityService;
        private readonly INotificationService _notificationService;

        public InvoiceService(
            ApplicationDbContext context, 
            ILogger<InvoiceService> logger, 
            ILoyaltyService loyaltyService, 
            IVoucherService voucherService, 
            IRecommendationService recommendationService, 
            IAuditLogService auditLogService, 
            ICartService cartService,
            IWalletSecurityService walletSecurityService,
            INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _loyaltyService = loyaltyService;
            _voucherService = voucherService;
            _recommendationService = recommendationService;
            _auditLogService = auditLogService;
            _cartService = cartService;
            _walletSecurityService = walletSecurityService;
            _notificationService = notificationService;
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
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product).ThenInclude(p => p.Images)
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
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product).ThenInclude(p => p.Images)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Bundle)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Invoice> Items, int TotalCount)> GetByUserPaginatedAsync(string userId, OrderStatus? status = null, string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Invoices
                .AsNoTrackingWithIdentityResolution()
                .Where(i => i.UserID == userId && !i.IsDeleted);

            if (status.HasValue)
            {
                query = query.Where(i => i.Status == status.Value);
            }

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(i => 
                    (i.InvoiceCode != null && i.InvoiceCode.ToLower().Contains(s)) ||
                    i.InvoiceDetails.Any(d => d.Variant.Product.ProductName.ToLower().Contains(s) || (d.Bundle != null && d.Bundle.Name.ToLower().Contains(s)))
                );
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product).ThenInclude(p => p.Images)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product).ThenInclude(p => p.Variants)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Bundle)
                .OrderByDescending(i => i.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        // ======== Lấy hóa đơn theo ID ========
        public async Task<Invoice?> GetByIdAsync(int id)
        {
            return await _context.Invoices
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Include(i => i.User)
                .Include(i => i.Voucher)
                .Include(i => i.ShippingVoucher)
                .Include(i => i.VoucherUsages).ThenInclude(vu => vu.Voucher)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product).ThenInclude(p => p.Images)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant).ThenInclude(v => v.Product).ThenInclude(p => p.Variants)
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
        public async Task<Invoice> CreateFromCartAsync(int cartId, PayMethod? payMethod, string shippingAddress, UserAddress? userAddress = null, PolyBabyAPI.DTOs.InvoiceDtos.CheckoutRequestDto? request = null)
        {
            var cart = await _context.Carts
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Variant)
                    .ThenInclude(v => v.Product)
                .Include(c => c.CartDetails)
                    .ThenInclude(cd => cd.Bundle)
                .Include(c => c.Voucher) // ✅ Include Voucher từ Cart
                .Include(c => c.ShippingVoucher) // Include ShippingVoucher từ Cart
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.CartID == cartId);

            if (cart == null || cart.User == null)
                throw new InvalidOperationException("Không tìm thấy giỏ hàng.");

            if (cart.CartDetails == null || !cart.CartDetails.Any())
                throw new InvalidOperationException("Giỏ hàng trống.");

            // Xác định items cần checkout
            var selectedCartDetailIds = request?.SelectedCartDetailIds;
            var itemsToCheckout = selectedCartDetailIds != null && selectedCartDetailIds.Count > 0
                ? cart.CartDetails.Where(cd => selectedCartDetailIds.Contains(cd.CartDetailID)).ToList()
                : cart.CartDetails.ToList();

            if (itemsToCheckout.Count == 0)
                throw new InvalidOperationException("Không tìm thấy sản phẩm đã chọn trong giỏ hàng.");

            var remainingItems = cart.CartDetails.Except(itemsToCheckout).ToList();
            var isPartialCheckout = remainingItems.Count > 0;

            // ✅ Tính lại SubTotal từ các sản phẩm checkout dựa trên giá thực tế mới nhất
            decimal subTotal = 0;
            foreach (var item in itemsToCheckout)
            {
                decimal currentUnitPrice = await _cartService.GetEffectivePriceAsync(
                    cart.UserID,
                    item.VariantID,
                    item.BundleID,
                    item.Quantity
                );

                item.UnitPrice = currentUnitPrice;
                item.TotalPrice = currentUnitPrice * item.Quantity;
                subTotal += item.TotalPrice;
            }

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
            decimal pointsDiscountAmount = 0;
            if (request != null && request.UsePoints && request.PointsToUse > 0)
            {
                var isPointsValid = await _loyaltyService.ValidatePointsRedemptionAsync(cart.UserID, request.PointsToUse, subTotal - discountAmount);
                if (!isPointsValid)
                {
                    throw new InvalidOperationException("Số điểm quy đổi sử dụng không hợp lệ hoặc vượt quá số dư khả dụng.");
                }
                pointsDiscountAmount = await _loyaltyService.CalculateRedemptionDiscountAsync(cart.UserID, request.PointsToUse);
            }

            decimal remainAfterVoucherAndPoints = subTotal - discountAmount - pointsDiscountAmount;
            if (remainAfterVoucherAndPoints < 0) remainAfterVoucherAndPoints = 0;

            decimal coinsDiscountAmount = 0;
            if (request != null && request.UseCoins && request.CoinsToUse > 0)
            {
                if (cart.User.CoinsBalance < request.CoinsToUse)
                    throw new InvalidOperationException("Số dư xu không đủ.");
                
                coinsDiscountAmount = Math.Min(request.CoinsToUse, remainAfterVoucherAndPoints);
            }

            decimal remainAfterCoins = remainAfterVoucherAndPoints - coinsDiscountAmount;
            
            decimal walletDiscountAmount = 0;
            if (request != null && request.UseWallet && request.WalletToUse > 0)
            {
                if (cart.User.WalletBalance < request.WalletToUse)
                    throw new InvalidOperationException("Số dư ví không đủ.");

                // BẢO MẬT VÍ: Kiểm tra mã PIN thanh toán
                if (string.IsNullOrEmpty(request.PaymentPin))
                    throw new InvalidOperationException("Vui lòng nhập mã PIN thanh toán để sử dụng Ví LazPe.");

                var validationResult = await _walletSecurityService.ValidatePaymentPinWithLockoutAsync(cart.User, request.PaymentPin);
                if (!validationResult.Success)
                    throw new InvalidOperationException(validationResult.Message);

                // BẢO MẬT VÍ: Kiểm tra toàn vẹn dữ liệu ví
                if (!_walletSecurityService.ValidateSignature(cart.User))
                    throw new InvalidOperationException("Dữ liệu ví không hợp lệ hoặc đã bị can thiệp. Vui lòng liên hệ CSKH.");
                
                walletDiscountAmount = Math.Min(request.WalletToUse, remainAfterCoins);
            }

            decimal totalDiscount = discountAmount + pointsDiscountAmount + coinsDiscountAmount + walletDiscountAmount;

            // ✅ Tính phí ship gốc dựa trên tổng tiền sau khi trừ giảm giá sản phẩm & điểm loyalty
            decimal netTotalPrice = subTotal - totalDiscount;
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

            // ✅ Tạo mã đơn hàng (InvoiceCode) và mã vận đơn (TrackingCode)
            var random = new Random();
            string letters = new string(Enumerable.Range(0, 2).Select(_ => (char)random.Next('A', 'Z' + 1)).ToArray());
            string digits = random.Next(100000, 999999).ToString();
            string dateStr = DateTime.Now.ToString("ddMM");

            // ✅ Tạo Invoice với thông tin voucher + điểm loyalty
            var invoice = new Invoice
            {
                InvoiceCode = $"{letters}{dateStr}{digits}",
                TrackingCode = $"LZP{dateStr}{digits}",
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
                DiscountAmount = totalDiscount,
                VoucherDiscountAmount = discountAmount,
                PointsDiscountAmount = pointsDiscountAmount,
                CoinsDiscountAmount = coinsDiscountAmount,
                WalletDiscountAmount = walletDiscountAmount,
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
                    await HandleFlashSaleCheckoutDeductionAsync(cart.UserID, item.VariantID.Value, null, item.Quantity, item.UnitPrice);

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
                    await HandleFlashSaleCheckoutDeductionAsync(cart.UserID, null, item.BundleID.Value, item.Quantity, item.UnitPrice);
                }
            }

            // ✅ Tính TotalPrice = SubTotal - DiscountAmount (bao gồm cả Voucher + Loyalty Points)
            invoice.TotalPrice = subTotal - invoice.DiscountAmount;
            if (invoice.TotalPrice < 0) invoice.TotalPrice = 0;
            invoice.ShippingFee = originalShippingFee;

            decimal amountToPay = invoice.TotalPrice + invoice.ShippingFee - invoice.ShippingDiscountAmount;
            if (amountToPay < 0) amountToPay = 0;
            invoice.AmountToPay = amountToPay;

            if (amountToPay == 0)
            {
                invoice.PayMethod = PayMethod.SystemWallet;
                invoice.Status = OrderStatus.Confirmed; // Tự động duyệt nếu đã thanh toán hết
            }

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync(); // Cần save trước để có InvoiceID

                // ✅ Khấu trừ điểm trong LoyaltyProfile & Ghi log lịch sử điểm
                string idempotencyKey = $"CHECKOUT_{invoice.InvoiceID}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

                if (request != null && request.UsePoints && request.PointsToUse > 0)
                {
                    var deductResult = await _loyaltyService.ApplyPointsRedemptionAsync(cart.UserID, request.PointsToUse, invoice.InvoiceID);
                    if (!deductResult)
                        throw new InvalidOperationException("Khấu trừ điểm Loyalty thất bại. Vui lòng kiểm tra lại số dư điểm.");
                }

                if (coinsDiscountAmount > 0)
                {
                    cart.User.CoinsBalance -= coinsDiscountAmount;
                    
                    // BẢO MẬT VÍ: Ký lại số dư sau khi trừ
                    cart.User.WalletSignature = _walletSecurityService.GenerateSignature(cart.UserID, cart.User.WalletBalance, cart.User.CoinsBalance);
                    
                    _context.BalanceTransactions.Add(new BalanceTransaction
                    {
                        UserID = cart.UserID,
                        InvoiceID = invoice.InvoiceID,
                        Amount = coinsDiscountAmount,
                        Direction = BalanceTransactionDirection.Debit,
                        SourceType = BalanceSourceType.Coins,
                        Reason = $"Thanh toán một phần đơn hàng #{invoice.InvoiceCode}",
                        IdempotencyKey = idempotencyKey + "_COINS",
                        HashSignature = "" // To implement HMAC signing later if needed
                    });
                }

                if (walletDiscountAmount > 0)
                {
                    cart.User.WalletBalance -= walletDiscountAmount;
                    
                    // BẢO MẬT VÍ: Ký lại số dư sau khi trừ
                    cart.User.WalletSignature = _walletSecurityService.GenerateSignature(cart.UserID, cart.User.WalletBalance, cart.User.CoinsBalance);
                    
                    _context.BalanceTransactions.Add(new BalanceTransaction
                    {
                        UserID = cart.UserID,
                        InvoiceID = invoice.InvoiceID,
                        Amount = walletDiscountAmount,
                        Direction = BalanceTransactionDirection.Debit,
                        SourceType = BalanceSourceType.Wallet,
                        Reason = $"Thanh toán một phần đơn hàng #{invoice.InvoiceCode}",
                        IdempotencyKey = idempotencyKey + "_WALLET",
                        HashSignature = "" 
                    });
                }

                if (payMethod == PayMethod.MobilePayment || invoice.AmountToPay == 0)
                {
                    _context.PaymentTransactions.Add(new PaymentTransaction
                    {
                        InvoiceID = invoice.InvoiceID,
                        TxnRef = invoice.InvoiceCode ?? invoice.InvoiceID.ToString(),
                        Status = invoice.AmountToPay == 0 ? PaymentTransactionStatus.Success : PaymentTransactionStatus.Pending,
                        Amount = invoice.AmountToPay,
                        Provider = invoice.AmountToPay == 0 ? "SystemWallet" : "VNPay",
                        CreatedAt = DateTime.Now,
                        PaidAt = invoice.AmountToPay == 0 ? DateTime.Now : null,
                        CompletedAt = invoice.AmountToPay == 0 ? DateTime.Now : null
                    });
                }

                if (appliedVoucher != null)
                {
                    var userVoucher = await _context.UserVouchers
                        .Where(uv => uv.UserID == cart.UserID
                            && uv.VoucherID == appliedVoucher.VoucherID
                            && uv.Status == UserVoucherStatus.Unused)
                        .OrderBy(uv => uv.CollectedAt)
                        .FirstOrDefaultAsync();

                    // Tự động thêm voucher public vào ví nếu chưa có
                    if (userVoucher == null && appliedVoucher.VisibilityType == VoucherVisibilityType.Public)
                    {
                         userVoucher = new UserVoucher
                         {
                             UserID = cart.UserID,
                             VoucherID = appliedVoucher.VoucherID,
                             Status = UserVoucherStatus.Unused,
                             CollectedAt = DateTime.Now
                         };
                         _context.UserVouchers.Add(userVoucher);
                    }

                    if (userVoucher == null)
                    {
                        throw new InvalidOperationException("Voucher sản phẩm chưa tồn tại trong ví hoặc đã được sử dụng.");
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

                if (appliedShippingVoucher != null)
                {
                    var userVoucher = await _context.UserVouchers
                        .Where(uv => uv.UserID == cart.UserID
                            && uv.VoucherID == appliedShippingVoucher.VoucherID
                            && uv.Status == UserVoucherStatus.Unused)
                        .OrderBy(uv => uv.CollectedAt)
                        .FirstOrDefaultAsync();

                    // Tự động thêm voucher public vào ví nếu chưa có
                    if (userVoucher == null && appliedShippingVoucher.VisibilityType == VoucherVisibilityType.Public)
                    {
                         userVoucher = new UserVoucher
                         {
                             UserID = cart.UserID,
                             VoucherID = appliedShippingVoucher.VoucherID,
                             Status = UserVoucherStatus.Unused,
                             CollectedAt = DateTime.Now
                         };
                         _context.UserVouchers.Add(userVoucher);
                    }

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
            catch (DbUpdateConcurrencyException ex)
            {
                await tx.RollbackAsync();
                _logger.LogWarning(ex, "Lỗi đồng bộ tồn kho khi tạo hóa đơn từ giỏ hàng {CartId}", cartId);
                throw new InvalidOperationException("Sản phẩm trong giỏ hàng vừa bị một khách hàng khác mua hết hoặc thay đổi số lượng. Vui lòng làm mới trang và thử lại!");
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
            string? search, OrderStatus? status, string? sortBy, bool desc, int page, int pageSize, decimal? minPrice = null, decimal? maxPrice = null, string? dateRange = null)
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

            if (minPrice.HasValue)
                q = q.Where(i => i.TotalPrice >= minPrice.Value);

            if (maxPrice.HasValue)
                q = q.Where(i => i.TotalPrice <= maxPrice.Value);

            if (!string.IsNullOrEmpty(dateRange))
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                var today = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;

                if (dateRange == "today")
                {
                    q = q.Where(i => i.CreatedAt >= today);
                }
                else if (dateRange == "7days")
                {
                    var d = today.AddDays(-7);
                    q = q.Where(i => i.CreatedAt >= d);
                }
                else if (dateRange == "30days")
                {
                    var d = today.AddDays(-30);
                    q = q.Where(i => i.CreatedAt >= d);
                }
                else if (dateRange == "3months")
                {
                    var d = today.AddMonths(-3);
                    q = q.Where(i => i.CreatedAt >= d);
                }
            }

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

        public async Task<byte[]> ExportExcelAsync(
            string? search, OrderStatus? status, string? sortBy, bool desc, decimal? minPrice = null, decimal? maxPrice = null, string? dateRange = null)
        {
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

            if (minPrice.HasValue)
                q = q.Where(i => i.TotalPrice >= minPrice.Value);

            if (maxPrice.HasValue)
                q = q.Where(i => i.TotalPrice <= maxPrice.Value);

            if (!string.IsNullOrEmpty(dateRange))
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                var today = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;

                if (dateRange == "today")
                {
                    q = q.Where(i => i.CreatedAt >= today);
                }
                else if (dateRange == "7days")
                {
                    var d = today.AddDays(-7);
                    q = q.Where(i => i.CreatedAt >= d);
                }
                else if (dateRange == "30days")
                {
                    var d = today.AddDays(-30);
                    q = q.Where(i => i.CreatedAt >= d);
                }
                else if (dateRange == "3months")
                {
                    var d = today.AddMonths(-3);
                    q = q.Where(i => i.CreatedAt >= d);
                }
            }

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

            var items = await sortedQuery
                .Include(i => i.User)
                .Include(i => i.Voucher)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Đơn hàng");
            
            // Header
            worksheet.Cell(1, 1).Value = "Mã ĐH";
            worksheet.Cell(1, 2).Value = "Mã vận đơn";
            worksheet.Cell(1, 3).Value = "Ngày tạo";
            worksheet.Cell(1, 4).Value = "Khách hàng";
            worksheet.Cell(1, 5).Value = "Email";
            worksheet.Cell(1, 6).Value = "SĐT";
            worksheet.Cell(1, 7).Value = "Địa chỉ giao";
            worksheet.Cell(1, 8).Value = "Thanh toán";
            worksheet.Cell(1, 9).Value = "Tổng tiền";
            worksheet.Cell(1, 10).Value = "Trạng thái";

            var headerRange = worksheet.Range("A1:J1");
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            int row = 2;
            foreach (var item in items)
            {
                worksheet.Cell(row, 1).Value = item.InvoiceCode ?? item.InvoiceID.ToString();
                worksheet.Cell(row, 2).Value = item.TrackingCode ?? "N/A";
                worksheet.Cell(row, 3).Value = item.CreatedAt?.ToString("dd/MM/yyyy HH:mm");
                worksheet.Cell(row, 4).Value = item.User?.FullName ?? "N/A";
                worksheet.Cell(row, 5).Value = item.User?.Email ?? "N/A";
                string formattedAddress = string.IsNullOrWhiteSpace(item.ShippingAddress)
                    ? "N/A"
                    : string.Join(", ", item.ShippingAddress.Split(',')
                        .Select(p => p.Trim())
                        .Where(p => !string.IsNullOrEmpty(p) && p != "-" && !p.Equals("null", StringComparison.OrdinalIgnoreCase)));

                worksheet.Cell(row, 6).Value = item.ShippingPhone ?? "N/A";
                worksheet.Cell(row, 7).Value = formattedAddress;
                worksheet.Cell(row, 8).Value = item.PayMethod?.ToString() ?? "N/A";
                worksheet.Cell(row, 9).Value = item.TotalPrice;
                worksheet.Cell(row, 9).Style.NumberFormat.Format = "#,##0\"₫\"";
                worksheet.Cell(row, 10).Value = item.Status switch
                {
                    OrderStatus.Pending => "Chờ xác nhận",
                    OrderStatus.Confirmed => "Đang xử lý",
                    OrderStatus.Shipped => "Đang giao",
                    OrderStatus.Completed => "Hoàn thành",
                    OrderStatus.Cancelled => "Đã hủy",
                    _ => item.Status.ToString()
                };

                row++;
            }
            
            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);

            await _auditLogService.LogAsync("ExportOrders", "Invoice", null, null, null, "Xuất danh sách đơn hàng ra file Excel");

            return stream.ToArray();
        }

        // ======== Xác nhận đơn hàng ========
        public async Task<bool> ConfirmAsync(int invoiceId)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);
            if (invoice == null || invoice.Status != OrderStatus.Pending) return false;

            invoice.Status = OrderStatus.Confirmed;
            invoice.ConfirmedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync("ApproveOrder", "Invoice", invoiceId.ToString(), "Pending", "Confirmed", "Xác nhận đơn hàng");

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
                    await _loyaltyService.EarnPointsAsync(invoice.UserID, invoice.InvoiceID, invoice.SubTotal);
                    await HandleReferralOnOrderCompletedAsync(invoice.UserID, invoice.TotalPrice, invoice.InvoiceID);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi tích điểm Loyalty/Referral khi hoàn thành đơn hàng {InvoiceId}", invoiceId);
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

            bool isPrepaid = invoice.CoinsDiscountAmount > 0 || 
                             invoice.WalletDiscountAmount > 0 || 
                             (invoice.PaymentTransactions != null && invoice.PaymentTransactions.Any(p => p.Status == PaymentTransactionStatus.Success));

            if (!isPrepaid) // Đơn COD thuần túy hoặc thanh toán online chưa thành công
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

                    _logger.LogInformation("Người dùng {UserId} tự hủy đơn hàng {InvoiceId} thành công (Đơn COD/Chưa thanh toán). Hàng + Voucher đã được hoàn trả. Lý do: {Reason}",
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
            else // Đã thanh toán bằng Ví, Xu hoặc VNPAY thành công
            {
                invoice.Status = OrderStatus.CancelRequested;
                invoice.CancelReason = reason;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Người dùng {UserId} yêu cầu hủy đơn hàng {InvoiceId} (Đơn đã thanh toán). Chuyển sang chờ Admin duyệt. Lý do: {Reason}",
                    userId, invoiceId, reason);
                    
                // Lên lịch tự động duyệt sau 1 phút
                Hangfire.BackgroundJob.Schedule<IInvoiceService>(s => s.ApproveCancelAsync(invoiceId, null), TimeSpan.FromMinutes(1));

                return OrderStatus.CancelRequested;
            }
        }

        // ======== Yêu cầu hoàn trả (Client) ========
        public async Task<bool> RequestReturnAsync(int invoiceId, string userId, string reason, string description, string imageUrls, RefundMethod refundMethod)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && i.UserID == userId && !i.IsDeleted);
            if (invoice == null || invoice.Status != OrderStatus.Completed) return false;

            invoice.Status = OrderStatus.ReturnRequested;
            invoice.ReturnReason = reason;
            invoice.ReturnDescription = description;
            invoice.ReturnImageUrls = imageUrls;
            invoice.RefundMethod = refundMethod;
            await _context.SaveChangesAsync();
            return true;
        }

        // ======== Hủy yêu cầu hoàn trả (Client) ========
        public async Task<bool> CancelReturnRequestAsync(int invoiceId, string userId)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && i.UserID == userId && !i.IsDeleted);
            if (invoice == null || invoice.Status != OrderStatus.ReturnRequested) return false;

            invoice.Status = OrderStatus.Completed;
            invoice.ReturnReason = null;
            invoice.ReturnImageUrls = null;
            invoice.RefundMethod = null;
            await _context.SaveChangesAsync();
            return true;
        }

        // ======== Duyệt hoàn trả (Admin) ========
        public async Task<bool> ApproveReturnAsync(int invoiceId, bool isRefundToCoins)
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);
            if (invoice == null || invoice.Status != OrderStatus.ReturnRequested) return false;

            invoice.Status = OrderStatus.ReturnApproved;
            if (isRefundToCoins)
            {
                invoice.RefundMethod = RefundMethod.LazPeCoins;
            }
            await _context.SaveChangesAsync();
            return true;
        }

        // ======== Từ chối hoàn trả (Admin) ========
        public async Task<bool> RejectReturnAsync(int invoiceId, string rejectReason)
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);
            if (invoice == null || invoice.Status != OrderStatus.ReturnRequested) return false;

            invoice.Status = OrderStatus.ReturnRejected;
            invoice.CancelReason = $"Từ chối trả hàng: {rejectReason}";
            
            await _context.SaveChangesAsync();
            return true;
        }

        // ======== Xác nhận đã nhận hàng hoàn (Admin) ========
        public async Task<bool> ConfirmReturnReceivedAsync(int invoiceId, bool isRestockable)
        {
            var invoice = await _context.Invoices
                .Include(i => i.User)
                .Include(i => i.PaymentTransactions)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Bundle).ThenInclude(b => b.BundleItems).ThenInclude(bi => bi.Variant)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);

            if (invoice == null || invoice.Status != OrderStatus.ReturnApproved || invoice.IsReturnReceived) return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                invoice.IsReturnReceived = true;
                invoice.Status = OrderStatus.ReturnedRefunded;
                invoice.CancelledAt = DateTime.Now;
                invoice.RefundedAt = DateTime.Now;
                
                await HandleLoyaltyOnCancelAsync(invoice);
                await RefundOrderBalancesAsync(invoice);

                if (isRestockable)
                {
                    await RestoreStockAsync(invoice, restoreFlashSale: false);
                }
                
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi khi xác nhận nhận hàng và hoàn tiền {InvoiceId}", invoiceId);
                return false;
            }
        }

        // ======== Tự động cộng lại tồn kho sau 14 ngày ========
        public async Task AutoRestockAfterReturnAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Variant)
                .Include(i => i.InvoiceDetails).ThenInclude(d => d.Bundle).ThenInclude(b => b.BundleItems).ThenInclude(bi => bi.Variant)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);

            if (invoice == null || invoice.Status != OrderStatus.ReturnedRefunded || invoice.IsReturnReceived) return;

            invoice.IsReturnReceived = true;
            await RestoreStockAsync(invoice, restoreFlashSale: false);
            await _context.SaveChangesAsync();
        }

        // ======== Admin hủy đơn (CÓ HOÀN TRẢ KHO + VOUCHER + VÍ/XU) ========
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
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);

            if (invoice == null || (invoice.Status != OrderStatus.Pending && invoice.Status != OrderStatus.Confirmed))
                return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await RestoreStockAsync(invoice);
                await RestoreVoucherAsync(invoice);
                await HandleLoyaltyOnCancelAsync(invoice);
                await RefundOrderBalancesAsync(invoice);

                invoice.Status = OrderStatus.Cancelled;
                invoice.CancelReason = reason;
                invoice.CancelledAt = DateTime.Now;

                MarkPendingPaymentsAsFailed(invoice, "CANCELLED");

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _auditLogService.LogAsync("CancelOrder", "Invoice", invoiceId.ToString(), null, "Cancelled", $"Admin hủy đơn hàng. Lý do: {reason}");

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

        // ======== Duyệt yêu cầu hủy (CÓ HOÀN TRẢ KHO + VOUCHER + VÍ/XU) ========
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
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId && !i.IsDeleted);

            if (invoice == null || invoice.Status != OrderStatus.CancelRequested)
                return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await RestoreStockAsync(invoice);
                await RestoreVoucherAsync(invoice);
                await HandleLoyaltyOnCancelAsync(invoice);
                await RefundOrderBalancesAsync(invoice);

                invoice.Status = OrderStatus.Cancelled;
                invoice.CancelReason = reason ?? invoice.CancelReason;
                invoice.CancelledAt = DateTime.Now;

                MarkPendingPaymentsAsFailed(invoice, "CANCELLED");

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _auditLogService.LogAsync("ApproveCancelOrder", "Invoice", invoiceId.ToString(), "CancelRequested", "Cancelled", $"Duyệt yêu cầu hủy đơn. Lý do: {reason}");

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
        private async Task RestoreStockAsync(Invoice invoice, bool restoreFlashSale = true)
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
                    if (restoreFlashSale)
                    {
                        await RestoreFlashSaleSoldQuantityAsync(detail.VariantID.Value, null, detail.Quantity, invoice.CreatedAt ?? DateTime.Now);
                    }
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
                    if (restoreFlashSale)
                    {
                        await RestoreFlashSaleSoldQuantityAsync(null, detail.BundleID.Value, detail.Quantity, invoice.CreatedAt ?? DateTime.Now);
                    }
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
        private async Task HandleFlashSaleCheckoutDeductionAsync(string userId, int? variantId, int? bundleId, int quantity, decimal unitPrice)
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

                if (fsItem != null && unitPrice == fsItem.DiscountPrice)
                {
                    if (fsItem.SoldQuantity + quantity > fsItem.TotalQuantity)
                    {
                        return; // Treat as normal purchase
                    }

                    if (fsItem.MaxQuantityPerUser > 0)
                    {
                        var userBoughtCount = await GetUserFlashSaleBoughtCountAsync(userId, fsItem.Id);
                        if (userBoughtCount + quantity > fsItem.MaxQuantityPerUser)
                        {
                            return; // Treat as normal purchase
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

                if (fsItem != null && unitPrice == fsItem.DiscountPrice)
                {
                    if (fsItem.SoldQuantity + quantity > fsItem.TotalQuantity)
                    {
                        return; // Treat as normal purchase if flash sale quantity is exhausted
                    }

                    if (fsItem.MaxQuantityPerUser > 0)
                    {
                        var userBoughtCount = await GetUserFlashSaleBoughtCountAsync(userId, fsItem.Id);
                        if (userBoughtCount + quantity > fsItem.MaxQuantityPerUser)
                        {
                            return; // Treat as normal purchase if user exceeds their limit
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

        // ======== XỬ LÝ HOA HỒNG GIỚI THIỆU KHI ĐƠN HÀNG HOÀN TẤT ========
        private async Task HandleReferralOnOrderCompletedAsync(string userId, decimal invoiceTotal, int invoiceId)
        {
            try
            {
                var referralRecord = await _context.ReferralRecords
                    .FirstOrDefaultAsync(r => r.ReferredUserId == userId);

                if (referralRecord == null) return;

                if (!referralRecord.HasCompletedFirstOrder)
                {
                    // Đơn đầu tiên
                    referralRecord.HasCompletedFirstOrder = true;
                    
                    // Nếu đơn đầu tiên này được hoàn tất trong vòng 7 ngày kể từ lúc đăng ký
                    if ((DateTime.Now - referralRecord.CreatedAt).TotalDays <= 7)
                    {
                        // Thưởng cố định 50,000 điểm hiện có (không tích lũy xét hạng)
                        int pointsToAdd = 50000;
                        await _loyaltyService.AddPointsAsync(
                            referralRecord.ReferrerId, 
                            pointsToAdd, 
                            "EARN", 
                            $"Thưởng giới thiệu bạn bè (đơn đầu tiên trong 7 ngày) - #{invoiceId}", 
                            invoiceId, 
                            false // không cộng vào điểm tích lũy xét hạng
                        );
                    }
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xử lý điểm thưởng Referral cho hóa đơn {InvoiceId}", invoiceId);
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

                    // Tích lũy điểm Loyalty và Referral
                    if (!string.IsNullOrEmpty(invoice.UserID))
                    {
                        try
                        {
                            await _loyaltyService.EarnPointsAsync(invoice.UserID, invoice.InvoiceID, invoice.SubTotal);
                            await HandleReferralOnOrderCompletedAsync(invoice.UserID, invoice.TotalPrice, invoice.InvoiceID);
                        }
                        catch (Exception lEx)
                        {
                            _logger.LogError(lEx, "Lỗi tích điểm Loyalty/Referral khi tự động hoàn thành đơn hàng {InvoiceId}", invoice.InvoiceID);
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

        // ======== TỰ ĐỘNG HỦY ĐƠN HÀNG QUÁ HẠN 2 NGÀY (CHỜ XÁC NHẬN HOẶC CHỜ XỬ LÝ) ========
        public async Task AutoCancelStaleOrdersAsync(CancellationToken cancellationToken)
        {
            var twoDaysAgo = DateTime.Now.AddDays(-2);

            // 1. Lấy danh sách các đơn hàng "Chờ xác nhận" (Pending) quá 2 ngày
            var pendingStaleOrders = await _context.Invoices
                .Where(i => i.Status == OrderStatus.Pending 
                            && i.CreatedAt.HasValue 
                            && i.CreatedAt.Value <= twoDaysAgo 
                            && !i.IsDeleted)
                .Select(i => new { i.InvoiceID, i.InvoiceCode, i.UserID })
                .ToListAsync(cancellationToken);

            // 2. Lấy danh sách các đơn hàng "Chờ xử lý / Đã xác nhận" (Confirmed) quá 2 ngày chưa giao
            var confirmedStaleOrders = await _context.Invoices
                .Where(i => i.Status == OrderStatus.Confirmed 
                            && ((i.ConfirmedAt.HasValue && i.ConfirmedAt.Value <= twoDaysAgo) || (!i.ConfirmedAt.HasValue && i.CreatedAt.HasValue && i.CreatedAt.Value <= twoDaysAgo))
                            && !i.IsDeleted)
                .Select(i => new { i.InvoiceID, i.InvoiceCode, i.UserID })
                .ToListAsync(cancellationToken);

            if (pendingStaleOrders.Count == 0 && confirmedStaleOrders.Count == 0) return;

            _logger.LogInformation("Tìm thấy {PendingCount} đơn hàng chờ xác nhận quá 2 ngày và {ConfirmedCount} đơn hàng chờ xử lý quá 2 ngày cần tự động hủy.", 
                pendingStaleOrders.Count, confirmedStaleOrders.Count);

            // Xử lý hủy đơn chờ xác nhận
            foreach (var item in pendingStaleOrders)
            {
                try
                {
                    var reason = "Hệ thống tự động hủy: Đơn hàng quá 2 ngày chưa được cửa hàng xác nhận";
                    bool success = await AdminCancelAsync(item.InvoiceID, reason);
                    if (success && !string.IsNullOrEmpty(item.UserID))
                    {
                        await SendAutoCancelNotificationAsync(item.InvoiceID, item.InvoiceCode, item.UserID, reason);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi tự động hủy đơn hàng chờ xác nhận quá 2 ngày {InvoiceId}", item.InvoiceID);
                }
            }

            // Xử lý hủy đơn chờ xử lý
            foreach (var item in confirmedStaleOrders)
            {
                try
                {
                    var reason = "Hệ thống tự động hủy: Đơn hàng quá 2 ngày chưa được bàn giao vận chuyển";
                    bool success = await AdminCancelAsync(item.InvoiceID, reason);
                    if (success && !string.IsNullOrEmpty(item.UserID))
                    {
                        await SendAutoCancelNotificationAsync(item.InvoiceID, item.InvoiceCode, item.UserID, reason);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi tự động hủy đơn hàng chờ xử lý quá 2 ngày {InvoiceId}", item.InvoiceID);
                }
            }
        }

        private async Task SendAutoCancelNotificationAsync(int invoiceId, string? invoiceCode, string userId, string reason)
        {
            try
            {
                var displayCode = !string.IsNullOrEmpty(invoiceCode) ? invoiceCode : invoiceId.ToString();
                var notifDto = new CreateNotificationDto
                {
                    Title = "Đơn hàng đã tự động bị hủy",
                    ShortDescription = $"Đơn hàng #{displayCode} đã bị hệ thống tự động hủy do quá hạn 2 ngày.",
                    Content = $"<p>Đơn hàng <strong>#{displayCode}</strong> của bạn đã bị hệ thống tự động hủy do quá 2 ngày chưa được xử lý/giao hàng. Lý do: <em>{reason}</em>.</p><p>Toàn bộ số tiền thanh toán (nếu có), xu LazPe, điểm thưởng, voucher và tồn kho sản phẩm đã được hoàn trả đầy đủ về tài khoản của bạn.</p>",
                    Type = NotificationType.Order,
                    Priority = NotificationPriority.High,
                    ActionType = ActionType.CustomUrl,
                    ActionUrl = $"/profile?tab=orders&id={invoiceId}",
                    TargetType = TargetType.SpecificUsers,
                    TargetValue = userId,
                    PublishedAt = DateTime.Now
                };
                await _notificationService.CreateNotificationAsync(notifDto, "System");
            }
            catch (Exception nEx)
            {
                _logger.LogError(nEx, "Lỗi khi gửi thông báo tự động hủy đơn {InvoiceId}", invoiceId);
            }
        }

        // ======== HOÀN TIỀN VÀO VÍ/XU (HELPER) ========
        private async Task RefundOrderBalancesAsync(Invoice invoice)
        {
            if (invoice.User == null) return;

            string idempotencyKey = $"REFUND_{invoice.InvoiceID}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

            // 1. Hoàn lại Coins
            if (invoice.CoinsDiscountAmount > 0)
            {
                invoice.User.CoinsBalance += invoice.CoinsDiscountAmount;
                _context.BalanceTransactions.Add(new BalanceTransaction
                {
                    UserID = invoice.UserID,
                    InvoiceID = invoice.InvoiceID,
                    Amount = invoice.CoinsDiscountAmount,
                    Direction = BalanceTransactionDirection.Credit,
                    SourceType = BalanceSourceType.Coins,
                    Reason = $"Hoàn tiền xu từ đơn hàng #{invoice.InvoiceCode} bị hủy",
                    IdempotencyKey = idempotencyKey + "_COINS",
                    HashSignature = "" 
                });
            }

            // 2. Hoàn lại Wallet
            if (invoice.WalletDiscountAmount > 0)
            {
                invoice.User.WalletBalance += invoice.WalletDiscountAmount;
                _context.BalanceTransactions.Add(new BalanceTransaction
                {
                    UserID = invoice.UserID,
                    InvoiceID = invoice.InvoiceID,
                    Amount = invoice.WalletDiscountAmount,
                    Direction = BalanceTransactionDirection.Credit,
                    SourceType = BalanceSourceType.Wallet,
                    Reason = $"Hoàn tiền ví từ đơn hàng #{invoice.InvoiceCode} bị hủy",
                    IdempotencyKey = idempotencyKey + "_WALLET",
                    HashSignature = "" 
                });
            }

            // 3. Hoàn lại số tiền đã thanh toán (VNPay hoặc SystemWallet)
            var successPayments = invoice.PaymentTransactions?
                .Where(p => p.Status == PaymentTransactionStatus.Success)
                .ToList();

            if (successPayments != null && successPayments.Any())
            {
                decimal totalPaid = successPayments.Sum(p => p.Amount);
                if (totalPaid > 0)
                {
                    bool refundToCoins = (!string.IsNullOrEmpty(invoice.CancelReason) && 
                                         invoice.CancelReason.Contains("[Hoàn tiền về: Xu LazPe]", StringComparison.OrdinalIgnoreCase)) ||
                                         invoice.RefundMethod == RefundMethod.LazPeCoins;
                    
                    if (refundToCoins)
                    {
                        invoice.User.CoinsBalance += totalPaid;
                        _context.BalanceTransactions.Add(new BalanceTransaction
                        {
                            UserID = invoice.UserID,
                            InvoiceID = invoice.InvoiceID,
                            Amount = totalPaid,
                            Direction = BalanceTransactionDirection.Credit,
                            SourceType = BalanceSourceType.Coins,
                            Reason = $"Hoàn xu thanh toán đơn hàng #{invoice.InvoiceCode}",
                            IdempotencyKey = idempotencyKey + "_VNPAID_COINS",
                            HashSignature = "" 
                        });
                    }
                    else
                    {
                        invoice.User.WalletBalance += totalPaid;
                        _context.BalanceTransactions.Add(new BalanceTransaction
                        {
                            UserID = invoice.UserID,
                            InvoiceID = invoice.InvoiceID,
                            Amount = totalPaid,
                            Direction = BalanceTransactionDirection.Credit,
                            SourceType = BalanceSourceType.Wallet, 
                            Reason = $"Hoàn tiền thanh toán đơn hàng #{invoice.InvoiceCode}",
                            IdempotencyKey = idempotencyKey + "_VNPAID_WALLET",
                            HashSignature = "" 
                        });
                    }
                }
            }
            else if (invoice.PayMethod == null && invoice.AmountToPay > 0 && invoice.Status == OrderStatus.ReturnedRefunded)
            {
                // Đối với đơn hàng COD đã nhận hàng (Completed) và nay được duyệt hoàn trả thành công (ReturnedRefunded)
                bool refundToCoins = invoice.RefundMethod == RefundMethod.LazPeCoins;
                
                if (refundToCoins)
                {
                    invoice.User.CoinsBalance += invoice.AmountToPay;
                    _context.BalanceTransactions.Add(new BalanceTransaction
                    {
                        UserID = invoice.UserID,
                        InvoiceID = invoice.InvoiceID,
                        Amount = invoice.AmountToPay,
                        Direction = BalanceTransactionDirection.Credit,
                        SourceType = BalanceSourceType.Coins,
                        Reason = $"Hoàn xu từ đơn hàng COD #{invoice.InvoiceCode} hoàn trả",
                        IdempotencyKey = idempotencyKey + "_COD_COINS",
                        HashSignature = "" 
                    });
                }
                else
                {
                    invoice.User.WalletBalance += invoice.AmountToPay;
                    _context.BalanceTransactions.Add(new BalanceTransaction
                    {
                        UserID = invoice.UserID,
                        InvoiceID = invoice.InvoiceID,
                        Amount = invoice.AmountToPay,
                        Direction = BalanceTransactionDirection.Credit,
                        SourceType = BalanceSourceType.Wallet, 
                        Reason = $"Hoàn tiền từ đơn hàng COD #{invoice.InvoiceCode} hoàn trả",
                        IdempotencyKey = idempotencyKey + "_COD_WALLET",
                        HashSignature = "" 
                    });
                }
            }

            // BẢO MẬT VÍ: Ký lại số dư sau khi hoàn tiền
            invoice.User.WalletSignature = _walletSecurityService.GenerateSignature(invoice.User.Id, invoice.User.WalletBalance, invoice.User.CoinsBalance);
        }
    }
}
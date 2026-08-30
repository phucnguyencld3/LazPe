using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Identity.UI.Services;

namespace PolyBabyAPI.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SubscriptionService> _logger;
        private readonly INotificationService _notificationService;
        private readonly IEmailSender _emailSender;

        public SubscriptionService(ApplicationDbContext context, ILogger<SubscriptionService> logger, INotificationService notificationService, IEmailSender emailSender)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
            _emailSender = emailSender;
        }

        public async Task<SubscriptionDto> CreateSubscriptionAsync(string userId, CreateSubscriptionDto dto)
        {
            var product = await _context.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.ProductID == dto.ProductID);
            if (product == null || !product.SupportsSubscription)
            {
                throw new ArgumentException("Sản phẩm không hỗ trợ mua định kỳ.");
            }

            var nextBillingDate = CalculateNextBillingDate(dto.StartDate, dto.FrequencyType, dto.FrequencyValue);

            var subscription = new Subscription
            {
                UserID = userId,
                ProductID = dto.ProductID,
                VariantID = dto.VariantID,
                Quantity = dto.Quantity,
                FrequencyType = dto.FrequencyType,
                FrequencyValue = dto.FrequencyValue,
                StartDate = dto.StartDate,
                NextBillingDate = nextBillingDate,
                Status = SubscriptionStatus.Active,
                ShippingAddressId = dto.ShippingAddressId,
                SubscribedPrice = dto.SubscribedPrice,
                CreatedAt = DateTime.Now
            };

            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            // Send notification to user about the successful subscription
            try
            {
                string variantName = "Mặc định";
                if (dto.VariantID.HasValue)
                {
                    var variant = await _context.Variants.FirstOrDefaultAsync(v => v.VariantID == dto.VariantID.Value);
                    if (variant != null) variantName = variant.VariantName;
                }

                await _notificationService.SendRichSystemNotificationAsync(
                    userId, 
                    "Đăng ký Mua Định Kỳ Thành Công", 
                    $"Bạn đã đăng ký mua định kỳ sản phẩm {product.ProductName} thành công.",
                    $"Bạn đã đăng ký mua định kỳ sản phẩm {product.ProductName} thành công.",
                    "/profile?tab=subscriptions",
                    "CustomUrl"
                );

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user != null && !string.IsNullOrEmpty(user.Email))
                {
                    decimal shippingFee = 30000m;
                    decimal totalAmount = (dto.SubscribedPrice * dto.Quantity) + shippingFee;

                    // Lấy product image (variant image ưu tiên, fallback sang product image)
                    string rawImageUrl = dto.VariantID.HasValue
                        ? (await _context.Variants.FirstOrDefaultAsync(v => v.VariantID == dto.VariantID.Value))?.ImageUrl ?? ""
                        : "";
                    if (string.IsNullOrEmpty(rawImageUrl))
                        rawImageUrl = product.Images?.FirstOrDefault()?.ImageUrl ?? "";
                    string productImageUrl = GetEmailImageUrl(rawImageUrl);

                    string frequencyText = GetFrequencyText(dto.FrequencyType, dto.FrequencyValue);
                    string additionalInfo = $@"<p style=""margin: 0 0 8px 0;"">&#128197; <strong>Ngày bắt đầu:</strong> {dto.StartDate:dd/MM/yyyy}</p>
<p style=""margin: 0 0 8px 0;"">&#128179; <strong>Tổng tiền dự kiến (kèm ship):</strong> <span style=""color: #16a34a; font-weight: 700;"">{totalAmount:N0} &#273;</span></p>
<p style=""margin: 0;"">&#9432; Hệ thống sẽ tự động trừ tiền trong Ví LazPe của bạn vào mỗi kỳ thanh toán. Vui lòng đảm bảo số dư ví luôn đủ.</p>";

                    var config = new SubscriptionEmailConfig(
                        Title: "&#10003; Đăng Ký Mua Định Kỳ Thành Công",
                        PrimaryColor: "#16a34a",
                        BannerBgColor: "#16a34a",
                        CardBgColor: "#f0fdf4",
                        CardBorderColor: "#bbf7d0",
                        Message: $"Bạn đã đăng ký mua định kỳ thành công trên <strong>LazPe</strong>. Đơn hàng sẽ được tự động xử lý theo chu kỳ bạn đã chọn.",
                        AdditionalInfo: additionalInfo
                    );

                    string htmlBody = BuildSubscriptionEmailHtml(
                        userName: user.FullName ?? user.Email,
                        productName: product.ProductName,
                        productImageUrl: productImageUrl,
                        price: dto.SubscribedPrice,
                        quantity: dto.Quantity,
                        frequencyText: frequencyText,
                        config: config
                    );

                    await _emailSender.SendEmailAsync(user.Email, "[LazPe] Đăng Ký Mua Định Kỳ Thành Công", htmlBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi gửi thông báo khi tạo mua định kỳ cho user {UserId}", userId);
            }

            return await GetSubscriptionByIdAsync(userId, subscription.SubscriptionID);
        }

        public async Task<IEnumerable<SubscriptionDto>> GetUserSubscriptionsAsync(string userId)
        {
            return await _context.Subscriptions
                .Where(s => s.UserID == userId)
                .Select(s => new SubscriptionDto
                {
                    SubscriptionID = s.SubscriptionID,
                    UserID = s.UserID,
                    ProductID = s.ProductID,
                    ProductName = s.Product.ProductName,
                    VariantID = s.VariantID,
                    VariantName = s.Variant != null ? s.Variant.VariantName : null,
                    Quantity = s.Quantity,
                    FrequencyType = s.FrequencyType,
                    FrequencyValue = s.FrequencyValue,
                    StartDate = s.StartDate,
                    NextBillingDate = s.NextBillingDate,
                    Status = s.Status,
                    ShippingAddressId = s.ShippingAddressId
                })
                .ToListAsync();
        }

        public async Task<SubscriptionDto> GetSubscriptionByIdAsync(string userId, int subscriptionId)
        {
            var sub = await _context.Subscriptions
                .Include(s => s.Product)
                .Include(s => s.Variant)
                .FirstOrDefaultAsync(s => s.SubscriptionID == subscriptionId && s.UserID == userId);

            if (sub == null) return null;

            return new SubscriptionDto
            {
                SubscriptionID = sub.SubscriptionID,
                UserID = sub.UserID,
                ProductID = sub.ProductID,
                ProductName = sub.Product.ProductName,
                VariantID = sub.VariantID,
                VariantName = sub.Variant?.VariantName,
                Quantity = sub.Quantity,
                FrequencyType = sub.FrequencyType,
                FrequencyValue = sub.FrequencyValue,
                StartDate = sub.StartDate,
                NextBillingDate = sub.NextBillingDate,
                Status = sub.Status,
                ShippingAddressId = sub.ShippingAddressId
            };
        }

        public async Task<bool> PauseSubscriptionAsync(string userId, int subscriptionId)
        {
            var sub = await _context.Subscriptions
                .Include(s => s.User)
                .Include(s => s.Product).ThenInclude(p => p.Images)
                .FirstOrDefaultAsync(s => s.SubscriptionID == subscriptionId && s.UserID == userId);
            if (sub == null || sub.Status != SubscriptionStatus.Active) return false;

            sub.Status = SubscriptionStatus.Paused;
            sub.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            try
            {
                await _notificationService.SendRichSystemNotificationAsync(
                    userId, 
                    "Tạm Dừng Mua Định Kỳ", 
                    $"Gói mua định kỳ sản phẩm {sub.Product.ProductName} đã được tạm dừng thành công.",
                    $"Gói mua định kỳ sản phẩm {sub.Product.ProductName} đã được tạm dừng thành công.",
                    "/profile?tab=subscriptions",
                    "CustomUrl"
                );
                
                if (sub.User != null && !string.IsNullOrEmpty(sub.User.Email))
                {
                    // Lấy product image (variant image ưu tiên, fallback sang product image)
                    string rawImageUrl = sub.VariantID.HasValue && !string.IsNullOrEmpty(sub.Variant?.ImageUrl)
                        ? sub.Variant.ImageUrl
                        : (sub.Product?.Images?.FirstOrDefault()?.ImageUrl ?? "");
                    string productImageUrl = GetEmailImageUrl(rawImageUrl);

                    string frequencyText = GetFrequencyText(sub.FrequencyType, sub.FrequencyValue);
                    string additionalInfo = $@"<p style=""margin: 0 0 8px 0;"">&#128336; <strong>Ngày tạm dừng:</strong> {DateTime.Now:dd/MM/yyyy HH:mm}</p>
<p style=""margin: 0;"">&#9432; Trong thời gian tạm dừng, hệ thống sẽ không tự động giao hàng và trừ tiền. Bạn có thể kích hoạt lại gói bất kỳ lúc nào trên ứng dụng LazPe.</p>";

                    var config = new SubscriptionEmailConfig(
                        Title: "&#9208; Mua Định Kỳ Đã Tạm Dừng",
                        PrimaryColor: "#d97706",
                        BannerBgColor: "#d97706",
                        CardBgColor: "#fffbeb",
                        CardBorderColor: "#fde68a",
                        Message: "Gói mua định kỳ của bạn đã được <strong>tạm dừng</strong> thành công theo yêu cầu.",
                        AdditionalInfo: additionalInfo
                    );

                    string htmlBody = BuildSubscriptionEmailHtml(
                        userName: sub.User.FullName ?? sub.User.Email,
                        productName: sub.Product.ProductName,
                        productImageUrl: productImageUrl,
                        price: sub.SubscribedPrice,
                        quantity: sub.Quantity,
                        frequencyText: frequencyText,
                        config: config
                    );

                    await _emailSender.SendEmailAsync(sub.User.Email, "[LazPe] Tạm Dừng Mua Định Kỳ", htmlBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi gửi thông báo khi tạm dừng mua định kỳ cho user {UserId}", userId);
            }

            return true;
        }

        public async Task<bool> ResumeSubscriptionAsync(string userId, int subscriptionId)
        {
            var sub = await _context.Subscriptions.FirstOrDefaultAsync(s => s.SubscriptionID == subscriptionId && s.UserID == userId);
            if (sub == null || sub.Status != SubscriptionStatus.Paused) return false;

            sub.Status = SubscriptionStatus.Active;
            sub.UpdatedAt = DateTime.Now;
            
            // Recalculate next billing date if it's in the past
            if (sub.NextBillingDate <= DateTime.Now)
            {
                 sub.NextBillingDate = CalculateNextBillingDate(DateTime.Now, sub.FrequencyType, sub.FrequencyValue);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CancelSubscriptionAsync(string userId, int subscriptionId)
        {
            var sub = await _context.Subscriptions
                .Include(s => s.User)
                .Include(s => s.Product).ThenInclude(p => p.Images)
                .FirstOrDefaultAsync(s => s.SubscriptionID == subscriptionId && s.UserID == userId);
            if (sub == null) return false;

            sub.Status = SubscriptionStatus.Cancelled;
            sub.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            try
            {
                await _notificationService.SendRichSystemNotificationAsync(
                    userId, 
                    "Hủy Mua Định Kỳ", 
                    $"Gói mua định kỳ sản phẩm {sub.Product.ProductName} đã bị hủy.",
                    $"Gói mua định kỳ sản phẩm {sub.Product.ProductName} đã bị hủy.",
                    "/profile?tab=subscriptions",
                    "CustomUrl"
                );
                
                if (sub.User != null && !string.IsNullOrEmpty(sub.User.Email))
                {
                    // Lấy product image (variant image ưu tiên, fallback sang product image)
                    string rawImageUrl = sub.VariantID.HasValue && !string.IsNullOrEmpty(sub.Variant?.ImageUrl)
                        ? sub.Variant.ImageUrl
                        : (sub.Product?.Images?.FirstOrDefault()?.ImageUrl ?? "");
                    string productImageUrl = GetEmailImageUrl(rawImageUrl);

                    string frequencyText = GetFrequencyText(sub.FrequencyType, sub.FrequencyValue);
                    string additionalInfo = $@"<p style=""margin: 0 0 8px 0;"">&#128336; <strong>Ngày hủy:</strong> {DateTime.Now:dd/MM/yyyy HH:mm}</p>
<p style=""margin: 0;"">&#9432; Nếu bạn thay đổi ý định, bạn luôn có thể tạo lại gói mua định kỳ mới trên ứng dụng LazPe với nhiều ưu đãi hấp dẫn.</p>";

                    var config = new SubscriptionEmailConfig(
                        Title: "&#10005; Mua Định Kỳ Đã Hủy",
                        PrimaryColor: "#dc2626",
                        BannerBgColor: "#dc2626",
                        CardBgColor: "#fef2f2",
                        CardBorderColor: "#fecaca",
                        Message: "Gói mua định kỳ của bạn đã được <strong>hủy</strong> thành công.",
                        AdditionalInfo: additionalInfo
                    );

                    string htmlBody = BuildSubscriptionEmailHtml(
                        userName: sub.User.FullName ?? sub.User.Email,
                        productName: sub.Product.ProductName,
                        productImageUrl: productImageUrl,
                        price: sub.SubscribedPrice,
                        quantity: sub.Quantity,
                        frequencyText: frequencyText,
                        config: config
                    );

                    await _emailSender.SendEmailAsync(sub.User.Email, "[LazPe] Hủy Mua Định Kỳ", htmlBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi gửi thông báo khi hủy mua định kỳ cho user {UserId}", userId);
            }

            return true;
        }

        public async Task ExecuteDueSubscriptionsAsync()
        {
            var dueSubscriptions = await _context.Subscriptions
                .Include(s => s.User)
                .Include(s => s.Product).ThenInclude(p => p.Images)
                .Include(s => s.Variant)
                .Where(s => s.Status == SubscriptionStatus.Active /* && s.NextBillingDate <= DateTime.Now */)
                .ToListAsync();

            foreach (var sub in dueSubscriptions)
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // 1. Check stock
                    int currentStock = sub.VariantID.HasValue ? sub.Variant!.Stock : sub.Product.Stock;
                    if (currentStock < sub.Quantity)
                    {
                        await RecordHistory(sub.SubscriptionID, null, 0, 0, SubscriptionPaymentStatus.Failed_OutOfStock, "Sản phẩm tạm hết hàng.");
                        // Không hủy subscription, có thể thử lại vào ngày mai hoặc giữ nguyên NextBillingDate để cron tiếp tục thử.
                        continue;
                    }

                    // 2. Check price
                    decimal unitPrice = sub.VariantID.HasValue ? sub.Variant!.UnitPrice : sub.Product.Price;
                    
                    // Check if price changed > 20%
                    if (sub.SubscribedPrice > 0)
                    {
                        decimal priceChangePercent = Math.Abs(unitPrice - sub.SubscribedPrice) / sub.SubscribedPrice * 100;
                        if (priceChangePercent > 20)
                        {
                            sub.Status = SubscriptionStatus.Paused;
                            sub.UpdatedAt = DateTime.Now;
                            await RecordHistory(sub.SubscriptionID, null, 0, 0, SubscriptionPaymentStatus.Failed_Error, $"Giá sản phẩm biến động > 20% ({priceChangePercent:F2}%). Đã tạm dừng gói mua định kỳ.");
                            await _notificationService.SendSystemNotificationAsync(sub.UserID, "Tạm dừng Mua Định Kỳ", $"Gói mua định kỳ sản phẩm {sub.Product.ProductName} đã bị tạm dừng do giá thay đổi lớn hơn 20%. Vui lòng xác nhận lại.");
                            continue;
                        }
                    }
                    
                    // Apply 5% discount
                    decimal priceAfterDiscount = unitPrice * 0.95m;
                    decimal subTotal = priceAfterDiscount * sub.Quantity;
                    decimal shippingFee = 30000; // Fixed shipping fee
                    decimal totalAmount = subTotal + shippingFee;

                    // 3. Deduct Wallet / Coin
                    var user = sub.User;
                    decimal walletUsed = 0;
                    decimal coinUsed = 0;
                    
                    if (user.WalletBalance >= totalAmount)
                    {
                        user.WalletBalance -= totalAmount;
                        walletUsed = totalAmount;
                    }
                    else if (user.WalletBalance + user.CoinsBalance >= totalAmount)
                    {
                        walletUsed = user.WalletBalance;
                        user.WalletBalance = 0;
                        coinUsed = totalAmount - walletUsed;
                        user.CoinsBalance -= coinUsed;
                    }
                    else
                    {
                        await RecordHistory(sub.SubscriptionID, null, 0, 0, SubscriptionPaymentStatus.Failed_NoBalance, "Số dư ví LazPe không đủ.");
                        
                        // Send notification about insufficient balance
                        await _notificationService.SendSystemNotificationAsync(sub.UserID, "Auto-Replenishment Failed", "Số dư ví LazPe không đủ để thanh toán đơn hàng định kỳ. Vui lòng nạp thêm tiền.");
                        continue;
                    }

                    // 4. Create Invoice
                    var random = new Random();
                    string digits = random.Next(100000, 999999).ToString();
                    string dateStr = DateTime.Now.ToString("ddMM");
                    
                    string invoiceCode = $"AT{dateStr}{digits}"; // AT for Auto
                    string trackingCode = $"LZP{dateStr}{digits}";
                    
                    var invoice = new Invoice
                    {
                        UserID = sub.UserID,
                        InvoiceCode = invoiceCode,
                        TrackingCode = trackingCode,
                        SubTotal = unitPrice * sub.Quantity,
                        DiscountAmount = (unitPrice - priceAfterDiscount) * sub.Quantity,
                        WalletDiscountAmount = walletUsed,
                        CoinsDiscountAmount = coinUsed,
                        AmountToPay = 0, // Fully paid by wallet/coins
                        TotalPrice = totalAmount,
                        ShippingFee = shippingFee,
                        Status = OrderStatus.Confirmed, // Tự động xác nhận
                        CreatedAt = DateTime.Now,
                        PayMethod = PayMethod.SystemWallet
                    };

                    // Add address info (assuming we fetch it from UserAddress based on ShippingAddressId)
                    var address = await _context.UserAddresses
                        .Include(a => a.Province)
                        .Include(a => a.District)
                        .Include(a => a.Ward)
                        .FirstOrDefaultAsync(a => a.AddressID == sub.ShippingAddressId);

                    if (address != null)
                    {
                        invoice.ShippingAddress = address.StreetAddress;
                        invoice.ShippingProvince = address.Province?.Name;
                        invoice.ShippingDistrict = address.District?.Name;
                        invoice.ShippingWard = address.Ward?.Name;
                        invoice.ShippingRecipientName = address.RecipientName;
                        invoice.ShippingPhone = address.PhoneNumber;
                    }

                    _context.Invoices.Add(invoice);
                    await _context.SaveChangesAsync();

                    // Invoice Detail
                    var invoiceDetail = new InvoiceDetail
                    {
                        InvoiceID = invoice.InvoiceID,
                        VariantID = sub.VariantID,
                        Quantity = sub.Quantity,
                        UnitPrice = unitPrice
                    };
                    _context.InvoiceDetails.Add(invoiceDetail);
                    
                    // Deduct stock
                    if (sub.VariantID.HasValue)
                        sub.Variant.Stock -= sub.Quantity;
                    else
                        sub.Product.Stock -= sub.Quantity;

                    // Update subscription
                    sub.CompletedOccurrences++;
                    sub.NextBillingDate = CalculateNextBillingDate(sub.NextBillingDate, sub.FrequencyType, sub.FrequencyValue);
                    
                    await RecordHistory(sub.SubscriptionID, invoice.InvoiceID, walletUsed, coinUsed, SubscriptionPaymentStatus.Success, "Thanh toán thành công");
                    
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Notify success
                    string imageUrl = sub.VariantID.HasValue && !string.IsNullOrEmpty(sub.Variant?.ImageUrl) 
                        ? sub.Variant.ImageUrl 
                        : (sub.Product?.Images?.FirstOrDefault()?.ImageUrl ?? "");
                    string productName = sub.Product?.ProductName ?? "Sản phẩm";
                    string variantName = sub.VariantID.HasValue ? (sub.Variant?.VariantName ?? "") : "";
                    string htmlContent = $@"<div class=""space-y-4"">
    <p>Đơn hàng <strong>{invoice.InvoiceCode}</strong> đã được thanh toán và tạo thành công từ gói mua định kỳ của bạn.</p>
    <div class=""p-4 bg-slate-50 rounded-lg border border-slate-100 flex gap-4"">
        <img src=""{imageUrl}"" alt=""Product"" class=""w-16 h-16 object-cover rounded-md border border-slate-200 flex-shrink-0"" />
        <div>
            <h4 class=""font-bold text-slate-800 text-sm mb-1"">{productName}</h4>
            <p class=""text-xs text-slate-500 mb-1"">{variantName}</p>
            <p class=""text-xs font-bold text-rose-500"">{unitPrice:N0}đ <span class=""text-slate-400 font-normal ml-2"">x {sub.Quantity}</span></p>
        </div>
    </div>
</div>";
                    await _notificationService.SendRichSystemNotificationAsync(
                        sub.UserID, 
                        "Đơn hàng định kỳ được tạo", 
                        $"Đơn hàng {invoice.InvoiceCode} đã được thanh toán và tạo thành công.",
                        htmlContent,
                        "/profile?tab=orders",
                        "CustomUrl"
                    );

                    if (user != null && !string.IsNullOrEmpty(user.Email))
                    {
                        // Lấy product image (variant image ưu tiên, fallback sang product image)
                        string rawImageUrl = sub.VariantID.HasValue && !string.IsNullOrEmpty(sub.Variant?.ImageUrl)
                            ? sub.Variant.ImageUrl
                            : (sub.Product?.Images?.FirstOrDefault()?.ImageUrl ?? "");
                        string productImageUrl = GetEmailImageUrl(rawImageUrl);

                        string frequencyText = GetFrequencyText(sub.FrequencyType, sub.FrequencyValue);
                        string additionalInfo = $@"<p style=""margin: 0 0 8px 0;"">&#128179; <strong>Mã đơn hàng:</strong> {System.Net.WebUtility.HtmlEncode(invoice.InvoiceCode)}</p>
<p style=""margin: 0 0 8px 0;"">&#128179; <strong>Tổng tiền đã thanh toán:</strong> <span style=""color: #16a34a; font-weight: 700;"">{totalAmount:N0} &#273;</span></p>
<p style=""margin: 0 0 8px 0;"">&#128336; <strong>Ngày thanh toán:</strong> {DateTime.Now:dd/MM/yyyy HH:mm}</p>
<p style=""margin: 0;"">&#128666; Hệ thống đang tiến hành đóng gói và giao hàng đến bạn.</p>";

                        var config = new SubscriptionEmailConfig(
                            Title: "&#10003; Thanh Toán Định Kỳ Thành Công",
                            PrimaryColor: "#16a34a",
                            BannerBgColor: "#16a34a",
                            CardBgColor: "#f0fdf4",
                            CardBorderColor: "#bbf7d0",
                            Message: $"Đơn hàng định kỳ của bạn đã được thanh toán và tạo thành công từ gói mua định kỳ.",
                            AdditionalInfo: additionalInfo
                        );

                        string htmlBody = BuildSubscriptionEmailHtml(
                            userName: user.FullName ?? user.Email,
                            productName: sub.Product.ProductName,
                            productImageUrl: productImageUrl,
                            price: unitPrice,
                            quantity: sub.Quantity,
                            frequencyText: frequencyText,
                            config: config
                        );

                        await _emailSender.SendEmailAsync(user.Email, $"[LazPe] Thanh Toán Định Kỳ Thành Công - {invoice.InvoiceCode}", htmlBody);
                    }
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, $"Lỗi khi xử lý subscription {sub.SubscriptionID}");
                }
            }
        }

        private DateTime CalculateNextBillingDate(DateTime current, FrequencyType type, int value)
        {
            return type switch
            {
                FrequencyType.Days => current.AddDays(value),
                FrequencyType.Weeks => current.AddDays(value * 7),
                FrequencyType.Months => current.AddMonths(value),
                _ => current.AddDays(value)
            };
        }

        private async Task RecordHistory(int subscriptionId, int? invoiceId, decimal walletUsed, decimal coinUsed, SubscriptionPaymentStatus status, string message)
        {
            var history = new SubscriptionPaymentHistory
            {
                SubscriptionID = subscriptionId,
                InvoiceID = invoiceId,
                Amount = walletUsed + coinUsed,
                WalletUsed = walletUsed,
                CoinUsed = coinUsed,
                PaymentStatus = status,
                Message = message,
                PaymentDate = DateTime.Now
            };
            _context.SubscriptionPaymentHistories.Add(history);
            await _context.SaveChangesAsync();
        }

        // ─── Email Helpers ───────────────────────────────────────────────────────────

        /// <summary>
        /// Configuration record for subscription status email styling.
        /// </summary>
        private sealed record SubscriptionEmailConfig(
            string Title,
            string PrimaryColor,
            string BannerBgColor,
            string CardBgColor,
            string CardBorderColor,
            string Message,
            string AdditionalInfo
        );

        /// <summary>
        /// Returns a Cloudinary URL optimised for email (200×200, fill, auto quality/format).
        /// If the URL is not a Cloudinary URL or is empty, returns the original value unchanged.
        /// </summary>
        private static string GetEmailImageUrl(string imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return string.Empty;

            // Only transform genuine Cloudinary delivery URLs
            const string marker = "/image/upload/";
            int markerIndex = imageUrl.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (markerIndex < 0 || !imageUrl.Contains("res.cloudinary.com", StringComparison.OrdinalIgnoreCase))
                return imageUrl;

            // Insert transformation segment right after /image/upload/
            const string transform = "w_200,h_200,c_fill,q_auto,f_auto/";
            int insertAt = markerIndex + marker.Length;

            // Avoid double-injecting if already transformed
            if (imageUrl.Length > insertAt && imageUrl[insertAt..].StartsWith("w_", StringComparison.OrdinalIgnoreCase))
                return imageUrl;

            return imageUrl[..insertAt] + transform + imageUrl[insertAt..];
        }

        /// <summary>
        /// Returns a human-readable frequency string for display in emails.
        /// </summary>
        private static string GetFrequencyText(FrequencyType type, int value)
        {
            return type switch
            {
                FrequencyType.Days   => $"Mỗi {value} ngày",
                FrequencyType.Weeks  => $"Mỗi {value} tuần",
                FrequencyType.Months => $"Mỗi {value} tháng",
                _                    => $"Mỗi {value} ngày"
            };
        }

        /// <summary>
        /// Builds the shared HTML body for subscription-related emails.
        /// All dynamic string values are HTML-encoded to prevent injection.
        /// </summary>
        private static string BuildSubscriptionEmailHtml(
            string userName,
            string productName,
            string productImageUrl,
            decimal price,
            int quantity,
            string frequencyText,
            SubscriptionEmailConfig config)
        {
            // HTML-encode dynamic content
            string safeUserName    = System.Net.WebUtility.HtmlEncode(userName ?? "Quý khách");
            string safeProductName = System.Net.WebUtility.HtmlEncode(productName ?? "Sản phẩm");
            string safeFrequency   = System.Net.WebUtility.HtmlEncode(frequencyText ?? "");

            // Build product image cell
            string imageCell;
            if (!string.IsNullOrWhiteSpace(productImageUrl))
            {
                imageCell =
                    "<td style=\"width:110px;vertical-align:top;padding-right:16px;\">" +
                    "<img src=\"" + productImageUrl + "\" alt=\"" + safeProductName + "\"" +
                    " width=\"110\" height=\"110\"" +
                    " style=\"display:block;width:110px;height:110px;object-fit:cover;" +
                    "border-radius:8px;border:1px solid " + config.CardBorderColor + ";\" />" +
                    "</td>";
            }
            else
            {
                imageCell =
                    "<td style=\"width:110px;vertical-align:top;padding-right:16px;\">" +
                    "<div style=\"width:110px;height:110px;background-color:#f3f4f6;" +
                    "border-radius:8px;border:1px solid #e5e7eb;display:table;text-align:center;\">" +
                    "<span style=\"display:table-cell;vertical-align:middle;font-size:12px;color:#9ca3af;\">&#7842;nh SP</span>" +
                    "</div></td>";
            }

            var sb = new System.Text.StringBuilder();
            sb.Append("<!DOCTYPE html><html lang=\"vi\"><head>");
            sb.Append("<meta charset=\"UTF-8\" />");
            sb.Append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />");
            sb.Append("<title>" + config.Title + "</title></head>");
            sb.Append("<body style=\"margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;\">");

            // Outer wrapper
            sb.Append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#f3f4f6;padding:24px 0;\">");
            sb.Append("<tr><td align=\"center\">");

            // Card
            sb.Append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"600\" style=\"max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);\">");

            // Status banner
            sb.Append("<tr><td style=\"background-color:" + config.BannerBgColor + ";padding:28px 32px;text-align:center;\">");
            sb.Append("<p style=\"margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;\">" + config.Title + "</p>");
            sb.Append("</td></tr>");

            // Body
            sb.Append("<tr><td style=\"padding:28px 32px;color:#374151;\">");

            // Greeting
            sb.Append("<p style=\"margin:0 0 16px 0;font-size:15px;line-height:1.6;\">Ch&#224;o b&#7841;n <strong>" + safeUserName + "</strong>,</p>");
            sb.Append("<p style=\"margin:0 0 24px 0;font-size:15px;line-height:1.6;\">" + config.Message + "</p>");

            // Product card table
            sb.Append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"background-color:" + config.CardBgColor + ";border:1px solid " + config.CardBorderColor + ";border-radius:10px;margin-bottom:24px;\">");
            sb.Append("<tr><td style=\"padding:16px;\">");
            sb.Append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\"><tr>");
            sb.Append(imageCell);
            sb.Append("<td style=\"vertical-align:top;\">");
            sb.Append("<p style=\"margin:0 0 8px 0;font-size:15px;font-weight:700;color:#111827;line-height:1.4;\">" + safeProductName + "</p>");
            sb.Append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">");
            sb.Append("<tr>");
            sb.Append("<td style=\"padding:2px 0;font-size:13px;color:#6b7280;white-space:nowrap;\">S&#7889; l&#432;&#7907;ng:&nbsp;</td>");
            sb.Append("<td style=\"padding:2px 0;font-size:13px;color:#111827;font-weight:600;\">" + quantity + "</td>");
            sb.Append("</tr><tr>");
            sb.Append("<td style=\"padding:2px 0;font-size:13px;color:#6b7280;white-space:nowrap;\">&#272;&#417;n gi&#225;:&nbsp;</td>");
            sb.Append("<td style=\"padding:2px 0;font-size:14px;color:" + config.PrimaryColor + ";font-weight:700;\">" + price.ToString("N0") + "&nbsp;&#273;</td>");
            sb.Append("</tr><tr>");
            sb.Append("<td style=\"padding:2px 0;font-size:13px;color:#6b7280;white-space:nowrap;\">Chu k&#7923;:&nbsp;</td>");
            sb.Append("<td style=\"padding:2px 0;font-size:13px;color:#111827;font-weight:600;\">" + safeFrequency + "</td>");
            sb.Append("</tr>");
            sb.Append("</table>");
            sb.Append("</td>");
            sb.Append("</tr></table>");
            sb.Append("</td></tr></table>");

            // Additional info
            sb.Append("<div style=\"background-color:#f9fafb;border-left:3px solid " + config.PrimaryColor + ";border-radius:4px;padding:14px 16px;margin-bottom:24px;font-size:13px;line-height:1.7;color:#374151;\">");
            sb.Append(config.AdditionalInfo);
            sb.Append("</div>");

            // Sign-off
            sb.Append("<p style=\"margin:0;font-size:14px;line-height:1.6;color:#6b7280;\">C&#7843;m &#417;n b&#7841;n &#273;&#227; &#273;&#7891;ng h&#224;nh c&#249;ng <strong style=\"color:#111827;\">LazPe</strong>!</p>");

            sb.Append("</td></tr>"); // close Body

            // Footer
            sb.Append("<tr><td style=\"background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;\">");
            sb.Append("<img src=\"https://raw.githubusercontent.com/phucnguyencld3/LazPe/main/frontend/public/logo/logo_1.png\" alt=\"LazPe Logo\" width=\"80\" height=\"32\" style=\"display:inline-block;height:32px;width:auto;margin-bottom:8px;\" />");
            sb.Append("<p style=\"margin:0;font-size:11px;color:#9ca3af;\">&#272;&#226;y l&#224; email t&#7921; &#273;&#7897;ng, vui l&#242;ng kh&#244;ng tr&#7843; l&#7901;i.<br />&copy; " + DateTime.Now.Year + " LazPe. All rights reserved.</p>");
            sb.Append("</td></tr>");

            sb.Append("</table>"); // close Card
            sb.Append("</td></tr></table>"); // close Wrapper
            sb.Append("</body></html>");

            return sb.ToString();
        }
    }
}

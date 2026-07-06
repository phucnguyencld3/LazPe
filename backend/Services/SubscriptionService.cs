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

namespace PolyBabyAPI.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SubscriptionService> _logger;
        private readonly INotificationService _notificationService;

        public SubscriptionService(ApplicationDbContext context, ILogger<SubscriptionService> logger, INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task<SubscriptionDto> CreateSubscriptionAsync(string userId, CreateSubscriptionDto dto)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductID == dto.ProductID);
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
            var sub = await _context.Subscriptions.FirstOrDefaultAsync(s => s.SubscriptionID == subscriptionId && s.UserID == userId);
            if (sub == null || sub.Status != SubscriptionStatus.Active) return false;

            sub.Status = SubscriptionStatus.Paused;
            sub.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
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
            var sub = await _context.Subscriptions.FirstOrDefaultAsync(s => s.SubscriptionID == subscriptionId && s.UserID == userId);
            if (sub == null) return false;

            sub.Status = SubscriptionStatus.Cancelled;
            sub.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task ExecuteDueSubscriptionsAsync()
        {
            var dueSubscriptions = await _context.Subscriptions
                .Include(s => s.User)
                .Include(s => s.Product)
                .Include(s => s.Variant)
                .Where(s => s.Status == SubscriptionStatus.Active && s.NextBillingDate <= DateTime.Now)
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
                    var invoice = new Invoice
                    {
                        UserID = sub.UserID,
                        InvoiceCode = "AUTO" + DateTime.Now.ToString("yyyyMMddHHmmssfff"),
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
                    await _notificationService.SendSystemNotificationAsync(sub.UserID, "Đơn hàng định kỳ được tạo", $"Đơn hàng {invoice.InvoiceCode} đã được thanh toán và tạo thành công.");
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
    }
}

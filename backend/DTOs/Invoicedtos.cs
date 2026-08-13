using PolyBabyAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class InvoiceDtos
    {
        /// <summary>
        /// Dùng cho request-cancel và admin-cancel
        /// </summary>
        public class CancelRequestDto
        {
            [MaxLength(500, ErrorMessage = "Lý do hủy tối đa 500 ký tự")]
            public string? Reason { get; set; }
        }

        /// <summary>
        /// Dùng cho create-from-cart (chọn item cụ thể và các ví/điểm)
        /// </summary>
        public class CheckoutRequestDto
        {
            public List<int>? SelectedCartDetailIds { get; set; }

            public bool UsePoints { get; set; }
            public int PointsToUse { get; set; }

            public bool UseCoins { get; set; }
            public decimal CoinsToUse { get; set; }

            public bool UseWallet { get; set; }
            public decimal WalletToUse { get; set; }

            public string? PaymentPin { get; set; }

            public string? AffiliateCode { get; set; }
        }

        /// <summary>
        /// Dùng cho update invoice (Admin)
        /// </summary>
        public class UpdateInvoiceRequest
        {
            public PayMethod? PayMethod { get; set; }
            public string? ShippingAddress { get; set; }
            public decimal ShippingFee { get; set; }
            public string? Note { get; set; }
            public OrderStatus? Status { get; set; }
        }

        /// <summary>
        /// Response danh sách hóa đơn
        /// </summary>
        public class InvoiceListResponse
        {
            public int InvoiceID { get; set; }
            public string? InvoiceCode { get; set; }
            public string? TrackingCode { get; set; }
            public string? UserID { get; set; }
            public string? UserName { get; set; }
            public string? UserFullName { get; set; }
            public string? UserEmail { get; set; }
            public string? UserPhone { get; set; }
            public decimal SubTotal { get; set; }
            public decimal DiscountAmount { get; set; }
            public decimal TotalPrice { get; set; }
            public decimal ShippingFee { get; set; }
            public string? ShippingAddress { get; set; }
            public string? PayMethod { get; set; }
            public string? Status { get; set; }
            public int StatusCode { get; set; }
            public DateTime? CreatedAt { get; set; }
            public bool HasVoucher { get; set; }
            public string? VoucherCode { get; set; }
            public string? VoucherName { get; set; }
            public int ItemCount { get; set; }
            public string? PrintTicketUrl { get; set; }
        }

        /// <summary>
        /// Response tra cứu đơn hàng công khai (Không bao gồm thông tin cá nhân khách hàng)
        /// </summary>
        public class PublicTrackingResponse
        {
            public int InvoiceID { get; set; }
            public string? InvoiceCode { get; set; }
            public string? TrackingCode { get; set; }
            public string? Status { get; set; }
            public int StatusCode { get; set; }
            public decimal TotalPrice { get; set; }
            public DateTime? CreatedAt { get; set; }
            public List<PublicTrackingItemDto> Items { get; set; } = new List<PublicTrackingItemDto>();
        }

        public class PublicTrackingItemDto
        {
            public string ProductName { get; set; } = string.Empty;
            public string? VariantName { get; set; }
            public int Quantity { get; set; }
            public decimal Price { get; set; }
            public string? ImageUrl { get; set; }
        }

        /// <summary>
        /// DTO cho Dashboard Chi tiêu Cá nhân
        /// </summary>
        public class UserSpendingDashboardDto
        {
            public decimal TotalSpent { get; set; }
            public int TotalOrders { get; set; }
            public decimal TotalSaved { get; set; }
            public int AvailablePoints { get; set; }
            public string VipTier { get; set; } = "Thành viên";
            public string VipColor { get; set; } = "#64748b";
            public List<MonthlySpendingDto> MonthlySpending { get; set; } = new List<MonthlySpendingDto>();
            public List<CategorySpendingDto> CategorySpending { get; set; } = new List<CategorySpendingDto>();
            public List<TopProductDto> TopProducts { get; set; } = new List<TopProductDto>();
        }

        public class MonthlySpendingDto
        {
            public int Month { get; set; }
            public int Year { get; set; }
            public decimal Amount { get; set; }
        }

        public class CategorySpendingDto
        {
            public int CategoryID { get; set; }
            public string CategoryName { get; set; } = string.Empty;
            public decimal Amount { get; set; }
            public double Percentage { get; set; }
        }

        public class TopProductDto
        {
            public int ProductID { get; set; }
            public string ProductName { get; set; } = string.Empty;
            public int Quantity { get; set; }
            public decimal TotalPrice { get; set; }
            public string? ImageUrl { get; set; }
        }
    }

    public class ReturnRequestDto
    {
        [Required]
        public string Reason { get; set; } = null!;
        public string? Description { get; set; }
        public string? ImageUrls { get; set; }
        public RefundMethod RefundMethod { get; set; }
    }

    public class ReturnApprovalDto
    {
        public bool IsRefundToCoins { get; set; }
    }

    public class ReturnRejectionDto
    {
        [Required]
        public string RejectReason { get; set; } = null!;
    }

    public class ConfirmReturnReceivedDto
    {
        public bool IsRestockable { get; set; } = true;
    }
}
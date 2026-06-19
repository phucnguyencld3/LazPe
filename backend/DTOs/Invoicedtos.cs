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
        /// Dùng cho create-from-cart (chọn item cụ thể)
        /// </summary>
        public class CreateFromCartRequest
        {
            public List<int>? SelectedCartDetailIds { get; set; }
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
    }
}
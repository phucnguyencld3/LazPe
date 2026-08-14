using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection;

namespace PolyBabyAPI.Models
{
    public enum PayMethod
    {
        [Display(Name = "Thẻ tín dụng")]
        CreditCard = 1,

        [Display(Name = "Thẻ ghi nợ")]
        DebitCard = 2,

        [Display(Name = "Ví điện tử")]
        MobilePayment = 3,

        [Display(Name = "Ví nội bộ / Hệ thống")]
        SystemWallet = 4
    }

    public enum OrderStatus
    {
        [Display(Name = "Chờ xác nhận")]
        Pending = 0,

        [Display(Name = "Đã xác nhận")]
        Confirmed = 1,

        [Display(Name = "Đang giao hàng")]
        Shipped = 2,

        [Display(Name = "Hoàn tất")]
        Completed = 3,

        [Display(Name = "Chờ duyệt hủy")]
        CancelRequested = 4,

        [Display(Name = "Đã hủy")]
        Cancelled = 5,

        [Display(Name = "Yêu cầu trả hàng")]
        ReturnRequested = 6,

        [Display(Name = "Đã trả hàng & hoàn tiền")]
        ReturnedRefunded = 7,

        [Display(Name = "Đã hủy & hoàn tiền")]
        CancelledRefunded = 8,

        [Display(Name = "Đã duyệt trả hàng")]
        ReturnApproved = 9,

        [Display(Name = "Từ chối trả hàng")]
        ReturnRejected = 10
    }

    public enum RefundMethod
    {
        None = 0,
        SystemWallet = 1,
        LazPeCoins = 2
    }

    public class Invoice
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InvoiceID { get; set; }

        [MaxLength(50)]
        public string? InvoiceCode { get; set; }

        [MaxLength(50)]
        public string? TrackingCode { get; set; }

        public string? UserID { get; set; }

        public string? AffiliateUserId { get; set; }

        public int? AffiliateLinkId { get; set; }

        public bool IsAffiliateProcessed { get; set; } = false;

        public int? VoucherID { get; set; }

        public int? ShippingVoucherID { get; set; }

        [ForeignKey(nameof(UserID))]
        [ValidateNever]
        public ApplicationUser User { get; set; }

        // Navigation tới Voucher
        [ForeignKey(nameof(VoucherID))]
        [ValidateNever]
        public virtual Voucher? Voucher { get; set; }

        [ForeignKey(nameof(ShippingVoucherID))]
        [ValidateNever]
        public virtual Voucher? ShippingVoucher { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tạm tính")]
        public decimal SubTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tổng tiền giảm giá")]
        public decimal DiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tiền giảm Voucher")]
        public decimal VoucherDiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tiền giảm Điểm")]
        public decimal PointsDiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tiền giảm Xu")]
        public decimal CoinsDiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tiền giảm Ví")]
        public decimal WalletDiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Cần thanh toán")]
        public decimal AmountToPay { get; set; } = 0;

        public RefundMethod? CancelRefundMethod { get; set; }

        public bool IsRefunded { get; set; } = false;

        public DateTime? RefundedAt { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Chiết khấu hạng thẻ")]
        public decimal TierDiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tiền giảm ship")]
        public decimal ShippingDiscountAmount { get; set; } = 0;


        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue, ErrorMessage = "Tổng tiền không hợp lệ")]
        [Display(Name = "Tổng tiền")]
        public decimal TotalPrice { get; set; }

        public PayMethod? PayMethod { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingFee { get; set; }

        [MaxLength(500, ErrorMessage = "Địa chỉ giao hàng tối đa 500 ký tự")]
        public string? ShippingAddress { get; set; }

        [MaxLength(100)]
        public string? ShippingProvince { get; set; }

        [MaxLength(100)]
        public string? ShippingDistrict { get; set; }

        [MaxLength(100)]
        public string? ShippingWard { get; set; }

        [MaxLength(500)]
        public string? ShippingStreetAddress { get; set; }

        [MaxLength(100, ErrorMessage = "Tên người nhận tối đa 100 ký tự")]
        [Display(Name = "Tên người nhận")]
        public string? ShippingRecipientName { get; set; }

        [MaxLength(15, ErrorMessage = "Số điện thoại người nhận tối đa 15 ký tự")]
        [Display(Name = "Số điện thoại nhận hàng")]
        public string? ShippingPhone { get; set; }

        [Display(Name = "Trạng thái đơn hàng")]
        [Required(ErrorMessage = "Trạng thái đơn hàng không được để trống")]
        [EnumDataType(typeof(OrderStatus), ErrorMessage = "Trạng thái không hợp lệ")]
        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        [Display(Name = "Đã xóa mềm")]
        public bool IsDeleted { get; set; } = false;

        [MaxLength(500, ErrorMessage = "Lý do hủy tối đa 500 ký tự")]
        public string? CancelReason { get; set; }

        [Display(Name = "Ngày tạo")]
        public DateTime? CreatedAt { get; set; } = DateTime.Now;

        [Display(Name = "Ngày xác nhận")]
        public DateTime? ConfirmedAt { get; set; }

        [Display(Name = "Ngày giao hàng")]
        public DateTime? ShippedAt { get; set; }

        [Display(Name = "Ngày hoàn tất")]
        public DateTime? CompletedAt { get; set; }

        [Display(Name = "Ngày hủy")]
        public DateTime? CancelledAt { get; set; }

        [MaxLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
        public string? Note { get; set; }

        public string? PrintTicketUrl { get; set; }

        [ValidateNever]
        public string? ReturnReason { get; set; }

        [MaxLength(1000)]
        public string? ReturnDescription { get; set; }
        
        public string? ReturnImageUrls { get; set; }
        public RefundMethod? RefundMethod { get; set; }
        public bool IsReturnReceived { get; set; }

        public ICollection<InvoiceDetail> InvoiceDetails { get; set; } = new List<InvoiceDetail>();

        // Lịch sử sử dụng voucher - để check ai dùng voucher nào, khi nào
        public virtual ICollection<VoucherUsage> VoucherUsages { get; set; } = new List<VoucherUsage>();
        public virtual ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();

    }

    public static class EnumExtensions
    {
        public static string GetDisplayName(this Enum enumValue)
        {
            var memberInfo = enumValue.GetType().GetMember(enumValue.ToString()).FirstOrDefault();
            if (memberInfo != null)
            {
                var displayAttribute = memberInfo.GetCustomAttribute<DisplayAttribute>();
                if (displayAttribute != null)
                    return displayAttribute.Name ?? enumValue.ToString();
            }
            return enumValue.ToString();
        }
    }
}
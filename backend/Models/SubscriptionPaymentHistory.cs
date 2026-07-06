using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public enum SubscriptionPaymentStatus
    {
        [Display(Name = "Thành công")]
        Success = 1,
        
        [Display(Name = "Thất bại (Số dư không đủ)")]
        Failed_NoBalance = 2,
        
        [Display(Name = "Thất bại (Hết hàng)")]
        Failed_OutOfStock = 3,
        
        [Display(Name = "Thất bại (Lỗi hệ thống)")]
        Failed_Error = 4
    }

    public class SubscriptionPaymentHistory
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int HistoryID { get; set; }

        [Required]
        public int SubscriptionID { get; set; }

        [ForeignKey(nameof(SubscriptionID))]
        [ValidateNever]
        public virtual Subscription Subscription { get; set; }

        public int? InvoiceID { get; set; }

        [ForeignKey(nameof(InvoiceID))]
        [ValidateNever]
        public virtual Invoice? Invoice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal WalletUsed { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CoinUsed { get; set; }

        [Required]
        public SubscriptionPaymentStatus PaymentStatus { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; } = DateTime.Now;

        public string? Message { get; set; }
    }
}

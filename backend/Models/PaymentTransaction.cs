using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public enum PaymentTransactionStatus
    {
        Pending = 0,
        Success = 1,
        Failed = 2
    }

    public class PaymentTransaction
    {
        [Key]
        public int PaymentTransactionId { get; set; }

        public int InvoiceID { get; set; }

        [MaxLength(50)]
        public string TxnRef { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? VnPayTransactionNo { get; set; }

        [MaxLength(10)]
        public string? ResponseCode { get; set; }

        public PaymentTransactionStatus Status { get; set; } = PaymentTransactionStatus.Pending;

        [MaxLength(2000)]
        public string? RawQuery { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? PaidAt { get; set; }

        [ForeignKey(nameof(InvoiceID))]
        [ValidateNever]
        public Invoice? Invoice { get; set; }
        // Thêm dưới VoucherUsages
    }
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public enum BalanceSourceType
    {
        Wallet = 1,
        Coins = 2,
        LoyaltyPoints = 3,
        VnPayRefund = 4,
        WithdrawRequest = 5
    }

    public enum BalanceTransactionDirection
    {
        Debit = 1, // Trừ tiền
        Credit = 2 // Cộng tiền
    }

    public class BalanceTransaction
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserID { get; set; } = string.Empty;

        public int? InvoiceID { get; set; }

        public BalanceSourceType SourceType { get; set; }

        public BalanceTransactionDirection Direction { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [MaxLength(255)]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(200)]
        public string IdempotencyKey { get; set; } = string.Empty;

        [MaxLength(256)]
        public string HashSignature { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("UserID")]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey("InvoiceID")]
        public virtual Invoice? Invoice { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class CreateWithdrawRequestDto
    {
        [Required]
        [Range(10000, 100000000, ErrorMessage = "Số tiền rút phải từ 10.000đ đến 100.000.000đ")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập tên ngân hàng")]
        [MaxLength(100)]
        public string BankName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập số tài khoản")]
        [MaxLength(50)]
        public string BankAccount { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập tên chủ tài khoản")]
        [MaxLength(100)]
        public string BankOwnerName { get; set; } = string.Empty;
    }

    public class ProcessWithdrawRequestDto
    {
        [Required]
        public bool IsApproved { get; set; }
        
        [MaxLength(500)]
        public string? AdminNote { get; set; }
    }
}

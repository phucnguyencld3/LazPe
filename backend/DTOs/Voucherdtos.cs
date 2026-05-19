using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.DTOs
{
    public class Voucherdtos
    {
        public class CreateVoucherRequest
        {
            [Required(ErrorMessage = "Mã voucher là bắt buộc")]
            [StringLength(50)]
            public string Code { get; set; }

            [Required(ErrorMessage = "Tên voucher là bắt buộc")]
            [StringLength(200)]
            public string Name { get; set; }

            [Required(ErrorMessage = "Loại giảm giá là bắt buộc")]
            public int DiscountType { get; set; } // 1: %, 2: tiền cố định

            [Required(ErrorMessage = "Giá trị giảm giá là bắt buộc")]
            [Column(TypeName = "decimal(18,2)")]
            public decimal DiscountValue { get; set; }

            [Column(TypeName = "decimal(18,2)")]
            public decimal MinOrderValue { get; set; }

            [Column(TypeName = "decimal(18,2)")]
            public decimal MaxDiscount { get; set; }

            [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc")]
            public DateTime StartDate { get; set; }

            [Required(ErrorMessage = "Ngày kết thúc là bắt buộc")]
            public DateTime EndDate { get; set; }

            [Required(ErrorMessage = "Tổng số lượng là bắt buộc")]
            public int TotalQuantity { get; set; }

            public bool Status { get; set; } = true; // Mặc định là kích hoạt

            public int VisibilityType { get; set; } = 1;
            public int ExclusiveType { get; set; } = 0;
        }

        public class UpdateVoucherRequest
        {
            public string? VoucherCode { get; set; }
            public string? Description { get; set; }
            public double? DiscountPercent { get; set; }
            public double? DiscountAmount { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? EndDate { get; set; }
            public int? Quantity { get; set; }
            public bool? IsActive { get; set; }
            public string? Name { get; internal set; }
            public decimal DiscountValue { get; internal set; }
            public int DiscountType { get; internal set; }
            public decimal MinOrderValue { get; internal set; }
            public decimal MaxDiscount { get; internal set; }
            public int TotalQuantity { get; internal set; }
            public bool Status { get; internal set; }
            public int VisibilityType { get; internal set; }
            public int ExclusiveType { get; internal set; }
        }

        public class ActivateExclusiveVoucherRequest
        {
            [Required]
            public string Code { get; set; } = string.Empty;
        }

        public class AssignExclusiveVoucherRequest
        {
            [Required]
            public int VoucherID { get; set; }
            [Required]
            public List<string> UserIDs { get; set; } = new();
        }
    }
}
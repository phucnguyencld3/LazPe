using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public enum VoucherVisibilityType
    {
        Public = 1,
        Exclusive = 2
    }

    public enum ExclusiveDistributionType
    {
        None = 0,
        ManualCode = 1,
        DirectAssign = 2
    }

    public enum VoucherType
    {
        ProductDiscount = 1,
        ShippingDiscount = 2
    }

    public class Voucher
    {
        [Display(Name = "Loại voucher")]
        public VoucherType VoucherType { get; set; } = VoucherType.ProductDiscount;

        [Display(Name = "Miễn phí vận chuyển")]
        public bool IsFreeShipping { get; set; } = false;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Mức giảm phí ship tối đa")]
        public decimal? MaxShippingDiscount { get; set; }

        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int VoucherID { get; set; }

        [Required(ErrorMessage = "Mã voucher là bắt buộc")]
        [StringLength(50)]
        [Display(Name = "Mã voucher")]
        public string Code { get; set; }

        [Required(ErrorMessage = "Tên voucher là bắt buộc")]
        [StringLength(200)]
        [Display(Name = "Tên voucher")]
        public string Name { get; set; }

        [Display(Name = "Loại giảm giá")]
        public int DiscountType { get; set; } // 1: %, 2: tiền cố định...

        [Display(Name = "Giá trị giảm giá")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountValue { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Giá trị đơn hàng tối thiểu")]
        public decimal MinOrderValue { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Giá trị giảm giá tối đa")]
        public decimal MaxDiscount { get; set; }

        [Display(Name = "Ngày bắt đầu")]
        public DateTime StartDate { get; set; }

        [Display(Name = "Ngày kết thúc")]
        public DateTime EndDate { get; set; }

        [Display(Name = "Tổng số lượng")]
        public int TotalQuantity { get; set; }

        [Display(Name = "Số lượng đã sử dụng")]
        public int UsedQuantity { get; set; }

        [Display(Name = "Trạng thái")]
        public bool Status { get; set; }

        [Display(Name = "Hiển thị voucher")]
        public VoucherVisibilityType VisibilityType { get; set; } = VoucherVisibilityType.Public;

        [Display(Name = "Kiểu phân phối độc quyền")]
        public ExclusiveDistributionType ExclusiveType { get; set; } = ExclusiveDistributionType.None;

        [Display(Name = "Giới hạn sử dụng trên mỗi người dùng")]
        public int UsageLimitPerUser { get; set; } = 1;

        // Navigation
        public virtual ICollection<VoucherUsage> VoucherUsages { get; set; }
        public virtual ICollection<UserVoucher> UserVouchers { get; set; } = new List<UserVoucher>();
    }
}

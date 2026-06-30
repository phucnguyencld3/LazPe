using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    // =============================================
    // CART — READ DTOs
    // =============================================

    /// <summary>
    /// DTO đầy đủ giỏ hàng — trả về cho client sau mỗi thao tác
    /// </summary>
    public class CartDto
    {
        public int CartID { get; set; }
        public string UserID { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }

        /// <summary>Tạm tính trước giảm giá</summary>
        public decimal SubTotal { get; set; }

        /// <summary>Số tiền được giảm từ voucher</summary>
        public decimal DiscountAmount { get; set; }

        public decimal ShippingDiscountAmount { get; set; }

        /// <summary>Tổng tiền phải trả = SubTotal - DiscountAmount</summary>
        public decimal TotalAmount { get; set; }

        /// <summary>Voucher đang áp dụng, null nếu chưa có</summary>
        public VoucherDto? Voucher { get; set; }

        public VoucherDto? ShippingVoucher { get; set; }

        public List<CartDetailDto> CartDetails { get; set; } = new();

        // Computed
        public int TotalItems => CartDetails.Sum(cd => cd.Quantity);
    }

    /// <summary>
    /// DTO một dòng trong giỏ hàng — có thể là Variant hoặc Bundle
    /// </summary>
    public class CartDetailDto
    {
        public int CartDetailID { get; set; }
        public int CartID { get; set; }

        public int? VariantID { get; set; }
        public int? BundleID { get; set; }

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public bool IsGift { get; set; }

        /// <summary>Thông tin sản phẩm cha (chỉ có khi là Variant)</summary>
        public ProductCartDto? Product { get; set; }

        /// <summary>Thông tin biến thể (chỉ có khi là Variant)</summary>
        public VariantCartDto? Variant { get; set; }

        /// <summary>Thông tin combo (chỉ có khi là Bundle)</summary>
        public BundleCartDto? Bundle { get; set; }
    }

    /// <summary>
    /// DTO tóm tắt sản phẩm cha nhúng trong CartDetail
    /// </summary>
    public class ProductCartDto
    {
        public int ProductID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Slug { get; set; }
    }

    /// <summary>
    /// DTO tóm tắt biến thể nhúng trong CartDetail
    /// </summary>
    public class VariantCartDto
    {
        public int VariantID { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public decimal UnitPrice { get; set; }
        public int Stock { get; set; }
        public string? ImageUrl { get; set; }
    }

    /// <summary>
    /// DTO tóm tắt combo nhúng trong CartDetail
    /// </summary>
    public class BundleCartDto
    {
        public int BundleID { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string? ImageUrl { get; set; }
    }

    /// <summary>
    /// DTO thông tin voucher đang áp dụng trong giỏ hàng
    /// </summary>
    public class VoucherDto
    {
        public int VoucherID { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        /// <summary>Số tiền giảm cố định (DiscountType = 2)</summary>
        public decimal DiscountAmount { get; set; }

        /// <summary>Phần trăm giảm (DiscountType = 1)</summary>
        public decimal DiscountPercent { get; set; }

        public decimal MinOrderValue { get; set; }
        public decimal MaxDiscount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        /// <summary>true = giảm theo %, false = giảm tiền cố định</summary>
        public bool IsPercentage { get; set; }

        public int VoucherType { get; set; }
        public bool IsFreeShipping { get; set; }
        public decimal? MaxShippingDiscount { get; set; }
    }

    // =============================================
    // CART — WRITE DTOs
    // =============================================

    /// <summary>
    /// DTO thêm sản phẩm hoặc combo vào giỏ hàng
    /// </summary>
    public class AddToCartDto
    {
        public int? VariantID { get; set; }
        public int? BundleID { get; set; }
        public int? SelectedGiftVariantId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; } = 1;

        /// <summary>Hợp lệ khi có ít nhất một trong VariantID hoặc BundleID</summary>
        public bool IsValid => VariantID.HasValue ^ BundleID.HasValue;
    }

    /// <summary>
    /// DTO cập nhật số lượng sản phẩm trong giỏ hàng (Quantity = 0 sẽ xóa dòng)
    /// </summary>
    public class UpdateCartItemDto
    {
        [Required(ErrorMessage = "CartDetailID là bắt buộc")]
        public int CartDetailID { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số lượng không hợp lệ")]
        public int Quantity { get; set; }
    }

    /// <summary>
    /// DTO áp dụng mã giảm giá vào giỏ hàng
    /// </summary>
    public class ApplyVoucherDto
    {
        [Required(ErrorMessage = "Mã voucher là bắt buộc")]
        [StringLength(50, ErrorMessage = "Mã voucher tối đa 50 ký tự")]
        public string VoucherCode { get; set; } = string.Empty;
    }
}
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class CreateFullProductDto
    {
        [StringLength(50)]
        public string? Code { get; set; }

        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên không được vượt quá 200 ký tự")]
        public string ProductName { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        public string Description { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Giá không hợp lệ")]
        public decimal Price { get; set; } = 0;

        [Range(0, 100, ErrorMessage = "Giảm giá sản phẩm phải từ 0 đến 100")]
        public decimal ProductDiscountPercent { get; set; } = 0;

        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho không hợp lệ")]
        public int Stock { get; set; } = 0;

        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        public int CategoryID { get; set; }

        public int? SupplierID { get; set; }
        public bool Status { get; set; } = true;
        public string? CreatedBy { get; set; }

        public List<CreateFullProductOptionDto> Options { get; set; } = new();
        public List<CreateFullVariantDto> Variants { get; set; } = new();
    }

    public class CreateFullProductOptionDto
    {
        [Required(ErrorMessage = "Tên tùy chọn là bắt buộc")]
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; } = 1;
        public List<CreateFullProductOptionValueDto> Values { get; set; } = new();
    }

    public class CreateFullProductOptionValueDto
    {
        [Required(ErrorMessage = "Giá trị thuộc tính là bắt buộc")]
        public string Value { get; set; } = string.Empty;
        public decimal Price { get; set; } = 0;
        public int DisplayOrder { get; set; } = 1;
    }

    public class CreateFullVariantDto
    {
        [Required(ErrorMessage = "Tên biến thể là bắt buộc")]
        public string VariantName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal VariantDiscountPercent { get; set; } = 0;
        public int Stock { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? Description { get; set; }
        public bool Status { get; set; } = true;

        public List<VariantOptionValueMappingDto> OptionValues { get; set; } = new();
    }

    public class VariantOptionValueMappingDto
    {
        public string OptionName { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}

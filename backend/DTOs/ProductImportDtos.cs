using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class ValidateImportResponseDto
    {
        public List<ProductImportDto> Products { get; set; } = new List<ProductImportDto>();
        public List<VariantImportDto> Variants { get; set; } = new List<VariantImportDto>();
        public List<ImportErrorDto> Errors { get; set; } = new List<ImportErrorDto>();
        public List<ImportDuplicateDto> Duplicates { get; set; } = new List<ImportDuplicateDto>();
    }

    public class ProductImportDto
    {
        public string ExcelRow { get; set; } = string.Empty;
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Specifications { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public int SupplierId { get; set; }
        public decimal BasePrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Option1Name { get; set; } = string.Empty;
        public string Option1Values { get; set; } = string.Empty;
        public string Option2Name { get; set; } = string.Empty;
        public string Option2Values { get; set; } = string.Empty;
        public string ImageUrls { get; set; } = string.Empty;
        
        public bool IsValid { get; set; } = true;
    }

    public class VariantImportDto
    {
        public string ExcelRow { get; set; } = string.Empty;
        public string ProductCode { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public string Option1Value { get; set; } = string.Empty;
        public string Option2Value { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        
        public bool IsValid { get; set; } = true;
    }

    public class ImportErrorDto
    {
        public string Sheet { get; set; } = string.Empty;
        public string Row { get; set; } = string.Empty;
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsWarning { get; set; } = false;
    }

    public class ImportDuplicateDto
    {
        public string Sheet { get; set; } = string.Empty;
        public string Row { get; set; } = string.Empty;
        public string ItemCode { get; set; } = string.Empty; // ProductCode or SKU
        public string ResolvingAction { get; set; } = "Skip"; // Skip, Update, CreateNew
    }

    public class ImportCommitRequestDto
    {
        public List<ProductImportDto> Products { get; set; } = new List<ProductImportDto>();
        public List<VariantImportDto> Variants { get; set; } = new List<VariantImportDto>();
        public List<ImportDuplicateDto> ActionableDuplicates { get; set; } = new List<ImportDuplicateDto>();
    }
}

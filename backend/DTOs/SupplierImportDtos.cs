using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class SupplierImportDto
    {
        public string ExcelRow { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public string Logo { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "true";
        public bool IsValid { get; set; } = true;
    }

    public class SupplierValidateImportResponseDto
    {
        public List<SupplierImportDto> Suppliers { get; set; } = new List<SupplierImportDto>();
        public List<ImportErrorDto> Errors { get; set; } = new List<ImportErrorDto>();
        public List<ImportDuplicateDto> Duplicates { get; set; } = new List<ImportDuplicateDto>();
    }

    public class SupplierImportCommitRequestDto
    {
        public List<SupplierImportDto> Suppliers { get; set; } = new List<SupplierImportDto>();
        public List<ImportDuplicateDto> ActionableDuplicates { get; set; } = new List<ImportDuplicateDto>();
    }
}

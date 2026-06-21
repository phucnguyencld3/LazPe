using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class CategoryImportDto
    {
        public string ExcelRow { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string ParentCategoryName { get; set; } = string.Empty;
        public string SortOrder { get; set; } = "0";
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "true";
        public bool IsValid { get; set; } = true;
    }

    public class CategoryValidateImportResponseDto
    {
        public List<CategoryImportDto> Categories { get; set; } = new List<CategoryImportDto>();
        public List<ImportErrorDto> Errors { get; set; } = new List<ImportErrorDto>();
        public List<ImportDuplicateDto> Duplicates { get; set; } = new List<ImportDuplicateDto>();
    }

    public class CategoryImportCommitRequestDto
    {
        public List<CategoryImportDto> Categories { get; set; } = new List<CategoryImportDto>();
        public List<ImportDuplicateDto> ActionableDuplicates { get; set; } = new List<ImportDuplicateDto>();
    }
}

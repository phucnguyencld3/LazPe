using PolyBabyAPI.DTOs;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface ICategoryService
    {
        // Basic CRUD operations
        Task<IEnumerable<Categories>> GetAllCategoriesAsync();
        Task<Categories?> GetCategoryByIdAsync(int id);
        Task<bool> CreateCategoryAsync(CreateCategoryDto model, string userId);
        Task<bool> UpdateCategoryAsync(EditCategoryDto model, string userId);
        Task<bool> DeleteCategoryAsync(int id);

        // Advanced operations
        Task<CategoriesPaginationDto> GetCategoriesPaginatedAsync(int page, int pageSize, string searchTerm = "", bool? status = null);
        Task<bool> ToggleCategoryStatusAsync(int id);
        Task<List<CategorySelectDto>> GetCategoriesForSelectAsync();
        Task<List<Categories>> GetParentCategoriesAsync();
        Task<CategoryDetailDto?> GetCategoryDetailAsync(int id);
        Task<bool> HasProductsAsync(int categoryId);
        Task<List<Categories>> GetSubCategoriesAsync(int parentId);
        Task<byte[]> ExportExcelAsync(string searchTerm, bool? status);
    }
}


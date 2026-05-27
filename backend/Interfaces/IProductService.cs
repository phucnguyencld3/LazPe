using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    public interface IProductService
    {
        Task<ProductPaginationDto> GetProductsPaginatedAsync(
            int page, int pageSize, string searchTerm = "",
            int? categoryId = null, int? supplierId = null, bool? status = null,
            decimal? minPrice = null, decimal? maxPrice = null,
            string sortBy = "CreatedAt", string sortDirection = "desc");

        Task<ProductDto?> GetProductByIdAsync(int id);
        Task<ProductDetailDto?> GetProductDetailAsync(int id);
        Task<ServiceResult<ProductDto>> CreateProductAsync(CreateProductDto dto);
        Task<ServiceResult<ProductDto>> UpdateProductAsync(int id, UpdateProductDto dto, string userId);
        Task<ServiceResult<bool>> DeleteProductAsync(int id);
        Task<ServiceResult<bool>> ToggleProductStatusAsync(int id);
        Task<List<CategorySelectDto>> GetCategoriesForSelectAsync();
        Task<List<SupplierSelectDto>> GetSuppliersForSelectAsync();
        Task<bool> IsProductCodeExistAsync(string code, int? excludeId = null);
        Task<object> GetProductStatsAsync();
    }
}
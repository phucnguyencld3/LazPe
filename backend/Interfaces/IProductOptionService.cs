using PolyBabyAPI.DTOs;

namespace PolyBabyAPI.Interfaces
{
    public interface IProductOptionService
    {
        Task<List<ProductOptionDto>> GetOptionsByProductIdAsync(int productId);
        Task<ProductOptionDto?> GetOptionByIdAsync(int optionId);
        Task<ServiceResult<ProductOptionDto>> CreateOptionAsync(int productId, CreateProductOptionDto dto);
        Task<ServiceResult<ProductOptionDto>> UpdateOptionAsync(int optionId, UpdateProductOptionDto dto);
        Task<ServiceResult<bool>> DeleteOptionAsync(int optionId);
        Task<ServiceResult<ProductOptionValueDto>> AddOptionValueAsync(int optionId, CreateProductOptionValueDto dto);
        Task<ServiceResult<ProductOptionValueDto>> UpdateOptionValueAsync(int valueId, UpdateProductOptionValueDto dto);
        Task<ServiceResult<bool>> DeleteOptionValueAsync(int valueId);
    }
}
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class ProductOptionService : IProductOptionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductOptionService> _logger;

        public ProductOptionService(ApplicationDbContext context, ILogger<ProductOptionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<ProductOptionDto>> GetOptionsByProductIdAsync(int productId)
        {
            return await _context.ProductOptions
                .Where(po => po.ProductID == productId)
                .OrderBy(po => po.DisplayOrder)
                .Select(po => new ProductOptionDto
                {
                    ProductOptionID = po.ProductOptionID,
                    ProductID = po.ProductID,
                    Name = po.Name,
                    DisplayOrder = po.DisplayOrder,
                    CreatedAt = po.CreatedAt,
                    CreatedBy = po.CreatedBy,
                    ProductOptionValues = po.ProductOptionValues
                        .OrderBy(v => v.DisplayOrder)
                        .Select(v => new ProductOptionValueDto
                        {
                            ProductOptionValueID = v.ProductOptionValueID,
                            ProductOptionID = v.ProductOptionID,
                            Value = v.Value,
                            DisplayOrder = v.DisplayOrder,
                            Price = v.Price,
                            CreatedAt = v.CreatedAt,
                            CreatedBy = v.CreatedBy
                        }).ToList()
                })
                .ToListAsync();
        }

        public async Task<ProductOptionDto?> GetOptionByIdAsync(int optionId)
        {
            return await _context.ProductOptions
                .Where(po => po.ProductOptionID == optionId)
                .Select(po => new ProductOptionDto
                {
                    ProductOptionID = po.ProductOptionID,
                    ProductID = po.ProductID,
                    Name = po.Name,
                    DisplayOrder = po.DisplayOrder,
                    CreatedAt = po.CreatedAt,
                    CreatedBy = po.CreatedBy,
                    ProductOptionValues = po.ProductOptionValues
                        .OrderBy(v => v.DisplayOrder)
                        .Select(v => new ProductOptionValueDto
                        {
                            ProductOptionValueID = v.ProductOptionValueID,
                            ProductOptionID = v.ProductOptionID,
                            Value = v.Value,
                            DisplayOrder = v.DisplayOrder,
                            Price = v.Price,
                            CreatedAt = v.CreatedAt,
                            CreatedBy = v.CreatedBy
                        }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<ServiceResult<ProductOptionDto>> CreateOptionAsync(int productId, CreateProductOptionDto dto)
        {
            try
            {
                var product = await _context.Products.FindAsync(productId);
                if (product == null)
                    return new ServiceResult<ProductOptionDto> { Success = false, Message = "Không tìm thấy sản phẩm" };

                // Check duplicate name
                var exists = await _context.ProductOptions
                    .AnyAsync(po => po.ProductID == productId && po.Name == dto.Name);
                if (exists)
                    return new ServiceResult<ProductOptionDto> { Success = false, Message = $"Thuộc tính '{dto.Name}' đã tồn tại cho sản phẩm này" };

                var option = new ProductOption
                {
                    ProductID = productId,
                    Name = dto.Name,
                    DisplayOrder = dto.DisplayOrder,
                    CreatedAt = DateTime.Now,
                    CreatedBy = "System"
                };

                _context.ProductOptions.Add(option);
                await _context.SaveChangesAsync();

                // Add values if provided
                if (dto.Values.Any())
                {
                    foreach (var valDto in dto.Values)
                    {
                        var optionValue = new ProductOptionValue
                        {
                            ProductOptionID = option.ProductOptionID,
                            Value = valDto.Value,
                            Price = valDto.Price,
                            DisplayOrder = valDto.DisplayOrder,
                            CreatedAt = DateTime.Now,
                            CreatedBy = "System"
                        };
                        _context.ProductOptionValues.Add(optionValue);
                    }
                    await _context.SaveChangesAsync();
                }

                var result = await GetOptionByIdAsync(option.ProductOptionID);
                return new ServiceResult<ProductOptionDto> { Success = true, Data = result, Message = "Tạo thuộc tính thành công" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product option for product {ProductId}", productId);
                return new ServiceResult<ProductOptionDto> { Success = false, Message = "Có lỗi xảy ra khi tạo thuộc tính" };
            }
        }

        public async Task<ServiceResult<ProductOptionDto>> UpdateOptionAsync(int optionId, UpdateProductOptionDto dto)
        {
            try
            {
                var option = await _context.ProductOptions.FindAsync(optionId);
                if (option == null)
                    return new ServiceResult<ProductOptionDto> { Success = false, Message = "Không tìm thấy thuộc tính" };

                // Check duplicate name (exclude self)
                var exists = await _context.ProductOptions
                    .AnyAsync(po => po.ProductID == option.ProductID && po.Name == dto.Name && po.ProductOptionID != optionId);
                if (exists)
                    return new ServiceResult<ProductOptionDto> { Success = false, Message = $"Thuộc tính '{dto.Name}' đã tồn tại cho sản phẩm này" };

                option.Name = dto.Name;
                option.DisplayOrder = dto.DisplayOrder;
                await _context.SaveChangesAsync();

                var result = await GetOptionByIdAsync(optionId);
                return new ServiceResult<ProductOptionDto> { Success = true, Data = result, Message = "Cập nhật thuộc tính thành công" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product option {OptionId}", optionId);
                return new ServiceResult<ProductOptionDto> { Success = false, Message = "Có lỗi xảy ra khi cập nhật thuộc tính" };
            }
        }

        public async Task<ServiceResult<bool>> DeleteOptionAsync(int optionId)
        {
            try
            {
                var option = await _context.ProductOptions
                    .Include(po => po.ProductOptionValues)
                        .ThenInclude(pov => pov.VariantOptionValues)
                    .FirstOrDefaultAsync(po => po.ProductOptionID == optionId);

                if (option == null)
                    return new ServiceResult<bool> { Success = false, Message = "Không tìm thấy thuộc tính" };

                // Check if any value is linked to variants
                var hasLinkedVariants = option.ProductOptionValues
                    .Any(pov => pov.VariantOptionValues.Any());

                if (hasLinkedVariants)
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        Message = "Không thể xóa thuộc tính đang được sử dụng bởi biến thể. Vui lòng xóa biến thể liên quan trước."
                    };

                _context.ProductOptionValues.RemoveRange(option.ProductOptionValues);
                _context.ProductOptions.Remove(option);
                await _context.SaveChangesAsync();

                return new ServiceResult<bool> { Success = true, Data = true, Message = "Xóa thuộc tính thành công" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product option {OptionId}", optionId);
                return new ServiceResult<bool> { Success = false, Message = "Có lỗi xảy ra khi xóa thuộc tính" };
            }
        }

        public async Task<ServiceResult<ProductOptionValueDto>> AddOptionValueAsync(int optionId, CreateProductOptionValueDto dto)
        {
            try
            {
                var option = await _context.ProductOptions.FindAsync(optionId);
                if (option == null)
                    return new ServiceResult<ProductOptionValueDto> { Success = false, Message = "Không tìm thấy thuộc tính" };

                // Check duplicate value
                var exists = await _context.ProductOptionValues
                    .AnyAsync(v => v.ProductOptionID == optionId && v.Value == dto.Value);
                if (exists)
                    return new ServiceResult<ProductOptionValueDto> { Success = false, Message = $"Giá trị '{dto.Value}' đã tồn tại" };

                var value = new ProductOptionValue
                {
                    ProductOptionID = optionId,
                    Value = dto.Value,
                    Price = dto.Price,
                    DisplayOrder = dto.DisplayOrder,
                    CreatedAt = DateTime.Now,
                    CreatedBy = "System"
                };

                _context.ProductOptionValues.Add(value);
                await _context.SaveChangesAsync();

                return new ServiceResult<ProductOptionValueDto>
                {
                    Success = true,
                    Data = new ProductOptionValueDto
                    {
                        ProductOptionValueID = value.ProductOptionValueID,
                        ProductOptionID = value.ProductOptionID,
                        Value = value.Value,
                        Price = value.Price,
                        DisplayOrder = value.DisplayOrder,
                        CreatedAt = value.CreatedAt,
                        CreatedBy = value.CreatedBy
                    },
                    Message = "Thêm giá trị thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding option value to option {OptionId}", optionId);
                return new ServiceResult<ProductOptionValueDto> { Success = false, Message = "Có lỗi xảy ra khi thêm giá trị" };
            }
        }

        public async Task<ServiceResult<ProductOptionValueDto>> UpdateOptionValueAsync(int valueId, UpdateProductOptionValueDto dto)
        {
            try
            {
                var value = await _context.ProductOptionValues.FindAsync(valueId);
                if (value == null)
                    return new ServiceResult<ProductOptionValueDto> { Success = false, Message = "Không tìm thấy giá trị thuộc tính" };

                // Check duplicate (exclude self)
                var exists = await _context.ProductOptionValues
                    .AnyAsync(v => v.ProductOptionID == value.ProductOptionID && v.Value == dto.Value && v.ProductOptionValueID != valueId);
                if (exists)
                    return new ServiceResult<ProductOptionValueDto> { Success = false, Message = $"Giá trị '{dto.Value}' đã tồn tại" };

                value.Value = dto.Value;
                value.Price = dto.Price;
                value.DisplayOrder = dto.DisplayOrder;
                await _context.SaveChangesAsync();

                return new ServiceResult<ProductOptionValueDto>
                {
                    Success = true,
                    Data = new ProductOptionValueDto
                    {
                        ProductOptionValueID = value.ProductOptionValueID,
                        ProductOptionID = value.ProductOptionID,
                        Value = value.Value,
                        Price = value.Price,
                        DisplayOrder = value.DisplayOrder
                    },
                    Message = "Cập nhật giá trị thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating option value {ValueId}", valueId);
                return new ServiceResult<ProductOptionValueDto> { Success = false, Message = "Có lỗi xảy ra khi cập nhật giá trị" };
            }
        }

        public async Task<ServiceResult<bool>> DeleteOptionValueAsync(int valueId)
        {
            try
            {
                var value = await _context.ProductOptionValues
                    .Include(v => v.VariantOptionValues)
                    .FirstOrDefaultAsync(v => v.ProductOptionValueID == valueId);

                if (value == null)
                    return new ServiceResult<bool> { Success = false, Message = "Không tìm thấy giá trị thuộc tính" };

                if (value.VariantOptionValues.Any())
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        Message = "Không thể xóa giá trị đang được sử dụng bởi biến thể. Vui lòng xóa biến thể liên quan trước."
                    };

                _context.ProductOptionValues.Remove(value);
                await _context.SaveChangesAsync();

                return new ServiceResult<bool> { Success = true, Data = true, Message = "Xóa giá trị thành công" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting option value {ValueId}", valueId);
                return new ServiceResult<bool> { Success = false, Message = "Có lỗi xảy ra khi xóa giá trị" };
            }
        }
    }
}
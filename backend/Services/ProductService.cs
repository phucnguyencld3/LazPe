using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductService> _logger;

        public ProductService(ApplicationDbContext context, ILogger<ProductService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ProductPaginationDto> GetProductsPaginatedAsync(
            int page, int pageSize, string searchTerm = "",
            int? categoryId = null, int? supplierId = null, bool? status = null,
            decimal? minPrice = null, decimal? maxPrice = null,
            string sortBy = "CreatedAt", string sortDirection = "desc")
        {
            try
            {
                var query = _context.Products
                    .AsNoTracking()
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(p => p.ProductName.Contains(searchTerm));
                }

                if (categoryId.HasValue)
                    query = query.Where(p => p.CategoryID == categoryId.Value);

                if (supplierId.HasValue)
                    query = query.Where(p => p.SupplierID == supplierId.Value);

                if (status.HasValue)
                    query = query.Where(p => p.Status == status.Value);

                if (minPrice.HasValue)
                    query = query.Where(p => p.Price >= minPrice.Value);

                if (maxPrice.HasValue)
                    query = query.Where(p => p.Price <= maxPrice.Value);

                // Apply sorting
                query = sortBy.ToLower() switch
                {
                    "productname" => sortDirection.ToLower() == "asc" 
                        ? query.OrderBy(p => p.ProductName) 
                        : query.OrderByDescending(p => p.ProductName),
                    "price" => sortDirection.ToLower() == "asc"
                        ? query.OrderBy(p => p.Price)
                        : query.OrderByDescending(p => p.Price),
                    "code" => sortDirection.ToLower() == "asc"
                        ? query.OrderBy(p => p.Code)
                        : query.OrderByDescending(p => p.Code),
                    "categoryname" => sortDirection.ToLower() == "asc"
                        ? query.OrderBy(p => p.Category.CategoryName)
                        : query.OrderByDescending(p => p.Category.CategoryName),
                    _ => sortDirection.ToLower() == "asc"
                        ? query.OrderBy(p => p.CreatedAt)
                        : query.OrderByDescending(p => p.CreatedAt)
                };

                var totalItems = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

                var products = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new ProductListItemDto
                    {
                        ProductID = p.ProductID,
                        Code = p.Code,
                        ProductName = p.ProductName,
                        Description = p.Description,
                        Price = p.Price,
                        ProductDiscountPercent = p.ProductDiscountPercent,
                        Stock = p.Stock,
                        Status = p.Status,
                        CategoryID = p.CategoryID,
                        CategoryName = p.Category.CategoryName,
                        SupplierID = p.SupplierID,
                        SupplierName = p.Supplier != null ? p.Supplier.SupplierName : "",
                        CreatedAt = p.CreatedAt,
                        CreatedBy = p.CreatedBy,
                        ImageUrl = p.Variants
                            .Where(v => v.ImageUrl != null && v.ImageUrl != "")
                            .OrderBy(v => v.VariantID)
                            .Select(v => v.ImageUrl)
                            .FirstOrDefault(),
                        TotalStock = p.Variants.Sum(v => v.Stock),
                        MinPrice = p.Variants.Where(v => v.Status).Any() 
                            ? p.Variants.Where(v => v.Status).Min(v => v.UnitPrice) 
                            : 0,
                        MaxPrice = p.Variants.Where(v => v.Status).Any() 
                            ? p.Variants.Where(v => v.Status).Max(v => v.UnitPrice) 
                            : 0,
                        MinEffectivePrice = 0,
                        MaxEffectivePrice = 0,
                        VariantCount = p.Variants.Count
                    })
                    .ToListAsync();

                var productIds = products.Select(p => p.ProductID).ToList();
                if (productIds.Count > 0)
                {
                    var variantPriceRows = await _context.Variants
                        .AsNoTracking()
                        .Where(v => v.Status && productIds.Contains(v.ProductID))
                        .Select(v => new
                        {
                            v.ProductID,
                            v.UnitPrice,
                            v.VariantDiscountPercent
                        })
                        .ToListAsync();

                    var variantMap = variantPriceRows
                        .GroupBy(v => v.ProductID)
                        .ToDictionary(g => g.Key, g => g.ToList());

                    foreach (var product in products)
                    {
                        if (!variantMap.TryGetValue(product.ProductID, out var variants) || variants.Count == 0)
                        {
                            product.MinEffectivePrice = 0;
                            product.MaxEffectivePrice = 0;
                            continue;
                        }

                        var effectivePrices = variants.Select(v =>
                            v.UnitPrice * (1m - ((v.VariantDiscountPercent > 0 ? v.VariantDiscountPercent : product.ProductDiscountPercent) / 100m)));

                        product.MinEffectivePrice = effectivePrices.Min();
                        product.MaxEffectivePrice = effectivePrices.Max();
                    }
                }

                return new ProductPaginationDto
                {
                    Products = products,
                    CurrentPage = page,
                    TotalPages = totalPages,
                    TotalItems = totalItems,
                    PageSize = pageSize,
                    SearchTerm = searchTerm,
                    CategoryId = categoryId,
                    SupplierId = supplierId,
                    Status = status,
                    MinPrice = minPrice,
                    MaxPrice = maxPrice,
                    SortBy = sortBy,
                    SortDirection = sortDirection
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetProductsPaginatedAsync");
                throw;
            }
        }

        public async Task<ProductDto?> GetProductByIdAsync(int id)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Supplier)
                    .FirstOrDefaultAsync(p => p.ProductID == id);

                if (product == null) return null;

                return new ProductDto
                {
                    ProductID = product.ProductID,
                    Code = product.Code,
                    ProductName = product.ProductName,
                    Description = product.Description,
                    Price = product.Price,
                    ProductDiscountPercent = product.ProductDiscountPercent,
                    Stock = product.Stock,
                    Status = product.Status,
                    CategoryID = product.CategoryID,
                    SupplierID = product.SupplierID,
                    CreatedAt = product.CreatedAt,
                    CreatedBy = product.CreatedBy,
                    Category = product.Category != null ? new CategoryDto
                    {
                        CategoryID = product.Category.CategoryID,
                        CategoryName = product.Category.CategoryName
                    } : null,
                    Supplier = product.Supplier != null ? new SupplierDto
                    {
                        SupplierID = product.Supplier.SupplierID,
                        SupplierName = product.Supplier.SupplierName
                    } : null
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product {ProductId}", id);
                throw;
            }
        }

        public async Task<ProductDetailDto?> GetProductDetailAsync(int id)
        {
            try
            {
                var product = await _context.Products
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(p => p.Category)
                    .Include(p => p.Supplier)
                    .Include(p => p.Variants.Where(v => v.Status))
                        .ThenInclude(v => v.VariantOptionValues)
                            .ThenInclude(vov => vov.ProductOptionValue)
                                .ThenInclude(pov => pov.ProductOption)
                    .Include(p => p.ProductOptions)
                        .ThenInclude(po => po.ProductOptionValues)
                    .FirstOrDefaultAsync(p => p.ProductID == id);

                if (product == null) return null;

                return new ProductDetailDto
                {
                    ProductID = product.ProductID,
                    Code = product.Code,
                    ProductName = product.ProductName,
                    Description = product.Description,
                    Price = product.Price,
                    ProductDiscountPercent = product.ProductDiscountPercent,
                    Stock = product.Stock,
                    Status = product.Status,
                    CategoryID = product.CategoryID,
                    SupplierID = product.SupplierID,
                    CreatedAt = product.CreatedAt,
                    CreatedBy = product.CreatedBy,
                    Category = product.Category != null ? new CategoryDto
                    {
                        CategoryID = product.Category.CategoryID,
                        CategoryName = product.Category.CategoryName
                    } : null,
                    Supplier = product.Supplier != null ? new SupplierDto
                    {
                        SupplierID = product.Supplier.SupplierID,
                        SupplierName = product.Supplier.SupplierName
                    } : null,
                    Variants = product.Variants.Select(v => new VariantDto
                    {
                        VariantID = v.VariantID,
                        ProductID = v.ProductID,
                        VariantName = v.VariantName,
                        UnitPrice = v.UnitPrice,
                        VariantDiscountPercent = v.VariantDiscountPercent,
                        EffectiveDiscountPercent = v.VariantDiscountPercent > 0 ? v.VariantDiscountPercent : product.ProductDiscountPercent,
                        FinalPrice = v.UnitPrice * (1m - ((v.VariantDiscountPercent > 0 ? v.VariantDiscountPercent : product.ProductDiscountPercent) / 100m)),
                        Stock = v.Stock,
                        SKU = v.SKU,
                        ImageUrl = v.ImageUrl,
                        Description = v.Description,
                        Status = v.Status,
                        CreatedAt = v.CreatedAt,
                        VariantOptionValues = v.VariantOptionValues.Select(vov => new VariantOptionValueDto
                        {
                            VariantOptionValueID = vov.VariantOptionValueID,
                            VariantID = vov.VariantID,
                            ProductOptionValueID = vov.ProductOptionValueID,
                            ProductOptionValue = new ProductOptionValueDto
                            {
                                ProductOptionValueID = vov.ProductOptionValue.ProductOptionValueID,
                                ProductOptionID = vov.ProductOptionValue.ProductOptionID,
                                Value = vov.ProductOptionValue.Value,
                                Price = vov.ProductOptionValue.Price
                            }
                        }).ToList()
                    }).ToList(),
                    ProductOptions = product.ProductOptions.Select(po => new ProductOptionDto
                    {
                        ProductOptionID = po.ProductOptionID,
                        ProductID = po.ProductID,
                        Name = po.Name,
                        DisplayOrder = po.DisplayOrder,
                        ProductOptionValues = po.ProductOptionValues.Select(pov => new ProductOptionValueDto
                        {
                            ProductOptionValueID = pov.ProductOptionValueID,
                            ProductOptionID = pov.ProductOptionID,
                            Value = pov.Value,
                            Price = pov.Price,
                            DisplayOrder = pov.DisplayOrder
                        }).ToList()
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product detail {ProductId}", id);
                throw;
            }
        }

        public async Task<ServiceResult<ProductDto>> CreateProductAsync(CreateProductDto dto)
        {
            try
            {
                // Validate business rules
                if (await IsProductCodeExistAsync(dto.Code))
                {
                    return new ServiceResult<ProductDto>
                    {
                        Success = false,
                        Message = "Mã sản phẩm đã tồn tại"
                    };
                }

                // Generate code if empty
                if (string.IsNullOrWhiteSpace(dto.Code))
                {
                    dto.Code = await GenerateProductCodeAsync();
                }

                var product = new Product
                {
                    Code = dto.Code,
                    ProductName = dto.ProductName,
                    Description = dto.Description,
                    Price = dto.Price,
                    ProductDiscountPercent = dto.ProductDiscountPercent,
                    Stock = dto.Stock,
                    CategoryID = dto.CategoryID,
                    SupplierID = dto.SupplierID ?? 0, // Default supplier if not provided
                    CreatedAt = DateTime.Now,
                    CreatedBy = dto.CreatedBy ?? "System",
                    Status = true
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                // Return created product
                var result = await GetProductByIdAsync(product.ProductID);
                
                return new ServiceResult<ProductDto>
                {
                    Success = true,
                    Data = result,
                    Message = "Tạo sản phẩm thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                return new ServiceResult<ProductDto>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi tạo sản phẩm"
                };
            }
        }

        public async Task<ServiceResult<ProductDto>> UpdateProductAsync(int id, UpdateProductDto dto, string userId)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.Variants)
                    .FirstOrDefaultAsync(p => p.ProductID == id);
                if (product == null)
                {
                    return new ServiceResult<ProductDto>
                    {
                        Success = false,
                        Message = "Không tìm thấy sản phẩm"
                    };
                }

                // Validate business rules
                if (await IsProductCodeExistAsync(dto.Code, id))
                {
                    return new ServiceResult<ProductDto>
                    {
                        Success = false,
                        Message = "Mã sản phẩm đã tồn tại"
                    };
                }

                var oldBasePrice = product.Price;

                // Update product
                product.Code = dto.Code ?? product.Code;
                product.ProductName = dto.ProductName;
                product.Description = dto.Description;
                product.Price = dto.Price;
                product.ProductDiscountPercent = dto.ProductDiscountPercent;
                product.Stock = dto.Stock;
                product.CategoryID = dto.CategoryID;
                product.SupplierID = dto.SupplierID ?? product.SupplierID;
                product.Status = dto.Status;

                // Đồng bộ giá biến thể theo giá gốc mới:
                // unitPrice mới = unitPrice cũ + (giá gốc mới - giá gốc cũ)
                var priceDelta = dto.Price - oldBasePrice;
                if (priceDelta != 0 && product.Variants != null)
                {
                    foreach (var variant in product.Variants)
                    {
                        variant.UnitPrice += priceDelta;
                        if (variant.UnitPrice < 0)
                            variant.UnitPrice = 0;
                    }
                }

                await _context.SaveChangesAsync();

                // Return updated product
                var result = await GetProductByIdAsync(product.ProductID);
                
                return new ServiceResult<ProductDto>
                {
                    Success = true,
                    Data = result,
                    Message = "Cập nhật sản phẩm thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {ProductId}", id);
                return new ServiceResult<ProductDto>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi cập nhật sản phẩm"
                };
            }
        }

        public async Task<ServiceResult<bool>> DeleteProductAsync(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var product = await _context.Products
                    .FirstOrDefaultAsync(p => p.ProductID == id);

                if (product == null)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        Message = "Không tìm thấy sản phẩm"
                    };
                }

                var variantIds = await _context.Variants
                    .Where(v => v.ProductID == id)
                    .Select(v => v.VariantID)
                    .ToListAsync();

                if (variantIds.Count > 0)
                {
                    // 1. Kiểm tra đơn hàng (InvoiceDetail)
                    var invoiceUsageCount = await _context.InvoiceDetails
                        .CountAsync(i => i.VariantID.HasValue && variantIds.Contains(i.VariantID.Value));

                    if (invoiceUsageCount > 0)
                    {
                        return new ServiceResult<bool>
                        {
                            Success = false,
                            Message = $"Không thể xóa sản phẩm vì biến thể đã có {invoiceUsageCount} đơn đặt hàng liên quan trong hệ thống."
                        };
                    }

                    // 2. Kiểm tra đánh giá (Review)
                    var reviewUsageCount = await _context.Reviews
                        .CountAsync(r => variantIds.Contains(r.VariantID));

                    if (reviewUsageCount > 0)
                    {
                        return new ServiceResult<bool>
                        {
                            Success = false,
                            Message = $"Không thể xóa sản phẩm vì đã có {reviewUsageCount} lượt đánh giá từ khách hàng."
                        };
                    }

                    // 3. Kiểm tra Combo / Bundle (BundleItem)
                    var bundleUsageCount = await _context.BundleItems
                        .CountAsync(bi => variantIds.Contains(bi.VariantID));

                    if (bundleUsageCount > 0)
                    {
                        return new ServiceResult<bool>
                        {
                            Success = false,
                            Message = $"Không thể xóa sản phẩm vì có {bundleUsageCount} biến thể đang nằm trong gói Combo/Bundle."
                        };
                    }

                    // Xóa giỏ hàng tạm (CartDetail)
                    var cartDetails = await _context.CartDetails
                        .Where(cd => cd.VariantID.HasValue && variantIds.Contains(cd.VariantID.Value))
                        .ToListAsync();

                    if (cartDetails.Count > 0)
                        _context.CartDetails.RemoveRange(cartDetails);

                    // Xóa liên kết thuộc tính biến thể (VariantOptionValue)
                    var variantOptionValues = await _context.VariantOptionValues
                        .Where(vov => variantIds.Contains(vov.VariantID))
                        .ToListAsync();

                    if (variantOptionValues.Count > 0)
                        _context.VariantOptionValues.RemoveRange(variantOptionValues);

                    // Xóa các biến thể
                    var variants = await _context.Variants
                        .Where(v => variantIds.Contains(v.VariantID))
                        .ToListAsync();

                    if (variants.Count > 0)
                        _context.Variants.RemoveRange(variants);
                }

                // Xóa thuộc tính cấu hình (ProductOption)
                var productOptions = await _context.ProductOptions
                    .Where(po => po.ProductID == id)
                    .ToListAsync();

                if (productOptions.Count > 0)
                    _context.ProductOptions.RemoveRange(productOptions);

                _context.Products.Remove(product);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new ServiceResult<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Xóa sản phẩm thành công"
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error deleting product {ProductId}", id);
                
                string errorMsg = "Có lỗi xảy ra trong quá trình xóa sản phẩm.";
                if (ex.InnerException != null && (ex.InnerException.Message.Contains("FK_") || ex.InnerException.Message.Contains("REFERENCE constraint")))
                {
                    errorMsg = "Không thể xóa sản phẩm do có ràng buộc dữ liệu liên kết khác trong cơ sở dữ liệu.";
                }
                
                return new ServiceResult<bool>
                {
                    Success = false,
                    Message = errorMsg
                };
            }
        }

        public async Task<ServiceResult<bool>> ToggleProductStatusAsync(int id)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        Message = "Không tìm thấy sản phẩm"
                    };
                }

                product.Status = !product.Status;
                await _context.SaveChangesAsync();

                return new ServiceResult<bool>
                {
                    Success = true,
                    Data = true,
                    Message = product.Status ? "Kích hoạt sản phẩm thành công" : "Vô hiệu hóa sản phẩm thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling product status {ProductId}", id);
                return new ServiceResult<bool>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi cập nhật trạng thái sản phẩm"
                };
            }
        }

        public async Task<List<CategorySelectDto>> GetCategoriesForSelectAsync()
        {
            return await _context.Categories
                .Where(c => c.Status)
                .OrderBy(c => c.Level)
                .ThenBy(c => c.CategoryName)
                .Select(c => new CategorySelectDto
                {
                    CategoryID = c.CategoryID,
                    CategoryName = c.CategoryName,
                    ParentID = c.ParentID,
                    Level = c.Level,
                    Status = c.Status
                })
                .ToListAsync();
        }

        public async Task<List<SupplierSelectDto>> GetSuppliersForSelectAsync()
        {
            return await _context.Suppliers
                .Where(s => s.Status)
                .OrderBy(s => s.SupplierName)
                .Select(s => new SupplierSelectDto
                {
                    SupplierID = s.SupplierID,
                    SupplierName = s.SupplierName,
                    Status = s.Status
                })
                .ToListAsync();
        }

        public async Task<bool> IsProductCodeExistAsync(string code, int? excludeId = null)
        {
            if (string.IsNullOrWhiteSpace(code)) return false;

            var query = _context.Products.Where(p => p.Code == code);
            
            if (excludeId.HasValue)
                query = query.Where(p => p.ProductID != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<object> GetProductStatsAsync()
        {
            var totalProducts = await _context.Products.CountAsync();
            var activeProducts = await _context.Products.CountAsync(p => p.Status);
            var outOfStockProducts = await _context.Products.CountAsync(p => p.Stock == 0);
            
            var oneWeekAgo = DateTime.Now.AddDays(-7);
            var newProducts = await _context.Products.CountAsync(p => p.CreatedAt >= oneWeekAgo);

            return new
            {
                totalProducts,
                activeProducts,
                outOfStockProducts,
                newProducts
            };
        }

        private async Task<string> GenerateProductCodeAsync()
        {
            var count = await _context.Products.CountAsync();
            return $"SP{(count + 1):D6}"; // SP000001, SP000002, etc.
        }
    }
}
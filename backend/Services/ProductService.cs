using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Helpers;
using PolyBabyAPI.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;
using System.Threading;
using Hangfire;

namespace PolyBabyAPI.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductService> _logger;
        private readonly IMemoryCache _cache;
        private readonly ISearchEngineService _searchEngineService;
        private readonly IAuditLogService _auditLogService;
        private readonly Hangfire.IBackgroundJobClient _backgroundJobClient;
        private static CancellationTokenSource _resetCacheToken = new CancellationTokenSource();

        public ProductService(
            ApplicationDbContext context, 
            ILogger<ProductService> logger, 
            IMemoryCache cache, 
            ISearchEngineService searchEngineService, 
            IAuditLogService auditLogService,
            Hangfire.IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _logger = logger;
            _cache = cache;
            _searchEngineService = searchEngineService;
            _auditLogService = auditLogService;
            _backgroundJobClient = backgroundJobClient;
        }

        public void ClearProductCache()
        {
            if (!_resetCacheToken.IsCancellationRequested)
            {
                _resetCacheToken.Cancel();
                _resetCacheToken.Dispose();
                _resetCacheToken = new CancellationTokenSource();
            }
        }

        public async Task<ProductPaginationDto> GetProductsPaginatedAsync(
            int page, int pageSize, string searchTerm = "",
            int? categoryId = null, int? supplierId = null, bool? status = null,
            decimal? minPrice = null, decimal? maxPrice = null,
            string sortBy = "CreatedAt", string sortDirection = "desc", bool? hasDiscount = null)
        {
            var cacheKey = $"Products_{page}_{pageSize}_{searchTerm}_{categoryId}_{supplierId}_{status}_{minPrice}_{maxPrice}_{sortBy}_{sortDirection}";
            if (_cache.TryGetValue(cacheKey, out ProductPaginationDto? cachedResult) && cachedResult != null)
            {
                return cachedResult;
            }

            try
            {
                var query = _context.Products.AsNoTracking().Where(p => !p.IsDeleted);

                List<int>? meiliSortedIds = null;
                // Apply filters
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    try
                    {
                        var matchingIds = await _searchEngineService.SearchProductsAsync(searchTerm);
                        if (!matchingIds.Any())
                        {
                            // Thử tìm kiếm bằng keyword không dấu trên Meilisearch
                            var noTone = StringHelper.RemoveVietnameseTones(searchTerm);
                            if (noTone != searchTerm)
                            {
                                matchingIds = await _searchEngineService.SearchProductsAsync(noTone);
                            }
                        }

                        if (matchingIds.Any())
                        {
                            query = query.Where(p => matchingIds.Contains(p.ProductID));
                            meiliSortedIds = matchingIds;
                        }
                        else
                        {
                            // Nếu vẫn không có, fallback về SQL
                            var noTone = StringHelper.RemoveVietnameseTones(searchTerm).ToLower();
                            var allProducts = _context.Products.Select(x => new { x.ProductID, x.ProductName }).ToList();
                            var matchedIds = allProducts.Where(x => 
                                (x.ProductName ?? "").ToLower().Contains(searchTerm.ToLower()) || 
                                StringHelper.RemoveVietnameseTones(x.ProductName ?? "").ToLower().Contains(noTone)
                            ).Select(x => x.ProductID).ToList();
                            
                            query = query.Where(p => matchedIds.Contains(p.ProductID));
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Meilisearch query failed. Fallback to SQL Server LIKE.");
                        var noTone = StringHelper.RemoveVietnameseTones(searchTerm).ToLower();
                        var allProducts = _context.Products.Select(x => new { x.ProductID, x.ProductName }).ToList();
                        var matchedIds = allProducts.Where(x => 
                            (x.ProductName ?? "").ToLower().Contains(searchTerm.ToLower()) || 
                            StringHelper.RemoveVietnameseTones(x.ProductName ?? "").ToLower().Contains(noTone)
                        ).Select(x => x.ProductID).ToList();
                        
                        query = query.Where(p => matchedIds.Contains(p.ProductID));
                    }
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

                if (hasDiscount.HasValue && hasDiscount.Value)
                    query = query.Where(p => p.ProductDiscountPercent > 0 || p.Variants.Any(v => v.VariantDiscountPercent > 0));

                bool useRelevanceSort = meiliSortedIds != null && sortBy.ToLower() == "createdat";

                var totalItems = await query.AsSingleQuery().CountAsync();
                var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

                // Apply sorting
                if (!useRelevanceSort)
                {
                    var sortKey = sortBy.ToLower();
                    if (sortKey == "bestseller")
                    {
                        var topSellerIds = await _context.InvoiceDetails
                            .AsNoTracking()
                            .Where(id => id.Invoice != null && id.Invoice.Status == OrderStatus.Completed && id.Variant != null)
                            .GroupBy(id => id.Variant!.ProductID)
                            .OrderByDescending(g => g.Sum(id => id.Quantity))
                            .Select(g => g.Key)
                            .Take(200)
                            .ToListAsync();

                        useRelevanceSort = true;
                        meiliSortedIds = topSellerIds;
                    }
                    else if (sortKey == "topwishlist")
                    {
                        var topWishIds = await _context.Wishlists
                            .AsNoTracking()
                            .GroupBy(w => w.ProductID)
                            .OrderByDescending(g => g.Count())
                            .Select(g => g.Key)
                            .Take(200)
                            .ToListAsync();

                        useRelevanceSort = true;
                        meiliSortedIds = topWishIds;
                    }
                    else
                    {
                        query = sortKey switch
                        {
                            "productname" => sortDirection.ToLower() == "asc" ? query.OrderBy(p => p.ProductName) : query.OrderByDescending(p => p.ProductName),
                            "price" => sortDirection.ToLower() == "asc" ? query.OrderBy(p => p.Price) : query.OrderByDescending(p => p.Price),
                            "code" => sortDirection.ToLower() == "asc" ? query.OrderBy(p => p.Code) : query.OrderByDescending(p => p.Code),
                            "categoryname" => sortDirection.ToLower() == "asc" ? query.OrderBy(p => p.Category!.CategoryName) : query.OrderByDescending(p => p.Category!.CategoryName),
                            "ratingcount" => sortDirection.ToLower() == "asc" ? query.OrderBy(p => p.ReviewCount) : query.OrderByDescending(p => p.ReviewCount),
                            _ => sortDirection.ToLower() == "asc" ? query.OrderBy(p => p.CreatedAt) : query.OrderByDescending(p => p.CreatedAt)
                        };
                    }
                }

                List<Product> productsBase;
                if (useRelevanceSort)
                {
                    // Lấy toàn bộ danh sách ID đã lọc (tối đa 100), sắp xếp trên RAM theo điểm relevance của Meilisearch, sau đó phân trang.
                    var allMatching = await query
                        .AsSingleQuery()
                        .Include(p => p.Category)
                        .Include(p => p.Supplier)
                        .ToListAsync();

                    productsBase = allMatching
                        .OrderBy(p => meiliSortedIds!.IndexOf(p.ProductID))
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToList();
                }
                else
                {
                    // Câu query 1: Lấy thông tin cơ bản của Product và include Category, Supplier
                    productsBase = await query
                        .AsSingleQuery()
                        .Include(p => p.Category)
                        .Include(p => p.Supplier)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();
                }

                var productIds = productsBase.Select(p => p.ProductID).ToList();
                var productDtos = new List<ProductListItemDto>();

                if (productIds.Any())
                {
                    // Câu query 2: Lấy thông tin Variants
                    var variants = await _context.Variants
                        .AsNoTracking()
                        .Where(v => productIds.Contains(v.ProductID))
                        .ToListAsync();

                    var variantMap = variants.GroupBy(v => v.ProductID).ToDictionary(g => g.Key, g => g.ToList());

                    // Câu query 3: Lấy thông tin Images
                    var images = await _context.ProductImages
                        .AsNoTracking()
                        .Where(i => productIds.Contains(i.ProductID))
                        .ToListAsync();

                    var imageMap = images.GroupBy(i => i.ProductID).ToDictionary(g => g.Key, g => g.ToList());

                    // Câu query 4: Lấy Review stats
                    var reviewStats = await _context.Reviews
                        .AsNoTracking()
                        .Where(r => !r.IsHidden && r.Variant != null && productIds.Contains(r.Variant.ProductID))
                        .GroupBy(r => r.Variant!.ProductID)
                        .Select(g => new {
                            ProductID = g.Key,
                            AverageRating = g.Average(r => r.Rating),
                            RatingCount = g.Count()
                        })
                        .ToDictionaryAsync(x => x.ProductID, x => x);

                    // Map dữ liệu trên RAM (Tránh N+1)
                    foreach (var p in productsBase)
                    {
                        var pVariants = variantMap.GetValueOrDefault(p.ProductID) ?? new List<Variant>();
                        var pActiveVariants = pVariants.Where(v => v.Status).ToList();
                        var pImages = imageMap.GetValueOrDefault(p.ProductID) ?? new List<ProductImage>();

                        var dto = new ProductListItemDto
                        {
                            ProductID = p.ProductID,
                            Code = p.Code,
                            Slug = p.Slug,
                            ProductName = p.ProductName,
                            Description = p.Description,
                            Specifications = p.Specifications,
                            Price = p.Price,
                            ProductDiscountPercent = p.ProductDiscountPercent,
                            Stock = p.Stock,
                            Status = p.Status,
                            SupportsSubscription = p.SupportsSubscription,
                            CategoryID = p.CategoryID,
                            CategoryName = p.Category?.CategoryName ?? "",
                            SupplierID = p.SupplierID,
                            SupplierName = p.Supplier?.SupplierName ?? "",
                            CreatedAt = p.CreatedAt,
                            CreatedBy = p.CreatedBy,
                            
                            TotalStock = pVariants.Sum(v => v.Stock),
                            VariantCount = pVariants.Count,
                            
                            ImageUrl = pVariants.Where(v => !string.IsNullOrEmpty(v.ImageUrl)).OrderBy(v => v.VariantID).Select(v => v.ImageUrl).FirstOrDefault()
                                       ?? pImages.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault()
                        };

                        if (pActiveVariants.Any())
                        {
                            dto.MinPrice = pActiveVariants.Min(v => v.UnitPrice);
                            dto.MaxPrice = pActiveVariants.Max(v => v.UnitPrice);

                            var effectivePrices = pActiveVariants.Select(v =>
                                v.UnitPrice * (1m - ((v.VariantDiscountPercent > 0 ? v.VariantDiscountPercent : p.ProductDiscountPercent) / 100m)));

                            dto.MinEffectivePrice = effectivePrices.Min();
                            dto.MaxEffectivePrice = effectivePrices.Max();
                        }
                        else
                        {
                            dto.MinPrice = 0;
                            dto.MaxPrice = 0;
                            dto.MinEffectivePrice = 0;
                            dto.MaxEffectivePrice = 0;
                        }

                        if (reviewStats.TryGetValue(p.ProductID, out var stats))
                        {
                            dto.Rating = stats.AverageRating;
                            dto.RatingCount = stats.RatingCount;
                        }

                        productDtos.Add(dto);
                    }
                }

                var result = new ProductPaginationDto
                {
                    Products = productDtos,
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

                // Lưu vào cache
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(10))
                    .AddExpirationToken(new CancellationChangeToken(_resetCacheToken.Token));
                _cache.Set(cacheKey, result, cacheOptions);

                return result;
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
                    .FirstOrDefaultAsync(p => p.ProductID == id && !p.IsDeleted);

                if (product == null) return null;

                var reviewStats = await _context.Reviews
                    .AsNoTracking()
                    .Where(r => !r.IsHidden && r.Variant != null && r.Variant.ProductID == id)
                    .GroupBy(r => r.Variant.ProductID)
                    .Select(g => new
                    {
                        AverageRating = g.Average(r => r.Rating),
                        RatingCount = g.Count()
                    })
                    .FirstOrDefaultAsync();

                return new ProductDto
                {
                    ProductID = product.ProductID,
                    Code = product.Code,
                    Slug = product.Slug,
                    ProductName = product.ProductName,
                    Description = product.Description,
                    MetaTitle = product.MetaTitle,
                    MetaDescription = product.MetaDescription,
                    Specifications = product.Specifications,
                    Price = product.Price,
                    ProductDiscountPercent = product.ProductDiscountPercent,
                    Stock = product.Stock,
                    Status = product.Status,
                    SupportsSubscription = product.SupportsSubscription,
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
                    Rating = product.AverageRating > 0 ? product.AverageRating : (reviewStats?.AverageRating ?? 0),
                    RatingCount = product.ReviewCount > 0 ? product.ReviewCount : (reviewStats?.RatingCount ?? 0)
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
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.ProductID == id && !p.IsDeleted);

                if (product == null) return null;

                var reviewStats = await _context.Reviews
                    .AsNoTracking()
                    .Where(r => !r.IsHidden && r.Variant != null && r.Variant.ProductID == id)
                    .GroupBy(r => r.Variant.ProductID)
                    .Select(g => new
                    {
                        AverageRating = g.Average(r => r.Rating),
                        RatingCount = g.Count()
                    })
                    .FirstOrDefaultAsync();

                return new ProductDetailDto
                {
                    ProductID = product.ProductID,
                    Code = product.Code,
                    Slug = product.Slug,
                    ProductName = product.ProductName,
                    Description = product.Description,
                    MetaTitle = product.MetaTitle,
                    MetaDescription = product.MetaDescription,
                    Specifications = product.Specifications,
                    Price = product.Price,
                    ProductDiscountPercent = product.ProductDiscountPercent,
                    Stock = product.Stock,
                    Status = product.Status,
                    SupportsSubscription = product.SupportsSubscription,
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
                    Rating = product.AverageRating > 0 ? product.AverageRating : (reviewStats?.AverageRating ?? 0),
                    RatingCount = product.ReviewCount > 0 ? product.ReviewCount : (reviewStats?.RatingCount ?? 0),
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
                    }).ToList(),
                    ImageUrls = product.Images?.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList() ?? new List<string>()
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

                // Generate slug
                var slugStr = !string.IsNullOrWhiteSpace(dto.Slug) ? dto.Slug : dto.ProductName;
                var slug = await GenerateUniqueSlugAsync(GenerateSlug(slugStr));

                var product = new Product
                {
                    Code = dto.Code,
                    Slug = slug,
                    MetaTitle = dto.MetaTitle ?? dto.ProductName,
                    MetaDescription = (dto.MetaDescription ?? dto.Description)?.Length > 500 ? (dto.MetaDescription ?? dto.Description).Substring(0, 500) : (dto.MetaDescription ?? dto.Description),
                    ProductName = dto.ProductName,
                    Description = dto.Description,
                    Specifications = dto.Specifications,
                    Price = dto.Price,
                    ProductDiscountPercent = dto.ProductDiscountPercent,
                    Stock = dto.Stock,
                    CategoryID = dto.CategoryID,
                    SupplierID = dto.SupplierID ?? 0, // Default supplier if not provided
                    CreatedAt = DateTime.Now,
                    CreatedBy = dto.CreatedBy ?? "System",
                    Status = true,
                    SupportsSubscription = dto.SupportsSubscription
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();
                ClearProductCache();

                try { await _searchEngineService.IndexProductAsync(product); } catch (Exception e) { _logger.LogError(e, "Error syncing to Meilisearch"); }

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

        public async Task<ServiceResult<ProductDto>> CreateFullProductAsync(CreateFullProductDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Validation: Tên sản phẩm bắt buộc
                if (string.IsNullOrWhiteSpace(dto.ProductName))
                {
                    return new ServiceResult<ProductDto>
                    {
                        Success = false,
                        Message = "Tên sản phẩm không được để trống"
                    };
                }

                // 2. Validation: SKU/Code sản phẩm gốc không trùng lặp
                if (!string.IsNullOrWhiteSpace(dto.Code) && await IsProductCodeExistAsync(dto.Code))
                {
                    return new ServiceResult<ProductDto>
                    {
                        Success = false,
                        Message = $"Mã sản phẩm (SKU) '{dto.Code}' đã tồn tại"
                    };
                }

                // Tự động sinh mã sản phẩm nếu trống
                var productCode = string.IsNullOrWhiteSpace(dto.Code) ? await GenerateProductCodeAsync() : dto.Code.Trim();

                // 3. Validation: Category phải tồn tại
                var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryID == dto.CategoryID);
                if (!categoryExists)
                {
                    return new ServiceResult<ProductDto>
                    {
                        Success = false,
                        Message = "Danh mục sản phẩm không tồn tại hoặc đã bị ẩn"
                    };
                }

                // 4. Validation: Supplier (thương hiệu) phải tồn tại nếu truyền
                if (dto.SupplierID.HasValue && dto.SupplierID.Value > 0)
                {
                    var supplierExists = await _context.Suppliers.AnyAsync(s => s.SupplierID == dto.SupplierID.Value);
                    if (!supplierExists)
                    {
                        return new ServiceResult<ProductDto>
                        {
                            Success = false,
                            Message = "Thương hiệu không tồn tại hoặc đã bị ẩn"
                        };
                    }
                }

                // 5. Validation: Option không trùng tên
                var optionNames = dto.Options.Select(o => o.Name.Trim()).ToList();
                if (optionNames.Count != optionNames.Distinct(StringComparer.OrdinalIgnoreCase).Count())
                {
                    return new ServiceResult<ProductDto>
                    {
                        Success = false,
                        Message = "Không cho phép trùng tên các thuộc tính (Options)"
                    };
                }

                // 6. Validation: Trùng Value trong cùng Option
                foreach (var option in dto.Options)
                {
                    var values = option.Values.Select(v => v.Value.Trim()).ToList();
                    if (values.Count != values.Distinct(StringComparer.OrdinalIgnoreCase).Count())
                    {
                        return new ServiceResult<ProductDto>
                        {
                            Success = false,
                            Message = $"Thuộc tính '{option.Name}' có các giá trị trùng lặp"
                        };
                    }
                }

                // 7. Validation: Trùng mã SKU của các biến thể
                var variantSkus = dto.Variants.Where(v => !string.IsNullOrWhiteSpace(v.SKU)).Select(v => v.SKU.Trim()).ToList();
                if (variantSkus.Count != variantSkus.Distinct(StringComparer.OrdinalIgnoreCase).Count())
                {
                    return new ServiceResult<ProductDto>
                    {
                        Success = false,
                        Message = "Mã SKU của các biến thể trong danh sách bị trùng lặp"
                    };
                }

                foreach (var sku in variantSkus)
                {
                    var skuExistsInDb = await _context.Variants.AnyAsync(v => v.SKU == sku && !v.IsDeleted);
                    if (skuExistsInDb)
                    {
                        return new ServiceResult<ProductDto>
                        {
                            Success = false,
                            Message = $"Mã SKU '{sku}' của biến thể đã tồn tại trong hệ thống"
                        };
                    }
                }

                // Generate slug
                var slugStr = !string.IsNullOrWhiteSpace(dto.Slug) ? dto.Slug : dto.ProductName;
                var slug = await GenerateUniqueSlugAsync(GenerateSlug(slugStr));

                // 8. Tạo Product
                var product = new Product
                {
                    Code = productCode,
                    Slug = slug,
                    MetaTitle = dto.MetaTitle ?? dto.ProductName,
                    MetaDescription = (dto.MetaDescription ?? dto.Description)?.Length > 500 ? (dto.MetaDescription ?? dto.Description).Substring(0, 500) : (dto.MetaDescription ?? dto.Description),
                    ProductName = dto.ProductName,
                    Description = dto.Description ?? "",
                    Specifications = dto.Specifications ?? "",
                    Price = dto.Price,
                    ProductDiscountPercent = dto.ProductDiscountPercent,
                    Stock = dto.Variants.Any() ? dto.Variants.Sum(v => v.Stock) : dto.Stock,
                    CategoryID = dto.CategoryID,
                    SupplierID = dto.SupplierID ?? 0,
                    CreatedAt = DateTime.Now,
                    CreatedBy = dto.CreatedBy ?? "System",
                    Status = dto.Status,
                    SupportsSubscription = dto.SupportsSubscription
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                // 8.1 Thêm ảnh sản phẩm
                if (dto.Images != null && dto.Images.Any())
                {
                    int index = 1;
                    foreach (var imgUrl in dto.Images)
                    {
                        if (!string.IsNullOrWhiteSpace(imgUrl))
                        {
                            _context.ProductImages.Add(new ProductImage
                            {
                                ProductID = product.ProductID,
                                ImageUrl = imgUrl,
                                DisplayOrder = index++
                            });
                        }
                    }
                    await _context.SaveChangesAsync();
                }


                // Map để lưu trữ ID của Option Value phục vụ cho ánh xạ Variant
                // Key cấp 1: Tên Option (vd: "Màu sắc")
                // Key cấp 2: Giá trị (vd: "Đỏ")
                // Value: ProductOptionValueID vừa sinh trong DB
                var optionValueMap = new Dictionary<string, Dictionary<string, int>>(StringComparer.OrdinalIgnoreCase);

                // 9. Tạo Product Options & Values
                foreach (var optDto in dto.Options)
                {
                    var option = new ProductOption
                    {
                        ProductID = product.ProductID,
                        Name = optDto.Name,
                        DisplayOrder = optDto.DisplayOrder,
                        CreatedAt = DateTime.Now,
                        CreatedBy = dto.CreatedBy ?? "System"
                    };
                    _context.ProductOptions.Add(option);
                    await _context.SaveChangesAsync();

                    var valMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                    foreach (var valDto in optDto.Values)
                    {
                        var optVal = new ProductOptionValue
                        {
                            ProductOptionID = option.ProductOptionID,
                            Value = valDto.Value,
                            Price = valDto.Price,
                            DisplayOrder = valDto.DisplayOrder,
                            CreatedAt = DateTime.Now,
                            CreatedBy = dto.CreatedBy ?? "System"
                        };
                        _context.ProductOptionValues.Add(optVal);
                        await _context.SaveChangesAsync();

                        valMap[valDto.Value] = optVal.ProductOptionValueID;
                    }

                    optionValueMap[optDto.Name] = valMap;
                }

                // 10. Tạo các Variants và gắn Variant Option Values
                foreach (var varDto in dto.Variants)
                {
                    var sku = string.IsNullOrWhiteSpace(varDto.SKU)
                        ? $"SP{Random.Shared.Next(10000000, 99999999)}"
                        : varDto.SKU.Trim();

                    var variant = new Variant
                    {
                        ProductID = product.ProductID,
                        VariantName = varDto.VariantName,
                        UnitPrice = varDto.UnitPrice,
                        VariantDiscountPercent = varDto.VariantDiscountPercent,
                        Stock = varDto.Stock,
                        SKU = sku,
                        ImageUrl = varDto.ImageUrl,
                        Description = varDto.Description ?? "",
                        CreatedAt = DateTime.Now,
                        CreatedBy = dto.CreatedBy ?? "System",
                        Status = varDto.Status
                    };

                    _context.Variants.Add(variant);
                    await _context.SaveChangesAsync();

                    foreach (var mapDto in varDto.OptionValues)
                    {
                        if (optionValueMap.TryGetValue(mapDto.OptionName, out var valMap) &&
                            valMap.TryGetValue(mapDto.Value, out var optValId))
                        {
                            var vov = new VariantOptionValue
                            {
                                VariantID = variant.VariantID,
                                ProductOptionValueID = optValId
                            };
                            _context.VariantOptionValues.Add(vov);
                        }
                        else
                        {
                            throw new InvalidOperationException($"Không tìm thấy thuộc tính '{mapDto.OptionName}' với giá trị '{mapDto.Value}'");
                        }
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                ClearProductCache();

                try { await _searchEngineService.IndexProductAsync(product); } catch (Exception e) { _logger.LogError(e, "Error syncing to Meilisearch"); }

                _logger.LogInformation("Product Created: {ProductName} (ID: {ProductID})", product.ProductName, product.ProductID);
                _logger.LogInformation("Variants Generated: {VariantCount} variants created", dto.Variants.Count);

                var resultDto = await GetProductByIdAsync(product.ProductID);
                return new ServiceResult<ProductDto>
                {
                    Success = true,
                    Data = resultDto,
                    Message = "Tạo sản phẩm hoàn chỉnh thành công"
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating full product");
                return new ServiceResult<ProductDto>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi tạo sản phẩm: " + ex.Message
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
                var oldDiscount = product.ProductDiscountPercent;
                var oldFinalPrice = oldBasePrice * (1m - (oldDiscount / 100m));

                var slugStr = !string.IsNullOrWhiteSpace(dto.Slug) ? dto.Slug : dto.ProductName;
                var slug = await GenerateUniqueSlugAsync(GenerateSlug(slugStr), id);

                // Update product
                product.Code = dto.Code ?? product.Code;
                product.Slug = slug;
                product.MetaTitle = dto.MetaTitle ?? dto.ProductName;
                product.MetaDescription = (dto.MetaDescription ?? dto.Description)?.Length > 500 ? (dto.MetaDescription ?? dto.Description).Substring(0, 500) : (dto.MetaDescription ?? dto.Description);
                product.ProductName = dto.ProductName;
                product.Description = dto.Description;
                product.Specifications = dto.Specifications;
                product.Price = dto.Price;
                product.ProductDiscountPercent = dto.ProductDiscountPercent;
                product.Stock = dto.Stock;
                product.CategoryID = dto.CategoryID;
                product.SupplierID = dto.SupplierID ?? product.SupplierID;
                product.Status = dto.Status;
                product.SupportsSubscription = dto.SupportsSubscription;

                var newFinalPrice = dto.Price * (1m - (dto.ProductDiscountPercent / 100m));
                var priceDelta = dto.Price - oldBasePrice;

                // Đồng bộ giá biến thể theo giá gốc mới:
                // unitPrice mới = unitPrice cũ + (giá gốc mới - giá gốc cũ)
                if (product.Variants != null)
                {
                    foreach (var variant in product.Variants)
                    {
                        var oldVariantDiscount = variant.VariantDiscountPercent > 0 ? variant.VariantDiscountPercent : oldDiscount;
                        var oldVariantFinalPrice = variant.UnitPrice * (1m - (oldVariantDiscount / 100m));

                        if (priceDelta != 0)
                        {
                            variant.UnitPrice += priceDelta;
                            if (variant.UnitPrice < 0)
                                variant.UnitPrice = 0;
                        }
                            
                        var newVariantDiscount = variant.VariantDiscountPercent > 0 ? variant.VariantDiscountPercent : dto.ProductDiscountPercent;
                        var newVariantFinalPrice = variant.UnitPrice * (1m - (newVariantDiscount / 100m));

                        if (newVariantFinalPrice < oldVariantFinalPrice)
                        {
                            _backgroundJobClient.Enqueue<IProductAlertService>(s => s.ProcessPriceDropAlertsAsync(product.ProductID, variant.VariantID, newVariantFinalPrice));
                        }
                    }
                }
                
                if (newFinalPrice < oldFinalPrice)
                {
                    _backgroundJobClient.Enqueue<IProductAlertService>(s => s.ProcessPriceDropAlertsAsync(product.ProductID, null, newFinalPrice));
                }
                
                var oldStock = product.Stock;
                if (oldStock == 0 && dto.Stock > 0)
                {
                    _backgroundJobClient.Enqueue<IProductAlertService>(s => s.ProcessBackInStockAlertsAsync(product.ProductID, null));
                }

                await _context.SaveChangesAsync();

                var oldValuesStr = System.Text.Json.JsonSerializer.Serialize(new { Price = oldBasePrice, ProductName = product.ProductName, Status = product.Status });
                var newValuesStr = System.Text.Json.JsonSerializer.Serialize(new { Price = dto.Price, ProductName = dto.ProductName, Status = dto.Status });
                await _auditLogService.LogAsync("UpdateProduct", "Product", id.ToString(), oldValuesStr, newValuesStr, $"Cập nhật sản phẩm: {dto.ProductName}");

                // Cập nhật ProductImages nếu được truyền lên
                if (dto.Images != null)
                {
                    // Xóa ảnh cũ
                    var oldImages = await _context.ProductImages.Where(i => i.ProductID == product.ProductID).ToListAsync();
                    _context.ProductImages.RemoveRange(oldImages);
                    
                    // Thêm ảnh mới
                    if (dto.Images.Any())
                    {
                        int index = 1;
                        foreach (var imgUrl in dto.Images)
                        {
                            if (!string.IsNullOrWhiteSpace(imgUrl))
                            {
                                _context.ProductImages.Add(new ProductImage
                                {
                                    ProductID = product.ProductID,
                                    ImageUrl = imgUrl,
                                    DisplayOrder = index++
                                });
                            }
                        }
                    }
                    await _context.SaveChangesAsync();
                }

                // Xóa ảnh biến thể nếu được yêu cầu (ưu tiên ảnh sản phẩm)
                if (dto.ClearVariantImages && product.Variants != null)
                {
                    foreach (var variant in product.Variants)
                    {
                        variant.ImageUrl = null;
                    }
                    await _context.SaveChangesAsync();
                }
                
                ClearProductCache();

                try { await _searchEngineService.IndexProductAsync(product); } catch (Exception e) { _logger.LogError(e, "Error syncing to Meilisearch"); }

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

                product.IsDeleted = true;
                product.Status = false;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                ClearProductCache();

                try { await _searchEngineService.DeleteProductAsync(id); } catch (Exception e) { _logger.LogError(e, "Error deleting from Meilisearch"); }

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
                ClearProductCache();

                return new ServiceResult<bool>
                {
                    Success = true,
                    Data = product.Status
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

        public async Task<ServiceResult<bool>> ToggleProductSubscriptionAsync(int id)
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

                product.SupportsSubscription = !product.SupportsSubscription;
                await _context.SaveChangesAsync();
                ClearProductCache();

                return new ServiceResult<bool>
                {
                    Success = true,
                    Data = product.SupportsSubscription,
                    Message = product.SupportsSubscription ? "Bật tính năng mua định kỳ thành công" : "Tắt tính năng mua định kỳ thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling product subscription {ProductId}", id);
                return new ServiceResult<bool>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi cập nhật tính năng mua định kỳ"
                };
            }
        }

        public async Task<ServiceResult<bool>> BulkSetSubscriptionStatusAsync(List<int> ids, bool isEnabled)
        {
            try
            {
                var products = await _context.Products.Where(p => ids.Contains(p.ProductID)).ToListAsync();
                if (!products.Any())
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        Message = "Không tìm thấy sản phẩm nào"
                    };
                }

                foreach (var product in products)
                {
                    product.SupportsSubscription = isEnabled;
                }

                await _context.SaveChangesAsync();
                ClearProductCache();

                return new ServiceResult<bool>
                {
                    Success = true,
                    Data = true,
                    Message = $"Đã cập nhật trạng thái mua định kỳ cho {products.Count} sản phẩm"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk updating product subscription for {Count} products", ids.Count);
                return new ServiceResult<bool>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi cập nhật nhiều sản phẩm"
                };
            }
        }

        public async Task<List<CategorySelectDto>> GetCategoriesForSelectAsync()
        {
            var categories = await _context.Categories.AsNoTracking().Where(c => c.Status).ToListAsync();
            var directCounts = await _context.Products.AsNoTracking()
                .Where(p => p.Status)
                .GroupBy(p => p.CategoryID)
                .Select(g => new { CategoryID = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryID, x => x.Count);

            var childrenMap = categories
                .Where(c => c.ParentID.HasValue)
                .GroupBy(c => c.ParentID!.Value)
                .ToDictionary(g => g.Key, g => g.Select(c => c.CategoryID).ToList());

            int GetCount(int catId)
            {
                int count = directCounts.TryGetValue(catId, out var direct) ? direct : 0;
                if (childrenMap.TryGetValue(catId, out var children))
                {
                    foreach (var childId in children)
                    {
                        count += GetCount(childId);
                    }
                }
                return count;
            }

            return categories
                .OrderBy(c => c.Level)
                .ThenBy(c => c.CategoryName)
                .Select(c => new CategorySelectDto
                {
                    CategoryID = c.CategoryID,
                    CategoryName = c.CategoryName,
                    ParentID = c.ParentID,
                    Level = c.Level,
                    Status = c.Status,
                    ProductCount = GetCount(c.CategoryID)
                })
                .ToList();
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

            var query = _context.Products.Where(p => p.Code == code && !p.IsDeleted);
            
            if (excludeId.HasValue)
                query = query.Where(p => p.ProductID != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<object> GetProductStatsAsync()
        {
            var totalProducts = await _context.Products.CountAsync(p => !p.IsDeleted);
            var activeProducts = await _context.Products.CountAsync(p => p.Status && !p.IsDeleted);
            // S\u1ea3n ph\u1ea9m \u0111\u01b0\u1ee3c coi l\u00e0 h\u1ebft h\u00e0ng khi:
            // - Kh\u00f4ng c\u00f3 bi\u1ebfn th\u1ec3: Stock g\u1ed1c == 0
            // - C\u00f3 bi\u1ebfn th\u1ec3: T\u1ed5ng t\u1ed3n kho bi\u1ebfn th\u1ec3 == 0
            var outOfStockProducts = await _context.Products
                .CountAsync(p => p.Variants.Any()
                    ? p.Variants.Sum(v => v.Stock) == 0
                    : p.Stock == 0);
            
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

        public async Task<object> GetSubscriptionStatsAsync()
        {
            var totalProducts = await _context.Products.CountAsync(p => !p.IsDeleted);
            var activeSubscriptions = await _context.Products.CountAsync(p => p.SupportsSubscription && !p.IsDeleted);
            var inactiveSubscriptions = totalProducts - activeSubscriptions;
            
            return new
            {
                totalProducts,
                activeSubscriptions,
                inactiveSubscriptions
            };
        }

        private async Task<string> GenerateProductCodeAsync()
        {
            var count = await _context.Products.CountAsync();
            return $"SP{(count + 1):D6}"; // SP000001, SP000002, etc.
        }

        public async Task<ProductDetailDto?> GetProductBySlugAsync(string slug)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Slug == slug && !p.IsDeleted);
            if (product == null) return null;
            return await GetProductDetailAsync(product.ProductID);
        }

        private string GenerateSlug(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            var slug = input.ToLowerInvariant();

            string[] vietnameseSigns = new string[] {
                "aAeEoOuUiIdDyY",
                "áàạảãâấầậẩẫăắằặẳẵ",
                "ÁÀẠẢÃÂẤẦẬẨẪĂẮẰẶẲẴ",
                "éèẹẻẽêếềệểễ",
                "ÉÈẸẺẼÊẾỀỆỂỄ",
                "óòọỏõôốồộổỗơớờợởỡ",
                "ÓÒỌỎÕÔỐỒỘỔỖƠỚỜỢỞỠ",
                "úùụủũưứừựửữ",
                "ÚÙỤỦŨƯỨỪỰỬỮ",
                "íìịỉĩ",
                "ÍÌỊỈĨ",
                "đ",
                "Đ",
                "ýỳỵỷỹ",
                "ÝỲỴỶỸ"
            };

            for (int i = 1; i < vietnameseSigns.Length; i++)
            {
                for (int j = 0; j < vietnameseSigns[i].Length; j++)
                {
                    slug = slug.Replace(vietnameseSigns[i][j], vietnameseSigns[0][i - 1]);
                }
            }
            slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-").Trim('-');

            return slug;
        }

        private async Task<string> GenerateUniqueSlugAsync(string baseSlug, int? excludeId = null)
        {
            var slug = baseSlug;
            var counter = 1;
            
            var query = _context.Products.AsQueryable();
            if (excludeId.HasValue)
                query = query.Where(p => p.ProductID != excludeId.Value);

            while (await query.AnyAsync(p => p.Slug == slug))
            {
                slug = $"{baseSlug}-{counter}";
                counter++;
            }
            return slug;
        }
        public async Task<ServiceResult<object>> SyncSeoFieldsAsync()
        {
            try
            {
                var productsToUpdate = await _context.Products
                    .Where(p => string.IsNullOrEmpty(p.Slug) || string.IsNullOrEmpty(p.MetaTitle) || string.IsNullOrEmpty(p.MetaDescription))
                    .ToListAsync();

                var updatedProductsList = new List<object>();
                
                foreach (var product in productsToUpdate)
                {
                    bool isUpdated = false;
                    
                    if (string.IsNullOrEmpty(product.Slug))
                    {
                        var baseSlug = GenerateSlug(product.ProductName);
                        product.Slug = await GenerateUniqueSlugAsync(baseSlug, product.ProductID);
                        isUpdated = true;
                    }

                    if (string.IsNullOrEmpty(product.MetaTitle))
                    {
                        var title = product.ProductName ?? "";
                        product.MetaTitle = title.Length > 255 ? title.Substring(0, 255) : title;
                        isUpdated = true;
                    }

                    if (string.IsNullOrEmpty(product.MetaDescription))
                    {
                        var plainTextDesc = System.Text.RegularExpressions.Regex.Replace(product.Description ?? "", "<.*?>", String.Empty);
                        product.MetaDescription = plainTextDesc.Length > 500 ? plainTextDesc.Substring(0, 500) : plainTextDesc;
                        isUpdated = true;
                    }

                    if (isUpdated)
                    {
                        _context.Products.Update(product);
                        await _context.SaveChangesAsync();
                        
                        updatedProductsList.Add(new {
                            id = product.ProductID,
                            name = product.ProductName,
                            slug = product.Slug,
                            metaTitle = product.MetaTitle,
                            metaDescription = product.MetaDescription
                        });
                    }
                }

                if (updatedProductsList.Count > 0)
                {
                    ClearProductCache();
                }

                return ServiceResult<object>.Ok(new {
                    count = updatedProductsList.Count,
                    products = updatedProductsList
                }, "Đồng bộ SEO thành công");
            }
            catch (Exception ex)
            {
                return ServiceResult<object>.Fail($"Lỗi đồng bộ SEO: {ex.Message}");
            }
        }
    }
}
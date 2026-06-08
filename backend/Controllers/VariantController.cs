using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
[Authorize]
    public class VariantController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IVariantService _variantService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ILogger<VariantController> _logger;

        public VariantController(
            ApplicationDbContext context,
            IVariantService variantService,
            ICloudinaryService cloudinaryService,
            ILogger<VariantController> logger)
        {
            _context = context;
            _variantService = variantService;
            _cloudinaryService = cloudinaryService;
            _logger = logger;
        }

        #region GET Endpoints

        /// <summary>
        /// Lấy danh sách biến thể của một sản phẩm với phân trang, tìm kiếm và sắp xếp
        /// </summary>

        [HttpGet("product/{productId}")]
        [Permission("Product.Read")]
        public async Task<ActionResult> GetVariantsByProduct(
            int productId, 
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null)
        {
            try
            {
                var product = await _context.Products.FindAsync(productId);
                if (product == null)
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });

                // Get total count
                var query = _context.Variants
                    .Where(v => v.ProductID == productId);

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(v => v.VariantName.Contains(searchTerm) || v.SKU.Contains(searchTerm));
                }

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                // Get paginated data
                var variants = await query
                    .OrderByDescending(v => v.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(v => new
                    {
                        v.VariantID,
                        v.ProductID,
                        v.VariantName,
                        v.SKU,
                        v.UnitPrice,
                        v.VariantDiscountPercent,
                        EffectiveDiscountPercent = v.VariantDiscountPercent > 0 ? v.VariantDiscountPercent : v.Product.ProductDiscountPercent,
                        FinalPrice = v.UnitPrice * (1m - ((v.VariantDiscountPercent > 0 ? v.VariantDiscountPercent : v.Product.ProductDiscountPercent) / 100m)),
                        v.Stock,
                        v.ImageUrl,
                        v.Status,
                        v.CreatedAt,
                        v.CreatedBy,
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    pageCount = totalPages,
                    currentPage = page,
                    pageSize,
                    data = variants
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting variants for product {ProductId}", productId);
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách biến thể", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một biến thể theo ID, bao gồm thông tin sản phẩm cha và các thuộc tính đã chọn
        /// </summary>

        [HttpGet("{id}")]
        [Permission("Product.Read")]
        public async Task<ActionResult> GetVariantById(int id)
        {
            try
            {
                var variant = await _variantService.GetVariantByIdAsync(id);
                if (variant == null)
                    return NotFound(new { message = "Không tìm thấy biến thể" });

                return Ok(variant);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting variant {VariantId}", id);
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin biến thể", error = ex.Message });
            }
        }

        /// <summary>
        /// Tạo tổ hợp biến thể tự động dựa trên các thuộc tính và giá trị đã có của sản phẩm
        /// </summary>

        [HttpGet("generate-combinations/{productId}")]
        [Permission("Product.Read")]
        public async Task<ActionResult> GenerateVariantCombinations(int productId)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.ProductOptions)
                        .ThenInclude(po => po.ProductOptionValues)
                    .FirstOrDefaultAsync(p => p.ProductID == productId);

                if (product == null)
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });

                if (!product.ProductOptions.Any() || product.ProductOptions.All(po => !po.ProductOptionValues.Any()))
                    return BadRequest(new { message = "Vui lòng thêm thuộc tính và giá trị trước khi tạo biến thể" });

                var combinations = await _variantService.GenerateVariantCombinationsAsync(productId);

                return Ok(new
                {
                    productId,
                    productName = product.ProductName,
                    productCode = product.Code,
                    totalCombinations = combinations.Count,
                    combinations
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating variant combinations for product {ProductId}", productId);
                return StatusCode(500, new { message = "Lỗi khi tạo tổ hợp biến thể", error = ex.Message });
            }
        }

        #endregion

        #region POST Endpoints

        /// <summary>
        /// Tạo variant (không có upload ảnh - dùng DTO với ImageUrl)
        /// </summary>
        [HttpPost]
        [Permission("Product.Create")]
        public async Task<ActionResult> CreateVariant([FromBody] VariantCreateDto dto)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.ProductOptions)
                        .ThenInclude(po => po.ProductOptionValues)
                    .FirstOrDefaultAsync(p => p.ProductID == dto.ProductID);

                if (product == null)
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });

                var hasOptions = product.ProductOptions != null && product.ProductOptions.Any();
                var hasOptionValueIds = dto.OptionValueIds != null && dto.OptionValueIds.Any();

                // Chỉ validate OptionValueIds khi sản phẩm có options
                if (hasOptions && !hasOptionValueIds)
                    return BadRequest(new { message = "Vui lòng chọn thuộc tính cho biến thể" });

                if (hasOptions && hasOptionValueIds)
                {
                    var requiredOptionsCount = product.ProductOptions.Count;
                    var selectedOptionsCount = dto.OptionValueIds.Count;

                    if (selectedOptionsCount < requiredOptionsCount)
                    {
                        return BadRequest(new
                        {
                            message = $"Vui lòng chọn đầy đủ {requiredOptionsCount} thuộc tính (đã chọn: {selectedOptionsCount})"
                        });
                    }

                    if (await _variantService.VariantExistsAsync(dto.ProductID, dto.OptionValueIds))
                        return BadRequest(new { message = "Biến thể này đã tồn tại" });
                }

                var selectedOptionValues = hasOptionValueIds
                    ? await _context.ProductOptionValues
                        .Where(pov => dto.OptionValueIds.Contains(pov.ProductOptionValueID))
                        .ToListAsync()
                    : new List<ProductOptionValue>();

                decimal calculatedPrice = product.Price + selectedOptionValues.Sum(v => v.Price);
                decimal finalPrice = calculatedPrice;

                // Cho phép giá = 0 (ví dụ: sản phẩm miễn phí hoặc chưa có giá)
                if (finalPrice < 0)
                    return BadRequest(new { message = "Giá biến thể không được âm" });

                string sku = dto.SKU;
                if (string.IsNullOrWhiteSpace(sku))
                {
                    string generatedSKU;
                    int attempts = 0;
                    do
                    {
                        generatedSKU = GenerateVariantSKU(product.Code);
                        attempts++;
                        if (attempts >= 10)
                        {
                            generatedSKU = $"{product.Code.Substring(0, Math.Min(4, product.Code.Length))}{DateTime.Now:HHmmss}";
                            break;
                        }
                    }
                    while (await _context.Variants.AnyAsync(v => v.SKU == generatedSKU));
                    sku = generatedSKU;
                }

                string variantName = dto.Name;
                if (string.IsNullOrWhiteSpace(variantName))
                {
                    variantName = product.ProductName;
                    foreach (var optionValue in selectedOptionValues)
                        variantName += $" - {optionValue.Value}";
                }

                var variant = new Variant
                {
                    ProductID = dto.ProductID,
                    VariantName = variantName,
                    UnitPrice = finalPrice,
                    VariantDiscountPercent = dto.VariantDiscountPercent,
                    Stock = dto.Stock,
                    SKU = sku,
                    Description = dto.Description ?? $"Biến thể {variantName}",
                    ImageUrl = dto.ImageUrl,
                    CreatedAt = DateTime.Now,
                    CreatedBy = User.Identity?.Name ?? "System",
                    Status = true
                };

                var success = await _variantService.CreateVariantAsync(variant, dto.OptionValueIds);

                if (success)
                {
                    return CreatedAtAction(nameof(GetVariantById), new { id = variant.VariantID },
                        new { message = "Tạo biến thể thành công", variant });
                }

                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo biến thể" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating variant");
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }

        /// <summary>
        /// Kiểm tra xem một tổ hợp thuộc tính đã tồn tại biến thể nào chưa (dùng để tránh tạo trùng khi chọn thuộc tính)
        /// </summary>

        [HttpPost("check-exists")]
        [Permission("Product.Read")]
        public async Task<IActionResult> CheckVariantExists([FromBody] CheckVariantExistsDto dto)
        {
            try
            {
                if (dto.OptionValueIds == null || !dto.OptionValueIds.Any())
                    return Ok(new { exists = false });

                var existingVariant = await _context.Variants
                    .Include(v => v.VariantOptionValues)
                    .Where(v => v.ProductID == dto.ProductID)
                    .FirstOrDefaultAsync(v =>
                        v.VariantOptionValues.Count == dto.OptionValueIds.Count &&
                        v.VariantOptionValues.All(vov => dto.OptionValueIds.Contains(vov.ProductOptionValueID)));

                if (existingVariant != null)
                {
                    return Ok(new
                    {
                        exists = true,
                        variant = new
                        {
                            variantId = existingVariant.VariantID,
                            variantName = existingVariant.VariantName,
                            sku = existingVariant.SKU,
                            unitPrice = existingVariant.UnitPrice,
                            stock = existingVariant.Stock,
                            imageUrl = existingVariant.ImageUrl,
                            status = existingVariant.Status
                        }
                    });
                }

                return Ok(new { exists = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking variant existence");
                return StatusCode(500, new { message = "Lỗi khi kiểm tra biến thể", error = ex.Message });
            }
        }
        /// <summary>
        /// Tạo nhiều variant cùng lúc
        /// </summary>
        [HttpPost("product/{productId}/multiple")]
        [Permission("Product.Create")]
        public async Task<ActionResult> CreateMultipleVariants(int productId, [FromBody] List<VariantCreateDto> dtos)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.ProductOptions)
                        .ThenInclude(po => po.ProductOptionValues)
                    .FirstOrDefaultAsync(p => p.ProductID == productId);

                if (product == null)
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });

                if (dtos == null || !dtos.Any())
                    return BadRequest(new { message = "Không có biến thể nào để tạo" });

                var createdVariants = new List<Variant>();
                var errors = new List<string>();

                foreach (var dto in dtos)
                {
                    try
                    {
                        // Validate
                        var hasOptions = product.ProductOptions != null && product.ProductOptions.Any();
                        var hasOptionValueIds = dto.OptionValueIds != null && dto.OptionValueIds.Any();

                        if (hasOptions && !hasOptionValueIds)
                        {
                            errors.Add($"Biến thể '{dto.Name}': Vui lòng chọn thuộc tính");
                            continue;
                        }

                        // Check if variant already exists
                        if (hasOptionValueIds && await _variantService.VariantExistsAsync(productId, dto.OptionValueIds))
                        {
                            errors.Add($"Biến thể '{dto.Name}': Đã tồn tại");
                            continue;
                        }

                        // Calculate price
                        var selectedOptionValues = hasOptionValueIds
                            ? await _context.ProductOptionValues
                                .Where(pov => dto.OptionValueIds.Contains(pov.ProductOptionValueID))
                                .ToListAsync()
                            : new List<ProductOptionValue>();

                        decimal calculatedPrice = product.Price + selectedOptionValues.Sum(v => v.Price);
                        decimal finalPrice = calculatedPrice;

                        // Generate SKU if not provided
                        string sku = dto.SKU;
                        if (string.IsNullOrWhiteSpace(sku))
                        {
                            string generatedSKU;
                            int attempts = 0;
                            do
                            {
                                generatedSKU = GenerateVariantSKU(product.Code);
                                attempts++;
                                if (attempts >= 10)
                                {
                                    generatedSKU = $"{product.Code.Substring(0, Math.Min(4, product.Code.Length))}{DateTime.Now:HHmmss}";
                                    break;
                                }
                            }
                            while (await _context.Variants.AnyAsync(v => v.SKU == generatedSKU));
                            sku = generatedSKU;
                        }

                        // Generate variant name if not provided
                        string variantName = dto.Name;
                        if (string.IsNullOrWhiteSpace(variantName))
                        {
                            variantName = product.ProductName;
                            foreach (var optionValue in selectedOptionValues)
                                variantName += $" - {optionValue.Value}";
                        }

                        // Create variant
                        var variant = new Variant
                        {
                            ProductID = productId,
                            VariantName = variantName,
                            UnitPrice = finalPrice,
                            VariantDiscountPercent = dto.VariantDiscountPercent,
                            Stock = dto.Stock,
                            SKU = sku,
                            Description = dto.Description ?? $"Biến thể {variantName}",
                            ImageUrl = dto.ImageUrl,
                            CreatedAt = DateTime.Now,
                            CreatedBy = dto.CreatedBy ?? User.Identity?.Name ?? "System", // ✅ QUAN TRỌNG: Thêm CreatedBy
                            Status = true
                        };

                        var success = await _variantService.CreateVariantAsync(variant, dto.OptionValueIds);

                        if (success)
                        {
                            createdVariants.Add(variant);
                        }
                        else
                        {
                            errors.Add($"Biến thể '{dto.Name}': Không thể tạo");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error creating variant {VariantName}", dto.Name);
                        errors.Add($"Biến thể '{dto.Name}': {ex.Message}");
                    }
                }

                if (createdVariants.Any())
                {
                    return Ok(new
                    {
                        success = true,
                        message = $"Đã tạo {createdVariants.Count}/{dtos.Count} biến thể",
                        createdCount = createdVariants.Count,
                        totalCount = dtos.Count,
                        errors = errors.Any() ? errors : null,
                        variants = createdVariants.Select(v => new
                        {
                            v.VariantID,
                            v.VariantName,
                            v.SKU,
                            v.UnitPrice,
                            v.Stock
                        })
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể tạo biến thể nào",
                    errors
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating multiple variants for product {ProductId}", productId);
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }

        #endregion

        #region PUT Endpoints

        /// <summary>
        /// Cập nhật thông tin biến thể (không có upload ảnh - dùng DTO với ImageUrl)
        /// </summary>

        [HttpPut("{id}")]
        [Permission("Product.Update")]
        public async Task<IActionResult> UpdateVariant(int id, [FromBody] VariantUpdateDto dto)
        {
            try
            {
                var existing = await _context.Variants.FindAsync(id);
                if (existing == null)
                    return NotFound(new { message = "Không tìm thấy biến thể" });

                existing.VariantName = dto.Name ?? existing.VariantName;
                existing.UnitPrice = dto.Price > 0 ? dto.Price : existing.UnitPrice;
                existing.VariantDiscountPercent = dto.VariantDiscountPercent;
                existing.Stock = dto.Stock >= 0 ? dto.Stock : existing.Stock;
                existing.Description = dto.Description ?? existing.Description;
                existing.Status = dto.Status;

                _context.Update(existing);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật biến thể thành công", variant = existing });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating variant {VariantId}", id);
                return StatusCode(500, new { message = "Lỗi khi cập nhật biến thể", error = ex.Message });
            }
        }

        /// <summary>
        /// Bật/tắt trạng thái của biến thể (ví dụ: để ẩn biến thể không còn bán mà không xóa)
        /// </summary>

        [HttpPut("{id}/toggle-status")]
        [Permission("Product.Update")]
        public async Task<IActionResult> ToggleStatus(int id, [FromBody] ToggleStatusDto dto)
        {
            try
            {
                var variant = await _context.Variants.FindAsync(id);
                if (variant == null)
                    return NotFound(new { message = "Không tìm thấy biến thể" });

                variant.Status = dto.Status;
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Đã {(dto.Status ? "bật" : "tắt")} biến thể", status = variant.Status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling variant status");
                return StatusCode(500, new { message = "Lỗi khi thay đổi trạng thái", error = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật tồn kho của biến thể (có thể dùng cho cả cập nhật thủ công và tự động sau khi bán hàng)
        /// </summary>

        [HttpPut("{id}/update-stock")]
        [Permission("Product.Update")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockDto dto)
        {
            try
            {
                if (dto.NewStock < 0)
                    return BadRequest(new { message = "Tồn kho không được âm" });

                var success = await _variantService.UpdateStockAsync(id, dto.NewStock);
                if (success)
                    return Ok(new { message = "Cập nhật tồn kho thành công", newStock = dto.NewStock });

                return NotFound(new { message = "Không tìm thấy biến thể" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stock for variant {VariantId}", id);
                return StatusCode(500, new { message = "Lỗi khi cập nhật tồn kho", error = ex.Message });
            }
        }

        /// <summary>
        /// Upload / cập nhật hình ảnh cho variant → Cloudinary folder "Variants"
        /// </summary>
        [HttpPost("{id}/upload-image")]
        [Permission("Product.Update")]
        public async Task<IActionResult> UploadVariantImage(int id, IFormFile image)
        {
            try
            {
                if (image == null || image.Length == 0)
                    return BadRequest(new { message = "Vui lòng chọn hình ảnh" });

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
                if (!allowedTypes.Contains(image.ContentType.ToLower()))
                    return BadRequest(new { message = "Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)" });

                // Validate file size (max 5MB)
                if (image.Length > 5 * 1024 * 1024)
                    return BadRequest(new { message = "Kích thước ảnh tối đa 5MB" });

                var variant = await _context.Variants.FindAsync(id);
                if (variant == null)
                    return NotFound(new { message = "Không tìm thấy biến thể" });

                // Thay thế ảnh trên Cloudinary bằng phương thức dùng chung
                var imageUrl = await _cloudinaryService.ReplaceImageAsync(variant.ImageUrl, image, "Variants");

                if (string.IsNullOrEmpty(imageUrl))
                    return StatusCode(500, new { message = "Không thể upload hình ảnh lên Cloudinary" });

                // Cập nhật URL vào database
                variant.ImageUrl = imageUrl;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Variant {VariantId} image updated: {ImageUrl}", id, imageUrl);

                return Ok(new
                {
                    message = "Cập nhật hình ảnh thành công",
                    imageUrl
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image for variant {VariantId}", id);
                return StatusCode(500, new { message = "Lỗi khi upload hình ảnh", error = ex.Message });
            }
        }

        /// <summary>
        /// Xóa hình ảnh variant
        /// </summary>
        [HttpDelete("{id}/image")]
        [Permission("Product.Update")]
        public async Task<IActionResult> DeleteVariantImage(int id)
        {
            try
            {
                var variant = await _context.Variants.FindAsync(id);
                if (variant == null)
                    return NotFound(new { message = "Không tìm thấy biến thể" });

                if (string.IsNullOrEmpty(variant.ImageUrl))
                    return BadRequest(new { message = "Biến thể chưa có hình ảnh" });

                // Xóa trên Cloudinary
                try { await _cloudinaryService.DeleteImageAsync(variant.ImageUrl); }
                catch (Exception ex) { _logger.LogWarning(ex, "Could not delete variant image from Cloudinary"); }

                variant.ImageUrl = null;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Xóa hình ảnh thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image for variant {VariantId}", id);
                return StatusCode(500, new { message = "Lỗi khi xóa hình ảnh", error = ex.Message });
            }
        }
        #endregion

        #region DELETE Endpoints

        /// <summary>
        /// Xóa biến thể nếu không có liên kết quan trọng (ví dụ: đang có trong giỏ hàng, đã bán ra trong đơn hàng, hoặc đang được sử dụng trong combo/bundle)
        /// </summary>

        [HttpDelete("{id}")]
        [Permission("Product.Delete")]
        public async Task<IActionResult> DeleteVariant(int id)
        {
            try
            {
                var variant = await _context.Variants.FindAsync(id);
                if (variant == null)
                    return NotFound(new { message = "Không tìm thấy biến thể" });

                var isUsed = await CheckVariantInUse(id);
                if (isUsed.isUsed)
                {
                    return BadRequest(new
                    {
                        message = $"Không thể xóa biến thể này vì {isUsed.reason}",
                        isUsed = true,
                        canForceDelete = isUsed.canForceDelete,
                        usageDetails = isUsed.details
                    });
                }

                if (!string.IsNullOrEmpty(variant.ImageUrl))
                {
                    try { await _cloudinaryService.DeleteImageAsync(variant.ImageUrl); }
                    catch (Exception ex) { _logger.LogWarning(ex, "Could not delete variant image"); }
                }

                var success = await _variantService.DeleteVariantAsync(id);
                if (success)
                    return Ok(new { message = "Xóa biến thể thành công" });

                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa biến thể" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting variant {VariantId}", id);
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }

        /// <summary>
        /// Xóa biến thể và tất cả dữ liệu liên quan (ví dụ: chi tiết giỏ hàng, chi tiết đơn hàng, combo/bundle) - chỉ dùng khi thực sự cần thiết và có xác nhận rõ ràng từ người dùng vì sẽ mất dữ liệu liên quan
        /// </summary>

        [HttpDelete("{id}/force")]
        [Authorize(Roles = "Admin")]
        [Permission("Product.Delete")]
        public async Task<IActionResult> ForceDeleteVariant(int id, [FromQuery] bool confirmForce = false)
        {
            if (!confirmForce)
                return BadRequest(new { message = "Cần xác nhận xóa cưỡng bức (confirmForce=true)" });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var variant = await _context.Variants
                    .Include(v => v.VariantOptionValues)
                    .Include(v => v.CartDetails)
                    .Include(v => v.BundleItems)
                    .FirstOrDefaultAsync(v => v.VariantID == id);

                if (variant == null)
                    return NotFound(new { message = "Không tìm thấy biến thể" });

                if (!string.IsNullOrEmpty(variant.ImageUrl))
                {
                    try { await _cloudinaryService.DeleteImageAsync(variant.ImageUrl); }
                    catch (Exception ex) { _logger.LogWarning(ex, "Could not delete variant image"); }
                }

                if (variant.CartDetails?.Any() == true)
                    _context.CartDetails.RemoveRange(variant.CartDetails);

                if (variant.BundleItems?.Any() == true)
                    _context.BundleItems.RemoveRange(variant.BundleItems);

                if (variant.VariantOptionValues?.Any() == true)
                    _context.VariantOptionValues.RemoveRange(variant.VariantOptionValues);

                _context.Variants.Remove(variant);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Đã xóa biến thể và tất cả dữ liệu liên quan" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error force deleting variant {VariantId}", id);
                return StatusCode(500, new { message = "Lỗi khi xóa cưỡng bức", error = ex.Message });
            }
        }

        #endregion

        #region Helper Methods

        private string GenerateVariantSKU(string productCode)
        {
            if (productCode.Length > 4)
                productCode = productCode.Substring(0, 4);
            else if (productCode.Length < 4)
                productCode = productCode.PadRight(4, '0');

            var random = new Random();
            return $"{productCode}{random.Next(0, 1000000):D6}";
        }

        private async Task<(bool isUsed, string reason, bool canForceDelete, object details)> CheckVariantInUse(int variantId)
        {
            var cartCount = await _context.CartDetails.CountAsync(cd => cd.VariantID == variantId);
            var invoiceCount = await _context.InvoiceDetails.CountAsync(id => id.VariantID == variantId);
            var bundleCount = await _context.BundleItems.CountAsync(bi => bi.VariantID == variantId);

            var details = new { cartItems = cartCount, invoiceItems = invoiceCount, bundleItems = bundleCount };

            if (invoiceCount > 0)
                return (true, $"đã có {invoiceCount} đơn hàng sử dụng", false, details);
            if (cartCount > 0)
                return (true, $"đang có {cartCount} sản phẩm trong giỏ hàng", true, details);
            if (bundleCount > 0)
                return (true, $"đang được sử dụng trong {bundleCount} combo/bundle", true, details);

            return (false, "", false, details);
        }

        #endregion
    }
}
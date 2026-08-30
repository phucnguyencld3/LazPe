using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BundleController : ControllerBase
    {
        private readonly IBundleService _bundleService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ILogger<BundleController> _logger;

        public BundleController(
            IBundleService bundleService,
            ICloudinaryService cloudinaryService,
            ILogger<BundleController> logger)
        {
            _bundleService = bundleService;
            _cloudinaryService = cloudinaryService;
            _logger = logger;
        }

        #region GET Methods (Public)

        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test() =>
            Ok(new { success = true, message = "Bundle API is working!", timestamp = DateTime.Now });

        /// <summary>
        /// Lấy danh sách bundles đang bán (cho khách hàng)
        /// </summary>
        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicBundles()
        {
            try
            {
                var bundles = await _bundleService.GetAllBundlesAsync();
                // Chỉ trả về bundle đang bán, có items
                var data = bundles
                    .Where(b => b.Status && b.BundleItems.Any())
                    .Select(b => MapBundleToResponse(b))
                    .ToList();

                return Ok(new { success = true, data, message = "Lấy danh sách combo thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public bundles");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Lấy chi tiết bundle (cho khách hàng)
        /// </summary>
        [HttpGet("public/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicBundle(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID combo không hợp lệ" });

                var bundle = await _bundleService.GetBundleWithItemsAsync(id);
                if (bundle == null || !bundle.Status)
                    return NotFound(new { success = false, message = "Không tìm thấy combo" });

                var result = new
                {
                    bundleID = bundle.BundleID,
                    name = bundle.Name,
                    code = bundle.Code ?? "",
                    description = bundle.Description ?? "",
                    price = bundle.Price ?? 0,
                    originalPrice = bundle.OriginalPrice ?? 0,
                    discountPercent = bundle.DiscountPercent,
                    status = bundle.Status,
                    imageUrl = bundle.ImageUrl ?? "",
                    createdDate = bundle.CreatedDate,
                    items = bundle.BundleItems?.Select(bi => new
                    {
                        bundleItemID = bi.BundleItemID,
                        variantID = bi.VariantID,
                        quantity = bi.Quantity,
                        variantName = bi.Variant?.VariantName ?? "Unknown",
                        unitPrice = bi.Variant?.UnitPrice ?? 0,
                        stock = bi.Variant?.Stock ?? 0,
                        imageUrl = !string.IsNullOrEmpty(bi.Variant?.ImageUrl) ? bi.Variant.ImageUrl : (bi.Variant?.Product?.Images?.FirstOrDefault()?.ImageUrl ?? ""),
                        productName = bi.Variant?.Product?.ProductName ?? "",
                        sku = bi.Variant?.SKU ?? ""
                    }).ToList()
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public bundle {BundleId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        #endregion

        #region GET Methods (Admin)
        /// <summary>
        /// Lấy tất cả bundles (cho admin)
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Permission("Bundle.Read")]
        public async Task<IActionResult> GetAllBundles()
        {
            try
            {
                var bundles = await _bundleService.GetAllBundlesAsync();
                var data = bundles.Select(b => MapBundleToResponse(b)).ToList();
                return Ok(new { success = true, data, message = "Lấy danh sách combo thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bundles");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách combo" });
            }
        }

        /// <summary>
        /// Lấy danh sách bundles có phân trang (cho admin)
        /// </summary>
        [HttpGet("paginated")]
        [Permission("Bundle.Read")]
        public async Task<IActionResult> GetBundlesPaginated(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string searchTerm = "",
            [FromQuery] bool? status = null)
        {
            try
            {
                var bundles = await _bundleService.GetAllBundlesAsync();

                if (!string.IsNullOrEmpty(searchTerm))
                    bundles = bundles.Where(b => b.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                                                 b.Description?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) == true);

                if (status.HasValue)
                    bundles = bundles.Where(b => b.Status == status.Value);

                var totalItems = bundles.Count();
                var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

                var paginatedBundles = bundles
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(b => MapBundleToResponse(b))
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = new { bundles = paginatedBundles, currentPage = page, totalPages, totalItems, pageSize }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting paginated bundles");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Xuất danh sách Combo sản phẩm ra Excel
        /// </summary>
        [HttpGet("export-excel")]
        [Permission("Bundle.Read")]
        public async Task<IActionResult> ExportExcel(
            [FromQuery] string searchTerm = "",
            [FromQuery] bool? status = null)
        {
            try
            {
                _logger.LogInformation("Exporting bundles list to Excel...");
                var fileContents = await _bundleService.ExportExcelAsync(searchTerm, status);
                var fileName = $"DanhSachCombo_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

                return File(
                    fileContents,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fileName
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error exporting bundles to Excel");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi xuất báo cáo Excel"
                });
            }
        }

        /// <summary>
        /// Lấy chi tiết bundle (cho admin)
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet("{id}")]
        [Permission("Bundle.Read")]
        public async Task<IActionResult> GetBundle(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID combo không hợp lệ" });

                var bundle = await _bundleService.GetBundleWithItemsAsync(id);
                if (bundle == null)
                    return NotFound(new { success = false, message = "Không tìm thấy combo" });

                var result = new
                {
                    bundleID = bundle.BundleID,
                    name = bundle.Name,
                    code = bundle.Code ?? "",
                    description = bundle.Description ?? "",
                    price = bundle.Price ?? 0,
                    originalPrice = bundle.OriginalPrice ?? 0,
                    discountPercent = bundle.DiscountPercent,
                    status = bundle.Status,
                    imageUrl = bundle.ImageUrl ?? "",
                    createdDate = bundle.CreatedDate,
                    items = bundle.BundleItems?.Select(bi => new
                    {
                        bundleItemID = bi.BundleItemID,
                        variantID = bi.VariantID,
                        quantity = bi.Quantity,
                        variantName = bi.Variant?.VariantName ?? "Unknown",
                        unitPrice = bi.Variant?.UnitPrice ?? 0,
                        stock = bi.Variant?.Stock ?? 0,
                        imageUrl = !string.IsNullOrEmpty(bi.Variant?.ImageUrl) ? bi.Variant.ImageUrl : (bi.Variant?.Product?.Images?.FirstOrDefault()?.ImageUrl ?? ""),
                        productName = bi.Variant?.Product?.ProductName ?? "",
                        sku = bi.Variant?.SKU ?? ""
                    }).ToList()
                };

                return Ok(new { success = true, data = result, message = "Lấy thông tin combo thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bundle {BundleId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Lấy danh sách variants có sẵn để thêm vào combo (cho admin)
        /// </summary>
        /// <returns></returns>

        [HttpGet("available-variants")]
        [Permission("Bundle.Read")]
        public async Task<IActionResult> GetAvailableVariants()
        {
            try
            {
                var variants = await _bundleService.GetAvailableVariantsAsync();
                var data = variants.Select(v => new
                {
                    variantID = v.VariantID,
                    variantName = v.VariantName,
                    sku = v.SKU,
                    unitPrice = v.UnitPrice,
                    stock = v.Stock,
                    imageUrl = !string.IsNullOrEmpty(v.ImageUrl) ? v.ImageUrl : (v.Product?.Images?.FirstOrDefault()?.ImageUrl ?? ""),
                    productName = v.Product?.ProductName ?? "",
                    productID = v.ProductID
                }).ToList();

                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available variants");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        #endregion

        #region POST Methods

        /// <summary>
        /// Tạo một bundle mới (cho admin)
        /// </summary>
        /// <param name="dto">Dữ liệu bundle</param>
        /// <returns></returns>
        [HttpPost]
        [Permission("Bundle.Create")]
        public async Task<IActionResult> CreateBundle([FromBody] CreateBundleDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

                var currentUserId = HttpContext.User?.Identity?.Name ?? "system";

                var bundle = new Bundle
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    ImageUrl = dto.ImageUrl,
                    DiscountPercent = dto.DiscountPercent,
                    Status = dto.Status,
                    CreatedDate = DateTime.Now,
                    CreatedBy = currentUserId
                };

                var success = await _bundleService.CreateBundleAsync(bundle);
                if (!success)
                    return BadRequest(new { success = false, message = "Không thể tạo combo" });

                if (dto.BundleItems.Any())
                {
                    foreach (var item in dto.BundleItems)
                    {
                        var bundleItem = new BundleItem
                        {
                            BundleID = bundle.BundleID,
                            VariantID = item.VariantID,
                            Quantity = item.Quantity,
                            SortOrder = item.SortOrder
                        };
                        await _bundleService.AddBundleItemAsync(bundleItem);
                    }
                }

                return Ok(new { success = true, message = "Tạo combo thành công", data = new { bundleId = bundle.BundleID } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bundle");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo combo" });
            }
        }

        /// <summary>
        /// Upload ảnh cho bundle (cho admin)
        /// </summary>
        /// <param name="file">File ảnh</param>
        /// <returns></returns>
        [HttpPost("upload-image")]
        [Consumes("multipart/form-data")]
        [Permission("Bundle.Update")]
        public async Task<IActionResult> UploadBundleImage([FromForm] IFormFile file, [FromForm] string? oldImageUrl = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "Vui lòng chọn file ảnh" });

                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    return BadRequest(new { success = false, message = "Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)" });

                if (file.Length > 10 * 1024 * 1024)
                    return BadRequest(new { success = false, message = "File ảnh không được vượt quá 10MB" });

                var imageUrl = await _cloudinaryService.ReplaceImageAsync(oldImageUrl, file, "polystation/Bundles");

                if (string.IsNullOrEmpty(imageUrl))
                    return StatusCode(500, new { success = false, message = "Upload ảnh thất bại" });

                return Ok(new { success = true, data = imageUrl, message = "Upload ảnh thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading bundle image");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi upload ảnh" });
            }
        }

        /// <summary>
        /// Toggle trạng thái bán của bundle (cho admin)
        /// </summary>
        /// <param name="id">ID của bundle</param>
        /// <returns></returns>

        [HttpPost("{id}/toggle-status")]
        [Permission("Bundle.Update")]
        public async Task<IActionResult> ToggleBundleStatus(int id)
        {
            try
            {
                var bundle = await _bundleService.GetBundleByIdAsync(id);
                if (bundle == null)
                    return NotFound(new { success = false, message = "Không tìm thấy combo" });

                bundle.Status = !bundle.Status;
                bundle.UpdatedDate = DateTime.Now;
                bundle.UpdatedBy = HttpContext.User?.Identity?.Name ?? "system";

                var success = await _bundleService.UpdateBundleAsync(bundle);
                return success
                    ? Ok(new { success = true, message = "Cập nhật trạng thái thành công", data = new { newStatus = bundle.Status } })
                    : BadRequest(new { success = false, message = "Không thể cập nhật trạng thái" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling bundle status {BundleId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Thêm một sản phẩm vào bundle (cho admin)
        /// </summary>
        /// <param name="bundleId">ID của bundle</param>
        /// <param name="dto">Dữ liệu sản phẩm cần thêm</param>
        /// <returns></returns>
        [HttpPost("{bundleId}/items")]
        [Permission("Bundle.Update")]
        public async Task<IActionResult> AddBundleItem(int bundleId, [FromBody] AddBundleItemDto dto)
        {
            try
            {
                if (!await _bundleService.BundleExistsAsync(bundleId))
                    return NotFound(new { success = false, message = "Không tìm thấy combo" });

                if (await _bundleService.VariantExistsInBundleAsync(bundleId, dto.VariantID))
                    return BadRequest(new { success = false, message = "Variant đã tồn tại trong combo" });

                var bundleItem = new BundleItem
                {
                    BundleID = bundleId,
                    VariantID = dto.VariantID,
                    Quantity = dto.Quantity
                };

                var success = await _bundleService.AddBundleItemAsync(bundleItem);
                return success
                    ? Ok(new { success = true, message = "Thêm sản phẩm vào combo thành công" })
                    : BadRequest(new { success = false, message = "Không thể thêm sản phẩm" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding item to bundle {BundleId}", bundleId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        #endregion

        #region PUT Methods

        /// <summary>
        /// Cập nhật thông tin của một bundle (cho admin)
        /// </summary>
        /// <param name="id">ID của bundle</param>
        /// <param name="dto">Dữ liệu cập nhật bundle</param>
        /// <returns></returns>
        [HttpPut("{id}")]
        [Permission("Bundle.Update")]
        public async Task<IActionResult> UpdateBundle(int id, [FromBody] UpdateBundleDto dto)
        {
            try
            {
                if (id != dto.BundleID)
                    return BadRequest(new { success = false, message = "ID combo không khớp" });

                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

                var bundle = await _bundleService.GetBundleByIdAsync(id);
                if (bundle == null)
                    return NotFound(new { success = false, message = "Không tìm thấy combo" });

                bundle.Name = dto.Name;
                bundle.Description = dto.Description;
                bundle.ImageUrl = dto.ImageUrl;
                bundle.DiscountPercent = dto.DiscountPercent;
                bundle.Status = dto.Status;
                bundle.UpdatedDate = DateTime.Now;
                bundle.UpdatedBy = HttpContext.User?.Identity?.Name ?? "system";

                var originalPrice = await _bundleService.CalculateBundleTotalPriceAsync(id);
                bundle.OriginalPrice = originalPrice;
                bundle.Price = Math.Round(originalPrice * (1 - dto.DiscountPercent / 100m), 0);

                var success = await _bundleService.UpdateBundleAsync(bundle);
                return success
                    ? Ok(new { success = true, message = "Cập nhật combo thành công" })
                    : BadRequest(new { success = false, message = "Không thể cập nhật combo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating bundle {BundleId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Cập nhật số lượng của một sản phẩm trong bundle (cho admin)
        /// </summary>
        /// <param name="bundleItemId">ID của sản phẩm trong bundle</param>
        /// <param name="dto">Dữ liệu cập nhật sản phẩm</param>
        /// <returns></returns>
        [HttpPut("items/{bundleItemId}")]
        [Permission("Bundle.Update")]
        public async Task<IActionResult> UpdateBundleItem(int bundleItemId, [FromBody] UpdateBundleItemDto dto)
        {
            try
            {
                var item = await _bundleService.GetBundleItemByIdAsync(bundleItemId);
                if (item == null)
                    return NotFound(new { success = false, message = "Không tìm thấy item" });

                item.Quantity = dto.Quantity;
                var success = await _bundleService.UpdateBundleItemAsync(item);
                return success
                    ? Ok(new { success = true, message = "Cập nhật thành công" })
                    : BadRequest(new { success = false, message = "Không thể cập nhật" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating bundle item {ItemId}", bundleItemId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        #endregion

        #region DELETE Methods

        /// <summary>
        /// Xóa một bundle (cho admin)
        /// </summary>
        /// <param name="id">ID của bundle</param>
        /// <returns></returns>
        [HttpDelete("{id}")]
        [Permission("Bundle.Delete")]
        public async Task<IActionResult> DeleteBundle(int id)
        {
            try
            {
                var bundle = await _bundleService.GetBundleWithItemsAsync(id);
                if (bundle == null)
                    return NotFound(new { success = false, message = "Không tìm thấy combo" });

                if (!string.IsNullOrEmpty(bundle.ImageUrl))
                    await _cloudinaryService.DeleteImageAsync(bundle.ImageUrl);

                var success = await _bundleService.DeleteBundleAsync(id);
                return success
                    ? Ok(new { success = true, message = "Xóa combo thành công" })
                    : BadRequest(new { success = false, message = "Không thể xóa combo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting bundle {BundleId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Xóa một sản phẩm khỏi bundle (cho admin)
        /// </summary>
        /// <param name="bundleItemId">ID của sản phẩm trong bundle</param>
        /// <returns></returns>
        [HttpDelete("items/{bundleItemId}")]
        [Permission("Bundle.Delete")]
        public async Task<IActionResult> DeleteBundleItem(int bundleItemId)
        {
            try
            {
                var success = await _bundleService.DeleteBundleItemAsync(bundleItemId);
                return success
                    ? Ok(new { success = true, message = "Xóa sản phẩm khỏi combo thành công" })
                    : BadRequest(new { success = false, message = "Không thể xóa" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting bundle item {ItemId}", bundleItemId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        #endregion

        #region Helpers

        private object MapBundleToResponse(Bundle b) => new
        {
            bundleID = b.BundleID,
            name = b.Name,
            code = b.Code ?? "",
            description = b.Description ?? "",
            price = b.Price ?? 0,
            originalPrice = b.OriginalPrice ?? 0,
            discountPercent = b.DiscountPercent,
            status = b.Status,
            itemCount = b.BundleItems?.Count ?? 0,
            createdDate = b.CreatedDate,
            imageUrl = b.ImageUrl ?? "",
            stock = b.BundleItems == null || !b.BundleItems.Any()
                ? 0
                : b.BundleItems.Min(bi => bi.Variant != null && bi.Quantity > 0 ? (bi.Variant.Stock / bi.Quantity) : 0),
            items = b.BundleItems?.Select(bi => new
            {
                bundleItemID = bi.BundleItemID,
                variantID = bi.VariantID,
                quantity = bi.Quantity,
                variantName = bi.Variant?.VariantName ?? "Unknown",
                unitPrice = bi.Variant?.UnitPrice ?? 0,
                stock = bi.Variant?.Stock ?? 0,
                imageUrl = !string.IsNullOrEmpty(bi.Variant?.ImageUrl) ? bi.Variant.ImageUrl : (bi.Variant?.Product?.Images?.FirstOrDefault()?.ImageUrl ?? ""),
                productName = bi.Variant?.Product?.ProductName ?? "",
                sku = bi.Variant?.SKU ?? ""
            }).ToList()
        };

        #endregion
    }
}
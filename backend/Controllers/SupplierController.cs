using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierService _supplierService;
        private readonly ILogger<SuppliersController> _logger;

        public SuppliersController(ISupplierService supplierService, ILogger<SuppliersController> logger)
        {
            _supplierService = supplierService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tất cả nhà cung cấp
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllSuppliers()
        {
            try
            {
                var suppliers = await _supplierService.GetAllSuppliersAsync();

                _logger.LogInformation(" Retrieved {Count} suppliers", suppliers.Count());

                return Ok(new
                {
                    success = true,
                    data = suppliers,
                    message = "Lấy danh sách nhà cung cấp thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Error getting all suppliers");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy danh sách nhà cung cấp"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách nhà cung cấp với phân trang - PHẢI TRƯỚC GetSupplierById
        /// </summary>
        [HttpGet("paginated")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSuppliersPaginated(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string searchTerm = "",
            [FromQuery] bool? status = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100;

                _logger.LogInformation("=== GET SUPPLIERS PAGINATED ===");
                _logger.LogInformation("Page: {Page}, PageSize: {PageSize}, Search: {Search}, Status: {Status}",
                    page, pageSize, searchTerm ?? "null", status);

                var allSuppliers = await _supplierService.GetAllSuppliersAsync();

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var searchLower = searchTerm.ToLower();
                    allSuppliers = allSuppliers.Where(s =>
                        s.SupplierName.ToLower().Contains(searchLower)
                    );
                }

                if (status.HasValue)
                {
                    allSuppliers = allSuppliers.Where(s => s.Status == status.Value);
                }

                var totalItems = allSuppliers.Count();
                var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

                if (page > totalPages && totalPages > 0)
                    page = totalPages;

                var suppliers = allSuppliers
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                _logger.LogInformation("✅ Pagination result: Page {Page}/{TotalPages}, Items: {Count}/{Total}",
                    page, totalPages, suppliers.Count, totalItems);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        suppliers = suppliers.Select(s => new
                        {
                            supplierID = s.SupplierID,
                            supplierName = s.SupplierName,
                            logo = s.Logo,
                            description = s.Description,
                            status = s.Status,
                            createdAt = s.CreatedAt,
                            createdBy = s.CreatedBy,
                            productCount = s.Products?.Count ?? 0
                        }).ToList(),
                        currentPage = page,
                        pageSize = pageSize,
                        totalItems = totalItems,
                        totalPages = totalPages,
                        searchTerm = searchTerm,
                        status = status
                    },
                    message = "Lấy danh sách nhà cung cấp thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in GetSuppliersPaginated");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy danh sách nhà cung cấp"
                });
            }
        }

        /// <summary>
        /// Xuất file Excel danh sách nhà cung cấp/thương hiệu
        /// </summary>
        [HttpGet("export-excel")]
        [Permission("Supplier.Read")]
        public async Task<IActionResult> ExportExcel(
            [FromQuery] string searchTerm = "",
            [FromQuery] bool? status = null)
        {
            try
            {
                _logger.LogInformation("Exporting suppliers list to Excel...");
                var fileContents = await _supplierService.ExportExcelAsync(searchTerm, status);
                var fileName = $"DanhSachThuongHieu_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

                return File(
                    fileContents,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fileName
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error exporting suppliers to Excel");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi xuất báo cáo Excel"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách nhà cung cấp hoạt động
        /// </summary>
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveSuppliers()
        {
            try
            {
                var suppliers = await _supplierService.GetActiveSuppliersAsync();

                return Ok(new
                {
                    success = true,
                    data = suppliers,
                    message = "Lấy danh sách nhà cung cấp hoạt động thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting active suppliers");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy danh sách nhà cung cấp hoạt động"
                });
            }
        }

        /// <summary>
        /// Tìm kiếm nhà cung cấp
        /// </summary>
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchSuppliers([FromQuery] string searchTerm)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                    return BadRequest(new { success = false, message = "Vui lòng nhập từ khóa tìm kiếm" });

                var suppliers = await _supplierService.SearchSuppliersAsync(searchTerm);

                return Ok(new
                {
                    success = true,
                    data = suppliers,
                    message = "Tìm kiếm nhà cung cấp thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error searching suppliers");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tìm kiếm nhà cung cấp"
                });
            }
        }

        /// <summary>
        /// Lấy nhà cung cấp theo ID - ⚠️ PHẢI SAU các route cụ thể khác
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSupplierById(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID nhà cung cấp không hợp lệ" });

                var supplier = await _supplierService.GetSupplierByIdAsync(id);

                if (supplier == null)
                    return NotFound(new { success = false, message = "Không tìm thấy nhà cung cấp" });

                return Ok(new
                {
                    success = true,
                    data = supplier,
                    message = "Lấy thông tin nhà cung cấp thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting supplier {Id}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy thông tin nhà cung cấp"
                });
            }
        }

        /// <summary>
        /// Lấy số lượng sản phẩm của nhà cung cấp
        /// </summary>
        [HttpGet("{id}/product-count")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductCountBySupplier(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID nhà cung cấp không hợp lệ" });

                var exists = await _supplierService.SupplierExistsAsync(id);
                if (!exists)
                    return NotFound(new { success = false, message = "Không tìm thấy nhà cung cấp" });

                var count = await _supplierService.GetProductCountBySupplierAsync(id);

                return Ok(new
                {
                    success = true,
                    data = new { supplierId = id, productCount = count },
                    message = "Lấy số lượng sản phẩm thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting product count for supplier {Id}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy số lượng sản phẩm"
                });
            }
        }

        /// <summary>
        /// Tạo nhà cung cấp mới
        /// </summary>
        [HttpPost]
        [Permission("Supplier.Create")]
        public async Task<IActionResult> CreateSupplier([FromBody] SupplierCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                if (await _supplierService.SupplierNameExistsAsync(dto.SupplierName))
                    return BadRequest(new { success = false, message = "Tên nhà cung cấp đã tồn tại" });

                var supplier = new Supplier
                {
                    SupplierName = dto.SupplierName,
                    Logo = dto.Logo,
                    Description = dto.Description ?? string.Empty,
                    CreatedBy = dto.CreatedBy ?? "System",
                    CreatedAt = DateTime.UtcNow,
                    Status = dto.Status
                };

                var createdSupplier = await _supplierService.CreateSupplierAsync(supplier);

                _logger.LogInformation("✅ Supplier created: {SupplierName} (ID: {Id})",
                    createdSupplier.SupplierName, createdSupplier.SupplierID);

                return CreatedAtAction(nameof(GetSupplierById), new { id = createdSupplier.SupplierID },
                    new
                    {
                        success = true,
                        data = createdSupplier,
                        message = "Tạo nhà cung cấp thành công"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creating supplier");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo nhà cung cấp: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Cập nhật nhà cung cấp
        /// </summary>
        [HttpPut("{id}")]
        [Permission("Supplier.Update")]
        public async Task<IActionResult> UpdateSupplier(int id, [FromBody] SupplierUpdateDto dto)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID nhà cung cấp không hợp lệ" });

                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var supplier = await _supplierService.GetSupplierByIdAsync(id);
                if (supplier == null)
                    return NotFound(new { success = false, message = "Không tìm thấy nhà cung cấp" });

                if (await _supplierService.SupplierNameExistsAsync(dto.SupplierName, id))
                    return BadRequest(new { success = false, message = "Tên nhà cung cấp đã tồn tại" });

                supplier.SupplierName = dto.SupplierName;
                supplier.Description = dto.Description ?? string.Empty;

                if (!string.IsNullOrEmpty(dto.Logo))
                    supplier.Logo = dto.Logo;

                supplier.Status = dto.Status;

                var updateResult = await _supplierService.UpdateSupplierAsync(supplier);

                if (!updateResult)
                    return BadRequest(new { success = false, message = "Không thể cập nhật nhà cung cấp" });

                _logger.LogInformation("✅ Supplier updated: {SupplierName} (ID: {Id})",
                    supplier.SupplierName, supplier.SupplierID);

                return Ok(new
                {
                    success = true,
                    data = supplier,
                    message = "Cập nhật nhà cung cấp thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error updating supplier {Id}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi cập nhật nhà cung cấp: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Xóa nhà cung cấp
        /// </summary>
        [HttpDelete("{id}")]
        [Permission("Supplier.Delete")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID nhà cung cấp không hợp lệ" });

                var supplier = await _supplierService.GetSupplierByIdAsync(id);
                if (supplier == null)
                    return NotFound(new { success = false, message = "Không tìm thấy nhà cung cấp" });

                if (!await _supplierService.CanDeleteSupplierAsync(id))
                    return BadRequest(new
                    {
                        success = false,
                        message = "Không thể xóa nhà cung cấp vì có sản phẩm liên quan"
                    });

                var deleteResult = await _supplierService.DeleteSupplierAsync(id);

                if (!deleteResult)
                    return BadRequest(new { success = false, message = "Không thể xóa nhà cung cấp" });

                _logger.LogInformation("✅ Supplier deleted: {SupplierName} (ID: {Id})",
                    supplier.SupplierName, supplier.SupplierID);

                return Ok(new
                {
                    success = true,
                    message = "Xóa nhà cung cấp thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error deleting supplier {Id}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi xóa nhà cung cấp: " + ex.Message
                });
            }
        }
    }
}
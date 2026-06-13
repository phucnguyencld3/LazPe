using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using PolyBabyAPI.Filters;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        private readonly ILogger<CategoryController> _logger;

        public CategoryController(ICategoryService categoryService, ILogger<CategoryController> logger)
        {
            _categoryService = categoryService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả categories - Yêu cầu quyền Category.Read
        /// </summary>
        [HttpGet]
        [Permission("Category.Read")]
        public async Task<IActionResult> GetAllCategories()
        {
            try
            {
                _logger.LogInformation("Getting all categories...");

                var categories = await _categoryService.GetAllCategoriesAsync();

                var result = categories.Select(c => new CategoryDto
                {
                    CategoryID = c.CategoryID,
                    CategoryName = c.CategoryName,
                    ParentID = c.ParentID,
                    Level = c.Level,
                    Description = c.Description,
                    SortOrder = c.SortOrder,
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.CreatedBy,
                    ProductCount = c.Products?.Count ?? 0
                }).ToList();

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = "Lấy danh sách danh mục thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all categories");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy danh sách danh mục"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách categories có phân trang - Yêu cầu quyền Category.Read
        /// </summary>
        [HttpGet("paginated")]
        [Permission("Category.Read")]
        public async Task<IActionResult> GetCategoriesPaginated(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string searchTerm = "",
            [FromQuery] bool? status = null)
        {
            try
            {
                var result = await _categoryService.GetCategoriesPaginatedAsync(page, pageSize, searchTerm, status);

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = "Lấy danh sách danh mục thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting paginated categories");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy danh sách danh mục"
                });
            }
        }

        /// <summary>
        /// Lấy chi tiết category - Yêu cầu quyền Category.Read
        /// </summary>
        [HttpGet("{id}/detail")]
        [Permission("Category.Read")]
        public async Task<IActionResult> GetCategoryDetail(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID danh mục không hợp lệ" });

                var category = await _categoryService.GetCategoryDetailAsync(id);
                if (category == null)
                    return NotFound(new { success = false, message = "Không tìm thấy danh mục" });

                return Ok(new
                {
                    success = true,
                    data = category,
                    message = "Lấy chi tiết danh mục thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category detail for ID: {CategoryId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy chi tiết danh mục"
                });
            }
        }

        /// <summary>
        /// Lấy category để edit - Yêu cầu quyền Category.Read
        /// </summary>
        [HttpGet("{id}")]
        [Permission("Category.Read")]
        public async Task<IActionResult> GetCategory(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID danh mục không hợp lệ" });

                var category = await _categoryService.GetCategoryByIdAsync(id);
                if (category == null)
                    return NotFound(new { success = false, message = "Không tìm thấy danh mục" });

                var result = new CategoryDto
                {
                    CategoryID = category.CategoryID,
                    CategoryName = category.CategoryName,
                    ParentID = category.ParentID,
                    Level = category.Level,
                    Description = category.Description,
                    SortOrder = category.SortOrder,
                    Status = category.Status,
                    CreatedAt = category.CreatedAt,
                    CreatedBy = category.CreatedBy,
                    ProductCount = category.Products?.Count ?? 0
                };

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = "Lấy thông tin danh mục thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category for ID: {CategoryId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy thông tin danh mục"
                });
            }
        }

        /// <summary>
        /// Lấy danh sách categories để select (dropdown) - Yêu cầu quyền Category.Read
        /// </summary>
        [HttpGet("for-select")]
        [Permission("Category.Read")]
        public async Task<IActionResult> GetCategoriesForSelect()
        {
            try
            {
                var categories = await _categoryService.GetAllCategoriesAsync();

                var result = categories
                    .Where(c => c.Status) // Chỉ show active categories
                    .Select(c => new
                    {
                        categoryID = c.CategoryID,
                        categoryName = $"{new string('—', c.Level * 2)} {c.CategoryName}",
                        level = c.Level
                    })
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = "Lấy danh sách danh mục thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting categories for select");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi lấy danh sách danh mục"
                });
            }
        }

        /// <summary>
        /// Tạo category mới - Yêu cầu quyền Category.Create
        /// </summary>
        [HttpPost]
        [Permission("Category.Create")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors);
                    _logger.LogWarning("Model validation failed: {Errors}", string.Join(", ", errors.Select(e => e.ErrorMessage)));
                    return BadRequest(new 
                    { 
                        success = false, 
                        message = "Dữ liệu không hợp lệ", 
                        errors = errors.Select(e => e.ErrorMessage).ToList() // ✅ Chi tiết lỗi
                    });
                }

                if (string.IsNullOrWhiteSpace(dto.CategoryName))
                {
                    return BadRequest(new 
                    { 
                        success = false, 
                        message = "Tên danh mục không được để trống" 
                    });
                }

                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System";
                
                _logger.LogInformation("Creating category: {CategoryName}, ParentID: {ParentID}, UserId: {UserId}",
                    dto.CategoryName, dto.ParentID, userId);

                var success = await _categoryService.CreateCategoryAsync(dto, userId);

                if (success)
                {
                    _logger.LogInformation("Category created successfully: {CategoryName} by user {UserId}",
                        dto.CategoryName, userId);

                    return Ok(new
                    {
                        success = true,
                        message = "Tạo danh mục thành công"
                    });
                }
                else
                {
                    _logger.LogWarning("Failed to create category: {CategoryName}", dto.CategoryName);
                    return BadRequest(new
                    {
                        success = false,
                        message = "Không thể tạo danh mục"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating category: {CategoryName}", dto?.CategoryName);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi tạo danh mục",
                    detail = ex.Message 
                });
            }
        }

        /// <summary>
        /// Cập nhật category - Yêu cầu quyền Category.Update
        /// </summary>
        [HttpPut("{id}")]
        [Permission("Category.Update")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] EditCategoryDto dto)
        {
            try
            {
                if (id != dto.CategoryID)
                    return BadRequest(new { success = false, message = "ID không khớp" });

                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState.Values });

                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System";
                var success = await _categoryService.UpdateCategoryAsync(dto, userId);

                if (success)
                {
                    _logger.LogInformation("Category updated: {CategoryId} by user {UserId}",
                        id, userId);

                    return Ok(new
                    {
                        success = true,
                        message = "Cập nhật danh mục thành công"
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể cập nhật danh mục (có thể là circular reference)"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating category {CategoryId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi cập nhật danh mục"
                });
            }
        }

        /// <summary>
        /// Xóa category - Yêu cầu quyền Category.Delete
        /// </summary>
        [HttpDelete("{id}")]
        [Permission("Category.Delete")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID danh mục không hợp lệ" });

                // ✅ SỬA: Loại bỏ userId parameter
                var success = await _categoryService.DeleteCategoryAsync(id);

                if (success)
                {
                    _logger.LogInformation("Category deleted: {CategoryId} by user {UserId}",
                        id, User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);

                    return Ok(new
                    {
                        success = true,
                        message = "Xóa danh mục thành công"
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể xóa danh mục (có thể có sản phẩm liên kết)"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting category {CategoryId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi xóa danh mục"
                });
            }
        }

        /// <summary>
        /// Toggle trạng thái category - Yêu cầu quyền Category.Update
        /// </summary>
        [HttpPost("{id}/toggle-status")]
        [Permission("Category.Update")]
        public async Task<IActionResult> ToggleCategoryStatus(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID danh mục không hợp lệ" });

                // ✅ SỬA: Loại bỏ userId parameter
                var success = await _categoryService.ToggleCategoryStatusAsync(id);

                if (success)
                {
                    _logger.LogInformation("Category status toggled: {CategoryId} by user {UserId}",
                        id, User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);

                    return Ok(new
                    {
                        success = true,
                        message = "Cập nhật trạng thái danh mục thành công"
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "Không thể cập nhật trạng thái danh mục"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling category status {CategoryId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra khi cập nhật trạng thái danh mục"
                });
            }
        }
    }
}
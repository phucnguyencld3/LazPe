using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Filters;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly ILogger<ProductController> _logger;

        public ProductController(IProductService productService, ILogger<ProductController> logger)
        {
            _productService = productService;
            _logger = logger;
        }

        #region Public Shop Endpoints

        /// <summary>
        /// Lấy danh sách sản phẩm cho shop (public — chỉ sản phẩm active)
        /// </summary>
        [HttpGet("shop")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductsForShop(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] string searchTerm = "",
            [FromQuery] int? categoryId = null,
            [FromQuery] string sortBy = "CreatedAt",
            [FromQuery] string sortDirection = "desc",
            [FromQuery] bool? hasDiscount = null)
        {
            try
            {
                var result = await _productService.GetProductsPaginatedAsync(
                    page, pageSize, searchTerm, categoryId, null,
                    true, null, null, sortBy, sortDirection, hasDiscount);

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = "Lấy danh sách sản phẩm thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shop products");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Có lỗi xảy ra"
                });
            }
        }

        /// <summary>
        /// Lấy chi tiết sản phẩm cho shop (public — chỉ sản phẩm active)
        /// </summary>
        [HttpGet("shop/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductDetailForShop(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID sản phẩm không hợp lệ" });

                var product = await _productService.GetProductDetailAsync(id);
                if (product == null)
                    return NotFound(new { success = false, message = "Không tìm thấy sản phẩm" });

                return Ok(new
                {
                    success = true,
                    data = product,
                    message = "Lấy chi tiết sản phẩm thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shop product detail {ProductId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Lấy danh mục cho filter trên shop (public)
        /// </summary>
        [HttpGet("shop/categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoriesForShop()
        {
            try
            {
                var categories = await _productService.GetCategoriesForSelectAsync();
                return Ok(new { success = true, data = categories });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shop categories");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        #endregion

        #region Admin Endpoints

        /// <summary>
        /// Lấy danh sách sản phẩm có phân trang, tìm kiếm, lọc và sắp xếp (admin)
        /// </summary>
        /// <param name="page">Số trang</param>
        /// <param name="pageSize">Số lượng sản phẩm trên mỗi trang</param>
        /// <param name="searchTerm">Từ khóa tìm kiếm</param>
        /// <param name="categoryId">ID danh mục</param>
        /// <param name="supplierId">ID nhà cung cấp</param>
        /// <param name="status">Trạng thái sản phẩm</param>
        /// <param name="minPrice">Giá tối thiểu</param>
        /// <param name="maxPrice">Giá tối đa</param>
        /// <param name="sortBy">Trường sắp xếp</param>
        /// <param name="sortDirection">Hướng sắp xếp (asc hoặc desc)</param>
        /// <returns></returns>
        [HttpGet]
        [Permission("Product.Read")]
        public async Task<IActionResult> GetProducts(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] string searchTerm = "",
            [FromQuery] int? categoryId = null,
            [FromQuery] int? supplierId = null,
            [FromQuery] bool? status = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string sortBy = "CreatedAt",
            [FromQuery] string sortDirection = "desc")
        {
            try
            {
                var result = await _productService.GetProductsPaginatedAsync(
                    page, pageSize, searchTerm, categoryId, supplierId,
                    status, minPrice, maxPrice, sortBy, sortDirection);

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = "Lấy danh sách sản phẩm thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting products");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách sản phẩm" });
            }
        }


        /// <summary>
        /// Lấy thông tin chi tiết của một sản phẩm theo ID (admin)
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <returns></returns>
        [HttpGet("{id}")]
        [Permission("Product.Read")]
        public async Task<IActionResult> GetProduct(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID sản phẩm không hợp lệ" });

                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound(new { success = false, message = "Không tìm thấy sản phẩm" });

                return Ok(new { success = true, data = product, message = "Lấy thông tin sản phẩm thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product {ProductId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin sản phẩm" });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một sản phẩm theo ID (admin) - bao gồm các biến thể và tùy chọn
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <returns></returns>
        [HttpGet("{id}/detail")]
        [Permission("Product.Read")]
        public async Task<IActionResult> GetProductDetail(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(new { success = false, message = "ID sản phẩm không hợp lệ" });

                var product = await _productService.GetProductDetailAsync(id);
                if (product == null)
                    return NotFound(new { success = false, message = "Không tìm thấy sản phẩm" });

                return Ok(new { success = true, data = product, message = "Lấy chi tiết sản phẩm thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product detail {ProductId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy chi tiết sản phẩm" });
            }
        }

        /// <summary>
        /// Tạo mới một sản phẩm (admin)
        /// </summary>
        /// <param name="dto">Thông tin sản phẩm cần tạo</param>
        /// <returns></returns>
        [HttpPost]
        [Permission("Product.Create")]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors);
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = errors.Select(e => e.ErrorMessage).ToList() });
                }

                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System";
                dto.CreatedBy = userId;

                var result = await _productService.CreateProductAsync(dto);

                if (result.Success)
                    return Ok(new { success = true, data = result.Data, message = "Tạo sản phẩm thành công" });

                return BadRequest(new { success = false, message = result.Message, errors = result.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product: {ProductName}", dto?.ProductName);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo sản phẩm" });
            }
        }

        /// <summary>
        /// Tạo mới sản phẩm hoàn chỉnh kèm Options và Variants trong một Transaction (admin)
        /// </summary>
        [HttpPost("full")]
        [Permission("Product.Create")]
        public async Task<IActionResult> CreateFullProduct([FromBody] CreateFullProductDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors);
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = errors.Select(e => e.ErrorMessage).ToList() });
                }

                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System";
                dto.CreatedBy = userId;

                var result = await _productService.CreateFullProductAsync(dto);

                if (result.Success)
                    return Ok(new { success = true, data = result.Data, message = result.Message });

                return BadRequest(new { success = false, message = result.Message, errors = result.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating full product: {ProductName}", dto?.ProductName);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo sản phẩm" });
            }
        }

        /// <summary>
        /// Cập nhật thông tin một sản phẩm theo ID (admin)
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <param name="dto">Thông tin sản phẩm cần cập nhật</param>
        /// <returns></returns>
        [HttpPut("{id}")]
        [Permission("Product.Update")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
        {
            try
            {
                if (id <= 0) return BadRequest(new { success = false, message = "ID sản phẩm không hợp lệ" });
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors);
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = errors.Select(e => e.ErrorMessage).ToList() });
                }

                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "System";
                var result = await _productService.UpdateProductAsync(id, dto, userId);

                if (result.Success)
                    return Ok(new { success = true, data = result.Data, message = "Cập nhật sản phẩm thành công" });

                return BadRequest(new { success = false, message = result.Message, errors = result.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {ProductId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật sản phẩm" });
            }
        }

        /// <summary>
        /// Xóa một sản phẩm theo ID (admin)
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <returns></returns>
        [HttpDelete("{id}")]
        [Permission("Product.Delete")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                if (id <= 0) return BadRequest(new { success = false, message = "ID sản phẩm không hợp lệ" });
                var result = await _productService.DeleteProductAsync(id);
                if (result.Success)
                    return Ok(new { success = true, message = "Xóa sản phẩm thành công" });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product {ProductId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa sản phẩm" });
            }
        }

        /// <summary>
        /// Chuyển trạng thái active/inactive của sản phẩm theo ID (admin)
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <returns></returns>
        [HttpPost("{id}/toggle-status")]
        [Permission("Product.Update")]
        public async Task<IActionResult> ToggleProductStatus(int id)
        {
            try
            {
                if (id <= 0) return BadRequest(new { success = false, message = "ID sản phẩm không hợp lệ" });
                var result = await _productService.ToggleProductStatusAsync(id);
                if (result.Success)
                    return Ok(new { success = true, message = "Cập nhật trạng thái sản phẩm thành công" });
                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling product status {ProductId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật trạng thái sản phẩm" });
            }
        }

        /// <summary>
        /// Lấy thống kê số lượng sản phẩm (admin)
        /// </summary>
        [HttpGet("admin-stats")]
        [Permission("Product.Read")]
        public async Task<IActionResult> GetProductStats()
        {
            try
            {
                var stats = await _productService.GetProductStatsAsync();
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product stats");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thống kê sản phẩm" });
            }
        }

        /// <summary>
        /// Lấy danh sách danh mục cho select (admin)
        /// </summary>
        /// <returns>Danh sách danh mục</returns>
        [HttpGet("categories")]
        [Permission("Product.Read")]
        public async Task<IActionResult> GetCategoriesForSelect()
        {
            try
            {
                var categories = await _productService.GetCategoriesForSelectAsync();
                return Ok(new { success = true, data = categories, message = "Lấy danh sách danh mục thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting categories for select");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách danh mục" });
            }
        }

        /// <summary>
        /// Lấy danh sách thương hiệu cho select (admin)
        /// </summary>
        /// <returns>Danh sách thương hiệu</returns>
        [HttpGet("suppliers")]
        [Permission("Product.Read")]
        public async Task<IActionResult> GetSuppliersForSelect()
        {
            try
            {
                var suppliers = await _productService.GetSuppliersForSelectAsync();
                return Ok(new { success = true, data = suppliers, message = "Lấy danh sách thương hiệu thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting suppliers for select");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách thương hiệu" });
            }
        }

        #endregion
    }
}
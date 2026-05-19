using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Interfaces;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProductOptionController : ControllerBase
    {
        private readonly IProductOptionService _service;
        private readonly ILogger<ProductOptionController> _logger;

        public ProductOptionController(IProductOptionService service, ILogger<ProductOptionController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tất cả thuộc tính của sản phẩm
        /// </summary>
        /// <param name="productId">ID của sản phẩm</param>
        /// <returns>Danh sách thuộc tính của sản phẩm</returns>
        [HttpGet("product/{productId}")]
        [Permission("Product.Read")]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            try
            {
                var options = await _service.GetOptionsByProductIdAsync(productId);
                return Ok(new { success = true, data = options });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting options for product {ProductId}", productId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một thuộc tính sản phẩm theo ID
        /// </summary>
        /// <param name="id">ID của thuộc tính sản phẩm</param>
        /// <returns>Thông tin chi tiết của thuộc tính sản phẩm</returns>
        [HttpGet("{id}")]
        [Permission("Product.Read")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var option = await _service.GetOptionByIdAsync(id);
                if (option == null)
                    return NotFound(new { success = false, message = "Không tìm thấy thuộc tính" });

                return Ok(new { success = true, data = option });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting option {OptionId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Tạo mới một thuộc tính cho sản phẩm
        /// </summary>
        /// <param name="productId">ID của sản phẩm</param>
        /// <param name="dto">Dữ liệu thuộc tính sản phẩm</param>
        /// <returns>Thông tin thuộc tính sản phẩm vừa tạo</returns>
        [HttpPost("product/{productId}")]
        [Permission("Product.Create")]
        public async Task<IActionResult> Create(int productId, [FromBody] CreateProductOptionDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

                var result = await _service.CreateOptionAsync(productId, dto);
                if (result.Success)
                    return Ok(new { success = true, data = result.Data, message = result.Message });

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating option for product {ProductId}", productId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Cập nhật thông tin của một thuộc tính sản phẩm
        /// </summary>
        /// <param name="id">ID của thuộc tính sản phẩm</param>
        /// <param name="dto">Dữ liệu cập nhật thuộc tính sản phẩm</param>
        /// <returns>Thông tin thuộc tính sản phẩm sau khi cập nhật</returns>
        [HttpPut("{id}")]
        [Permission("Product.Update")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProductOptionDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

                var result = await _service.UpdateOptionAsync(id, dto);
                if (result.Success)
                    return Ok(new { success = true, data = result.Data, message = result.Message });

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating option {OptionId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Xóa một thuộc tính sản phẩm theo ID
        /// </summary>
        /// <param name="id">ID của thuộc tính sản phẩm</param>
        /// <returns>Kết quả xóa thuộc tính sản phẩm</returns>
        [HttpDelete("{id}")]
        [Permission("Product.Delete")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _service.DeleteOptionAsync(id);
                if (result.Success)
                    return Ok(new { success = true, message = result.Message });

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting option {OptionId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Thêm một giá trị mới cho thuộc tính sản phẩm
        /// </summary>
        /// <param name="optionId">ID của thuộc tính sản phẩm</param>
        /// <param name="dto">Dữ liệu giá trị thuộc tính sản phẩm</param>
        /// <returns>Thông tin giá trị thuộc tính sản phẩm vừa tạo</returns>
        [HttpPost("{optionId}/values")]
        [Permission("Product.Create")]
        public async Task<IActionResult> AddValue(int optionId, [FromBody] CreateProductOptionValueDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

                var result = await _service.AddOptionValueAsync(optionId, dto);
                if (result.Success)
                    return Ok(new { success = true, data = result.Data, message = result.Message });

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding value to option {OptionId}", optionId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Cập nhật thông tin của một giá trị thuộc tính sản phẩm
        /// </summary>
        /// <param name="valueId">ID của giá trị thuộc tính sản phẩm</param>
        /// <param name="dto">Dữ liệu cập nhật giá trị thuộc tính sản phẩm</param>
        /// <returns>Thông tin giá trị thuộc tính sản phẩm sau khi cập nhật</returns>
        [HttpPut("values/{valueId}")]
        [Permission("Product.Update")]
        public async Task<IActionResult> UpdateValue(int valueId, [FromBody] UpdateProductOptionValueDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

                var result = await _service.UpdateOptionValueAsync(valueId, dto);
                if (result.Success)
                    return Ok(new { success = true, data = result.Data, message = result.Message });

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating value {ValueId}", valueId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Xóa một giá trị thuộc tính sản phẩm theo ID
        /// </summary>
        /// <param name="valueId">ID của giá trị thuộc tính sản phẩm</param>
        /// <returns>Kết quả xóa giá trị thuộc tính sản phẩm</returns>
        [HttpDelete("values/{valueId}")]
        [Permission("Product.Delete")]
        public async Task<IActionResult> DeleteValue(int valueId)
        {
            try
            {
                var result = await _service.DeleteOptionValueAsync(valueId);
                if (result.Success)
                    return Ok(new { success = true, message = result.Message });

                return BadRequest(new { success = false, message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting value {ValueId}", valueId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }
    }
}
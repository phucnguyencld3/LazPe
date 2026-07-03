using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System.Security.Claims;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private readonly ILogger<CartController> _logger;

        public CartController(ICartService cartService, ILogger<CartController> logger)
        {
            _cartService = cartService;
            _logger = logger;
        }

        #region Cart Management

        /// <summary>
        /// Lấy giỏ hàng của user hiện tại
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var cart = await _cartService.GetCartByUserIdAsync(userId);
                var cartDto = MapCartToDto(cart);

                return Ok(new { success = true, data = cartDto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cart");
                return StatusCode(500, new { success = false, message = "Có lỗi khi lấy giỏ hàng" });
            }
        }

        /// <summary>
        /// Thêm sản phẩm hoặc combo vào giỏ hàng
        /// </summary>
        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            // ✅ Kiểm tra ModelState (Quantity, ...)
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            _logger.LogInformation("Received AddToCart: VariantID={VariantID}, BundleID={BundleID}, Quantity={Quantity}, SelectedGiftVariantId={SelectedGiftVariantId}", dto.VariantID, dto.BundleID, dto.Quantity, dto.SelectedGiftVariantId);

            // ✅ Kiểm tra phải có ít nhất VariantID hoặc BundleID
            if (!dto.IsValid)
            {
                return BadRequest(new { success = false, message = "Phải có VariantID hoặc BundleID" });
            }

            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                await _cartService.AddToCartAsync(userId, dto.VariantID, dto.BundleID, dto.Quantity, dto.SelectedGiftVariantId);

                var updatedCart = await _cartService.GetCartByUserIdAsync(userId);
                var cartDto = MapCartToDto(updatedCart);

                _logger.LogInformation("Added item to cart for user {UserId}. VariantID={VariantID}, BundleID={BundleID}",
                    userId, dto.VariantID, dto.BundleID);

                return Ok(new
                {
                    success = true,
                    message = dto.BundleID.HasValue
                        ? "Đã thêm combo vào giỏ hàng"
                        : "Đã thêm sản phẩm vào giỏ hàng",
                    data = cartDto
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding to cart");
                return StatusCode(500, new { success = false, message = "Có lỗi khi thêm sản phẩm vào giỏ hàng" });
            }
        }

        /// <summary>
        /// Cập nhật số lượng sản phẩm trong giỏ hàng
        /// </summary>
        [HttpPut("update")]
        public async Task<IActionResult> UpdateCartItem([FromBody] UpdateCartItemDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                await _cartService.UpdateQuantityAsync(dto.CartDetailID, dto.Quantity);

                var updatedCart = await _cartService.GetCartByUserIdAsync(userId);
                var cartDto = MapCartToDto(updatedCart);

                var message = dto.Quantity == 0 ? "Đã xóa sản phẩm khỏi giỏ hàng" : "Đã cập nhật số lượng sản phẩm";

                return Ok(new
                {
                    success = true,
                    message = message,
                    data = cartDto
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating cart item {CartDetailId}", dto.CartDetailID);
                return StatusCode(500, new { success = false, message = "Có lỗi khi cập nhật giỏ hàng" });
            }
        }

        /// <summary>
        /// Xóa sản phẩm khỏi giỏ hàng
        /// </summary>
        [HttpDelete("remove/{cartDetailId}")]
        public async Task<IActionResult> RemoveFromCart(int cartDetailId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                await _cartService.RemoveFromCartAsync(cartDetailId);

                var updatedCart = await _cartService.GetCartByUserIdAsync(userId);
                var cartDto = MapCartToDto(updatedCart);

                return Ok(new
                {
                    success = true,
                    message = "Đã xóa sản phẩm khỏi giỏ hàng",
                    data = cartDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing cart item {CartDetailId}", cartDetailId);
                return StatusCode(500, new { success = false, message = "Có lỗi khi xóa sản phẩm" });
            }
        }

        /// <summary>
        /// Xóa toàn bộ giỏ hàng
        /// </summary>
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var cart = await _cartService.GetCartByUserIdAsync(userId);
                await _cartService.ClearCartAsync(cart.CartID);

                return Ok(new
                {
                    success = true,
                    message = "Đã xóa toàn bộ giỏ hàng",
                    data = new { totalItems = 0, totalAmount = 0 }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing cart");
                return StatusCode(500, new { success = false, message = "Có lỗi khi xóa giỏ hàng" });
            }
        }

        /// <summary>
        /// Lấy số lượng sản phẩm trong giỏ hàng (cho badge)
        /// </summary>
        [HttpGet("count")]
        public async Task<IActionResult> GetCartCount()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Ok(new { success = true, data = new { count = 0 } });
                }

                var cart = await _cartService.GetCartByUserIdAsync(userId);
                var count = cart.CartDetails.Sum(cd => cd.Quantity);

                return Ok(new { success = true, data = new { count = count } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cart count");
                return Ok(new { success = true, data = new { count = 0 } });
            }
        }

        #endregion

        #region Voucher Management

        /// <summary>
        /// Tự động áp dụng mã giảm giá tốt nhất
        /// </summary>
        [HttpPost("auto-apply-vouchers")]
        public async Task<IActionResult> AutoApplyVouchers()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var cart = await _cartService.GetCartByUserIdAsync(userId);
                var result = await _cartService.AutoApplyBestVouchersAsync(cart.CartID);

                if (result.Success)
                {
                    var updatedCart = await _cartService.GetCartByUserIdAsync(userId);
                    var cartDto = MapCartToDto(updatedCart);

                    return Ok(new
                    {
                        success = true,
                        message = result.Message,
                        appliedCodes = result.AppliedCodes,
                        data = cartDto
                    });
                }
                else
                {
                    return BadRequest(new { success = false, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error auto applying vouchers");
                return StatusCode(500, new { success = false, message = "Có lỗi khi tự động áp dụng mã giảm giá" });
            }
        }

        /// <summary>
        /// Áp dụng mã giảm giá
        /// </summary>
        [HttpPost("apply-voucher")]
        public async Task<IActionResult> ApplyVoucher([FromBody] ApplyVoucherDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Mã voucher không hợp lệ" });
            }

            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var cart = await _cartService.GetCartByUserIdAsync(userId);
                var result = await _cartService.ApplyVoucherAsync(cart.CartID, dto.VoucherCode);

                if (result.Success)
                {
                    var updatedCart = await _cartService.GetCartByUserIdAsync(userId);
                    var cartDto = MapCartToDto(updatedCart);

                    return Ok(new
                    {
                        success = true,
                        message = result.Message,
                        data = cartDto
                    });
                }
                else
                {
                    return BadRequest(new { success = false, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying voucher {VoucherCode}", dto.VoucherCode);
                return StatusCode(500, new { success = false, message = "Có lỗi khi áp dụng mã giảm giá" });
            }
        }

        /// <summary>
        /// Hủy áp dụng mã giảm giá
        /// </summary>
        [HttpPost("remove-voucher")]
        public async Task<IActionResult> RemoveVoucher([FromQuery] int? type = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var cart = await _cartService.GetCartByUserIdAsync(userId);
                await _cartService.RemoveVoucherAsync(cart.CartID, type);

                var updatedCart = await _cartService.GetCartByUserIdAsync(userId);
                var cartDto = MapCartToDto(updatedCart);

                var message = type == 1 ? "Đã hủy mã giảm giá sản phẩm" 
                            : type == 2 ? "Đã hủy mã giảm giá vận chuyển" 
                            : "Đã hủy mã giảm giá";

                return Ok(new
                {
                    success = true,
                    message = message,
                    data = cartDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing voucher");
                return StatusCode(500, new { success = false, message = "Có lỗi khi hủy mã giảm giá" });
            }
        }

        #endregion

        #region Helper Methods

        private string GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        private CartDto MapCartToDto(Cart cart)
        {
            if (cart == null) return new CartDto();

            return new CartDto
            {
                CartID = cart.CartID,
                UserID = cart.UserID,
                CreatedDate = cart.CreatedDate,
                TotalAmount = cart.TotalAmount,
                SubTotal = cart.SubTotal,
                DiscountAmount = cart.DiscountAmount,
                ShippingDiscountAmount = cart.ShippingDiscountAmount,
                Voucher = cart.Voucher != null ? MapVoucherToDto(cart.Voucher) : null,
                ShippingVoucher = cart.ShippingVoucher != null ? MapVoucherToDto(cart.ShippingVoucher) : null,
                CartDetails = cart.CartDetails.Select(MapCartDetailToDto).ToList()
            };
        }

        private CartDetailDto MapCartDetailToDto(CartDetail detail)
        {
            return new CartDetailDto
            {
                CartDetailID = detail.CartDetailID,
                CartID = detail.CartID,
                VariantID = detail.VariantID,
                BundleID = detail.BundleID,
                Quantity = detail.Quantity,
                UnitPrice = detail.UnitPrice,
                TotalPrice = detail.TotalPrice,
                IsGift = detail.IsGift,
                Product = detail.Variant?.Product != null ? new ProductCartDto
                {
                    ProductID = detail.Variant.Product.ProductID,
                    Name = detail.Variant.Product.ProductName,
                    ImageUrl = GetProductImageUrl(detail.Variant.Product),
                    Slug = !string.IsNullOrEmpty(detail.Variant.Product.Slug) ? detail.Variant.Product.Slug : GenerateProductSlug(detail.Variant.Product.ProductName)
                } : null,
                Variant = detail.Variant != null ? new VariantCartDto
                {
                    VariantID = detail.Variant.VariantID,
                    Size = "Xem chi tiết",
                    Color = detail.Variant.VariantName,
                    UnitPrice = detail.UnitPrice,
                    Stock = detail.Variant.Stock,
                    ImageUrl = detail.Variant.ImageUrl ?? GetProductImageUrl(detail.Variant.Product)
                } : null,
                Bundle = detail.Bundle != null ? new BundleCartDto
                {
                    BundleID = detail.Bundle.BundleID,
                    Name = detail.Bundle.Name,
                    Price = detail.Bundle.Price ?? 0,
                    Stock = GetBundleStock(detail.Bundle),
                    ImageUrl = detail.Bundle.ImageUrl
                } : null
            };
        }

        private VoucherDto MapVoucherToDto(Voucher voucher)
        {
            return new VoucherDto
            {
                VoucherID = voucher.VoucherID,
                Code = voucher.Code,
                Name = voucher.Name,
                Description = voucher.VoucherType == VoucherType.ShippingDiscount 
                    ? (voucher.IsFreeShipping ? "Miễn phí vận chuyển" : $"Giảm phí vận chuyển {GetDiscountDescription(voucher)}") 
                    : $"Giảm {GetDiscountDescription(voucher)}",
                DiscountAmount = voucher.DiscountType == 2 ? voucher.DiscountValue : 0,
                DiscountPercent = voucher.DiscountType == 1 ? voucher.DiscountValue : 0,
                MinOrderValue = voucher.MinOrderValue,
                MaxDiscount = voucher.MaxDiscount,
                StartDate = voucher.StartDate,
                EndDate = voucher.EndDate,
                IsPercentage = voucher.DiscountType == 1,
                VoucherType = (int)voucher.VoucherType,
                IsFreeShipping = voucher.IsFreeShipping,
                MaxShippingDiscount = voucher.MaxShippingDiscount
            };
        }

        private string? GetProductImageUrl(Product product)
        {
            var img = product?.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl;
            return !string.IsNullOrEmpty(img) ? img : "/assets/img/products/default-product.jpg";
        }

        private string GenerateProductSlug(string productName)
        {
            if (string.IsNullOrEmpty(productName))
                return "san-pham";

            return productName
                .ToLower()
                .Trim()
                .Replace(" ", "-")
                .Replace("ă", "a").Replace("â", "a").Replace("á", "a").Replace("à", "a").Replace("ã", "a").Replace("ạ", "a")
                .Replace("đ", "d")
                .Replace("ê", "e").Replace("é", "e").Replace("è", "e").Replace("ẽ", "e").Replace("ẹ", "e")
                .Replace("ô", "o").Replace("ó", "o").Replace("ò", "o").Replace("õ", "o").Replace("ọ", "o")
                .Replace("ơ", "o").Replace("ờ", "o").Replace("ở", "o").Replace("ỡ", "o").Replace("ợ", "o")
                .Replace("ư", "u").Replace("ú", "u").Replace("ù", "u").Replace("ũ", "u").Replace("ụ", "u")
                .Replace("ứ", "u").Replace("ừ", "u").Replace("ử", "u").Replace("ữ", "u").Replace("ự", "u");
        }

        private int GetBundleStock(Bundle bundle)
        {
            return 999;
        }

        private string GetDiscountDescription(Voucher voucher)
        {
            if (voucher.DiscountType == 1)
            {
                return $"{voucher.DiscountValue}%";
            }
            else
            {
                return $"{voucher.DiscountValue:N0}đ";
            }
        }

        #endregion
    }
}
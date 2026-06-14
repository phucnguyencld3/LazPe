using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WishlistController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WishlistController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var wishlistItems = await _context.Wishlists
                .AsNoTracking()
                .Where(w => w.UserID == userId && w.Product.Status)
                .Select(w => new
                {
                    id = w.Product.ProductID,
                    name = w.Product.ProductName,
                    description = w.Product.Description,
                    price = w.Product.Price,
                    discountPrice = w.Product.ProductDiscountPercent > 0 
                        ? (w.Product.Price * (1m - w.Product.ProductDiscountPercent / 100m)) 
                        : (decimal?)null,
                    image = w.Product.Variants
                        .Where(v => !string.IsNullOrEmpty(v.ImageUrl))
                        .OrderBy(v => v.VariantID)
                        .Select(v => v.ImageUrl)
                        .FirstOrDefault() 
                        ?? w.Product.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() 
                        ?? w.Product.Variants.FirstOrDefault().ImageUrl ?? "",
                    categoryId = w.Product.CategoryID,
                    categoryName = w.Product.Category.CategoryName,
                    inStock = w.Product.Status && w.Product.Variants.Sum(v => v.Stock) > 0,
                    quantity = w.Product.Variants.Sum(v => v.Stock)
                })
                .ToListAsync();

            return Ok(new { success = true, data = wishlistItems, message = "Lấy danh sách yêu thích thành công" });
        }

        [HttpPost("toggle/{productId}")]
        public async Task<IActionResult> ToggleWishlist(int productId)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound(new { success = false, message = "Sản phẩm không tồn tại" });

            var item = await _context.Wishlists.FindAsync(userId, productId);
            bool isAdded = false;

            if (item != null)
            {
                _context.Wishlists.Remove(item);
                await _context.SaveChangesAsync();
            }
            else
            {
                var newFav = new Wishlist
                {
                    UserID = userId,
                    ProductID = productId,
                    CreatedAt = DateTime.Now
                };
                _context.Wishlists.Add(newFav);
                await _context.SaveChangesAsync();
                isAdded = true;
            }

            return Ok(new 
            { 
                success = true, 
                isWishlisted = isAdded, 
                message = isAdded ? "Đã thêm sản phẩm vào danh sách yêu thích" : "Đã xóa sản phẩm khỏi danh sách yêu thích" 
            });
        }

        [HttpPost("sync")]
        public async Task<IActionResult> SyncWishlist([FromBody] int[] productIds)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (productIds == null || productIds.Length == 0)
                return Ok(new { success = true, message = "Không có sản phẩm nào cần đồng bộ" });

            var existingProductIds = await _context.Products
                .Where(p => productIds.Contains(p.ProductID))
                .Select(p => p.ProductID)
                .ToListAsync();

            var currentWishlist = await _context.Wishlists
                .Where(w => w.UserID == userId)
                .Select(w => w.ProductID)
                .ToListAsync();

            var toAdd = existingProductIds
                .Where(id => !currentWishlist.Contains(id))
                .Select(id => new Wishlist
                {
                    UserID = userId,
                    ProductID = id,
                    CreatedAt = DateTime.Now
                })
                .ToList();

            if (toAdd.Count > 0)
            {
                _context.Wishlists.AddRange(toAdd);
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, message = "Đồng bộ danh sách yêu thích thành công" });
        }
    }
}

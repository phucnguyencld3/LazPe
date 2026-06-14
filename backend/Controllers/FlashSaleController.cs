using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FlashSaleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FlashSaleController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // CLIENT APIS
        // ==========================================

        // GET: api/flashsale/current
        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentFlashSale()
        {
            var now = DateTime.Now;

            // Lấy tất cả FlashSale đang hoạt động (IsActive) và chưa kết thúc (EndTime >= now)
            var activeSales = await _context.FlashSales
                .Include(fs => fs.FlashSaleItems)
                .Where(fs => fs.IsActive && fs.EndTime >= now)
                .OrderBy(fs => fs.StartTime)
                .ToListAsync();

            // Đồng bộ trạng thái tự động dựa trên thời gian
            bool statusChanged = false;
            foreach (var sale in activeSales)
            {
                var expectedStatus = FlashSaleStatus.Upcoming;
                if (now >= sale.StartTime && now <= sale.EndTime)
                    expectedStatus = FlashSaleStatus.Active;
                else if (now > sale.EndTime)
                    expectedStatus = FlashSaleStatus.Ended;

                if (sale.Status != expectedStatus)
                {
                    sale.Status = expectedStatus;
                    statusChanged = true;
                }
            }
            if (statusChanged)
            {
                await _context.SaveChangesAsync();
            }

            var responseList = new List<FlashSaleResponseDto>();

            foreach (var sale in activeSales)
            {
                var response = new FlashSaleResponseDto
                {
                    Id = sale.Id,
                    Name = sale.Name,
                    StartTime = sale.StartTime,
                    EndTime = sale.EndTime,
                    Status = sale.Status,
                    IsActive = sale.IsActive,
                    CreatedAt = sale.CreatedAt,
                    CreatedBy = sale.CreatedBy,
                    FlashSaleItems = new List<FlashSaleItemResponseDto>()
                };

                // Điền thông tin chi tiết tên, ảnh, giá gốc của từng item trong Flash Sale
                foreach (var item in sale.FlashSaleItems)
                {
                    var itemDto = new FlashSaleItemResponseDto
                    {
                        Id = item.Id,
                        FlashSaleId = item.FlashSaleId,
                        ItemType = item.ItemType,
                        ReferenceId = item.ReferenceId,
                        DiscountPrice = item.DiscountPrice,
                        TotalQuantity = item.TotalQuantity,
                        SoldQuantity = item.SoldQuantity,
                        MaxQuantityPerUser = item.MaxQuantityPerUser
                    };

                    if (item.ItemType == FlashSaleItemType.Product)
                    {
                        var product = await _context.Products
                            .Include(p => p.Variants)
                            .Include(p => p.Images)
                            .FirstOrDefaultAsync(p => p.ProductID == item.ReferenceId);
                        if (product != null)
                        {
                            itemDto.ItemName = product.ProductName;
                            itemDto.OriginalPrice = product.Price;
                            itemDto.ImageUrl = product.Variants?.FirstOrDefault(v => !string.IsNullOrEmpty(v.ImageUrl))?.ImageUrl ?? product.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl;
                            itemDto.ProductId = product.ProductID;
                        }
                    }
                    else if (item.ItemType == FlashSaleItemType.Variant)
                    {
                        var variant = await _context.Variants
                            .Include(v => v.Product)
                            .FirstOrDefaultAsync(v => v.VariantID == item.ReferenceId);
                        if (variant != null)
                        {
                            itemDto.ItemName = $"{variant.Product?.ProductName} ({variant.VariantName})";
                            itemDto.OriginalPrice = variant.UnitPrice;
                            itemDto.SKU = variant.SKU;
                            itemDto.ImageUrl = variant.ImageUrl;
                            itemDto.ProductId = variant.ProductID;
                        }
                    }
                    else if (item.ItemType == FlashSaleItemType.Bundle)
                    {
                        var bundle = await _context.Bundles
                            .FirstOrDefaultAsync(b => b.BundleID == item.ReferenceId);
                        if (bundle != null)
                        {
                            itemDto.ItemName = bundle.Name;
                            itemDto.OriginalPrice = bundle.OriginalPrice ?? 0;
                            itemDto.ImageUrl = bundle.ImageUrl;
                        }
                    }

                    response.FlashSaleItems.Add(itemDto);
                }

                responseList.Add(response);
            }

            return Ok(responseList);
        }

        // ==========================================
        // ADMIN APIS
        // ==========================================

        // GET: api/flashsale/admin
        [HttpGet("admin")]
        public async Task<IActionResult> GetAdminFlashSales()
        {
            var sales = await _context.FlashSales
                .Include(fs => fs.FlashSaleItems)
                .OrderByDescending(fs => fs.StartTime)
                .ToListAsync();

            var now = DateTime.Now;
            var responseList = new List<FlashSaleResponseDto>();

            foreach (var sale in sales)
            {
                // Cập nhật trạng thái tự động trong bộ nhớ và lưu nếu đổi
                var expectedStatus = FlashSaleStatus.Upcoming;
                if (now >= sale.StartTime && now <= sale.EndTime)
                    expectedStatus = FlashSaleStatus.Active;
                else if (now > sale.EndTime)
                    expectedStatus = FlashSaleStatus.Ended;

                if (sale.Status != expectedStatus)
                {
                    sale.Status = expectedStatus;
                    await _context.SaveChangesAsync();
                }

                responseList.Add(new FlashSaleResponseDto
                {
                    Id = sale.Id,
                    Name = sale.Name,
                    StartTime = sale.StartTime,
                    EndTime = sale.EndTime,
                    Status = sale.Status,
                    IsActive = sale.IsActive,
                    CreatedAt = sale.CreatedAt,
                    CreatedBy = sale.CreatedBy,
                    FlashSaleItems = sale.FlashSaleItems.Select(item => new FlashSaleItemResponseDto
                    {
                        Id = item.Id,
                        FlashSaleId = item.FlashSaleId,
                        ItemType = item.ItemType,
                        ReferenceId = item.ReferenceId,
                        DiscountPrice = item.DiscountPrice,
                        TotalQuantity = item.TotalQuantity,
                        SoldQuantity = item.SoldQuantity,
                        MaxQuantityPerUser = item.MaxQuantityPerUser
                    }).ToList()
                });
            }

            return Ok(responseList);
        }

        // GET: api/flashsale/admin/5
        [HttpGet("admin/{id}")]
        public async Task<IActionResult> GetAdminFlashSaleById(int id)
        {
            var sale = await _context.FlashSales
                .Include(fs => fs.FlashSaleItems)
                .FirstOrDefaultAsync(fs => fs.Id == id);

            if (sale == null)
            {
                return NotFound(new { message = "Không tìm thấy chiến dịch Flash Sale." });
            }

            var response = new FlashSaleResponseDto
            {
                Id = sale.Id,
                Name = sale.Name,
                StartTime = sale.StartTime,
                EndTime = sale.EndTime,
                Status = sale.Status,
                IsActive = sale.IsActive,
                CreatedAt = sale.CreatedAt,
                CreatedBy = sale.CreatedBy,
                FlashSaleItems = new List<FlashSaleItemResponseDto>()
            };

            foreach (var item in sale.FlashSaleItems)
            {
                var itemDto = new FlashSaleItemResponseDto
                {
                    Id = item.Id,
                    FlashSaleId = item.FlashSaleId,
                    ItemType = item.ItemType,
                    ReferenceId = item.ReferenceId,
                    DiscountPrice = item.DiscountPrice,
                    TotalQuantity = item.TotalQuantity,
                    SoldQuantity = item.SoldQuantity,
                    MaxQuantityPerUser = item.MaxQuantityPerUser
                };

                if (item.ItemType == FlashSaleItemType.Product)
                {
                    var product = await _context.Products.Include(p => p.Variants).Include(p => p.Images).FirstOrDefaultAsync(p => p.ProductID == item.ReferenceId);
                    if (product != null)
                    {
                        itemDto.ItemName = product.ProductName;
                        itemDto.OriginalPrice = product.Price;
                        itemDto.ImageUrl = product.Variants?.FirstOrDefault(v => !string.IsNullOrEmpty(v.ImageUrl))?.ImageUrl ?? product.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl;
                        itemDto.ProductId = product.ProductID;
                    }
                }
                else if (item.ItemType == FlashSaleItemType.Variant)
                {
                    var variant = await _context.Variants.Include(v => v.Product).FirstOrDefaultAsync(v => v.VariantID == item.ReferenceId);
                    if (variant != null)
                    {
                        itemDto.ItemName = $"{variant.Product?.ProductName} ({variant.VariantName})";
                        itemDto.OriginalPrice = variant.UnitPrice;
                        itemDto.SKU = variant.SKU;
                        itemDto.ImageUrl = variant.ImageUrl;
                        itemDto.ProductId = variant.ProductID;
                    }
                }
                else if (item.ItemType == FlashSaleItemType.Bundle)
                {
                    var bundle = await _context.Bundles.FirstOrDefaultAsync(b => b.BundleID == item.ReferenceId);
                    if (bundle != null)
                    {
                        itemDto.ItemName = bundle.Name;
                        itemDto.OriginalPrice = bundle.OriginalPrice ?? 0;
                        itemDto.ImageUrl = bundle.ImageUrl;
                    }
                }

                response.FlashSaleItems.Add(itemDto);
            }

            return Ok(response);
        }

        // POST: api/flashsale/admin
        [HttpPost("admin")]
        public async Task<IActionResult> CreateFlashSale([FromBody] CreateFlashSaleDto dto)
        {
            var now = DateTime.Now;
            if (dto.StartTime < now.AddMinutes(-2))
            {
                return BadRequest(new { message = "Thời gian bắt đầu không được ở quá khứ." });
            }

            if (dto.EndTime <= now)
            {
                return BadRequest(new { message = "Thời gian kết thúc phải lớn hơn thời gian hiện tại." });
            }

            if (dto.StartTime >= dto.EndTime)
            {
                return BadRequest(new { message = "Thời gian kết thúc phải lớn hơn thời gian bắt đầu." });
            }

            var sale = new FlashSale
            {
                Name = dto.Name,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                IsActive = dto.IsActive,
                Status = dto.StartTime > DateTime.Now ? FlashSaleStatus.Upcoming : FlashSaleStatus.Active,
                CreatedBy = GetCurrentUserId()
            };

            foreach (var itemDto in dto.FlashSaleItems)
            {
                sale.FlashSaleItems.Add(new FlashSaleItem
                {
                    ItemType = itemDto.ItemType,
                    ReferenceId = itemDto.ReferenceId,
                    DiscountPrice = itemDto.DiscountPrice,
                    TotalQuantity = itemDto.TotalQuantity,
                    SoldQuantity = 0,
                    MaxQuantityPerUser = itemDto.MaxQuantityPerUser
                });
            }

            _context.FlashSales.Add(sale);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAdminFlashSaleById), new { id = sale.Id }, sale);
        }

        // PUT: api/flashsale/admin/5
        [HttpPut("admin/{id}")]
        public async Task<IActionResult> UpdateFlashSale(int id, [FromBody] UpdateFlashSaleDto dto)
        {
            var sale = await _context.FlashSales
                .Include(fs => fs.FlashSaleItems)
                .FirstOrDefaultAsync(fs => fs.Id == id);

            if (sale == null)
            {
                return NotFound(new { message = "Không tìm thấy chiến dịch Flash Sale." });
            }

            var now = DateTime.Now;

            if (dto.EndTime <= now)
            {
                return BadRequest(new { message = "Thời gian kết thúc phải lớn hơn thời gian hiện tại." });
            }

            if (sale.Status == FlashSaleStatus.Upcoming || dto.StartTime != sale.StartTime)
            {
                if (dto.StartTime < now.AddMinutes(-2))
                {
                    return BadRequest(new { message = "Thời gian bắt đầu không được ở quá khứ." });
                }
            }

            if (dto.StartTime >= dto.EndTime)
            {
                return BadRequest(new { message = "Thời gian kết thúc phải lớn hơn thời gian bắt đầu." });
            }

            sale.Name = dto.Name;
            sale.StartTime = dto.StartTime;
            sale.EndTime = dto.EndTime;
            sale.IsActive = dto.IsActive;

            // Cập nhật lại trạng thái chiến dịch dựa trên thời gian mới
            if (now >= sale.StartTime && now <= sale.EndTime)
                sale.Status = FlashSaleStatus.Active;
            else if (now > sale.EndTime)
                sale.Status = FlashSaleStatus.Ended;
            else
                sale.Status = FlashSaleStatus.Upcoming;

            // Xóa các items cũ và add lại mới (để đơn giản)
            _context.FlashSaleItems.RemoveRange(sale.FlashSaleItems);

            foreach (var itemDto in dto.FlashSaleItems)
            {
                sale.FlashSaleItems.Add(new FlashSaleItem
                {
                    ItemType = itemDto.ItemType,
                    ReferenceId = itemDto.ReferenceId,
                    DiscountPrice = itemDto.DiscountPrice,
                    TotalQuantity = itemDto.TotalQuantity,
                    SoldQuantity = 0,
                    MaxQuantityPerUser = itemDto.MaxQuantityPerUser
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật Flash Sale thành công." });
        }

        // DELETE: api/flashsale/admin/5
        [HttpDelete("admin/{id}")]
        public async Task<IActionResult> DeleteFlashSale(int id)
        {
            var sale = await _context.FlashSales
                .Include(fs => fs.FlashSaleItems)
                .FirstOrDefaultAsync(fs => fs.Id == id);

            if (sale == null)
            {
                return NotFound(new { message = "Không tìm thấy chiến dịch Flash Sale." });
            }

            // Chỉ cho phép xóa khi chưa có mặt hàng nào được mua bán
            if (sale.FlashSaleItems.Any(item => item.SoldQuantity > 0))
            {
                return BadRequest(new { message = "Không thể xóa chiến dịch Flash Sale này vì đã có khách hàng đặt mua sản phẩm." });
            }

            _context.FlashSales.Remove(sale);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa chiến dịch Flash Sale thành công." });
        }

        // GET: api/flashsale/admin/{id}/purchasers
        [HttpGet("admin/{id}/purchasers")]
        public async Task<IActionResult> GetFlashSalePurchasers(int id)
        {
            var sale = await _context.FlashSales
                .Include(fs => fs.FlashSaleItems)
                .FirstOrDefaultAsync(fs => fs.Id == id);

            if (sale == null)
            {
                return NotFound(new { message = "Không tìm thấy chiến dịch Flash Sale." });
            }

            // Lấy tất cả hóa đơn trong khoảng thời gian chạy Flash Sale (không tính đơn hủy)
            var invoices = await _context.Invoices
                .Include(i => i.User)
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Variant)
                        .ThenInclude(v => v.Product)
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Bundle)
                .Where(i => i.CreatedAt >= sale.StartTime 
                    && i.CreatedAt <= sale.EndTime
                    && i.Status != OrderStatus.Cancelled)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            var purchasers = new List<object>();

            foreach (var invoice in invoices)
            {
                foreach (var detail in invoice.InvoiceDetails)
                {
                    foreach (var fsItem in sale.FlashSaleItems)
                    {
                        bool isMatch = false;
                        string itemName = "";

                        if (fsItem.ItemType == FlashSaleItemType.Bundle && detail.BundleID == fsItem.ReferenceId)
                        {
                            isMatch = true;
                            itemName = detail.Bundle?.Name ?? "Gói sản phẩm";
                        }
                        else if (fsItem.ItemType == FlashSaleItemType.Variant && detail.VariantID == fsItem.ReferenceId)
                        {
                            isMatch = true;
                            itemName = detail.Variant != null 
                                ? $"{detail.Variant.Product?.ProductName} ({detail.Variant.VariantName})"
                                : "Phân loại sản phẩm";
                        }
                        else if (fsItem.ItemType == FlashSaleItemType.Product && detail.VariantID.HasValue)
                        {
                            if (detail.Variant?.ProductID == fsItem.ReferenceId)
                            {
                                isMatch = true;
                                itemName = detail.Variant.Product?.ProductName ?? "Sản phẩm";
                            }
                        }

                        if (isMatch)
                        {
                            purchasers.Add(new
                            {
                                InvoiceId = invoice.InvoiceID,
                                InvoiceCode = $"HD-{invoice.InvoiceID}",
                                CustomerId = invoice.UserID,
                                CustomerName = invoice.User?.FullName ?? invoice.ShippingRecipientName ?? "Khách vãng lai",
                                CustomerEmail = invoice.User?.Email ?? "N/A",
                                CustomerPhone = invoice.User?.PhoneNumber ?? invoice.ShippingPhone ?? "N/A",
                                ItemName = itemName,
                                Quantity = detail.Quantity,
                                UnitPrice = detail.UnitPrice,
                                TotalPrice = detail.TotalPrice,
                                PurchasedAt = invoice.CreatedAt,
                                Status = invoice.Status.ToString()
                            });
                        }
                    }
                }
            }

            return Ok(purchasers);
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst("UserId")?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? string.Empty;
        }
    }
}

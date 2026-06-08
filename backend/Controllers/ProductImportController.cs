using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Models;
using PolyBabyAPI.DTOs;
using System.Globalization;
using System.Security.Claims;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProductImportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductImportController> _logger;

        public ProductImportController(ApplicationDbContext context, ILogger<ProductImportController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("template")]
        [AllowAnonymous]
        public IActionResult DownloadTemplate()
        {
            using var workbook = new XLWorkbook();

            var productsSheet = workbook.Worksheets.Add("Products");
            productsSheet.Cell(1, 1).Value = "ProductCode";
            productsSheet.Cell(1, 2).Value = "ProductName";
            productsSheet.Cell(1, 3).Value = "Description";
            productsSheet.Cell(1, 4).Value = "CategoryName";
            productsSheet.Cell(1, 5).Value = "SupplierName";
            productsSheet.Cell(1, 6).Value = "BasePrice";
            productsSheet.Cell(1, 7).Value = "Status";
            productsSheet.Cell(1, 8).Value = "Option1Name";
            productsSheet.Cell(1, 9).Value = "Option1Values";
            productsSheet.Cell(1, 10).Value = "Option2Name";
            productsSheet.Cell(1, 11).Value = "Option2Values";

            productsSheet.Cell(2, 1).Value = "SP-AO-001";
            productsSheet.Cell(2, 2).Value = "Áo body bé trai";
            productsSheet.Cell(2, 3).Value = "Chất liệu cotton mềm mại";
            productsSheet.Cell(2, 4).Value = "Quần áo bé trai";
            productsSheet.Cell(2, 5).Value = "LazPe";
            productsSheet.Cell(2, 6).Value = "150000";
            productsSheet.Cell(2, 7).Value = "true";
            productsSheet.Cell(2, 8).Value = "Màu sắc";
            productsSheet.Cell(2, 9).Value = "Xanh, Đỏ";
            productsSheet.Cell(2, 10).Value = "Kích cỡ";
            productsSheet.Cell(2, 11).Value = "S, M, L";

            var variantsSheet = workbook.Worksheets.Add("Variants");
            variantsSheet.Cell(1, 1).Value = "ProductCode";
            variantsSheet.Cell(1, 2).Value = "SKU";
            variantsSheet.Cell(1, 3).Value = "Option1Value";
            variantsSheet.Cell(1, 4).Value = "Option2Value";
            variantsSheet.Cell(1, 5).Value = "Price";
            variantsSheet.Cell(1, 6).Value = "Stock";
            variantsSheet.Cell(1, 7).Value = "ImageUrl";

            variantsSheet.Cell(2, 1).Value = "SP-AO-001";
            variantsSheet.Cell(2, 2).Value = "SP-AO-001-XANH-S";
            variantsSheet.Cell(2, 3).Value = "Xanh";
            variantsSheet.Cell(2, 4).Value = "S";
            variantsSheet.Cell(2, 5).Value = "150000";
            variantsSheet.Cell(2, 6).Value = "10";
            variantsSheet.Cell(2, 7).Value = "";

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ProductImportTemplate.xlsx");
        }

        [HttpPost("validate")]
        [Permission("Product.Create")]
        public async Task<IActionResult> ValidateImport(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng tải lên file Excel");

            var response = new ValidateImportResponseDto();
            
            try
            {
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                using var workbook = new XLWorkbook(stream);

                var productsSheet = workbook.Worksheet("Products");
                var variantsSheet = workbook.Worksheet("Variants");

                if (productsSheet == null || variantsSheet == null)
                    return BadRequest("File không đúng định dạng mẫu. Cần có 2 sheet 'Products' và 'Variants'.");

                // Parse Products
                var productRows = productsSheet.RowsUsed().Skip(1); // skip header
                var inFileDataProducts = new HashSet<string>();

                foreach (var row in productRows)
                {
                    string code = row.Cell(1).GetString().Trim();
                    if (string.IsNullOrEmpty(code)) continue;

                    var pDto = new ProductImportDto
                    {
                        ExcelRow = row.RowNumber().ToString(),
                        ProductCode = code,
                        ProductName = row.Cell(2).GetString().Trim(),
                        Description = row.Cell(3).GetString().Trim(),
                        CategoryName = row.Cell(4).GetString().Trim(),
                        SupplierName = row.Cell(5).GetString().Trim(),
                        BasePrice = decimal.TryParse(row.Cell(6).GetString(), out var bp) ? bp : 0,
                        Status = row.Cell(7).GetString().Trim(),
                        Option1Name = row.Cell(8).GetString().Trim(),
                        Option1Values = row.Cell(9).GetString().Trim(),
                        Option2Name = row.Cell(10).GetString().Trim(),
                        Option2Values = row.Cell(11).GetString().Trim()
                    };

                    // Basic Validations
                    if (string.IsNullOrEmpty(pDto.ProductName))
                    {
                        pDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Products", Row = pDto.ExcelRow, Field = "ProductName", Message = "Tên sản phẩm trống" });
                    }
                    if (string.IsNullOrEmpty(pDto.CategoryName))
                    {
                        pDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Products", Row = pDto.ExcelRow, Field = "CategoryName", Message = "Danh mục trống" });
                    }
                    else
                    {
                        var cat = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryName == pDto.CategoryName);
                        if (cat == null)
                        {
                            pDto.IsValid = false;
                            response.Errors.Add(new ImportErrorDto { Sheet = "Products", Row = pDto.ExcelRow, Field = "CategoryName", Message = $"Danh mục '{pDto.CategoryName}' không tồn tại" });
                        }
                        else pDto.CategoryId = cat.CategoryID;
                    }

                    if (string.IsNullOrEmpty(pDto.SupplierName))
                    {
                        pDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Products", Row = pDto.ExcelRow, Field = "SupplierName", Message = "Nhà cung cấp trống" });
                    }
                    else
                    {
                        var sup = await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierName == pDto.SupplierName);
                        if (sup == null)
                        {
                            pDto.IsValid = false;
                            response.Errors.Add(new ImportErrorDto { Sheet = "Products", Row = pDto.ExcelRow, Field = "SupplierName", Message = $"Nhà cung cấp '{pDto.SupplierName}' không tồn tại" });
                        }
                        else pDto.SupplierId = sup.SupplierID;
                    }

                    // Duplicates within file
                    if (inFileDataProducts.Contains(pDto.ProductCode))
                    {
                        pDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Products", Row = pDto.ExcelRow, Field = "ProductCode", Message = "Mã sản phẩm trùng lặp trong file Excel" });
                    }
                    else
                    {
                        inFileDataProducts.Add(pDto.ProductCode);
                    }

                    // Duplicates in DB
                    var existingProd = await _context.Products.FirstOrDefaultAsync(p => p.Code == pDto.ProductCode);
                    if (existingProd != null)
                    {
                        response.Duplicates.Add(new ImportDuplicateDto { Sheet = "Products", Row = pDto.ExcelRow, ItemCode = pDto.ProductCode, ResolvingAction = "Skip" });
                    }

                    response.Products.Add(pDto);
                }

                // Parse Variants
                var variantRows = variantsSheet.RowsUsed().Skip(1);
                var inFileSkus = new HashSet<string>();

                foreach (var row in variantRows)
                {
                    string pCode = row.Cell(1).GetString().Trim();
                    string sku = row.Cell(2).GetString().Trim();
                    if (string.IsNullOrEmpty(pCode) && string.IsNullOrEmpty(sku)) continue;

                    var vDto = new VariantImportDto
                    {
                        ExcelRow = row.RowNumber().ToString(),
                        ProductCode = pCode,
                        SKU = sku,
                        Option1Value = row.Cell(3).GetString().Trim(),
                        Option2Value = row.Cell(4).GetString().Trim(),
                        Price = decimal.TryParse(row.Cell(5).GetString(), out var vp) ? vp : 0,
                        Stock = int.TryParse(row.Cell(6).GetString(), out var st) ? st : 0,
                        ImageUrl = row.Cell(7).GetString().Trim()
                    };

                    if (!inFileDataProducts.Contains(vDto.ProductCode))
                    {
                        vDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Variants", Row = vDto.ExcelRow, Field = "ProductCode", Message = $"Mã sản phẩm '{vDto.ProductCode}' không tồn tại trong sheet Products" });
                    }

                    if (inFileSkus.Contains(vDto.SKU))
                    {
                        vDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Variants", Row = vDto.ExcelRow, Field = "SKU", Message = "SKU trùng lặp trong file Excel" });
                    }
                    else if (!string.IsNullOrEmpty(vDto.SKU))
                    {
                        inFileSkus.Add(vDto.SKU);
                    }

                    if (string.IsNullOrEmpty(vDto.SKU))
                    {
                        vDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Variants", Row = vDto.ExcelRow, Field = "SKU", Message = "SKU không được để trống" });
                    }

                    var existingVar = await _context.Variants.FirstOrDefaultAsync(v => v.SKU == vDto.SKU);
                    if (existingVar != null)
                    {
                        response.Duplicates.Add(new ImportDuplicateDto { Sheet = "Variants", Row = vDto.ExcelRow, ItemCode = vDto.SKU, ResolvingAction = "Skip" });
                    }

                    response.Variants.Add(vDto);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating Excel import");
                return StatusCode(500, "Có lỗi xảy ra khi đọc file Excel.");
            }
        }

        [HttpPost("commit")]
        [Permission("Product.Create")]
        public async Task<IActionResult> CommitImport([FromBody] ImportCommitRequestDto request)
        {
            if (request == null || !request.Products.Any())
                return BadRequest("Không có dữ liệu hợp lệ để import.");

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var actionDict = request.ActionableDuplicates.ToDictionary(
                    d => d.ItemCode, 
                    d => d.ResolvingAction // Skip, Update, CreateNew
                );

                var productCodeMap = new Dictionary<string, int>(); // map ProductCode in excel to DB ProductID

                foreach (var pDto in request.Products)
                {
                    if (!pDto.IsValid) continue;

                    string finalCode = pDto.ProductCode;
                    bool skip = false;
                    bool update = false;

                    if (actionDict.TryGetValue(pDto.ProductCode, out var action))
                    {
                        if (action == "Skip") skip = true;
                        else if (action == "Update") update = true;
                        else if (action == "CreateNew") finalCode = pDto.ProductCode + "-" + Guid.NewGuid().ToString().Substring(0,4);
                    }

                    if (skip) 
                    {
                        var extId = await _context.Products.Where(p => p.Code == pDto.ProductCode).Select(p => p.ProductID).FirstOrDefaultAsync();
                        if (extId > 0) productCodeMap[pDto.ProductCode] = extId;
                        continue;
                    }

                    Product prod;
                    if (update)
                    {
                        prod = await _context.Products.Include(p => p.ProductOptions).FirstOrDefaultAsync(p => p.Code == pDto.ProductCode);
                        if (prod == null) { skip = true; continue; } // shouldn't happen
                        
                        prod.ProductName = pDto.ProductName;
                        prod.Description = pDto.Description;
                        prod.CategoryID = pDto.CategoryId;
                        prod.SupplierID = pDto.SupplierId;
                        prod.Price = pDto.BasePrice;
                        prod.Status = pDto.Status?.ToLower() == "true";
                    }
                    else
                    {
                        prod = new Product
                        {
                            Code = finalCode,
                            ProductName = pDto.ProductName,
                            Description = pDto.Description,
                            CategoryID = pDto.CategoryId,
                            SupplierID = pDto.SupplierId,
                            Price = pDto.BasePrice,
                            Status = pDto.Status?.ToLower() == "true",
                            CreatedAt = DateTime.Now,
                            CreatedBy = currentUserId
                        };
                        _context.Products.Add(prod);
                    }
                    
                    await _context.SaveChangesAsync();
                    productCodeMap[pDto.ProductCode] = prod.ProductID;

                    // Options logic
                    if (!string.IsNullOrEmpty(pDto.Option1Name))
                    {
                        var opt1 = prod.ProductOptions?.FirstOrDefault(o => o.Name == pDto.Option1Name);
                        if (opt1 == null) 
                        {
                            opt1 = new ProductOption { ProductID = prod.ProductID, Name = pDto.Option1Name, DisplayOrder = 1, CreatedBy = currentUserId };
                            _context.ProductOptions.Add(opt1);
                            await _context.SaveChangesAsync();
                        }
                    }
                    if (!string.IsNullOrEmpty(pDto.Option2Name))
                    {
                         var opt2 = prod.ProductOptions?.FirstOrDefault(o => o.Name == pDto.Option2Name);
                         if (opt2 == null)
                         {
                             opt2 = new ProductOption { ProductID = prod.ProductID, Name = pDto.Option2Name, DisplayOrder = 2, CreatedBy = currentUserId };
                             _context.ProductOptions.Add(opt2);
                             await _context.SaveChangesAsync();
                         }
                    }
                }

                foreach (var vDto in request.Variants)
                {
                    if (!vDto.IsValid) continue;
                    if (!productCodeMap.TryGetValue(vDto.ProductCode, out int prodId)) continue; // skipped product

                    var prod = await _context.Products.Include(p => p.ProductOptions).ThenInclude(po => po.ProductOptionValues).FirstOrDefaultAsync(p => p.ProductID == prodId);
                    if (prod == null) continue;

                    string finalSku = vDto.SKU;
                    bool skip = false;
                    bool update = false;

                    if (actionDict.TryGetValue(vDto.SKU, out var action))
                    {
                        if (action == "Skip") skip = true;
                        else if (action == "Update") update = true;
                        else if (action == "CreateNew") finalSku = vDto.SKU + "-" + Guid.NewGuid().ToString().Substring(0,4);
                    }

                    if (skip) continue;

                    Variant v;
                    if (update)
                    {
                        v = await _context.Variants.FirstOrDefaultAsync(v => v.SKU == vDto.SKU);
                        if (v != null)
                        {
                            v.VariantName = $"{prod.ProductName} - {vDto.Option1Value} {vDto.Option2Value}".Trim();
                            v.UnitPrice = vDto.Price;
                            v.Stock = vDto.Stock;
                            v.ImageUrl = vDto.ImageUrl;
                            v.Description = $"Biến thể {v.VariantName}";
                        }
                    }
                    else
                    {
                        v = new Variant
                        {
                            ProductID = prod.ProductID,
                            SKU = finalSku,
                            VariantName = $"{prod.ProductName} - {vDto.Option1Value} {vDto.Option2Value}".Trim(),
                            UnitPrice = vDto.Price,
                            Stock = vDto.Stock,
                            ImageUrl = vDto.ImageUrl,
                            Description = "Biến thể nhập từ Excel",
                            CreatedAt = DateTime.Now,
                            CreatedBy = currentUserId
                        };
                        _context.Variants.Add(v);
                        await _context.SaveChangesAsync();

                        // Associate Option Values
                        var options = prod.ProductOptions.ToList();
                        if (options.Count > 0 && !string.IsNullOrEmpty(vDto.Option1Value))
                        {
                            var o1 = options.FirstOrDefault(o => o.DisplayOrder == 1);
                            if (o1 != null)
                            {
                                var ov = o1.ProductOptionValues.FirstOrDefault(val => val.Value == vDto.Option1Value);
                                if (ov == null)
                                {
                                    ov = new ProductOptionValue { ProductOptionID = o1.ProductOptionID, Value = vDto.Option1Value, CreatedBy = currentUserId };
                                    _context.ProductOptionValues.Add(ov);
                                    await _context.SaveChangesAsync();
                                    o1.ProductOptionValues.Add(ov);
                                }
                                _context.VariantOptionValues.Add(new VariantOptionValue { VariantID = v.VariantID, ProductOptionValueID = ov.ProductOptionValueID });
                            }
                        }
                        if (options.Count > 1 && !string.IsNullOrEmpty(vDto.Option2Value))
                        {
                            var o2 = options.FirstOrDefault(o => o.DisplayOrder == 2);
                            if (o2 != null)
                            {
                                var ov = o2.ProductOptionValues.FirstOrDefault(val => val.Value == vDto.Option2Value);
                                if (ov == null)
                                {
                                    ov = new ProductOptionValue { ProductOptionID = o2.ProductOptionID, Value = vDto.Option2Value, CreatedBy = currentUserId };
                                    _context.ProductOptionValues.Add(ov);
                                    await _context.SaveChangesAsync();
                                    o2.ProductOptionValues.Add(ov);
                                }
                                _context.VariantOptionValues.Add(new VariantOptionValue { VariantID = v.VariantID, ProductOptionValueID = ov.ProductOptionValueID });
                            }
                        }
                    }
                }
                
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                return Ok(new { message = "Import thành công!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error committing Excel import");
                return StatusCode(500, "Có lỗi xảy ra khi lưu dữ liệu.");
            }
        }
    }
}
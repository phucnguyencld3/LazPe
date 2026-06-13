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

        // ─────────────────────────────────────────────
        // GET /api/ProductImport/template
        // ─────────────────────────────────────────────
        [HttpGet("template")]
        [AllowAnonymous]
        public IActionResult DownloadTemplate()
        {
            using var workbook = new XLWorkbook();

            var productsSheet = workbook.Worksheets.Add("Products");
            productsSheet.Cell(1, 1).Value = "ProductCode";
            productsSheet.Cell(1, 2).Value = "ProductName";
            productsSheet.Cell(1, 3).Value = "Description";
            productsSheet.Cell(1, 4).Value = "Specifications";
            productsSheet.Cell(1, 5).Value = "CategoryName";
            productsSheet.Cell(1, 6).Value = "SupplierName";
            productsSheet.Cell(1, 7).Value = "BasePrice";
            productsSheet.Cell(1, 8).Value = "Status";
            productsSheet.Cell(1, 9).Value = "Option1Name";
            productsSheet.Cell(1, 10).Value = "Option1Values";
            productsSheet.Cell(1, 11).Value = "Option2Name";
            productsSheet.Cell(1, 12).Value = "Option2Values";

            productsSheet.Cell(2, 1).Value = "SP-AO-001";
            productsSheet.Cell(2, 2).Value = "Áo body bé trai";
            productsSheet.Cell(2, 3).Value = "Chất liệu cotton mềm mại";
            productsSheet.Cell(2, 4).Value = "Chất liệu: Cotton 100% | Xuất xứ: Việt Nam | Độ tuổi: 1-3 tuổi";
            productsSheet.Cell(2, 5).Value = "Quần áo bé trai";
            productsSheet.Cell(2, 6).Value = "LazPe";
            productsSheet.Cell(2, 7).Value = "150000";
            productsSheet.Cell(2, 8).Value = "true";
            productsSheet.Cell(2, 9).Value = "Màu sắc";
            productsSheet.Cell(2, 10).Value = "Xanh, Đỏ";
            productsSheet.Cell(2, 11).Value = "Kích cỡ";
            productsSheet.Cell(2, 12).Value = "S, M, L";

            var variantsSheet = workbook.Worksheets.Add("Variants");
            variantsSheet.Cell(1, 1).Value = "ProductCode";
            variantsSheet.Cell(1, 2).Value = "SKU";
            variantsSheet.Cell(1, 3).Value = "Option1Value";
            variantsSheet.Cell(1, 4).Value = "Option2Value";
            variantsSheet.Cell(1, 5).Value = "Price";
            variantsSheet.Cell(1, 6).Value = "Stock";
            variantsSheet.Cell(1, 7).Value = "ImageUrl";

            variantsSheet.Cell(2, 1).Value = "SP-AO-001";
            variantsSheet.Cell(2, 2).Value = "SP-AO-001-001";
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

        // ─────────────────────────────────────────────
        // POST /api/ProductImport/validate
        // ─────────────────────────────────────────────
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
                var productRows = productsSheet.RowsUsed().Skip(1);
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
                        Specifications = row.Cell(4).GetString().Trim(),
                        CategoryName = row.Cell(5).GetString().Trim(),
                        SupplierName = row.Cell(6).GetString().Trim(),
                        BasePrice = decimal.TryParse(row.Cell(7).GetString(), out var bp) ? bp : 0,
                        Status = row.Cell(8).GetString().Trim(),
                        Option1Name = row.Cell(9).GetString().Trim(),
                        Option1Values = row.Cell(10).GetString().Trim(),
                        Option2Name = row.Cell(11).GetString().Trim(),
                        Option2Values = row.Cell(12).GetString().Trim()
                    };

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

                    if (inFileDataProducts.Contains(pDto.ProductCode))
                    {
                        pDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Products", Row = pDto.ExcelRow, Field = "ProductCode", Message = "Mã sản phẩm trùng lặp trong file Excel" });
                    }
                    else
                    {
                        inFileDataProducts.Add(pDto.ProductCode);
                    }

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

        // ─────────────────────────────────────────────
        // POST /api/ProductImport/commit
        // ─────────────────────────────────────────────
        [HttpPost("commit")]
        [Permission("Product.Create")]
        public async Task<IActionResult> CommitImport([FromBody] ImportCommitRequestDto request)
        {
            if (request == null || !request.Products.Any())
                return BadRequest("Không có dữ liệu hợp lệ để import.");

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";

            // Pre-load all categories & suppliers to resolve name → ID
            // Use GroupBy to handle duplicate names gracefully (take first match)
            var allCategoriesRaw = await _context.Categories.ToListAsync();
            var allCategories = allCategoriesRaw
                .GroupBy(c => c.CategoryName.ToLower())
                .ToDictionary(g => g.Key, g => g.First().CategoryID);

            var allSuppliersRaw = await _context.Suppliers.ToListAsync();
            var allSuppliers = allSuppliersRaw
                .GroupBy(s => s.SupplierName.ToLower())
                .ToDictionary(g => g.Key, g => g.First().SupplierID);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var actionDict = request.ActionableDuplicates
                    .GroupBy(d => d.ItemCode)
                    .ToDictionary(g => g.Key, g => g.First().ResolvingAction);

                var productCodeMap = new Dictionary<string, int>(); // excel code → DB ProductID

                // ── Products ──────────────────────────────────────────────
                foreach (var pDto in request.Products)
                {
                    if (!pDto.IsValid) continue;

                    // Resolve CategoryId / SupplierId from name if ID is 0
                    int resolvedCategoryId = pDto.CategoryId;
                    if (resolvedCategoryId <= 0 && !string.IsNullOrEmpty(pDto.CategoryName))
                        allCategories.TryGetValue(pDto.CategoryName.ToLower(), out resolvedCategoryId);

                    int resolvedSupplierId = pDto.SupplierId;
                    if (resolvedSupplierId <= 0 && !string.IsNullOrEmpty(pDto.SupplierName))
                        allSuppliers.TryGetValue(pDto.SupplierName.ToLower(), out resolvedSupplierId);

                    if (resolvedCategoryId <= 0)
                    {
                        _logger.LogWarning("Bỏ qua sản phẩm {Code}: không tìm thấy danh mục '{Cat}'", pDto.ProductCode, pDto.CategoryName);
                        continue;
                    }

                    // Determine action (Skip / Update / CreateNew)
                    string finalCode = pDto.ProductCode;
                    bool skip = false, update = false;

                    if (actionDict.TryGetValue(pDto.ProductCode, out var prodAction))
                    {
                        if (prodAction == "Skip")        skip = true;
                        else if (prodAction == "Update") update = true;
                        else if (prodAction == "CreateNew") finalCode = pDto.ProductCode + "-" + Guid.NewGuid().ToString()[..4];
                    }

                    if (skip)
                    {
                        var extId = await _context.Products
                            .Where(p => p.Code == pDto.ProductCode)
                            .Select(p => p.ProductID)
                            .FirstOrDefaultAsync();
                        if (extId > 0) productCodeMap[pDto.ProductCode] = extId;
                        continue;
                    }

                    Product prod;
                    if (update)
                    {
                        prod = await _context.Products
                            .Include(p => p.ProductOptions)
                            .FirstOrDefaultAsync(p => p.Code == pDto.ProductCode);
                        if (prod == null) continue;

                        prod.ProductName = pDto.ProductName;
                        prod.Description = string.IsNullOrEmpty(pDto.Description) ? prod.Description : pDto.Description;
                        prod.Specifications = string.IsNullOrEmpty(pDto.Specifications) ? prod.Specifications : ParseSpecificationsToJson(pDto.Specifications);
                        prod.CategoryID  = resolvedCategoryId;
                        prod.SupplierID  = resolvedSupplierId > 0 ? resolvedSupplierId : prod.SupplierID;
                        prod.Price       = pDto.BasePrice;
                        prod.Status      = pDto.Status?.ToLower() == "true";
                    }
                    else
                    {
                        prod = new Product
                        {
                            Code        = finalCode,
                            ProductName = pDto.ProductName,
                            Description = string.IsNullOrEmpty(pDto.Description) ? "Nhập từ Excel" : pDto.Description,
                            Specifications = ParseSpecificationsToJson(pDto.Specifications),
                            CategoryID  = resolvedCategoryId,
                            SupplierID  = resolvedSupplierId > 0 ? resolvedSupplierId : allSuppliers.Values.FirstOrDefault(),
                            Price       = pDto.BasePrice,
                            Status      = pDto.Status?.ToLower() != "false",
                            CreatedAt   = DateTime.Now,
                            CreatedBy   = currentUserId
                        };
                        _context.Products.Add(prod);
                    }

                    await _context.SaveChangesAsync();
                    productCodeMap[pDto.ProductCode] = prod.ProductID;

                    // Create Options
                    if (!string.IsNullOrEmpty(pDto.Option1Name))
                    {
                        bool exists = await _context.ProductOptions
                            .AnyAsync(o => o.ProductID == prod.ProductID && o.Name == pDto.Option1Name);
                        if (!exists)
                        {
                            _context.ProductOptions.Add(new ProductOption
                            {
                                ProductID = prod.ProductID, Name = pDto.Option1Name, DisplayOrder = 1, CreatedBy = currentUserId
                            });
                            await _context.SaveChangesAsync();
                        }
                    }
                    if (!string.IsNullOrEmpty(pDto.Option2Name))
                    {
                        bool exists = await _context.ProductOptions
                            .AnyAsync(o => o.ProductID == prod.ProductID && o.Name == pDto.Option2Name);
                        if (!exists)
                        {
                            _context.ProductOptions.Add(new ProductOption
                            {
                                ProductID = prod.ProductID, Name = pDto.Option2Name, DisplayOrder = 2, CreatedBy = currentUserId
                            });
                            await _context.SaveChangesAsync();
                        }
                    }
                }

                // ── Variants ──────────────────────────────────────────────
                foreach (var vDto in request.Variants)
                {
                    if (!vDto.IsValid) continue;
                    if (!productCodeMap.TryGetValue(vDto.ProductCode, out int prodId)) continue;

                    var prod = await _context.Products
                        .Include(p => p.ProductOptions)
                        .ThenInclude(po => po.ProductOptionValues)
                        .FirstOrDefaultAsync(p => p.ProductID == prodId);
                    if (prod == null) continue;

                    string finalSku = vDto.SKU;
                    bool skip = false, update = false;

                    if (actionDict.TryGetValue(vDto.SKU, out var varAction))
                    {
                        if (varAction == "Skip")        skip = true;
                        else if (varAction == "Update") update = true;
                        else if (varAction == "CreateNew") finalSku = vDto.SKU + "-" + Guid.NewGuid().ToString()[..4];
                    }

                    if (skip) continue;

                    string variantName = $"{prod.ProductName} - {vDto.Option1Value} {vDto.Option2Value}".Trim(' ', '-').Trim();

                    if (update)
                    {
                        var existing = await _context.Variants.FirstOrDefaultAsync(v => v.SKU == vDto.SKU);
                        if (existing != null)
                        {
                            existing.VariantName = string.IsNullOrEmpty(variantName) ? existing.VariantName : variantName;
                            existing.UnitPrice   = vDto.Price;
                            existing.Stock       = vDto.Stock;
                            existing.ImageUrl    = vDto.ImageUrl;
                            existing.Description = $"Biến thể {variantName}";
                            await _context.SaveChangesAsync();
                        }
                    }
                    else
                    {
                        var newVariant = new Variant
                        {
                            ProductID   = prod.ProductID,
                            SKU         = finalSku,
                            VariantName = string.IsNullOrEmpty(variantName) ? prod.ProductName : variantName,
                            UnitPrice   = vDto.Price,
                            Stock       = vDto.Stock,
                            ImageUrl    = vDto.ImageUrl,
                            Description = string.IsNullOrEmpty(variantName) ? "Biến thể nhập từ Excel" : $"Biến thể {variantName}",
                            CreatedAt   = DateTime.Now,
                            CreatedBy   = currentUserId,
                            Status      = true
                        };
                        _context.Variants.Add(newVariant);
                        await _context.SaveChangesAsync();

                        // Associate Option Values
                        var options = prod.ProductOptions.OrderBy(o => o.DisplayOrder).ToList();

                        async Task LinkOptionValue(ProductOption opt, string valueStr)
                        {
                            if (string.IsNullOrEmpty(valueStr)) return;
                            var ov = opt.ProductOptionValues.FirstOrDefault(v => v.Value == valueStr);
                            if (ov == null)
                            {
                                ov = new ProductOptionValue
                                {
                                    ProductOptionID = opt.ProductOptionID,
                                    Value = valueStr,
                                    CreatedBy = currentUserId
                                };
                                _context.ProductOptionValues.Add(ov);
                                await _context.SaveChangesAsync();
                                opt.ProductOptionValues.Add(ov);
                            }
                            _context.VariantOptionValues.Add(new VariantOptionValue
                            {
                                VariantID = newVariant.VariantID,
                                ProductOptionValueID = ov.ProductOptionValueID
                            });
                        }

                        if (options.Count > 0) await LinkOptionValue(options[0], vDto.Option1Value);
                        if (options.Count > 1) await LinkOptionValue(options[1], vDto.Option2Value);
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
                var isDev = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
                var detail = isDev
                    ? $"{ex.Message} | {ex.InnerException?.Message}"
                    : "Vui lòng kiểm tra lại dữ liệu và thử lại.";
                return StatusCode(500, $"Có lỗi xảy ra khi lưu dữ liệu: {detail}");
            }
        }
        private string ParseSpecificationsToJson(string specRaw)
        {
            if (string.IsNullOrWhiteSpace(specRaw)) return "{}";

            var specsDict = new Dictionary<string, string>();
            var parts = specRaw.Split('|', StringSplitOptions.RemoveEmptyEntries);
            foreach (var part in parts)
            {
                var kv = part.Split(':', 2);
                if (kv.Length == 2)
                {
                    var key = kv[0].Trim();
                    var val = kv[1].Trim();
                    if (!string.IsNullOrEmpty(key) && !string.IsNullOrEmpty(val))
                    {
                        specsDict[key] = val;
                    }
                }
                else if (kv.Length == 1)
                {
                    var key = kv[0].Trim();
                    if (!string.IsNullOrEmpty(key))
                    {
                        specsDict[key] = "";
                    }
                }
            }

            return System.Text.Json.JsonSerializer.Serialize(specsDict);
        }
    }
}
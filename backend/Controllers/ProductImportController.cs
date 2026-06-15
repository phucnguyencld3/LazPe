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
            productsSheet.Cell(1, 13).Value = "ImageUrls";

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
            productsSheet.Cell(2, 13).Value = "https://example.com/img1.jpg, https://example.com/img2.jpg";

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
        // GET /api/ProductImport/export
        // ─────────────────────────────────────────────
        [HttpGet("export")]
        [Permission("Product.View")]
        public async Task<IActionResult> ExportData()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .Include(p => p.ProductOptions)
                    .ThenInclude(po => po.ProductOptionValues)
                .Include(p => p.Images)
                .Include(p => p.Variants)
                    .ThenInclude(v => v.VariantOptionValues)
                    .ThenInclude(vov => vov.ProductOptionValue)
                .ToListAsync();

            using var workbook = new XLWorkbook();

            // Products Sheet
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
            productsSheet.Cell(1, 13).Value = "ImageUrls";

            int productRow = 2;
            var variantsSheet = workbook.Worksheets.Add("Variants");
            variantsSheet.Cell(1, 1).Value = "ProductCode";
            variantsSheet.Cell(1, 2).Value = "SKU";
            variantsSheet.Cell(1, 3).Value = "Option1Value";
            variantsSheet.Cell(1, 4).Value = "Option2Value";
            variantsSheet.Cell(1, 5).Value = "Price";
            variantsSheet.Cell(1, 6).Value = "Stock";
            variantsSheet.Cell(1, 7).Value = "ImageUrl";

            int variantRow = 2;

            foreach (var p in products)
            {
                var options = p.ProductOptions.OrderBy(o => o.DisplayOrder).ToList();
                var opt1 = options.FirstOrDefault(o => o.DisplayOrder == 1);
                var opt2 = options.FirstOrDefault(o => o.DisplayOrder == 2);

                string opt1Values = opt1 != null ? string.Join(", ", opt1.ProductOptionValues.Select(v => v.Value)) : "";
                string opt2Values = opt2 != null ? string.Join(", ", opt2.ProductOptionValues.Select(v => v.Value)) : "";

                var imageUrls = string.Join(", ", p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl));

                productsSheet.Cell(productRow, 1).Value = p.Code;
                productsSheet.Cell(productRow, 2).Value = p.ProductName;
                productsSheet.Cell(productRow, 3).Value = p.Description;
                productsSheet.Cell(productRow, 4).Value = ParseJsonToSpecifications(p.Specifications);
                productsSheet.Cell(productRow, 5).Value = p.Category?.CategoryName ?? "";
                productsSheet.Cell(productRow, 6).Value = p.Supplier?.SupplierName ?? "";
                productsSheet.Cell(productRow, 7).Value = p.Price;
                productsSheet.Cell(productRow, 8).Value = p.Status ? "true" : "false";
                productsSheet.Cell(productRow, 9).Value = opt1?.Name ?? "";
                productsSheet.Cell(productRow, 10).Value = opt1Values;
                productsSheet.Cell(productRow, 11).Value = opt2?.Name ?? "";
                productsSheet.Cell(productRow, 12).Value = opt2Values;
                productsSheet.Cell(productRow, 13).Value = imageUrls;

                productRow++;

                foreach (var v in p.Variants)
                {
                    string option1Value = "";
                    string option2Value = "";

                    if (opt1 != null)
                    {
                        var vov1 = v.VariantOptionValues.FirstOrDefault(vov => vov.ProductOptionValue.ProductOptionID == opt1.ProductOptionID);
                        if (vov1 != null) option1Value = vov1.ProductOptionValue.Value;
                    }

                    if (opt2 != null)
                    {
                        var vov2 = v.VariantOptionValues.FirstOrDefault(vov => vov.ProductOptionValue.ProductOptionID == opt2.ProductOptionID);
                        if (vov2 != null) option2Value = vov2.ProductOptionValue.Value;
                    }

                    variantsSheet.Cell(variantRow, 1).Value = p.Code;
                    variantsSheet.Cell(variantRow, 2).Value = v.SKU;
                    variantsSheet.Cell(variantRow, 3).Value = option1Value;
                    variantsSheet.Cell(variantRow, 4).Value = option2Value;
                    variantsSheet.Cell(variantRow, 5).Value = v.UnitPrice;
                    variantsSheet.Cell(variantRow, 6).Value = v.Stock;
                    variantsSheet.Cell(variantRow, 7).Value = v.ImageUrl;
                    variantRow++;
                }
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();
            var fileName = $"ProductsExport_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
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
                    string productName = row.Cell(2).GetString().Trim();
                    if (string.IsNullOrEmpty(code) && string.IsNullOrEmpty(productName)) continue;

                    if (string.IsNullOrEmpty(code))
                    {
                        // Auto-generate temporary code for product to group with variants inside this Excel
                        code = "TEMP-P-" + row.RowNumber();
                    }

                    var pDto = new ProductImportDto
                    {
                        ExcelRow = row.RowNumber().ToString(),
                        ProductCode = code,
                        ProductName = productName,
                        Description = row.Cell(3).GetString().Trim(),
                        Specifications = row.Cell(4).GetString().Trim(),
                        CategoryName = row.Cell(5).GetString().Trim(),
                        SupplierName = row.Cell(6).GetString().Trim(),
                        BasePrice = decimal.TryParse(row.Cell(7).GetString(), out var bp) ? bp : 0,
                        Status = row.Cell(8).GetString().Trim(),
                        Option1Name = row.Cell(9).GetString().Trim(),
                        Option1Values = row.Cell(10).GetString().Trim(),
                        Option2Name = row.Cell(11).GetString().Trim(),
                        Option2Values = row.Cell(12).GetString().Trim(),
                        ImageUrls = row.Cell(13).GetString().Trim()
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

                // Parse Variants from Excel sheet
                var variantRows = variantsSheet.RowsUsed().Skip(1);
                var explicitVariants = new List<VariantImportDto>();

                foreach (var row in variantRows)
                {
                    string pCode = row.Cell(1).GetString().Trim();
                    string sku = row.Cell(2).GetString().Trim();
                    string opt1Val = row.Cell(3).GetString().Trim();
                    string opt2Val = row.Cell(4).GetString().Trim();

                    if (string.IsNullOrEmpty(pCode) && string.IsNullOrEmpty(sku) && string.IsNullOrEmpty(opt1Val) && string.IsNullOrEmpty(opt2Val)) continue;

                    // If pCode is empty but there's at least one product in products list, fallback to the first product's code
                    if (string.IsNullOrEmpty(pCode))
                    {
                        pCode = inFileDataProducts.FirstOrDefault() ?? "";
                    }

                    if (string.IsNullOrEmpty(sku))
                    {
                        sku = GenerateDefaultSku(pCode, opt1Val, opt2Val);
                    }

                    var vDto = new VariantImportDto
                    {
                        ExcelRow = row.RowNumber().ToString(),
                        ProductCode = pCode,
                        SKU = sku,
                        Option1Value = opt1Val,
                        Option2Value = opt2Val,
                        Price = decimal.TryParse(row.Cell(5).GetString(), out var vp) ? vp : 0,
                        Stock = int.TryParse(row.Cell(6).GetString(), out var st) ? st : 0,
                        ImageUrl = row.Cell(7).GetString().Trim()
                    };

                    explicitVariants.Add(vDto);
                }

                var finalVariants = new List<VariantImportDto>();

                // Build a map of explicit variants for quick lookup: ProductCode -> List of variants
                var explicitMap = explicitVariants
                    .GroupBy(v => v.ProductCode.ToLower())
                    .ToDictionary(g => g.Key, g => g.ToList());

                foreach (var pDto in response.Products)
                {
                    if (!pDto.IsValid) continue;

                    // Parse option values
                    var opt1Values = string.IsNullOrEmpty(pDto.Option1Values) 
                        ? new List<string>() 
                        : pDto.Option1Values.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(v => v.Trim()).ToList();

                    var opt2Values = string.IsNullOrEmpty(pDto.Option2Values) 
                        ? new List<string>() 
                        : pDto.Option2Values.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(v => v.Trim()).ToList();

                    explicitMap.TryGetValue(pDto.ProductCode.ToLower(), out var productExplicits);
                    productExplicits ??= new List<VariantImportDto>();

                    if (opt1Values.Any())
                    {
                        // Separate explicit variants into:
                        // 1. Full combos: both Option1 AND Option2 are filled
                        // 2. Representative rows: only Option1 OR only Option2 is filled (used for propagation source)
                        var fullCombos = productExplicits.Where(v =>
                            !string.IsNullOrEmpty(v.Option1Value) && !string.IsNullOrEmpty(v.Option2Value)).ToList();
                        var representativeRows = productExplicits.Where(v =>
                            (string.IsNullOrEmpty(v.Option1Value) != string.IsNullOrEmpty(v.Option2Value))).ToList();

                        // Generate Cartesian product combinations
                        var generatedCombos = new List<(string opt1, string opt2)>();
                        if (opt2Values.Any())
                        {
                            foreach (var o1 in opt1Values)
                            {
                                foreach (var o2 in opt2Values)
                                {
                                    generatedCombos.Add((o1, o2));
                                }
                            }
                        }
                        else
                        {
                            foreach (var o1 in opt1Values)
                            {
                                generatedCombos.Add((o1, ""));
                            }
                        }

                        foreach (var combo in generatedCombos)
                        {
                            // Search if there is an explicit full combo variant matching
                            var matched = fullCombos.FirstOrDefault(v => 
                                v.Option1Value.Equals(combo.opt1, StringComparison.OrdinalIgnoreCase) && 
                                v.Option2Value.Equals(combo.opt2, StringComparison.OrdinalIgnoreCase));

                            if (matched != null)
                            {
                                // Use explicit full combo data, but fill in missing fields from representatives
                                if (string.IsNullOrEmpty(matched.ImageUrl))
                                {
                                    var repByOpt1 = representativeRows.FirstOrDefault(r =>
                                        !string.IsNullOrEmpty(r.Option1Value) &&
                                        r.Option1Value.Equals(combo.opt1, StringComparison.OrdinalIgnoreCase) &&
                                        !string.IsNullOrEmpty(r.ImageUrl));
                                    if (repByOpt1 != null) matched.ImageUrl = repByOpt1.ImageUrl;
                                }
                                if (matched.Price <= 0)
                                {
                                    var repByOpt2 = representativeRows.FirstOrDefault(r =>
                                        !string.IsNullOrEmpty(r.Option2Value) &&
                                        r.Option2Value.Equals(combo.opt2, StringComparison.OrdinalIgnoreCase) &&
                                        r.Price > 0);
                                    if (repByOpt2 != null) matched.Price = repByOpt2.Price;
                                    else
                                    {
                                        var repByOpt1 = representativeRows.FirstOrDefault(r =>
                                            !string.IsNullOrEmpty(r.Option1Value) &&
                                            r.Option1Value.Equals(combo.opt1, StringComparison.OrdinalIgnoreCase) &&
                                            r.Price > 0);
                                        if (repByOpt1 != null) matched.Price = repByOpt1.Price;
                                    }
                                }
                                if (matched.Stock <= 0)
                                {
                                    var repByOpt1 = representativeRows.FirstOrDefault(r =>
                                        !string.IsNullOrEmpty(r.Option1Value) &&
                                        r.Option1Value.Equals(combo.opt1, StringComparison.OrdinalIgnoreCase) &&
                                        r.Stock > 0);
                                    if (repByOpt1 != null) matched.Stock = repByOpt1.Stock;
                                    else
                                    {
                                        var repByOpt2 = representativeRows.FirstOrDefault(r =>
                                            !string.IsNullOrEmpty(r.Option2Value) &&
                                            r.Option2Value.Equals(combo.opt2, StringComparison.OrdinalIgnoreCase) &&
                                            r.Stock > 0);
                                        if (repByOpt2 != null) matched.Stock = repByOpt2.Stock;
                                    }
                                }
                                finalVariants.Add(matched);
                            }
                            else
                            {
                                // Auto-generate the missing combination, pre-fill from representatives
                                var autoSku = GenerateDefaultSku(pDto.ProductCode, combo.opt1, combo.opt2);

                                // Find representative data for this combo
                                string imageUrl = "";
                                decimal price = 0;
                                int stock = 0;

                                // Image: from Option1 representative (e.g. color row)
                                var imgRep = representativeRows.FirstOrDefault(r =>
                                    !string.IsNullOrEmpty(r.Option1Value) &&
                                    r.Option1Value.Equals(combo.opt1, StringComparison.OrdinalIgnoreCase) &&
                                    !string.IsNullOrEmpty(r.ImageUrl));
                                if (imgRep != null) imageUrl = imgRep.ImageUrl;
                                else
                                {
                                    imgRep = representativeRows.FirstOrDefault(r =>
                                        !string.IsNullOrEmpty(r.Option2Value) &&
                                        r.Option2Value.Equals(combo.opt2, StringComparison.OrdinalIgnoreCase) &&
                                        !string.IsNullOrEmpty(r.ImageUrl));
                                    if (imgRep != null) imageUrl = imgRep.ImageUrl;
                                }

                                // Price: from Option2 representative (e.g. size row), fallback to Option1
                                var priceRep = representativeRows.FirstOrDefault(r =>
                                    !string.IsNullOrEmpty(r.Option2Value) &&
                                    r.Option2Value.Equals(combo.opt2, StringComparison.OrdinalIgnoreCase) &&
                                    r.Price > 0);
                                if (priceRep != null) price = priceRep.Price;
                                else
                                {
                                    priceRep = representativeRows.FirstOrDefault(r =>
                                        !string.IsNullOrEmpty(r.Option1Value) &&
                                        r.Option1Value.Equals(combo.opt1, StringComparison.OrdinalIgnoreCase) &&
                                        r.Price > 0);
                                    if (priceRep != null) price = priceRep.Price;
                                }

                                // Stock: from Option1 representative (e.g. color row), fallback to Option2
                                var stockRep = representativeRows.FirstOrDefault(r =>
                                    !string.IsNullOrEmpty(r.Option1Value) &&
                                    r.Option1Value.Equals(combo.opt1, StringComparison.OrdinalIgnoreCase) &&
                                    r.Stock > 0);
                                if (stockRep != null) stock = stockRep.Stock;
                                else
                                {
                                    stockRep = representativeRows.FirstOrDefault(r =>
                                        !string.IsNullOrEmpty(r.Option2Value) &&
                                        r.Option2Value.Equals(combo.opt2, StringComparison.OrdinalIgnoreCase) &&
                                        r.Stock > 0);
                                    if (stockRep != null) stock = stockRep.Stock;
                                }

                                var autoVariant = new VariantImportDto
                                {
                                    ExcelRow = "Tự động sinh",
                                    ProductCode = pDto.ProductCode,
                                    SKU = autoSku,
                                    Option1Value = combo.opt1,
                                    Option2Value = combo.opt2,
                                    Price = price,
                                    Stock = stock,
                                    ImageUrl = imageUrl
                                };
                                finalVariants.Add(autoVariant);
                            }
                        }
                    }
                    else
                    {
                        // No options defined for this product, if there are explicit variants, add them
                        if (productExplicits.Any())
                        {
                            foreach (var exp in productExplicits)
                            {
                                finalVariants.Add(exp);
                            }
                        }
                        else
                        {
                            // Auto-generate a default variant representing the product itself
                            var autoSku = GenerateDefaultSku(pDto.ProductCode, "", "");
                            var autoVariant = new VariantImportDto
                            {
                                ExcelRow = "Tự động sinh",
                                ProductCode = pDto.ProductCode,
                                SKU = autoSku,
                                Option1Value = "",
                                Option2Value = "",
                                Price = pDto.BasePrice,
                                Stock = 0,
                                ImageUrl = ""
                            };
                            finalVariants.Add(autoVariant);
                        }
                    }
                }

                // Propagation pass: fill remaining gaps from siblings already in finalVariants
                // 1. Image: from same Option1 (color)
                foreach (var vDto in finalVariants)
                {
                    if (string.IsNullOrEmpty(vDto.ImageUrl))
                    {
                        var sibling = finalVariants.FirstOrDefault(v => 
                            v.ProductCode.Equals(vDto.ProductCode, StringComparison.OrdinalIgnoreCase) && 
                            !string.IsNullOrEmpty(v.ImageUrl) && 
                            !string.IsNullOrEmpty(v.Option1Value) &&
                            v.Option1Value.Equals(vDto.Option1Value, StringComparison.OrdinalIgnoreCase));

                        if (sibling == null)
                        {
                            sibling = finalVariants.FirstOrDefault(v => 
                                v.ProductCode.Equals(vDto.ProductCode, StringComparison.OrdinalIgnoreCase) && 
                                !string.IsNullOrEmpty(v.ImageUrl) && 
                                !string.IsNullOrEmpty(v.Option2Value) &&
                                v.Option2Value.Equals(vDto.Option2Value, StringComparison.OrdinalIgnoreCase));
                        }

                        if (sibling == null)
                        {
                            // 3rd Fallback: any sibling of the same product (useful for "1 single image" for the entire product)
                            sibling = finalVariants.FirstOrDefault(v => 
                                v.ProductCode.Equals(vDto.ProductCode, StringComparison.OrdinalIgnoreCase) && 
                                !string.IsNullOrEmpty(v.ImageUrl));
                        }

                        if (sibling != null)
                        {
                            vDto.ImageUrl = sibling.ImageUrl;
                        }
                    }
                }

                // 2. Price: from same Option2 (size), fallback to same Option1
                foreach (var vDto in finalVariants)
                {
                    if (vDto.Price <= 0)
                    {
                        var sibling = finalVariants.FirstOrDefault(v => 
                            v.ProductCode.Equals(vDto.ProductCode, StringComparison.OrdinalIgnoreCase) && 
                            v.Price > 0 && 
                            !string.IsNullOrEmpty(v.Option2Value) &&
                            v.Option2Value.Equals(vDto.Option2Value, StringComparison.OrdinalIgnoreCase));

                        if (sibling == null)
                        {
                            sibling = finalVariants.FirstOrDefault(v => 
                                v.ProductCode.Equals(vDto.ProductCode, StringComparison.OrdinalIgnoreCase) && 
                                v.Price > 0 && 
                                !string.IsNullOrEmpty(v.Option1Value) &&
                                v.Option1Value.Equals(vDto.Option1Value, StringComparison.OrdinalIgnoreCase));
                        }

                        if (sibling != null)
                        {
                            vDto.Price = sibling.Price;
                        }
                        else
                        {
                            var prod = response.Products.FirstOrDefault(p => p.ProductCode.Equals(vDto.ProductCode, StringComparison.OrdinalIgnoreCase));
                            if (prod != null)
                            {
                                vDto.Price = prod.BasePrice;
                            }
                        }
                    }
                }

                // 3. Stock: from same Option1 (color), fallback to same Option2
                foreach (var vDto in finalVariants)
                {
                    if (vDto.Stock <= 0)
                    {
                        var sibling = finalVariants.FirstOrDefault(v =>
                            v.ProductCode.Equals(vDto.ProductCode, StringComparison.OrdinalIgnoreCase) &&
                            v.Stock > 0 &&
                            !string.IsNullOrEmpty(v.Option1Value) &&
                            v.Option1Value.Equals(vDto.Option1Value, StringComparison.OrdinalIgnoreCase));

                        if (sibling == null)
                        {
                            sibling = finalVariants.FirstOrDefault(v =>
                                v.ProductCode.Equals(vDto.ProductCode, StringComparison.OrdinalIgnoreCase) &&
                                v.Stock > 0 &&
                                !string.IsNullOrEmpty(v.Option2Value) &&
                                v.Option2Value.Equals(vDto.Option2Value, StringComparison.OrdinalIgnoreCase));
                        }

                        if (sibling != null)
                        {
                            vDto.Stock = sibling.Stock;
                        }
                    }
                }

                // 4. Tiến hành Validate và thêm vào Response

                var inFileSkus = new HashSet<string>();
                foreach (var vDto in finalVariants)
                {
                    if (string.IsNullOrEmpty(vDto.SKU))
                    {
                        vDto.SKU = GenerateDefaultSku(vDto.ProductCode, vDto.Option1Value, vDto.Option2Value);
                    }

                    if (!inFileDataProducts.Contains(vDto.ProductCode))
                    {
                        vDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Variants", Row = vDto.ExcelRow, Field = "ProductCode", Message = $"Mã sản phẩm '{vDto.ProductCode}' không tồn tại trong sheet Products" });
                    }

                    if (inFileSkus.Contains(vDto.SKU))
                    {
                        vDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Variants", Row = vDto.ExcelRow, Field = "SKU", Message = $"Mã SKU '{vDto.SKU}' bị trùng lặp" });
                    }
                    else if (!string.IsNullOrEmpty(vDto.SKU))
                    {
                        inFileSkus.Add(vDto.SKU);
                    }

                    var existingVar = await _context.Variants.FirstOrDefaultAsync(v => v.SKU == vDto.SKU);
                    if (existingVar != null)
                    {
                        response.Duplicates.Add(new ImportDuplicateDto { Sheet = "Variants", Row = vDto.ExcelRow, ItemCode = vDto.SKU, ResolvingAction = "Skip" });
                    }

                    response.Variants.Add(vDto);
                }

                // 5. Check for Image Conflicts (Product ImageUrls vs Variant ImageUrl)
                foreach (var pDto in response.Products)
                {
                    if (string.IsNullOrEmpty(pDto.ImageUrls)) continue;

                    var hasVariantImages = response.Variants.Any(v => 
                        v.ProductCode.Equals(pDto.ProductCode, StringComparison.OrdinalIgnoreCase) && 
                        !string.IsNullOrEmpty(v.ImageUrl));

                    if (hasVariantImages)
                    {
                        // Priority is given to Variant Images per business rule
                        pDto.ImageUrls = string.Empty;
                        response.Errors.Add(new ImportErrorDto 
                        { 
                            Sheet = "Products", 
                            Row = pDto.ExcelRow, 
                            Field = "ImageUrls", 
                            Message = "Đã loại bỏ ảnh sản phẩm chung để ưu tiên ảnh biến thể",
                            IsWarning = true
                        });
                    }
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

                    if (!update && (finalCode.StartsWith("TEMP-") || finalCode.Length < 5 || !finalCode.StartsWith("SP-")))
                    {
                        string generatedCode;
                        do
                        {
                            generatedCode = "SP-" + Guid.NewGuid().ToString()[..6].ToUpper();
                        } while (await _context.Products.AnyAsync(p => p.Code == generatedCode));
                        finalCode = generatedCode;
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

                    // Create Product Images (Gallery)
                    if (!string.IsNullOrWhiteSpace(pDto.ImageUrls))
                    {
                        var urls = pDto.ImageUrls.Split(new[] { ',', '|' }, StringSplitOptions.RemoveEmptyEntries);
                        int displayOrder = 1;
                        foreach (var url in urls)
                        {
                            var cleanUrl = url.Trim();
                            if (!string.IsNullOrEmpty(cleanUrl))
                            {
                                _context.ProductImages.Add(new ProductImage
                                {
                                    ProductID = prod.ProductID,
                                    ImageUrl = cleanUrl,
                                    DisplayOrder = displayOrder++
                                });
                            }
                        }
                        await _context.SaveChangesAsync();
                    }
                }

                // Tự động sao chép ImageUrl cho các biến thể trống ảnh từ biến thể cùng nhóm phân loại (Option1 hoặc Option2)
                foreach (var vDto in request.Variants)
                {
                    if (string.IsNullOrEmpty(vDto.ImageUrl))
                    {
                        var sibling = request.Variants.FirstOrDefault(v => 
                            v.ProductCode == vDto.ProductCode && 
                            !string.IsNullOrEmpty(v.ImageUrl) && 
                            v.Option1Value == vDto.Option1Value);

                        if (sibling == null)
                        {
                            sibling = request.Variants.FirstOrDefault(v => 
                                v.ProductCode == vDto.ProductCode && 
                                !string.IsNullOrEmpty(v.ImageUrl) && 
                                v.Option2Value == vDto.Option2Value);
                        }

                        if (sibling == null)
                        {
                            // 3rd Fallback: any sibling of the same product
                            sibling = request.Variants.FirstOrDefault(v => 
                                v.ProductCode == vDto.ProductCode && 
                                !string.IsNullOrEmpty(v.ImageUrl));
                        }

                        if (sibling != null)
                        {
                            vDto.ImageUrl = sibling.ImageUrl;
                        }
                    }
                }

                // Tự động sao chép Price cho các biến thể có giá bằng 0 hoặc trống từ biến thể cùng nhóm phân loại (Ưu tiên Option2 trước như Size)
                foreach (var vDto in request.Variants)
                {
                    if (vDto.Price <= 0)
                    {
                        var sibling = request.Variants.FirstOrDefault(v =>
                            v.ProductCode == vDto.ProductCode &&
                            v.Price > 0 &&
                            v.Option2Value == vDto.Option2Value);

                        if (sibling == null)
                        {
                            sibling = request.Variants.FirstOrDefault(v =>
                                v.ProductCode == vDto.ProductCode &&
                                v.Price > 0 &&
                                v.Option1Value == vDto.Option1Value);
                        }

                        if (sibling != null)
                        {
                            vDto.Price = sibling.Price;
                        }
                    }
                }

                // Tự động sao chép Stock cho các biến thể có Stock bằng 0 hoặc trống từ biến thể cùng nhóm phân loại (Ưu tiên Option1 Màu sắc trước)
                foreach (var vDto in request.Variants)
                {
                    if (vDto.Stock <= 0)
                    {
                        // Ưu tiên cùng màu (Option1)
                        var sibling = request.Variants.FirstOrDefault(v =>
                            v.ProductCode == vDto.ProductCode &&
                            v.Stock > 0 &&
                            !string.IsNullOrEmpty(v.Option1Value) &&
                            v.Option1Value == vDto.Option1Value);

                        if (sibling == null)
                        {
                            // Fallback: cùng size (Option2)
                            sibling = request.Variants.FirstOrDefault(v =>
                                v.ProductCode == vDto.ProductCode &&
                                v.Stock > 0 &&
                                !string.IsNullOrEmpty(v.Option2Value) &&
                                v.Option2Value == vDto.Option2Value);
                        }

                        if (sibling != null)
                        {
                            vDto.Stock = sibling.Stock;
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

                    if (!update && (string.IsNullOrEmpty(finalSku) || finalSku.StartsWith("TEMP-") || finalSku.Length < 5 || !finalSku.StartsWith("SP-")))
                    {
                        finalSku = GenerateDefaultSku(prod.Code, vDto.Option1Value, vDto.Option2Value);
                    }

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
                        var opt1 = prod.ProductOptions.FirstOrDefault(o => o.DisplayOrder == 1);
                        var opt2 = prod.ProductOptions.FirstOrDefault(o => o.DisplayOrder == 2);

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

                        if (opt1 != null) await LinkOptionValue(opt1, vDto.Option1Value);
                        if (opt2 != null) await LinkOptionValue(opt2, vDto.Option2Value);
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

        private string ParseJsonToSpecifications(string jsonSpecs)
        {
            if (string.IsNullOrWhiteSpace(jsonSpecs)) return "";

            try
            {
                var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(jsonSpecs);
                if (dict == null || dict.Count == 0) return jsonSpecs;

                return string.Join(" | ", dict.Select(kv =>
                    string.IsNullOrEmpty(kv.Value) ? kv.Key : $"{kv.Key}: {kv.Value}"));
            }
            catch
            {
                // If it's not valid JSON, return as-is (already plain text)
                return jsonSpecs;
            }
        }

        private string GenerateDefaultSku(string productCode, string opt1Val, string opt2Val)
        {
            var suffix1 = NormalizeForSku(opt1Val);
            var suffix2 = NormalizeForSku(opt2Val);
            var suffixList = new List<string>();
            if (!string.IsNullOrEmpty(suffix1)) suffixList.Add(suffix1);
            if (!string.IsNullOrEmpty(suffix2)) suffixList.Add(suffix2);
            var suffix = string.Join("-", suffixList);
            return $"{productCode}-{suffix}".TrimEnd('-');
        }

        private string NormalizeForSku(string val)
        {
            if (string.IsNullOrEmpty(val)) return "";
            var normalized = val.Normalize(System.Text.NormalizationForm.FormD);
            var sb = new System.Text.StringBuilder();
            foreach (var c in normalized)
            {
                var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    if (char.IsLetterOrDigit(c))
                    {
                        sb.Append(char.ToUpperInvariant(c));
                    }
                }
            }
            var res = sb.ToString();
            return res.Length > 3 ? res[..3] : res;
        }
    }
}
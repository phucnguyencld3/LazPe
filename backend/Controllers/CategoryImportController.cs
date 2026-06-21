using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Filters;
using PolyBabyAPI.Models;
using PolyBabyAPI.DTOs;
using System.Security.Claims;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CategoryImportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CategoryImportController> _logger;

        public CategoryImportController(ApplicationDbContext context, ILogger<CategoryImportController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ─────────────────────────────────────────────
        // GET /api/CategoryImport/template
        // ─────────────────────────────────────────────
        [HttpGet("template")]
        [AllowAnonymous]
        public IActionResult DownloadTemplate()
        {
            using var workbook = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("Categories");

            sheet.Cell(1, 1).Value = "CategoryName";
            sheet.Cell(1, 2).Value = "ParentCategoryName";
            sheet.Cell(1, 3).Value = "SortOrder";
            sheet.Cell(1, 4).Value = "Description";
            sheet.Cell(1, 5).Value = "Status";

            // Ví dụ dòng 1
            sheet.Cell(2, 1).Value = "Quần áo trẻ em";
            sheet.Cell(2, 2).Value = "";
            sheet.Cell(2, 3).Value = "1";
            sheet.Cell(2, 4).Value = "Các loại quần áo cho bé trai và bé gái";
            sheet.Cell(2, 5).Value = "true";

            // Ví dụ dòng 2 (con của Quần áo trẻ em)
            sheet.Cell(3, 1).Value = "Đồ bộ bé trai";
            sheet.Cell(3, 2).Value = "Quần áo trẻ em";
            sheet.Cell(3, 3).Value = "2";
            sheet.Cell(3, 4).Value = "Đồ bộ thun cotton, đồ bộ lửng cho bé trai";
            sheet.Cell(3, 5).Value = "true";

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CategoryImportTemplate.xlsx");
        }

        // ─────────────────────────────────────────────
        // POST /api/CategoryImport/validate
        // ─────────────────────────────────────────────
        [HttpPost("validate")]
        [Permission("Category.Create")]
        public async Task<IActionResult> ValidateImport(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng tải lên file Excel");

            var response = new CategoryValidateImportResponseDto();

            try
            {
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                stream.Position = 0;
                using var workbook = new XLWorkbook(stream);

                if (!workbook.TryGetWorksheet("Categories", out var sheet))
                    return BadRequest("File không đúng định dạng mẫu. Cần có sheet 'Categories'.");

                var rows = sheet.RowsUsed().Skip(1);
                var inFileDataCategoryNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var row in rows)
                {
                    string categoryName = row.Cell(1).GetString().Trim();
                    string parentCategoryName = row.Cell(2).GetString().Trim();
                    string sortOrder = row.Cell(3).GetString().Trim();
                    string description = row.Cell(4).GetString().Trim();
                    string status = row.Cell(5).GetString().Trim();

                    if (string.IsNullOrEmpty(categoryName) && string.IsNullOrEmpty(description)) continue;

                    var catDto = new CategoryImportDto
                    {
                        ExcelRow = row.RowNumber().ToString(),
                        CategoryName = categoryName,
                        ParentCategoryName = parentCategoryName,
                        SortOrder = string.IsNullOrEmpty(sortOrder) ? "0" : sortOrder,
                        Description = description,
                        Status = string.IsNullOrEmpty(status) ? "true" : status
                    };

                    if (string.IsNullOrEmpty(catDto.CategoryName))
                    {
                        catDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Categories", Row = catDto.ExcelRow, Field = "CategoryName", Message = "Tên danh mục không được để trống" });
                    }

                    if (string.IsNullOrEmpty(catDto.Description))
                    {
                        catDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Categories", Row = catDto.ExcelRow, Field = "Description", Message = "Mô tả không được để trống" });
                    }

                    // Check trùng lặp ngay trong file Excel
                    if (!string.IsNullOrEmpty(catDto.CategoryName))
                    {
                        if (inFileDataCategoryNames.Contains(catDto.CategoryName))
                        {
                            catDto.IsValid = false;
                            response.Errors.Add(new ImportErrorDto { Sheet = "Categories", Row = catDto.ExcelRow, Field = "CategoryName", Message = $"Tên danh mục '{catDto.CategoryName}' bị trùng lặp trong file Excel" });
                        }
                        else
                        {
                            inFileDataCategoryNames.Add(catDto.CategoryName);
                        }
                    }

                    // Check trùng lặp với Database
                    if (!string.IsNullOrEmpty(catDto.CategoryName))
                    {
                        var existingCat = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryName.ToLower() == catDto.CategoryName.ToLower());
                        if (existingCat != null)
                        {
                            response.Duplicates.Add(new ImportDuplicateDto { Sheet = "Categories", Row = catDto.ExcelRow, ItemCode = catDto.CategoryName, ResolvingAction = "Skip" });
                        }
                    }

                    response.Categories.Add(catDto);
                }

                // Kiểm tra sự tồn tại của ParentCategoryName
                foreach (var catDto in response.Categories)
                {
                    if (!catDto.IsValid) continue;
                    if (string.IsNullOrEmpty(catDto.ParentCategoryName)) continue;

                    // ParentCategoryName phải nằm trong db hoặc nằm trong danh sách các category hợp lệ của file Excel
                    var parentExistsInDb = await _context.Categories.AnyAsync(c => c.CategoryName.ToLower() == catDto.ParentCategoryName.ToLower());
                    var parentExistsInFile = inFileDataCategoryNames.Contains(catDto.ParentCategoryName);

                    // Tránh trường hợp parent chính là bản thân nó
                    if (catDto.ParentCategoryName.Equals(catDto.CategoryName, StringComparison.OrdinalIgnoreCase))
                    {
                        catDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto 
                        { 
                            Sheet = "Categories", 
                            Row = catDto.ExcelRow, 
                            Field = "ParentCategoryName", 
                            Message = "Danh mục cha không thể là chính nó" 
                        });
                        continue;
                    }

                    if (!parentExistsInDb && !parentExistsInFile)
                    {
                        catDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto 
                        { 
                            Sheet = "Categories", 
                            Row = catDto.ExcelRow, 
                            Field = "ParentCategoryName", 
                            Message = $"Danh mục cha '{catDto.ParentCategoryName}' không tồn tại trong hệ thống hoặc trong file Excel" 
                        });
                    }
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating Category Excel import");
                return StatusCode(500, "Có lỗi xảy ra khi đọc file Excel.");
            }
        }

        // ─────────────────────────────────────────────
        // POST /api/CategoryImport/commit
        // ─────────────────────────────────────────────
        [HttpPost("commit")]
        [Permission("Category.Create")]
        public async Task<IActionResult> CommitImport([FromBody] CategoryImportCommitRequestDto request)
        {
            if (request == null || !request.Categories.Any())
                return BadRequest("Không có dữ liệu hợp lệ để import.");

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";

            // Load tất cả danh mục hiện có để làm bộ nhớ đệm resolve ParentID
            var dbCategories = await _context.Categories.ToListAsync();
            var categoryMap = dbCategories
                .GroupBy(c => c.CategoryName.ToLower())
                .ToDictionary(g => g.Key, g => g.First());

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var actionDict = request.ActionableDuplicates
                    .GroupBy(d => d.ItemCode.ToLower())
                    .ToDictionary(g => g.Key, g => g.First().ResolvingAction);

                var pendingCreates = new List<CategoryImportDto>();

                foreach (var catDto in request.Categories)
                {
                    if (!catDto.IsValid) continue;

                    string catNameLower = catDto.CategoryName.ToLower();
                    bool hasDuplicate = actionDict.TryGetValue(catNameLower, out var action);

                    bool isTrueStatus = catDto.Status.Equals("true", StringComparison.OrdinalIgnoreCase) || catDto.Status.Equals("1");

                    if (hasDuplicate)
                    {
                        if (action == "Skip")
                        {
                            _logger.LogInformation("Import Category: Bỏ qua '{Name}' do trùng lặp.", catDto.CategoryName);
                            continue;
                        }
                        else if (action == "Update")
                        {
                            // Thực hiện update đè dữ liệu cũ
                            if (categoryMap.TryGetValue(catNameLower, out var existingCat))
                            {
                                existingCat.Description = catDto.Description;
                                existingCat.SortOrder = string.IsNullOrEmpty(catDto.SortOrder) ? "0" : catDto.SortOrder;
                                existingCat.Status = isTrueStatus;
                                _context.Categories.Update(existingCat);
                                
                                _logger.LogInformation("Import Category: Cập nhật đè '{Name}'.", catDto.CategoryName);
                            }
                            continue;
                        }
                    }

                    // Nếu không trùng hoặc chọn CreateNew (tuy nhiên CategoryName thường nên duy nhất)
                    // Ta cho vào hàng đợi để tạo mới và giải quyết ParentID
                    pendingCreates.Add(catDto);
                }

                // Lưu các thay đổi update trước để đồng bộ DbContext
                await _context.SaveChangesAsync();

                // Tiến hành giải quyết tạo mới theo thuật toán đệ quy vòng lặp để đảm bảo ParentID luôn được resolve trước
                int maxIterations = 10;
                int iterations = 0;

                while (pendingCreates.Any() && iterations < maxIterations)
                {
                    iterations++;
                    var resolvedThisRound = new List<CategoryImportDto>();

                    foreach (var pending in pendingCreates)
                    {
                        bool isTrueStatus = pending.Status.Equals("true", StringComparison.OrdinalIgnoreCase) || pending.Status.Equals("1");

                        // Trường hợp 1: Không có ParentCategoryName -> Cấp 0 (Gốc)
                        if (string.IsNullOrEmpty(pending.ParentCategoryName))
                        {
                            var newCat = new Categories
                            {
                                CategoryName = pending.CategoryName,
                                ParentID = null,
                                Level = 0,
                                SortOrder = string.IsNullOrEmpty(pending.SortOrder) ? "0" : pending.SortOrder,
                                Description = pending.Description,
                                Status = isTrueStatus,
                                CreatedAt = DateTime.Now,
                                CreatedBy = currentUserId
                            };

                            _context.Categories.Add(newCat);
                            await _context.SaveChangesAsync(); // Lưu để lấy ID tự sinh

                            // Cập nhật bộ nhớ đệm map
                            categoryMap[newCat.CategoryName.ToLower()] = newCat;
                            resolvedThisRound.Add(pending);
                        }
                        else
                        {
                            // Trường hợp 2: Có ParentCategoryName -> Tìm cha trong bộ nhớ đệm
                            if (categoryMap.TryGetValue(pending.ParentCategoryName.ToLower(), out var parentCat))
                            {
                                var newCat = new Categories
                                {
                                    CategoryName = pending.CategoryName,
                                    ParentID = parentCat.CategoryID,
                                    Level = parentCat.Level + 1,
                                    SortOrder = string.IsNullOrEmpty(pending.SortOrder) ? "0" : pending.SortOrder,
                                    Description = pending.Description,
                                    Status = isTrueStatus,
                                    CreatedAt = DateTime.Now,
                                    CreatedBy = currentUserId
                                };

                                _context.Categories.Add(newCat);
                                await _context.SaveChangesAsync();

                                categoryMap[newCat.CategoryName.ToLower()] = newCat;
                                resolvedThisRound.Add(pending);
                            }
                        }
                    }

                    // Nếu trong vòng lặp này không giải quyết được thêm danh mục nào, dừng lại để tránh lặp vô hạn
                    if (!resolvedThisRound.Any())
                    {
                        _logger.LogWarning("Không thể giải quyết danh mục cha cho {Count} danh mục do lỗi tham chiếu vòng hoặc thiếu danh mục cha.", pendingCreates.Count);
                        break;
                    }

                    // Loại bỏ các danh mục đã tạo thành công khỏi hàng đợi
                    foreach (var resolved in resolvedThisRound)
                    {
                        pendingCreates.Remove(resolved);
                    }
                }

                if (pendingCreates.Any())
                {
                    // Nếu còn sót lại các danh mục chưa thể tạo do lỗi tham chiếu cha
                    return BadRequest($"Không thể xử lý quan hệ cha-con cho các danh mục: {string.Join(", ", pendingCreates.Select(c => c.CategoryName))}");
                }

                await transaction.CommitAsync();
                return Ok("Import danh mục thành công!");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error committing Category Excel import");
                return StatusCode(500, "Có lỗi xảy ra trong quá trình lưu dữ liệu.");
            }
        }
    }
}

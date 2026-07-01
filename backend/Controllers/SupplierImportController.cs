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
    [Authorize(Roles = "Admin")]
    public class SupplierImportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SupplierImportController> _logger;

        public SupplierImportController(ApplicationDbContext context, ILogger<SupplierImportController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ─────────────────────────────────────────────
        // GET /api/SupplierImport/template
        // ─────────────────────────────────────────────
        [HttpGet("template")]
        [AllowAnonymous]
        public IActionResult DownloadTemplate()
        {
            using var workbook = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("Suppliers");

            sheet.Cell(1, 1).Value = "SupplierName";
            sheet.Cell(1, 2).Value = "Logo";
            sheet.Cell(1, 3).Value = "Description";
            sheet.Cell(1, 4).Value = "Status";

            sheet.Cell(2, 1).Value = "PolyBaby Brand";
            sheet.Cell(2, 2).Value = "https://res.cloudinary.com/example/image/upload/logo.png";
            sheet.Cell(2, 3).Value = "Thương hiệu thời trang trẻ em cao cấp";
            sheet.Cell(2, 4).Value = "true";

            sheet.Cell(3, 1).Value = "LazPe Kids";
            sheet.Cell(3, 2).Value = "";
            sheet.Cell(3, 3).Value = "Đồ chơi phát triển trí tuệ trẻ em";
            sheet.Cell(3, 4).Value = "true";

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "SupplierImportTemplate.xlsx");
        }

        // ─────────────────────────────────────────────
        // POST /api/SupplierImport/validate
        // ─────────────────────────────────────────────
        [HttpPost("validate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ValidateImport(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng tải lên file Excel");

            var response = new SupplierValidateImportResponseDto();

            try
            {
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                stream.Position = 0;
                using var workbook = new XLWorkbook(stream);

                if (!workbook.TryGetWorksheet("Suppliers", out var sheet))
                    return BadRequest("File không đúng định dạng mẫu. Cần có sheet 'Suppliers'.");

                var rows = sheet.RowsUsed().Skip(1);
                var inFileDataSupplierNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var row in rows)
                {
                    string supplierName = row.Cell(1).GetString().Trim();
                    string logo = row.Cell(2).GetString().Trim();
                    string description = row.Cell(3).GetString().Trim();
                    string status = row.Cell(4).GetString().Trim();

                    if (string.IsNullOrEmpty(supplierName) && string.IsNullOrEmpty(description)) continue;

                    var supDto = new SupplierImportDto
                    {
                        ExcelRow = row.RowNumber().ToString(),
                        SupplierName = supplierName,
                        Logo = logo,
                        Description = description,
                        Status = string.IsNullOrEmpty(status) ? "true" : status
                    };

                    if (string.IsNullOrEmpty(supDto.SupplierName))
                    {
                        supDto.IsValid = false;
                        response.Errors.Add(new ImportErrorDto { Sheet = "Suppliers", Row = supDto.ExcelRow, Field = "SupplierName", Message = "Tên thương hiệu không được để trống" });
                    }

                    if (!string.IsNullOrEmpty(supDto.SupplierName))
                    {
                        if (inFileDataSupplierNames.Contains(supDto.SupplierName))
                        {
                            supDto.IsValid = false;
                            response.Errors.Add(new ImportErrorDto { Sheet = "Suppliers", Row = supDto.ExcelRow, Field = "SupplierName", Message = $"Tên thương hiệu '{supDto.SupplierName}' bị trùng lặp trong file Excel" });
                        }
                        else
                        {
                            inFileDataSupplierNames.Add(supDto.SupplierName);
                        }
                    }

                    // Check trùng lặp với Database
                    if (!string.IsNullOrEmpty(supDto.SupplierName))
                    {
                        var existingSup = await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierName.ToLower() == supDto.SupplierName.ToLower());
                        if (existingSup != null)
                        {
                            response.Duplicates.Add(new ImportDuplicateDto { Sheet = "Suppliers", Row = supDto.ExcelRow, ItemCode = supDto.SupplierName, ResolvingAction = "Skip" });
                        }
                    }

                    response.Suppliers.Add(supDto);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating Supplier Excel import");
                return StatusCode(500, "Có lỗi xảy ra khi đọc file Excel.");
            }
        }

        // ─────────────────────────────────────────────
        // POST /api/SupplierImport/commit
        // ─────────────────────────────────────────────
        [HttpPost("commit")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CommitImport([FromBody] SupplierImportCommitRequestDto request)
        {
            if (request == null || !request.Suppliers.Any())
                return BadRequest("Không có dữ liệu hợp lệ để import.");

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";

            var dbSuppliers = await _context.Suppliers.ToListAsync();
            var supplierMap = dbSuppliers
                .GroupBy(s => s.SupplierName.ToLower())
                .ToDictionary(g => g.Key, g => g.First());

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var actionDict = request.ActionableDuplicates
                    .GroupBy(d => d.ItemCode.ToLower())
                    .ToDictionary(g => g.Key, g => g.First().ResolvingAction);

                foreach (var supDto in request.Suppliers)
                {
                    if (!supDto.IsValid) continue;

                    string supNameLower = supDto.SupplierName.ToLower();
                    bool hasDuplicate = actionDict.TryGetValue(supNameLower, out var action);

                    bool isTrueStatus = supDto.Status.Equals("true", StringComparison.OrdinalIgnoreCase) || supDto.Status.Equals("1");

                    if (hasDuplicate)
                    {
                        if (action == "Skip")
                        {
                            _logger.LogInformation("Import Supplier: Bỏ qua '{Name}' do trùng lặp.", supDto.SupplierName);
                            continue;
                        }
                        else if (action == "Update")
                        {
                            if (supplierMap.TryGetValue(supNameLower, out var existingSup))
                            {
                                existingSup.Description = supDto.Description ?? string.Empty;
                                existingSup.Logo = string.IsNullOrEmpty(supDto.Logo) ? existingSup.Logo : supDto.Logo;
                                existingSup.Status = isTrueStatus;
                                _context.Suppliers.Update(existingSup);
                                
                                _logger.LogInformation("Import Supplier: Cập nhật đè '{Name}'.", supDto.SupplierName);
                            }
                            continue;
                        }
                    }

                    // Thêm mới
                    var newSup = new Supplier
                    {
                        SupplierName = supDto.SupplierName,
                        Logo = supDto.Logo ?? string.Empty,
                        Description = supDto.Description ?? string.Empty,
                        Status = isTrueStatus,
                        CreatedAt = DateTime.Now,
                        CreatedBy = currentUserId
                    };

                    _context.Suppliers.Add(newSup);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok("Import thương hiệu thành công!");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error committing Supplier Excel import");
                return StatusCode(500, "Có lỗi xảy ra trong quá trình lưu dữ liệu.");
            }
        }
    }
}

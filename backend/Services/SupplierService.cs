using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;
using ClosedXML.Excel;
using System.IO;

namespace PolyBabyAPI.Service
{
    public class SupplierService : ISupplierService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICloudinaryService _cloudinaryService;

        public SupplierService(ApplicationDbContext context, ICloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        // CRUD Operations
        public async Task<IEnumerable<Supplier>> GetAllSuppliersAsync()
        {
            return await _context.Suppliers
                .Include(s => s.Products)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<Supplier> GetSupplierByIdAsync(int id)
        {
            return await _context.Suppliers
                .Include(s => s.Products)
                .FirstOrDefaultAsync(s => s.SupplierID == id);
        }

        public async Task<Supplier> CreateSupplierAsync(Supplier supplier)
        {
            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();
            return supplier;
        }

        public async Task<bool> UpdateSupplierAsync(Supplier supplier)
        {
            try
            {
                _context.Entry(supplier).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await SupplierExistsAsync(supplier.SupplierID))
                {
                    return false;
                }
                throw;
            }
        }

        public async Task<bool> DeleteSupplierAsync(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return false;
            }

            // Delete logo from Cloudinary if exists
            if (!string.IsNullOrEmpty(supplier.Logo))
            {
                try
                {
                    await _cloudinaryService.DeleteImageAsync(supplier.Logo);
                }
                catch
                {
                    // Log error but continue with deletion
                }
            }

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
            return true;
        }

        // Business Logic
        public async Task<bool> SupplierExistsAsync(int id)
        {
            return await _context.Suppliers.AnyAsync(s => s.SupplierID == id);
        }

        public async Task<bool> SupplierNameExistsAsync(string name, int? excludeId = null)
        {
            var query = _context.Suppliers.Where(s => s.SupplierName.ToLower() == name.ToLower());

            if (excludeId.HasValue)
            {
                query = query.Where(s => s.SupplierID != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<IEnumerable<Supplier>> GetActiveSuppliersAsync()
        {
            return await _context.Suppliers
                .Where(s => s.Status)
                .OrderBy(s => s.SupplierName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Supplier>> SearchSuppliersAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return await GetAllSuppliersAsync();
            }

            searchTerm = searchTerm.ToLower();

            return await _context.Suppliers
                .Include(s => s.Products)
                .Where(s => s.SupplierName.ToLower().Contains(searchTerm))
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> GetProductCountBySupplierAsync(int supplierId)
        {
            return await _context.Products.CountAsync(p => p.SupplierID == supplierId);
        }

        public async Task<bool> CanDeleteSupplierAsync(int supplierId)
        {
            var productCount = await GetProductCountBySupplierAsync(supplierId);
            return productCount == 0;
        }

        public async Task<byte[]> ExportExcelAsync(string searchTerm, bool? status)
        {
            var query = _context.Suppliers.Include(s => s.Products).AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchLower = searchTerm.ToLower();
                query = query.Where(s => s.SupplierName.ToLower().Contains(searchLower));
            }

            if (status.HasValue)
            {
                query = query.Where(s => s.Status == status.Value);
            }

            var suppliers = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Danh sách thương hiệu");

            // Header báo cáo
            worksheet.Cell("A1").Value = "DANH SÁCH THƯƠNG HIỆU";
            worksheet.Cell("A1").Style.Font.Bold = true;
            worksheet.Cell("A1").Style.Font.FontSize = 16;
            worksheet.Cell("A1").Style.Font.FontColor = XLColor.DarkMidnightBlue;
            worksheet.Range("A1:H1").Merge();

            worksheet.Cell("A2").Value = $"Ngày xuất: {DateTime.Now:dd/MM/yyyy HH:mm}";
            worksheet.Range("A2:H2").Merge();

            // Header bảng
            var headers = new string[] { "STT", "ID Thương hiệu", "Tên thương hiệu", "Mô tả", "Ngày tạo", "Người tạo", "Sản phẩm liên kết", "Trạng thái" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(4, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.LightSkyBlue;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            int row = 5;
            int stt = 1;
            foreach (var sup in suppliers)
            {
                worksheet.Cell(row, 1).Value = stt++;
                worksheet.Cell(row, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                
                worksheet.Cell(row, 2).Value = sup.SupplierID;
                worksheet.Cell(row, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                
                worksheet.Cell(row, 3).Value = sup.SupplierName;
                worksheet.Cell(row, 4).Value = sup.Description ?? "";
                
                worksheet.Cell(row, 5).Value = sup.CreatedAt.ToString("dd/MM/yyyy HH:mm");
                worksheet.Cell(row, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                
                worksheet.Cell(row, 6).Value = sup.CreatedBy ?? "";
                
                worksheet.Cell(row, 7).Value = sup.Products?.Count ?? 0;
                worksheet.Cell(row, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                
                worksheet.Cell(row, 8).Value = sup.Status ? "Hoạt động" : "Ngừng hoạt động";
                worksheet.Cell(row, 8).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                
                if (sup.Status)
                {
                    worksheet.Cell(row, 8).Style.Font.FontColor = XLColor.Green;
                }
                else
                {
                    worksheet.Cell(row, 8).Style.Font.FontColor = XLColor.Red;
                }
                row++;
            }

            var range = worksheet.Range(4, 1, row - 1, headers.Length);
            range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            range.Style.Border.InsideBorderColor = XLColor.LightGray;

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }
    }
}
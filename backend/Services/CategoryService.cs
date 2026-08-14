using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.DTOs;
using ClosedXML.Excel;
using System.IO;

namespace PolyBabyAPI.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context;

        public CategoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Categories>> GetAllCategoriesAsync()
        {
            return await _context.Categories
                .Include(c => c.Products)
                .OrderBy(c => c.Level)
                .ThenBy(c => c.SortOrder)
                .ThenBy(c => c.CategoryName)
                .ToListAsync();
        }

        public async Task<Categories?> GetCategoryByIdAsync(int id)
        {
            var category = await _context.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CategoryID == id);

            if (category == null)
                return null;

            category.CreatedBy = await ResolveCreatedByDisplayAsync(category.CreatedBy);
            return category;
        }

        public async Task<bool> CreateCategoryAsync(CreateCategoryDto model, string userId)
        {
            try
            {
                // Tính level dựa trên parent category
                int level = 0;
                if (model.ParentID.HasValue)
                {
                    var parentCategory = await _context.Categories.FindAsync(model.ParentID.Value);
                    if (parentCategory != null)
                    {
                        level = parentCategory.Level + 1;
                    }
                }

                var category = new Categories
                {
                    CategoryName = model.CategoryName,
                    ParentID = model.ParentID,
                    Level = level,
                    Description = model.Description,
                    SortOrder = model.SortOrder ?? "0",
                    Status = model.Status,
                    CreatedAt = DateTime.Now,
                    CreatedBy = userId
                };

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateCategoryAsync(EditCategoryDto model, string userId)
        {
            try
            {
                var category = await _context.Categories.FindAsync(model.CategoryID);
                if (category == null) return false;

                // Kiểm tra không cho phép set parent là chính nó hoặc con của nó
                if (model.ParentID.HasValue)
                {
                    if (model.ParentID.Value == model.CategoryID)
                        return false;

                    var isChildCategory = await IsChildCategoryAsync(model.CategoryID, model.ParentID.Value);
                    if (isChildCategory) return false;
                }

                // Tính lại level
                int level = 0;
                if (model.ParentID.HasValue)
                {
                    var parentCategory = await _context.Categories.FindAsync(model.ParentID.Value);
                    if (parentCategory != null)
                    {
                        level = parentCategory.Level + 1;
                    }
                }

                category.CategoryName = model.CategoryName;
                category.ParentID = model.ParentID;
                category.Level = level;
                category.Description = model.Description;
                category.SortOrder = model.SortOrder ?? "0";
                category.Status = model.Status;

                await _context.SaveChangesAsync();

                // Cập nhật level cho tất cả sub categories
                await UpdateSubCategoriesLevelAsync(model.CategoryID);

                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            try
            {
                var category = await _context.Categories
                    .Include(c => c.Products)
                    .FirstOrDefaultAsync(c => c.CategoryID == id);

                if (category == null) return false;

                // Kiểm tra có sản phẩm không
                if (category.Products.Any())
                {
                    return false; // Không được xóa category có sản phẩm
                }

                // Kiểm tra có sub categories không
                var hasSubCategories = await _context.Categories
                    .AnyAsync(c => c.ParentID == id);

                if (hasSubCategories)
                {
                    return false; // Không được xóa category có sub categories
                }

                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<Dictionary<int, int>> GetTotalProductCountsAsync(bool activeOnly = false)
        {
            var categories = await _context.Categories.AsNoTracking().ToListAsync();

            var productsQuery = _context.Products.AsNoTracking();
            if (activeOnly)
            {
                productsQuery = productsQuery.Where(p => p.Status);
            }

            var directCounts = await productsQuery
                .GroupBy(p => p.CategoryID)
                .Select(g => new { CategoryID = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryID, x => x.Count);

            var childrenMap = categories
                .Where(c => c.ParentID.HasValue)
                .GroupBy(c => c.ParentID!.Value)
                .ToDictionary(g => g.Key, g => g.Select(c => c.CategoryID).ToList());

            int GetCount(int catId)
            {
                int count = directCounts.TryGetValue(catId, out var direct) ? direct : 0;
                if (childrenMap.TryGetValue(catId, out var children))
                {
                    foreach (var childId in children)
                    {
                        count += GetCount(childId);
                    }
                }
                return count;
            }

            var result = new Dictionary<int, int>();
            foreach (var cat in categories)
            {
                result[cat.CategoryID] = GetCount(cat.CategoryID);
            }

            return result;
        }

        public async Task<CategoriesPaginationDto> GetCategoriesPaginatedAsync(int page, int pageSize, string searchTerm = "", bool? status = null)
        {
            var query = _context.Categories.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(c => c.CategoryName.Contains(searchTerm) ||
                                        c.Description.Contains(searchTerm));
            }

            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var productCounts = await GetTotalProductCountsAsync();

            var categories = await query
                .OrderBy(c => c.Level)
                .ThenBy(c => c.SortOrder)
                .ThenBy(c => c.CategoryName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CategoryListItemDto
                {
                    CategoryID = c.CategoryID,
                    CategoryName = c.CategoryName,
                    Description = c.Description,
                    ParentID = c.ParentID,
                    ParentCategoryName = c.ParentID.HasValue ?
                        _context.Categories.Where(p => p.CategoryID == c.ParentID.Value).Select(p => p.CategoryName).FirstOrDefault() : null,
                    Level = c.Level,
                    SortOrder = c.SortOrder,
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.CreatedBy,
                    ProductCount = productCounts.ContainsKey(c.CategoryID) ? productCounts[c.CategoryID] : 0,
                    HasSubCategories = _context.Categories.Any(sub => sub.ParentID == c.CategoryID)
                })
                .ToListAsync();

            return new CategoriesPaginationDto
            {
                Categories = categories,
                CurrentPage = page,
                TotalPages = totalPages,
                TotalItems = totalItems,
                PageSize = pageSize,
                SearchTerm = searchTerm,
                Status = status
            };
        }

        public async Task<bool> ToggleCategoryStatusAsync(int id)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null) return false;

                category.Status = !category.Status;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<CategorySelectDto>> GetCategoriesForSelectAsync()
        {
            var productCounts = await GetTotalProductCountsAsync(activeOnly: true);

            var rawCategories = await _context.Categories
                .Where(c => c.Status)
                .OrderBy(c => c.Level)
                .ThenBy(c => c.SortOrder)
                .ThenBy(c => c.CategoryName)
                .ToListAsync();

            return rawCategories
                .Select(c => new CategorySelectDto
                {
                    CategoryID = c.CategoryID,
                    CategoryName = c.CategoryName,
                    ParentID = c.ParentID,
                    Level = c.Level,
                    Status = c.Status,
                    ProductCount = productCounts.TryGetValue(c.CategoryID, out var cnt) ? cnt : 0
                })
                .ToList();
        }

        public async Task<List<Categories>> GetParentCategoriesAsync()
        {
            return await _context.Categories
                .Where(c => c.Status && c.ParentID == null)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.CategoryName)
                .ToListAsync();
        }

        public async Task<CategoryDetailDto?> GetCategoryDetailAsync(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.CategoryID == id);

            if (category == null) return null;

            var productCounts = await GetTotalProductCountsAsync();

            var rawSubCategories = await _context.Categories
                .Where(c => c.ParentID == id)
                .ToListAsync();

            var subCategories = rawSubCategories
                .Select(c => new CategoryListItemDto
                {
                    CategoryID = c.CategoryID,
                    CategoryName = c.CategoryName,
                    Description = c.Description,
                    Level = c.Level,
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    ProductCount = productCounts.TryGetValue(c.CategoryID, out var subCnt) ? subCnt : 0
                })
                .ToList();

            var products = category.Products
                .Take(10)
                .Select(p => new ProductSummaryDto
                {
                    ProductID = p.ProductID,
                    ProductName = p.ProductName,
                    Code = p.Code,
                    Price = p.Price,
                    Status = p.Status,
                    CreatedAt = p.CreatedAt
                })
                .ToList();

            string parentCategoryName = null;
            if (category.ParentID.HasValue)
            {
                var parent = await _context.Categories.FindAsync(category.ParentID.Value);
                parentCategoryName = parent?.CategoryName;
            }

            var createdByDisplay = await ResolveCreatedByDisplayAsync(category.CreatedBy);

            return new CategoryDetailDto
            {
                CategoryID = category.CategoryID,
                CategoryName = category.CategoryName,
                Description = category.Description,
                ParentID = category.ParentID,
                ParentCategoryName = parentCategoryName,
                Level = category.Level,
                SortOrder = category.SortOrder,
                Status = category.Status,
                CreatedAt = category.CreatedAt,
                CreatedBy = createdByDisplay,
                ProductCount = productCounts.TryGetValue(category.CategoryID, out var cnt) ? cnt : 0,
                SubCategories = subCategories,
                Products = products
            };
        }

        private async Task<string?> ResolveCreatedByDisplayAsync(string? createdBy)
        {
            if (string.IsNullOrWhiteSpace(createdBy))
                return createdBy;

            var fullName = await _context.Users
                .Where(u => u.Id == createdBy)
                .Select(u => u.FullName)
                .FirstOrDefaultAsync();

            return string.IsNullOrWhiteSpace(fullName) ? createdBy : fullName;
        }

        public async Task<bool> HasProductsAsync(int categoryId)
        {
            return await _context.Products.AnyAsync(p => p.CategoryID == categoryId);
        }

        public async Task<List<Categories>> GetSubCategoriesAsync(int parentId)
        {
            return await _context.Categories
                .Where(c => c.ParentID == parentId)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.CategoryName)
                .ToListAsync();
        }

        private async Task<bool> IsChildCategoryAsync(int categoryId, int potentialParentId)
        {
            var subCategories = await _context.Categories
                .Where(c => c.ParentID == categoryId)
                .Select(c => c.CategoryID)
                .ToListAsync();

            if (subCategories.Contains(potentialParentId))
                return true;

            foreach (var subId in subCategories)
            {
                if (await IsChildCategoryAsync(subId, potentialParentId))
                    return true;
            }

            return false;
        }

        private async Task UpdateSubCategoriesLevelAsync(int parentId)
        {
            var parent = await _context.Categories.FindAsync(parentId);
            if (parent == null) return;

            var subCategories = await _context.Categories
                .Where(c => c.ParentID == parentId)
                .ToListAsync();

            foreach (var sub in subCategories)
            {
                sub.Level = parent.Level + 1;
                await UpdateSubCategoriesLevelAsync(sub.CategoryID);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<byte[]> ExportExcelAsync(string searchTerm, bool? status)
        {
            var query = _context.Categories.Include(c => c.Products).AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(c => c.CategoryName.Contains(searchTerm) || c.Description.Contains(searchTerm));
            }

            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            var categories = await query
                .OrderBy(c => c.Level)
                .ThenBy(c => c.SortOrder)
                .ThenBy(c => c.CategoryName)
                .ToListAsync();

            var productCounts = await GetTotalProductCountsAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Danh sách danh mục");

            // Header báo cáo
            worksheet.Cell("A1").Value = "DANH SÁCH DANH MỤC SẢN PHẨM";
            worksheet.Cell("A1").Style.Font.Bold = true;
            worksheet.Cell("A1").Style.Font.FontSize = 16;
            worksheet.Cell("A1").Style.Font.FontColor = XLColor.DarkMidnightBlue;
            worksheet.Range("A1:L1").Merge();

            worksheet.Cell("A2").Value = $"Ngày xuất: {DateTime.Now:dd/MM/yyyy HH:mm}";
            worksheet.Range("A2:L2").Merge();

            // Header bảng
            var headers = new string[] { 
                "STT", "ID Danh mục", "Tên danh mục", "Danh mục cha (ID)", "Danh mục cha (Tên)", 
                "Cấp độ", "Thứ tự sắp xếp", "Mô tả", "Sản phẩm liên kết", "Người tạo", "Ngày tạo", "Trạng thái" 
            };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(4, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.LightSkyBlue;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            // Cache parent names to avoid N+1 query in loop
            var allCategoriesMap = await _context.Categories.AsNoTracking().ToDictionaryAsync(c => c.CategoryID);

            int row = 5;
            int stt = 1;
            foreach (var cat in categories)
            {
                worksheet.Cell(row, 1).Value = stt++;
                worksheet.Cell(row, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(row, 2).Value = cat.CategoryID;
                worksheet.Cell(row, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(row, 3).Value = cat.CategoryName;

                if (cat.ParentID.HasValue && allCategoriesMap.TryGetValue(cat.ParentID.Value, out var parent))
                {
                    worksheet.Cell(row, 4).Value = cat.ParentID.Value;
                    worksheet.Cell(row, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    worksheet.Cell(row, 5).Value = parent.CategoryName;
                }
                else
                {
                    worksheet.Cell(row, 4).Value = "";
                    worksheet.Cell(row, 5).Value = "Không có";
                }

                worksheet.Cell(row, 6).Value = cat.Level;
                worksheet.Cell(row, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(row, 7).Value = cat.SortOrder ?? "0";
                worksheet.Cell(row, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(row, 8).Value = cat.Description ?? "";
                
                worksheet.Cell(row, 9).Value = productCounts.TryGetValue(cat.CategoryID, out var cnt) ? cnt : 0;
                worksheet.Cell(row, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                var createdByDisplay = await ResolveCreatedByDisplayAsync(cat.CreatedBy);
                worksheet.Cell(row, 10).Value = createdByDisplay ?? "";

                worksheet.Cell(row, 11).Value = cat.CreatedAt.ToString("dd/MM/yyyy HH:mm");
                worksheet.Cell(row, 11).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(row, 12).Value = cat.Status ? "Hoạt động" : "Đã ẩn";
                worksheet.Cell(row, 12).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                if (cat.Status)
                {
                    worksheet.Cell(row, 12).Style.Font.FontColor = XLColor.Green;
                }
                else
                {
                    worksheet.Cell(row, 12).Style.Font.FontColor = XLColor.Red;
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
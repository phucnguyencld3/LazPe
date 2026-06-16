using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Models;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.DTOs;

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

            var categories = await query
                .Include(c => c.Products)
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
                    ProductCount = c.Products.Count,
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
            return await _context.Categories
                .Where(c => c.Status)
                .OrderBy(c => c.Level)
                .ThenBy(c => c.SortOrder)
                .ThenBy(c => c.CategoryName)
                .Select(c => new CategorySelectDto
                {
                    CategoryID = c.CategoryID,
                    CategoryName = c.CategoryName,
                    ParentID = c.ParentID,
                    Level = c.Level,
                    Status = c.Status,
                    ProductCount = c.Products.Count(p => p.Status)
                })
                .ToListAsync();
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

            var subCategories = await _context.Categories
                .Where(c => c.ParentID == id)
                .Select(c => new CategoryListItemDto
                {
                    CategoryID = c.CategoryID,
                    CategoryName = c.CategoryName,
                    Description = c.Description,
                    Level = c.Level,
                    Status = c.Status,
                    CreatedAt = c.CreatedAt,
                    ProductCount = c.Products.Count
                })
                .ToListAsync();

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
                ProductCount = category.Products.Count,
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
    }
}
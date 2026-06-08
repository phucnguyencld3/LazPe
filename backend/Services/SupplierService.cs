using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interface;
using PolyBabyAPI.Models;

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
    }
}
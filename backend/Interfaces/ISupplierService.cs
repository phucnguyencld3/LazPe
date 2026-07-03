using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interface
{
    public interface ISupplierService
    {
        // CRUD Operations
        Task<IEnumerable<Supplier>> GetAllSuppliersAsync();
        Task<Supplier> GetSupplierByIdAsync(int id);
        Task<Supplier> CreateSupplierAsync(Supplier supplier);
        Task<bool> UpdateSupplierAsync(Supplier supplier);
        Task<bool> DeleteSupplierAsync(int id);

        // Business Logic
        Task<bool> SupplierExistsAsync(int id);
        Task<bool> SupplierNameExistsAsync(string name, int? excludeId = null);
        Task<IEnumerable<Supplier>> GetActiveSuppliersAsync(); // ✅ Sửa từ GetActivesuppliersAsync
        Task<IEnumerable<Supplier>> SearchSuppliersAsync(string searchTerm);
        Task<int> GetProductCountBySupplierAsync(int supplierId);
        Task<bool> CanDeleteSupplierAsync(int supplierId);
        Task<byte[]> ExportExcelAsync(string searchTerm, bool? status);
    }
}
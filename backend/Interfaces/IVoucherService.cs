using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interfaces
{
    public interface IVoucherService
    {
        Task<IEnumerable<Voucher>> GetAllVouchersAsync();
        Task<Voucher?> GetVoucherByIdAsync(int id);
        Task<Voucher?> GetVoucherByCodeAsync(string code);
        Task CreateVoucherAsync(Voucher voucher);
        Task UpdateVoucherAsync(Voucher voucher);
        Task DeleteVoucherAsync(int id);
        Task<string> GenerateUniqueVoucherCodeAsync(); // Tạo mã tự động
        
        // Logic nghiệp vụ
        Task<(bool IsValid, string Message)> ValidateVoucherAsync(string code, decimal orderValue, string userId);
        decimal CalculateDiscount(Voucher voucher, decimal orderValue);
        decimal CalculateShippingDiscount(Voucher voucher, decimal shippingFee);
    }
}

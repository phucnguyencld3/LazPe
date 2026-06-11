using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class VoucherService : IVoucherService
    {
        private readonly ApplicationDbContext _context;

        public VoucherService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Voucher>> GetAllVouchersAsync()
        {
            return await _context.Vouchers.OrderByDescending(v => v.StartDate).ToListAsync();
        }

        public async Task<Voucher?> GetVoucherByIdAsync(int id)
        {
            return await _context.Vouchers.FindAsync(id);
        }

        public async Task<Voucher?> GetVoucherByCodeAsync(string code)
        {
            return await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == code);
        }

        public async Task CreateVoucherAsync(Voucher voucher)
        {
            _context.Vouchers.Add(voucher);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateVoucherAsync(Voucher voucher)
        {
            _context.Vouchers.Update(voucher);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteVoucherAsync(int id)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher != null)
            {
                _context.Vouchers.Remove(voucher);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<string> GenerateUniqueVoucherCodeAsync()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            string code;
            
            do
            {
                code = new string(Enumerable.Repeat(chars, 8)
                    .Select(s => s[random.Next(s.Length)]).ToArray());
            } 
            while (await _context.Vouchers.AnyAsync(v => v.Code == code));

            return code;
        }

        public async Task<(bool IsValid, string Message)> ValidateVoucherAsync(string code, decimal orderValue, string userId)
        {
            var voucher = await GetVoucherByCodeAsync(code);

            if (voucher == null)
            {
                return (false, "Mã giảm giá không tồn tại.");
            }

            if (!voucher.Status)
            {
                return (false, "Mã giảm giá đã bị vô hiệu hóa.");
            }

            var now = DateTime.Now;
            if (now < voucher.StartDate)
            {
                return (false, "Mã giảm giá chưa đến ngày áp dụng.");
            }

            if (now > voucher.EndDate)
            {
                return (false, "Mã giảm giá đã hết hạn.");
            }

            if (voucher.UsedQuantity >= voucher.TotalQuantity)
            {
                return (false, "Mã giảm giá đã hết lượt sử dụng.");
            }

            if (orderValue < voucher.MinOrderValue)
            {
                return (false, $"Đơn hàng tối thiểu để áp dụng mã này là {voucher.MinOrderValue:N0}đ.");
            }

            // Kiểm tra xem user này đã dùng voucher này chưa (nếu cần giới hạn 1 lần/user)
            var hasUsed = await _context.VoucherUsages
                .AnyAsync(vu => vu.VoucherID == voucher.VoucherID && vu.UserID == userId);
            
            // Tùy nghiệp vụ: nếu muốn chặn user dùng lại thì mở comment dưới
            // if (hasUsed)
            // {
            //     return (false, "Bạn đã sử dụng mã giảm giá này rồi.");
            // }

            return (true, "Mã giảm giá hợp lệ.");
        }

        public decimal CalculateDiscount(Voucher voucher, decimal orderValue)
        {
            decimal discountAmount = 0;

            if (voucher.DiscountType == 1) // Phần trăm
            {
                discountAmount = orderValue * (voucher.DiscountValue / 100);
            }
            else // Tiền mặt
            {
                discountAmount = voucher.DiscountValue;
            }

            // Kiểm tra giảm tối đa
            if (voucher.MaxDiscount > 0 && discountAmount > voucher.MaxDiscount)
            {
                discountAmount = voucher.MaxDiscount;
            }

            // Không được giảm quá giá trị đơn hàng
            if (discountAmount > orderValue)
            {
                discountAmount = orderValue;
            }

            return discountAmount;
        }

        public decimal CalculateShippingDiscount(Voucher voucher, decimal shippingFee)
        {
            if (voucher.VoucherType != VoucherType.ShippingDiscount)
            {
                return 0;
            }

            if (voucher.IsFreeShipping)
            {
                return shippingFee;
            }

            decimal discountAmount = 0;

            if (voucher.DiscountType == 1) // Phần trăm
            {
                discountAmount = shippingFee * (voucher.DiscountValue / 100);
            }
            else // Tiền mặt cố định
            {
                discountAmount = voucher.DiscountValue;
            }

            // Kiểm tra giảm tối đa (sử dụng MaxShippingDiscount hoặc MaxDiscount)
            var maxCap = voucher.MaxShippingDiscount ?? voucher.MaxDiscount;
            if (maxCap > 0 && discountAmount > maxCap)
            {
                discountAmount = maxCap;
            }

            // Không được giảm quá phí vận chuyển thực tế
            if (discountAmount > shippingFee)
            {
                discountAmount = shippingFee;
            }

            if (discountAmount < 0)
            {
                discountAmount = 0;
            }

            return discountAmount;
        }
    }
}

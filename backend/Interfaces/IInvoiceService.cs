using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interface
{
    public interface IInvoiceService
    {
        Task<IEnumerable<Invoice>> GetAllAsync();
        Task<IEnumerable<Invoice>> GetByUserAsync(string userId, OrderStatus? status = null);
        Task<Invoice?> GetByIdAsync(int id);
        Task AddAsync(Invoice invoice);
        Task UpdateAsync(Invoice invoice);
        Task DeleteAsync(int id);

        /// <summary>
        /// Tạo hóa đơn từ giỏ hàng.
        /// Nếu selectedCartDetailIds != null → chỉ tạo từ các CartDetail đã chọn, giữ lại phần còn lại.
        /// Nếu selectedCartDetailIds == null → tạo từ toàn bộ giỏ hàng.
        /// </summary>
        Task<Invoice> CreateFromCartAsync(int cartId, PayMethod? payMethod, string shippingAddress, List<int>? selectedCartDetailIds = null);

        Task RecalculateTotalAsync(int invoiceId);

        Task<(IEnumerable<Invoice> Items, int TotalCount)> QueryAsync(
            string? search,
            OrderStatus? status,
            string? sortBy,
            bool desc,
            int page,
            int pageSize);

        Task<bool> ConfirmAsync(int invoiceId);
        Task<bool> MarkShippedAsync(int invoiceId);
        Task<bool> MarkCompletedByUserAsync(int invoiceId, string userId);
        Task<bool> RequestCancelAsync(int invoiceId, string userId, string? reason);
        Task<bool> AdminCancelAsync(int invoiceId, string? reason);
        Task<bool> ApproveCancelAsync(int invoiceId, string? reason);
        Task<bool> RejectCancelAsync(int invoiceId);
    }
}
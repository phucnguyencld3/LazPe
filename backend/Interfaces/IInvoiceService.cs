using PolyBabyAPI.Models;

namespace PolyBabyAPI.Interface
{
    public interface IInvoiceService
    {
        Task<IEnumerable<Invoice>> GetAllAsync();
        Task<IEnumerable<Invoice>> GetByUserAsync(string userId, OrderStatus? status = null);
        Task<(IEnumerable<Invoice> Items, int TotalCount)> GetByUserPaginatedAsync(string userId, OrderStatus? status = null, string? search = null, int page = 1, int pageSize = 10);
        Task<Invoice?> GetByIdAsync(int id);
        Task AddAsync(Invoice invoice);
        Task UpdateAsync(Invoice invoice);
        Task DeleteAsync(int id);

        /// <summary>
        /// Tạo hóa đơn từ giỏ hàng.
        /// Nếu selectedCartDetailIds != null → chỉ tạo từ các CartDetail đã chọn, giữ lại phần còn lại.
        /// Nếu selectedCartDetailIds == null → tạo từ toàn bộ giỏ hàng.
        /// </summary>
        Task<Invoice> CreateFromCartAsync(int cartId, PayMethod? payMethod, string shippingAddress, UserAddress? userAddress = null, PolyBabyAPI.DTOs.InvoiceDtos.CheckoutRequestDto? request = null);

        Task RecalculateTotalAsync(int invoiceId);

        Task<(IEnumerable<Invoice> Items, int TotalCount)> QueryAsync(
            string? search,
            OrderStatus? status,
            string? sortBy,
            bool desc,
            int page,
            int pageSize,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? dateRange = null);

        Task<byte[]> ExportExcelAsync(
            string? search,
            OrderStatus? status,
            string? sortBy,
            bool desc,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? dateRange = null);

        Task<bool> ConfirmAsync(int invoiceId);
        Task<bool> MarkShippedAsync(int invoiceId);
        Task<bool> MarkCompletedByUserAsync(int invoiceId, string userId);
        Task<OrderStatus?> RequestCancelAsync(int invoiceId, string userId, string? reason);
        Task<bool> AdminCancelAsync(int invoiceId, string? reason);
        Task<bool> ApproveCancelAsync(int invoiceId, string? reason);
        Task<bool> RejectCancelAsync(int invoiceId);
        
        // Trả hàng & hoàn tiền
        Task<bool> RequestReturnAsync(int invoiceId, string userId, string reason, string description, string imageUrls, RefundMethod refundMethod);
        Task<bool> CancelReturnRequestAsync(int invoiceId, string userId);
        Task<bool> ApproveReturnAsync(int invoiceId, bool isRefundToCoins);
        Task<bool> RejectReturnAsync(int invoiceId, string rejectReason);
        Task<bool> ConfirmReturnReceivedAsync(int invoiceId, bool isRestockable);
        Task AutoRestockAfterReturnAsync(int invoiceId);

        Task AutoCompleteShippedOrdersAsync(CancellationToken cancellationToken);
    }
}
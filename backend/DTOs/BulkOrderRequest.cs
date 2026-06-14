using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class BulkOrderRequest
    {
        [Required(ErrorMessage = "Danh sách ID hóa đơn không được để trống")]
        [MinLength(1, ErrorMessage = "Vui lòng chọn ít nhất 1 đơn hàng")]
        [MaxLength(10, ErrorMessage = "Chỉ được phép thao tác tối đa 10 đơn hàng cùng lúc")]
        public List<int> InvoiceIDs { get; set; } = new List<int>();
    }
}

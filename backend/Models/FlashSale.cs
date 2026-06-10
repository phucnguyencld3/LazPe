using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public enum FlashSaleStatus
    {
        Upcoming = 0,
        Active = 1,
        Ended = 2
    }

    public class FlashSale
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required(ErrorMessage = "Tên chiến dịch không được để trống")]
        [MaxLength(200)]
        [Display(Name = "Tên chiến dịch Flash Sale")]
        public string Name { get; set; }

        [Required]
        [Display(Name = "Thời gian bắt đầu")]
        public DateTime StartTime { get; set; }

        [Required]
        [Display(Name = "Thời gian kết thúc")]
        public DateTime EndTime { get; set; }

        [Display(Name = "Trạng thái")]
        public FlashSaleStatus Status { get; set; } = FlashSaleStatus.Upcoming;

        [Display(Name = "Kích hoạt (Hiển thị)")]
        public bool IsActive { get; set; } = true;

        [Display(Name = "Ngày tạo")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Display(Name = "Người tạo")]
        [MaxLength(100)]
        public string? CreatedBy { get; set; }

        // Navigation
        public virtual ICollection<FlashSaleItem> FlashSaleItems { get; set; } = new List<FlashSaleItem>();
    }
}

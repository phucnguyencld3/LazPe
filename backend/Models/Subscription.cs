using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PolyBabyAPI.Models
{
    public enum FrequencyType
    {
        [Display(Name = "Ngày")]
        Days = 1,
        
        [Display(Name = "Tuần")]
        Weeks = 2,
        
        [Display(Name = "Tháng")]
        Months = 3
    }

    public enum SubscriptionStatus
    {
        [Display(Name = "Đang hoạt động")]
        Active = 1,
        
        [Display(Name = "Đã tạm dừng")]
        Paused = 2,
        
        [Display(Name = "Đã hủy")]
        Cancelled = 3,

        [Display(Name = "Đã hoàn thành")]
        Completed = 4
    }

    public class Subscription
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SubscriptionID { get; set; }

        [Required]
        public string UserID { get; set; }

        [ForeignKey(nameof(UserID))]
        [ValidateNever]
        public virtual ApplicationUser User { get; set; }

        [Required]
        public int ProductID { get; set; }

        [ForeignKey(nameof(ProductID))]
        [ValidateNever]
        public virtual Product Product { get; set; }

        public int? VariantID { get; set; }

        [ForeignKey(nameof(VariantID))]
        [ValidateNever]
        public virtual Variant? Variant { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; }

        [Required]
        public FrequencyType FrequencyType { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Giá trị chu kỳ phải lớn hơn 0")]
        public int FrequencyValue { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime NextBillingDate { get; set; }

        public DateTime? EndDate { get; set; }

        public int? MaxOccurrences { get; set; }

        public int CompletedOccurrences { get; set; } = 0;

        [Required]
        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

        [Required(ErrorMessage = "Vui lòng chọn địa chỉ giao hàng")]
        public int ShippingAddressId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubscribedPrice { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
        
        public virtual ICollection<SubscriptionPaymentHistory> PaymentHistories { get; set; } = new List<SubscriptionPaymentHistory>();
    }
}

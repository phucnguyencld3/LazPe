using PolyBabyAPI.Models;
using System;
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class CreateSubscriptionDto
    {
        [Required]
        public int ProductID { get; set; }

        public int? VariantID { get; set; }

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
        public int ShippingAddressId { get; set; }

        public decimal SubscribedPrice { get; set; }
    }

    public class SubscriptionDto
    {
        public int SubscriptionID { get; set; }
        public string UserID { get; set; }
        public int ProductID { get; set; }
        public string ProductName { get; set; }
        public string ProductImage { get; set; }
        public int? VariantID { get; set; }
        public string? VariantName { get; set; }
        public int Quantity { get; set; }
        public FrequencyType FrequencyType { get; set; }
        public int FrequencyValue { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime NextBillingDate { get; set; }
        public SubscriptionStatus Status { get; set; }
        public int ShippingAddressId { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal OriginalPrice { get; set; }
    }
}

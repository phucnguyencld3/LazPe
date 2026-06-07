using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class Supplier
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SupplierID { get; set; }

        [Required(ErrorMessage = "Tên nhà cung cấp là bắt buộc")]
        [StringLength(200)]
        [Display(Name = "Tên nhà cung cấp")]
        public string SupplierName { get; set; }


        [Display(Name = "Logo")]
        public string Logo { get; set; }

        [StringLength(500)]
        [Display(Name = "Mô tả")]
        public string Description { get; set; }

        [StringLength(100)]
        [Display(Name = "Người tạo")]
        public string CreatedBy { get; set; }

        [Display(Name = "Ngày tạo")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Display(Name = "Trạng thái")]
        public bool Status { get; set; }

        // Navigation
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }

}

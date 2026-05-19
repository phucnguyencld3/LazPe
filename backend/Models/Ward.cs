using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.Models
{
    public class Ward
    {
        [Key]
        public int WardID { get; set; }

        [Required(ErrorMessage = "Tên quận/huyện là bắt buộc")]
        [StringLength(100)]
        [Display(Name = "Tên quận/huyện")]
        public string Name { get; set; }

        public int ProvinceID { get; set; }  // Convention tự map FK

        // Navigation
        public virtual Province Province { get; set; }
    }
}

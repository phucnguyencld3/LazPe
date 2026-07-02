using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class BabyProfile
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int BabyProfileID { get; set; }

        [Required]
        public string UserID { get; set; }

        [Required(ErrorMessage = "Tên của bé là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên của bé không được vượt quá 100 ký tự")]
        public string Name { get; set; } = "";

        [StringLength(50)]
        public string? Relationship { get; set; }

        [StringLength(20)]
        public string? Gender { get; set; } // Boy / Girl / Secret

        [Required(ErrorMessage = "Ngày sinh của bé là bắt buộc")]
        [DataType(DataType.Date)]
        public DateTime DateOfBirth { get; set; }

        [Range(0, 100, ErrorMessage = "Cân nặng phải từ 0 đến 100 kg")]
        public double? WeightKg { get; set; }

        [Range(0, 200, ErrorMessage = "Chiều cao phải từ 0 đến 200 cm")]
        public double? HeightCm { get; set; }

        [StringLength(200)]
        public string? FavoriteColors { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<BabyGrowthRecord> GrowthRecords { get; set; } = new();
        public List<VaccinationRecord> VaccinationRecords { get; set; } = new();

        [ForeignKey(nameof(UserID))]
        public virtual ApplicationUser User { get; set; } = null!;
    }
}

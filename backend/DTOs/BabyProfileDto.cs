using System;
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class BabyProfileDto
    {
        public int BabyProfileID { get; set; }
        public string UserID { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Relationship { get; set; }
        public string? Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public double? WeightKg { get; set; }
        public double? HeightCm { get; set; }
        public string? FavoriteColors { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateBabyProfileDto
    {
        [Required(ErrorMessage = "Tên của bé là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên của bé không được vượt quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Relationship { get; set; }

        [StringLength(20)]
        public string? Gender { get; set; }

        [Required(ErrorMessage = "Ngày sinh của bé là bắt buộc")]
        public DateTime DateOfBirth { get; set; }

        [Range(0, 100, ErrorMessage = "Cân nặng phải từ 0 đến 100 kg")]
        public double? WeightKg { get; set; }

        [Range(0, 200, ErrorMessage = "Chiều cao phải từ 0 đến 200 cm")]
        public double? HeightCm { get; set; }

        [StringLength(200)]
        public string? FavoriteColors { get; set; }
    }

    public class UpdateBabyProfileDto
    {
        [Required(ErrorMessage = "Tên của bé là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên của bé không được vượt quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Relationship { get; set; }

        [StringLength(20)]
        public string? Gender { get; set; }

        [Required(ErrorMessage = "Ngày sinh của bé là bắt buộc")]
        public DateTime DateOfBirth { get; set; }

        [Range(0, 100, ErrorMessage = "Cân nặng phải từ 0 đến 100 kg")]
        public double? WeightKg { get; set; }

        [Range(0, 200, ErrorMessage = "Chiều cao phải từ 0 đến 200 cm")]
        public double? HeightCm { get; set; }

        [StringLength(200)]
        public string? FavoriteColors { get; set; }
    }
}

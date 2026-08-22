using System;
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.Models
{
    public class BabyGrowthRecord
    {
        public DateTime RecordedDate { get; set; } = DateTime.Now;

        [Range(0.1, 100.0, ErrorMessage = "Cân nặng phải hợp lệ (0.1 - 100 kg).")]
        public double WeightKg { get; set; }

        [Range(10.0, 300.0, ErrorMessage = "Chiều cao phải hợp lệ (10 - 300 cm).")]
        public double HeightCm { get; set; }

        public string? Notes { get; set; }
    }
}

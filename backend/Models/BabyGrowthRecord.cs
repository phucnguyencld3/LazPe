using System;

namespace PolyBabyAPI.Models
{
    public class BabyGrowthRecord
    {
        public DateTime RecordedDate { get; set; } = DateTime.Now;
        public double WeightKg { get; set; }
        public double HeightCm { get; set; }
        public string? Notes { get; set; }
    }
}

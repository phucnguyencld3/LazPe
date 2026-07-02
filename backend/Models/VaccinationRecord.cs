using System;

namespace PolyBabyAPI.Models
{
    public class VaccinationRecord
    {
        public string VaccineName { get; set; } = string.Empty;
        public DateTime? AdministeredDate { get; set; }
        public DateTime? NextDueDate { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Completed, Skipped
        public string? Notes { get; set; }
    }
}

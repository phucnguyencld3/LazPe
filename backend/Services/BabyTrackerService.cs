using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PolyBabyAPI.Services
{
    public class BabyTrackerService : IBabyTrackerService
    {
        private readonly ApplicationDbContext _context;

        public BabyTrackerService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<BabyProfile?> GetTrackerDataAsync(int babyId)
        {
            return await _context.BabyProfiles
                .FirstOrDefaultAsync(b => b.BabyProfileID == babyId);
        }

        public async Task<bool> AddGrowthRecordAsync(int babyId, BabyGrowthRecord record)
        {
            var profile = await _context.BabyProfiles
                .Include(b => b.GrowthRecords)
                .FirstOrDefaultAsync(b => b.BabyProfileID == babyId);
                
            if (profile == null) return false;

            if (profile.GrowthRecords == null)
            {
                profile.GrowthRecords = new List<BabyGrowthRecord>();
            }

            profile.GrowthRecords.Add(record);
            
            // Sort records by date to keep them chronological
            profile.GrowthRecords = profile.GrowthRecords.OrderBy(r => r.RecordedDate).ToList();

            // Update the main profile stats to the latest record
            var latestRecord = profile.GrowthRecords.LastOrDefault();
            if (latestRecord != null)
            {
                profile.WeightKg = latestRecord.WeightKg;
                profile.HeightCm = latestRecord.HeightCm;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddVaccinationRecordAsync(int babyId, VaccinationRecord record)
        {
            var profile = await _context.BabyProfiles.FindAsync(babyId);
            if (profile == null) return false;

            if (profile.VaccinationRecords == null)
            {
                profile.VaccinationRecords = new List<VaccinationRecord>();
            }

            // Check if vaccine already exists, if so update it, else add new
            var existing = profile.VaccinationRecords.FirstOrDefault(v => v.VaccineName == record.VaccineName);
            if (existing != null)
            {
                existing.AdministeredDate = record.AdministeredDate;
                existing.NextDueDate = record.NextDueDate;
                existing.Status = record.Status;
                existing.Notes = record.Notes;
            }
            else
            {
                profile.VaccinationRecords.Add(record);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string> GetGrowthStatusAsync(int babyId)
        {
            var profile = await _context.BabyProfiles.FindAsync(babyId);
            if (profile == null || profile.GrowthRecords == null || !profile.GrowthRecords.Any())
            {
                return "Unknown";
            }

            var latestRecord = profile.GrowthRecords.OrderByDescending(r => r.RecordedDate).First();
            
            // Simplified WHO standard check based on hardcoded thresholds.
            // In a real scenario, this would compare with a full P3/P50/P97 dataset based on baby's age in months.
            var ageInMonths = (latestRecord.RecordedDate.Year - profile.DateOfBirth.Year) * 12 + latestRecord.RecordedDate.Month - profile.DateOfBirth.Month;
            
            if (ageInMonths < 0) ageInMonths = 0;

            // Very simple heuristic for demonstration purposes:
            // Assuming average weight gain of ~0.5kg per month for first year.
            double expectedWeight = 3.5 + (ageInMonths * 0.5); // 3.5kg birth weight average

            if (latestRecord.WeightKg < expectedWeight - 1.5)
            {
                return "Underweight";
            }
            else if (latestRecord.WeightKg > expectedWeight + 2.5)
            {
                return "Overweight";
            }
            
            return "Normal";
        }

        public async Task<List<Product>> GetRecommendedProductsAsync(int babyId)
        {
            var status = await GetGrowthStatusAsync(babyId);
            
            // Logic to recommend products based on status. 
            // In reality, you'd fetch from categories like "Sữa tăng cân" (Weight gain milk).
            var query = _context.Products
                .Include(p => p.Images)
                .Include(p => p.Variants)
                .Where(p => p.Status && !p.IsDeleted);

            if (status == "Underweight")
            {
                query = query.Where(p => p.ProductName.Contains("sữa") || p.ProductName.Contains("dinh dưỡng"));
            }
            else
            {
                query = query.Where(p => p.ProductName.Contains("tã") || p.ProductName.Contains("bỉm"));
            }

            return await query.Take(5).ToListAsync();
        }
    }
}

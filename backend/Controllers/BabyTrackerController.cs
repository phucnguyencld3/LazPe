using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;
using System.Threading.Tasks;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require user to be logged in
    public class BabyTrackerController : ControllerBase
    {
        private readonly IBabyTrackerService _trackerService;

        public BabyTrackerController(IBabyTrackerService trackerService)
        {
            _trackerService = trackerService;
        }

        [HttpGet("{babyId}")]
        public async Task<IActionResult> GetTrackerData(int babyId)
        {
            var data = await _trackerService.GetTrackerDataAsync(babyId);
            if (data == null) return NotFound("Baby profile not found.");

            var status = await _trackerService.GetGrowthStatusAsync(babyId);
            var recommendations = await _trackerService.GetRecommendedProductsAsync(babyId);

            return Ok(new
            {
                Profile = data,
                GrowthStatus = status,
                Recommendations = recommendations
            });
        }

        [HttpPost("{babyId}/growth")]
        public async Task<IActionResult> AddGrowthRecord(int babyId, [FromBody] BabyGrowthRecord record)
        {
            var success = await _trackerService.AddGrowthRecordAsync(babyId, record);
            if (!success) return BadRequest("Could not add growth record.");
            return Ok(new { message = "Growth record added successfully." });
        }

        [HttpPost("{babyId}/vaccinations")]
        public async Task<IActionResult> AddVaccinationRecord(int babyId, [FromBody] VaccinationRecord record)
        {
            var success = await _trackerService.AddVaccinationRecordAsync(babyId, record);
            if (!success) return BadRequest("Could not add vaccination record.");
            return Ok(new { message = "Vaccination record added successfully." });
        }

        [HttpGet("{babyId}/growth/predict")]
        public async Task<IActionResult> PredictGrowth(int babyId)
        {
            var data = await _trackerService.GetTrackerDataAsync(babyId);
            if (data == null) return NotFound("Baby profile not found.");

            // Calculate age in months
            var ageInMonths = (DateTime.Now.Year - data.DateOfBirth.Year) * 12 + DateTime.Now.Month - data.DateOfBirth.Month;
            if (ageInMonths < 0) ageInMonths = 0;

            double predictedWeight = 3.5 + (ageInMonths * 0.5); // Baseline average
            double predictedHeight = 50.0 + (ageInMonths * 2.0);

            // If there's a recent record, we can do a better prediction based on the last record
            var lastRecord = data.GrowthRecords?.OrderByDescending(r => r.RecordedDate).FirstOrDefault();
            if (lastRecord != null)
            {
                var monthsSinceLast = (DateTime.Now.Year - lastRecord.RecordedDate.Year) * 12 + DateTime.Now.Month - lastRecord.RecordedDate.Month;
                // [TESTING MODE] - Always pretend at least 1 month has passed so the UI always suggests a higher weight for testing.
                if (monthsSinceLast <= 0) monthsSinceLast = 1;
                
                predictedWeight = lastRecord.WeightKg + (monthsSinceLast * 0.5); 
                predictedHeight = lastRecord.HeightCm + (monthsSinceLast * 1.5);
            }

            return Ok(new { 
                predictedWeight = Math.Round(predictedWeight, 1), 
                predictedHeight = Math.Round(predictedHeight, 1) 
            });
        }
    }
}

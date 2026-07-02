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
    }
}

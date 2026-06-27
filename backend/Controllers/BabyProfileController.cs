using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BabyProfileController : ControllerBase
    {
        private readonly IBabyProfileService _babyProfileService;
        private readonly ILogger<BabyProfileController> _logger;

        public BabyProfileController(IBabyProfileService babyProfileService, ILogger<BabyProfileController> logger)
        {
            _babyProfileService = babyProfileService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyBabies()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Không xác định được danh tính người dùng" });
            }

            try
            {
                var babies = await _babyProfileService.GetByUserIdAsync(userId);
                var dtos = babies.Select(b => new BabyProfileDto
                {
                    BabyProfileID = b.BabyProfileID,
                    UserID = b.UserID,
                    Name = b.Name,
                    Relationship = b.Relationship,
                    Gender = b.Gender,
                    DateOfBirth = b.DateOfBirth,
                    WeightKg = b.WeightKg,
                    HeightCm = b.HeightCm,
                    FavoriteColors = b.FavoriteColors,
                    CreatedAt = b.CreatedAt
                }).ToList();
                return Ok(new { success = true, data = dtos });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting baby profiles for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải danh sách bé" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddBaby([FromBody] CreateBabyProfileDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Không xác định được danh tính người dùng" });
            }

            try
            {
                var baby = new BabyProfile
                {
                    UserID = userId,
                    Name = dto.Name,
                    Relationship = dto.Relationship,
                    Gender = dto.Gender,
                    DateOfBirth = dto.DateOfBirth,
                    WeightKg = dto.WeightKg,
                    HeightCm = dto.HeightCm,
                    FavoriteColors = dto.FavoriteColors
                };

                var createdBaby = await _babyProfileService.AddAsync(baby);
                var resultDto = new BabyProfileDto
                {
                    BabyProfileID = createdBaby.BabyProfileID,
                    UserID = createdBaby.UserID,
                    Name = createdBaby.Name,
                    Relationship = createdBaby.Relationship,
                    Gender = createdBaby.Gender,
                    DateOfBirth = createdBaby.DateOfBirth,
                    WeightKg = createdBaby.WeightKg,
                    HeightCm = createdBaby.HeightCm,
                    FavoriteColors = createdBaby.FavoriteColors,
                    CreatedAt = createdBaby.CreatedAt
                };

                return Ok(new { success = true, data = resultDto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding baby profile for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi thêm bé" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBaby(int id, [FromBody] UpdateBabyProfileDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Không xác định được danh tính người dùng" });
            }

            try
            {
                var baby = await _babyProfileService.GetByIdAsync(id);
                if (baby == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hồ sơ của bé" });
                }

                if (baby.UserID != userId)
                {
                    return Forbid();
                }

                baby.Name = dto.Name;
                baby.Relationship = dto.Relationship;
                baby.Gender = dto.Gender;
                baby.DateOfBirth = dto.DateOfBirth;
                baby.WeightKg = dto.WeightKg;
                baby.HeightCm = dto.HeightCm;
                baby.FavoriteColors = dto.FavoriteColors;

                await _babyProfileService.UpdateAsync(baby);
                return Ok(new { success = true, message = "Cập nhật thông tin bé thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating baby profile {Id} for user {UserId}", id, userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật thông tin bé" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBaby(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Không xác định được danh tính người dùng" });
            }

            try
            {
                var baby = await _babyProfileService.GetByIdAsync(id);
                if (baby == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hồ sơ của bé" });
                }

                if (baby.UserID != userId)
                {
                    return Forbid();
                }

                await _babyProfileService.DeleteAsync(id);
                return Ok(new { success = true, message = "Xóa thông tin bé thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting baby profile {Id} for user {UserId}", id, userId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa thông tin bé" });
            }
        }
    }
}

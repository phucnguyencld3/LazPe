using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PolyBabyAPI.Data;
using PolyBabyAPI.DTOs;
using PolyBabyAPI.Interfaces;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.Services
{
    public class BabyTimelineService : IBabyTimelineService
    {
        private readonly ApplicationDbContext _context;

        public BabyTimelineService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TimelineResponseDto> GetBabyTimelineAsync(string userId, int babyProfileId)
        {
            var baby = await _context.BabyProfiles
                .Include(b => b.GrowthRecords)
                .Include(b => b.VaccinationRecords)
                .FirstOrDefaultAsync(b => b.BabyProfileID == babyProfileId && b.UserID == userId);

            if (baby == null)
            {
                throw new ArgumentException("Không tìm thấy hồ sơ của bé hoặc bạn không có quyền truy cập.");
            }

            var today = DateTime.Now;
            int months = (today.Year - baby.DateOfBirth.Year) * 12 + today.Month - baby.DateOfBirth.Month;
            if (today.Day < baby.DateOfBirth.Day) months--;
            if (months < 0) months = 0;

            var response = new TimelineResponseDto
            {
                BabyProfileId = baby.BabyProfileID,
                BabyName = baby.Name,
                DateOfBirth = baby.DateOfBirth,
                AgeInMonths = months,
                Gender = baby.Gender ?? "N/A"
            };

            var events = new List<TimelineEventDto>();

            // 1. Map Growth Records
            if (baby.GrowthRecords != null)
            {
                foreach (var growth in baby.GrowthRecords)
                {
                    events.Add(new TimelineEventDto
                    {
                        EventDate = growth.RecordedDate,
                        EventType = "Growth",
                        Title = "Cập nhật chỉ số phát triển",
                        Description = $"Cân nặng: {growth.WeightKg}kg - Chiều cao: {growth.HeightCm}cm. {growth.Notes}",
                        ImageUrl = "/images/timeline/growth-icon.png" // Placeholder icon
                    });
                }
            }

            // 2. Map Vaccination Records
            if (baby.VaccinationRecords != null)
            {
                foreach (var vac in baby.VaccinationRecords.Where(v => v.Status == "Completed" && v.AdministeredDate.HasValue))
                {
                    events.Add(new TimelineEventDto
                    {
                        EventDate = vac.AdministeredDate.Value,
                        EventType = "Vaccination",
                        Title = $"Tiêm phòng: {vac.VaccineName}",
                        Description = vac.Notes ?? "Bé đã hoàn thành mũi tiêm dũng cảm!",
                        ImageUrl = "/images/timeline/vaccine-icon.png"
                    });
                }
            }

            // 3. Map Shopping History
            var invoices = await _context.Invoices
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.Images)
                .Where(i => i.UserID == userId && 
                            i.Status == OrderStatus.Completed && 
                            i.CreatedAt >= baby.DateOfBirth)
                .ToListAsync();

            foreach (var invoice in invoices)
            {
                if (!invoice.CreatedAt.HasValue) continue;

                foreach (var detail in invoice.InvoiceDetails)
                {
                    if (detail.Variant == null || detail.Variant.Product == null) continue;

                    var product = detail.Variant.Product;
                    var imageUrl = product.Images?.OrderBy(i => i.DisplayOrder).FirstOrDefault()?.ImageUrl 
                                   ?? detail.Variant.ImageUrl;

                    events.Add(new TimelineEventDto
                    {
                        EventDate = invoice.CreatedAt.Value,
                        EventType = "Shopping",
                        Title = "Món quà từ mẹ",
                        Description = $"Mẹ đã sắm {detail.Quantity}x {product.ProductName} ({detail.Variant.VariantName}) cho bé.",
                        ImageUrl = imageUrl,
                        RelatedId = product.ProductID
                    });
                }
            }

            // Sort all events chronologically
            response.Events = events.OrderBy(e => e.EventDate).ToList();

            // AI Summary (Optional - can be added later or processed asynchronously)
            response.AiSummary = $"Hành trình tuyệt vời của {baby.Name} qua {response.Events.Count} cột mốc đáng nhớ!";

            return response;
        }
    }
}

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
                    string[] growthTemplates = new string[] 
                    {
                        "Trộm vía bé yêu lớn nhanh quá! Hôm nay bé đạt {0}kg và cao {1}cm rồi nè. {2}",
                        "Cột mốc mới của thiên thần nhỏ: Nặng {0}kg - Cao {1}cm. Cứ đà này chẳng mấy chốc bé lớn bổng luôn! {2}",
                        "Tuyệt vời! Hành trình khôn lớn của bé ghi nhận thêm kỷ lục mới: {0}kg và {1}cm. {2}"
                    };
                    int gIndex = (int)(growth.WeightKg + growth.HeightCm) % growthTemplates.Length;
                    string gDesc = string.Format(growthTemplates[gIndex], growth.WeightKg, growth.HeightCm, growth.Notes);

                    events.Add(new TimelineEventDto
                    {
                        EventDate = growth.RecordedDate,
                        EventType = "Growth",
                        Title = "Cập nhật chỉ số phát triển",
                        Description = gDesc.Trim(),
                        ImageUrl = "/images/timeline/growth-icon.png" // Placeholder icon
                    });
                }
            }

            // 2. Map Vaccination Records
            if (baby.VaccinationRecords != null)
            {
                foreach (var vac in baby.VaccinationRecords.Where(v => v.Status == "Completed" && v.AdministeredDate.HasValue))
                {
                    string[] vacTemplates = new string[] 
                    {
                        "Dũng cảm quá đi! Bé đã hoàn thành mũi tiêm {0} rồi. {1}",
                        "Thêm một lớp bảo vệ sức khỏe cho bé yêu với mũi {0}. {1}",
                        "Bé cưng siêu ngoan đã vượt qua mũi tiêm {0} thành công! {1}"
                    };
                    int vIndex = Math.Abs(vac.VaccineName.GetHashCode()) % vacTemplates.Length;
                    string vDesc = string.Format(vacTemplates[vIndex], vac.VaccineName, vac.Notes ?? "");

                    events.Add(new TimelineEventDto
                    {
                        EventDate = vac.AdministeredDate.Value,
                        EventType = "Vaccination",
                        Title = $"Tiêm phòng: {vac.VaccineName}",
                        Description = vDesc.Trim(),
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

                    string[] templates = new string[] 
                    {
                        "Yêu thương đong đầy! Mẹ vừa chọn {0} {1} để chăm sóc bé tốt hơn nè.",
                        "Mẹ luôn dành những điều tuyệt vời nhất cho con! Mẹ đã sắm {0} {1}.",
                        "Một món quà nhỏ từ tình yêu lớn của mẹ: {0} {1} đã về đội của bé!",
                        "Bé yêu chắc sẽ thích lắm đây! Mẹ vừa rinh về {0} {1} cho cục cưng.",
                        "Để con yêu luôn khỏe mạnh và vui vẻ, mẹ đã chuẩn bị sẵn {0} {1} rồi nhé."
                    };
                    int templateIndex = (detail.InvoiceID + product.ProductID) % templates.Length; // pseudo-random based on IDs
                    string description = string.Format(templates[templateIndex], detail.Quantity, $"{product.ProductName} ({detail.Variant.VariantName})");

                    events.Add(new TimelineEventDto
                    {
                        EventDate = invoice.CreatedAt.Value,
                        EventType = "Shopping",
                        Title = "Món quà từ mẹ",
                        Description = description,
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

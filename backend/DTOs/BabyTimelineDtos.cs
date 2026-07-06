using System;
using System.Collections.Generic;

namespace PolyBabyAPI.DTOs
{
    public class TimelineResponseDto
    {
        public int BabyProfileId { get; set; }
        public string BabyName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public int AgeInMonths { get; set; }
        public string Gender { get; set; } = string.Empty;
        public List<TimelineEventDto> Events { get; set; } = new List<TimelineEventDto>();
        public string? AiSummary { get; set; }
    }

    public class TimelineEventDto
    {
        public DateTime EventDate { get; set; }
        public string EventType { get; set; } = string.Empty; // Growth, Vaccination, Shopping
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        
        // Optional tracking references
        public int? RelatedId { get; set; } 
    }
}

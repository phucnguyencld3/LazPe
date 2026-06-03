using PolyBabyAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ThumbnailImage { get; set; }
        public string? BannerImage { get; set; }
        public NotificationType Type { get; set; }
        public string TypeName => Type.ToString();
        public NotificationPriority Priority { get; set; }
        public string PriorityName => Priority.ToString();
        public ActionType ActionType { get; set; }
        public string ActionTypeName => ActionType.ToString();
        public string? ActionUrl { get; set; }
        public TargetType TargetType { get; set; }
        public string TargetTypeName => TargetType.ToString();
        public string? TargetValue { get; set; }
        public NotificationStatus Status { get; set; }
        public string StatusName => Status.ToString();
        public DateTime? PublishedAt { get; set; }
        public DateTime? ExpiredAt { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsPinned { get; set; }
        
        // stats fields (for admin)
        public int RecipientsCount { get; set; }
        public int ReadCount { get; set; }
        public double ReadRate => RecipientsCount > 0 ? Math.Round((double)ReadCount / RecipientsCount * 100, 2) : 0;
    }

    public class CreateNotificationDto
    {
        [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tiêu đề không được vượt quá 200 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mô tả ngắn là bắt buộc")]
        [StringLength(500, ErrorMessage = "Mô tả ngắn không được vượt quá 500 ký tự")]
        public string ShortDescription { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nội dung là bắt buộc")]
        public string Content { get; set; } = string.Empty;

        [StringLength(500)]
        public string? ThumbnailImage { get; set; }

        [StringLength(500)]
        public string? BannerImage { get; set; }

        public NotificationType Type { get; set; } = NotificationType.System;
        public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
        public ActionType ActionType { get; set; } = ActionType.None;

        [StringLength(500)]
        public string? ActionUrl { get; set; }

        public TargetType TargetType { get; set; } = TargetType.All;
        public string? TargetValue { get; set; } 

        public DateTime? PublishedAt { get; set; }
        public DateTime? ExpiredAt { get; set; }
        public bool IsPinned { get; set; } = false;
    }

    public class UpdateNotificationDto : CreateNotificationDto
    {
    }

    public class UserNotificationDto
    {
        public int Id { get; set; } // UserNotificationId
        public string UserId { get; set; } = string.Empty;
        public int NotificationId { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Flattened Notification details
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ThumbnailImage { get; set; }
        public string? BannerImage { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public string? ActionUrl { get; set; }
        public bool IsPinned { get; set; }
    }

    public class NotificationTemplateDto
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Tên mẫu là bắt buộc")]
        public string TemplateName { get; set; } = string.Empty;
        [Required(ErrorMessage = "Mã mẫu là bắt buộc")]
        public string TemplateCode { get; set; } = string.Empty;
        [Required(ErrorMessage = "Nội dung mẫu là bắt buộc")]
        public string TemplateContent { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class NotificationStatisticsDto
    {
        public int TotalNotifications { get; set; }
        public int TotalSent { get; set; }
        public int TotalRecipients { get; set; }
        public int TotalRead { get; set; }
        public double OverallReadRate => TotalRecipients > 0 ? Math.Round((double)TotalRead / TotalRecipients * 100, 2) : 0;
        public double EngagementRate { get; set; } // Tỷ lệ click hành động
        
        public List<NotificationTypeStatDto> ReadRatesByType { get; set; } = new();
        public List<NotificationTimeSeriesStatDto> SentOverTime { get; set; } = new();
        public List<NotificationDto> TopCampaigns { get; set; } = new();
    }

    public class NotificationTypeStatDto
    {
        public string TypeName { get; set; } = string.Empty;
        public int SentCount { get; set; }
        public int ReadCount { get; set; }
        public double ReadRate => SentCount > 0 ? Math.Round((double)ReadCount / SentCount * 100, 2) : 0;
    }

    public class NotificationTimeSeriesStatDto
    {
        public string Date { get; set; } = string.Empty; // Định dạng "yyyy-MM-dd"
        public int SentCount { get; set; }
        public int ReadCount { get; set; }
    }

    public class UpdateNotificationSettingsDto
    {
        public bool ReceiveEmailNotifications { get; set; }
        public bool ReceiveOrderUpdates { get; set; }
        public bool ReceivePromotions { get; set; }
    }
}

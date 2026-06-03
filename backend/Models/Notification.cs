using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.Models
{
    public enum NotificationType
    {
        System,      // Hệ thống
        Promotion,   // Khuyến mãi
        Order,       // Đơn hàng
        Membership,  // Thành viên
        RewardPoints // Điểm thưởng
    }

    public enum NotificationPriority
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum ActionType
    {
        None,
        Product,
        Voucher,
        Order,
        Membership,
        Promotion,
        CustomUrl
    }

    public enum TargetType
    {
        All,
        LoyaltyTier,
        Role,
        SpecificUsers,
        Condition
    }

    public enum NotificationStatus
    {
        Draft,
        Scheduled,
        Sent,
        Expired,
        Cancelled
    }

    public class Notification
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string ShortDescription { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty; // Rich content HTML

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
        
        // Cấu hình target bổ sung
        // Ví dụ: TargetType = Role -> "Admin,Staff"
        // TargetType = LoyaltyTier -> "Bronze,Gold"
        // TargetType = SpecificUsers -> "id1,id2,id3"
        // TargetType = Condition -> "NoOrders" hoặc "HasPoints"
        public string? TargetValue { get; set; } 

        public NotificationStatus Status { get; set; } = NotificationStatus.Draft;

        public DateTime? PublishedAt { get; set; }
        public DateTime? ExpiredAt { get; set; }

        [StringLength(100)]
        public string? HangfireJobId { get; set; }

        [StringLength(100)]
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public bool IsPinned { get; set; } = false;
        public bool IsDeleted { get; set; } = false;

        // Navigation property
        public virtual ICollection<UserNotification> UserNotifications { get; set; } = new List<UserNotification>();
    }
}

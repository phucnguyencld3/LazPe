using System.ComponentModel.DataAnnotations;
using PolyBabyAPI.Models;

namespace PolyBabyAPI.DTOs
{
    public class BannerDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Page { get; set; } = "global";
        public string Status { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public BannerLayoutConfig LayoutConfig { get; set; } = new BannerLayoutConfig();
        public BannerLayoutConfig? DraftConfig { get; set; }
        public bool HasUnpublishedChanges { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateOrUpdateBannerRequest
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Position { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Page { get; set; } = "global";

        public BannerLayoutConfig LayoutConfig { get; set; } = new BannerLayoutConfig();
    }

    public class PublishBannerRequest
    {
        [Required]
        public int BannerId { get; set; }
    }

    public class RollbackBannerRequest
    {
        [Required]
        public int BannerId { get; set; }

        [Required]
        public int VersionId { get; set; }
    }

    public class BannerVersionDto
    {
        public int Id { get; set; }
        public int BannerId { get; set; }
        public string Version { get; set; } = string.Empty;
        public BannerLayoutConfig LayoutConfig { get; set; } = new BannerLayoutConfig();
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
    }
}

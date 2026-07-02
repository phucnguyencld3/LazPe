using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class Banner
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Position { get; set; } = string.Empty; // home, left, popup, banner_top

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // slideshow, popup, sidebar, grid

        [StringLength(20)]
        public string Status { get; set; } = "Draft"; // Draft, Published

        [Required]
        [StringLength(50)]
        public string Page { get; set; } = "global"; // global, home, products, product_detail, cart, checkout, profile

        [StringLength(50)]
        public string Version { get; set; } = "1.0.0";

        public BannerLayoutConfig LayoutConfig { get; set; } = new BannerLayoutConfig();

        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        
        public string? CreatedBy { get; set; }
    }

    public class BannerLayoutConfig
    {
        // Common config
        public string? ContainerStyle { get; set; }
        public string? Animation { get; set; }
        
        // For components that have multiple items (slideshow, grid) or single item (popup, sidebar)
        public List<BannerItem> Items { get; set; } = new List<BannerItem>();
        
        // Popup specific
        public int? PopupDelay { get; set; } // in ms
        public bool? ShowCloseButton { get; set; }
        
        // Grid specific
        public int? GridColumns { get; set; }
        public int? GridGap { get; set; }
        
        // Responsive config
        public BannerResponsiveConfig? Responsive { get; set; } = new BannerResponsiveConfig();
    }

    public class BannerItem
    {
        public string ImageUrl { get; set; } = string.Empty;
        public string? AltText { get; set; }
        public string? RedirectUrl { get; set; }
        public int Order { get; set; }
    }

    public class BannerResponsiveConfig
    {
        public string? MobileContainerStyle { get; set; }
        public string? DesktopContainerStyle { get; set; }
        public int? MobileGridColumns { get; set; }
    }
}

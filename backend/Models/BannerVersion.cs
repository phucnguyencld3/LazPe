using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolyBabyAPI.Models
{
    public class BannerVersion
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int BannerId { get; set; }

        [Required]
        [StringLength(50)]
        public string Version { get; set; } = string.Empty;

        public BannerLayoutConfig LayoutConfig { get; set; } = new BannerLayoutConfig();

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string? CreatedBy { get; set; }

        [ForeignKey(nameof(BannerId))]
        public virtual Banner? Banner { get; set; }
    }
}

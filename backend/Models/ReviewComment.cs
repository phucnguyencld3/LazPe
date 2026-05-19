using System.ComponentModel.DataAnnotations;

namespace PolyBabyAPI.Models
{
    public class ReviewComment
    {
        [Key]
        public int CommentID { get; set; }

        public int ReviewID { get; set; }
        public string UserID { get; set; }        
        // Reply bình luận
        public int? ParentCommentID { get; set; }

        [Required(ErrorMessage = "Nội dung bình luận là bắt buộc")]
        [StringLength(500)]
        [Display(Name = "Nội dung bình luận")]
        public string Content { get; set; }

        [Display(Name = "Ngày tạo")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public bool IsHidden { get; set; } = false;

        // Navigation
        public virtual Review Review { get; set; }
        public virtual ApplicationUser User { get; set; }
        public virtual ReviewComment ParentComment { get; set; }
        public virtual ICollection<ReviewComment> ChildComments { get; set; }

    }
}

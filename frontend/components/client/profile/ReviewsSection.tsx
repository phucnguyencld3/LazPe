import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/lib/toast";
import {
  getUserReviews,
  getPendingReviews,
  createReviewFromInvoice,
  updateReview,
  deleteReview,
  getReviewLoyaltySettings,
  ReviewItem,
  ReviewComment
} from "@/lib/api";
import { Loader, Star, Image as ImageIcon, Video, Trash2, Edit3, X, Play, ShieldAlert, Award } from "lucide-react";

interface ReviewsSectionProps {
  userId: string;
  token: string;
}

interface LoyaltySettings {
  enableReviewReward: boolean;
  reviewRewardPoints: number;
  minimumReviewWords: number;
  requiredRatingForReward: number;
  allowMultipleRewardsPerProduct: boolean;
  reviewWithImageRewardPoints: number;
  reviewWithVideoRewardPoints: number;
  minimumReviewChars: number;
  allowEditReviewTimeLimitMinutes: number;
  maxReviewDaysAfterReceipt: number;
  requireDeliveryToReview: boolean;
  id: number;
}

export function ReviewsSection({ userId, token }: ReviewsSectionProps) {
  const [activeTab, setActiveTab] = useState<"to_review" | "reviewed">("to_review");
  const [toReviewList, setToReviewList] = useState<any[]>([]);
  const [reviewedList, setReviewedList] = useState<ReviewItem[]>([]);
  const [toReviewPage, setToReviewPage] = useState(1);
  const [reviewedPage, setReviewedPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // States for writing / editing reviews
  const [writingReviewFor, setWritingReviewFor] = useState<any | null>(null);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; mediaType: 'IMAGE' | 'VIDEO' }[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);

  // Lightbox modal state
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; mediaType: 'IMAGE' | 'VIDEO' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const settings = await getReviewLoyaltySettings();
      if (settings) {
        setLoyaltySettings(settings);
      }
    } catch (error) {
      console.error("Error fetching loyalty settings:", error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId || !token) return;
    setLoading(true);
    try {
      // 1. Fetch pending reviews
      const pendingData = await getPendingReviews(userId);
      if (pendingData) {
        setToReviewList(pendingData);
        
        // Auto-open review form if URL parameters match
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const urlInvoiceId = params.get("invoiceId");
          const urlDetailId = params.get("detailId");
          if (urlInvoiceId && urlDetailId) {
            const matchedItem = pendingData.find(
              (item: any) =>
                String(item.invoiceID) === urlInvoiceId &&
                String(item.invoiceDetailID) === urlDetailId
            );
            if (matchedItem) {
              setWritingReviewFor(matchedItem);
              setEditingReview(null);
              setRating(5);
              setComment("");
              setAttachedMedia([]);
              setActiveTab("to_review");

              // Clear parameters so they don't auto-open on subsequent tab changes
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete("invoiceId");
              newUrl.searchParams.delete("detailId");
              window.history.replaceState({}, "", newUrl.pathname + newUrl.search);
            }
          }
        }
      }

      // 2. Fetch completed reviews
      const reviewedData = await getUserReviews(userId, token, 1, 100);
      if (reviewedData && reviewedData.reviews) {
        setReviewedList(reviewedData.reviews);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("Không thể tải thông tin đánh giá.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchSettings();
    fetchData();
  }, [fetchSettings, fetchData]);

  const handleWriteReviewClick = (item: any) => {
    setWritingReviewFor(item);
    setEditingReview(null);
    setRating(5);
    setComment("");
    setAttachedMedia([]);
  };

  const handleEditReviewClick = (review: ReviewItem) => {
    setEditingReview(review);
    setWritingReviewFor(null);
    setRating(review.rating);
    setComment(review.content);
    setAttachedMedia(review.reviewMedia.map(m => ({ url: m.url, mediaType: m.mediaType })));
    setActiveTab("to_review"); // Switch tab to review form workspace
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedMedia.length + files.length > 5) {
      toast.error("Chỉ cho phép tải lên tối đa 5 file đính kèm.");
      return;
    }

    setUploadingMedia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 20MB limit
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`File ${file.name} vượt quá giới hạn 20MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
        if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.endsWith('/api')) {
          baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api`;
        }
        const uploadUrl = `${baseUrl}/Upload/review-media`;

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json();
        if (result.success && result.url) {
          setAttachedMedia(prev => [...prev, {
            url: result.url,
            mediaType: result.mediaType || "IMAGE"
          }]);
        } else {
          toast.error(result.message || `Lỗi tải lên file ${file.name}`);
        }
      }
      toast.success("Tải lên file đính kèm thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể upload tệp tin. Vui lòng kiểm tra dung lượng hoặc kết nối mạng.");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachedMedia = (index: number) => {
    setAttachedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingReview) {
      // EDIT MODE
      setSubmitting(true);
      try {
        const result = await updateReview(editingReview.reviewID, {
          reviewID: editingReview.reviewID,
          rating: rating,
          content: comment.trim(),
          media: attachedMedia
        });

        if (result.success) {
          toast.success("Cập nhật đánh giá thành công!");
          setEditingReview(null);
          setActiveTab("reviewed");
          await fetchData();
        } else {
          toast.error(result.message || "Không thể cập nhật đánh giá.");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Lỗi khi cập nhật đánh giá.");
      } finally {
        setSubmitting(false);
      }
    } else if (writingReviewFor) {
      // CREATE MODE
      if (!writingReviewFor.invoiceID || !writingReviewFor.invoiceDetailID) {
        toast.error("Thông tin đơn hàng không hợp lệ.");
        return;
      }

      setSubmitting(true);
      try {
        const result = await createReviewFromInvoice({
          invoiceID: writingReviewFor.invoiceID,
          invoiceDetailID: writingReviewFor.invoiceDetailID,
          rating: rating,
          content: comment.trim(),
          media: attachedMedia
        });

        if (result.success) {
          const rewardPoints = result.data?.loyaltyPointsEarned;
          if (result.data?.hasEarnedRewardPoints && rewardPoints) {
            toast.success(`Đánh giá thành công! Bạn nhận được +${rewardPoints} điểm Loyalty! 🎉`);
          } else {
            toast.success("Đăng đánh giá thành công! Cảm ơn ý kiến của bạn.");
          }
          setWritingReviewFor(null);
          setActiveTab("reviewed");
          await fetchData();
        } else {
          toast.error(result.message || "Không thể gửi đánh giá.");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Lỗi kết nối.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này? Điểm thưởng loyalty tích lũy (nếu có) từ đánh giá này sẽ bị thu hồi.")) return;

    try {
      const result = await deleteReview(reviewId);
      if (result.success) {
        toast.success("Xóa đánh giá thành công!");
        await fetchData();
      } else {
        toast.error(result.message || "Không thể xóa đánh giá.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi xóa đánh giá.");
    }
  };

  const canEdit = (review: ReviewItem) => {
    if (review.isHidden || review.censorshipLogs.length > 0) {
      return false;
    }

    if (!loyaltySettings) return true;

    const createdTime = new Date(review.createdAt).getTime();
    const timeLimitMs = loyaltySettings.allowEditReviewTimeLimitMinutes * 60 * 1000;
    return (Date.now() - createdTime) < timeLimitMs;
  };

  const canDelete = (review: ReviewItem) => {
    // Không giới hạn thời gian xóa. Chỉ cấm xóa nếu đã bị Admin kiểm duyệt (phạt ẩn).
    if (review.isHidden || review.censorshipLogs.length > 0) {
      return false;
    }
    return true;
  };

  const renderStarsSelector = (currentRating: number, onStarClick: (star: number) => void) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => onStarClick(star)}
            className="focus:outline-none transition-transform active:scale-90 duration-150"
          >
            <Star
              size={32}
              className={`${
                star <= currentRating 
                  ? "fill-amber-400 text-amber-400 drop-shadow-md" 
                  : "text-slate-200 hover:text-amber-200"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= score ? "fill-amber-400 text-amber-400" : "text-slate-200"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="bg-white rounded-[10px] p-5 border border-slate-100/60 min-h-[300px] flex flex-col items-center justify-center shadow-sm">
        <Loader className="animate-spin text-primary mb-3" size={32} />
        <p className="text-slate-500 font-bold text-[12px]">Đang tải danh sách đánh giá...</p>
      </section>
    );
  }

  // Pagination logic
  const paginatedToReview = toReviewList.slice((toReviewPage - 1) * itemsPerPage, toReviewPage * itemsPerPage);
  const toReviewTotalPages = Math.ceil(toReviewList.length / itemsPerPage);

  const paginatedReviewed = reviewedList.slice((reviewedPage - 1) * itemsPerPage, reviewedPage * itemsPerPage);
  const reviewedTotalPages = Math.ceil(reviewedList.length / itemsPerPage);

  const renderPagination = (currentPage: number, totalPages: number, setPage: (val: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-4 mt-6 mb-2">
        <button
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>
        <span className="text-[12px] font-bold text-slate-600">
          Trang {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    );
  };

  // Calculate dynamic points preview
  const charCount = comment.trim().length;
  const wordCount = comment.trim() === "" ? 0 : comment.trim().split(/\s+/).length;
  const isImageAttached = attachedMedia.some(m => m.mediaType === "IMAGE");
  const isVideoAttached = attachedMedia.some(m => m.mediaType === "VIDEO");

  let expectedPoints = 0;
  let matchesRules = false;
  if (loyaltySettings) {
    const minChars = loyaltySettings.minimumReviewChars;
    const minWords = loyaltySettings.minimumReviewWords;
    const qualifies = rating >= loyaltySettings.requiredRatingForReward && (charCount >= minChars || wordCount >= minWords);
    matchesRules = qualifies;

    if (qualifies) {
      if (isVideoAttached) {
        expectedPoints = loyaltySettings.reviewWithVideoRewardPoints;
      } else if (isImageAttached) {
        expectedPoints = loyaltySettings.reviewWithImageRewardPoints;
      } else {
        expectedPoints = loyaltySettings.reviewRewardPoints;
      }
    }
  }

  return (
    <section className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-100/60 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <h2 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>
          Đánh giá sản phẩm
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-5 overflow-x-auto scrollbar-none w-full gap-1">
        <button
          onClick={() => {
            setActiveTab("to_review");
            setWritingReviewFor(null);
            setEditingReview(null);
          }}
          className={`flex-1 py-3 px-2 text-[12px] sm:text-[13px] font-bold border-b-2 whitespace-nowrap text-center transition-all duration-200 ${
            activeTab === "to_review" && !writingReviewFor && !editingReview
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Chưa đánh giá ({toReviewList.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("reviewed");
            setWritingReviewFor(null);
            setEditingReview(null);
          }}
          className={`flex-1 py-3 px-2 text-[12px] sm:text-[13px] font-bold border-b-2 whitespace-nowrap text-center transition-all duration-200 ${
            activeTab === "reviewed"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Đã đánh giá ({reviewedList.length})
        </button>
      </div>

      {/* Write or Edit Form */}
      {(writingReviewFor || editingReview) ? (
        <form onSubmit={handleReviewSubmit} className="space-y-6 border border-slate-100 rounded-xl p-5 bg-slate-50/50">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
            <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
              <Edit3 size={18} className="text-primary" />
              {editingReview ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá sản phẩm"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setWritingReviewFor(null);
                setEditingReview(null);
                if (editingReview) setActiveTab("reviewed");
              }}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs flex items-center gap-1 hover:bg-slate-200/50 px-2 py-1 rounded"
            >
              Hủy
            </button>
          </div>

          {/* Product card info */}
          <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-lg">
            {(editingReview?.imageUrl || writingReviewFor?.imageUrl) ? (
              <img
                src={editingReview?.imageUrl || writingReviewFor?.imageUrl}
                alt="Product"
                className="w-16 h-16 rounded object-cover border border-slate-100 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                LazPe
              </div>
            )}
            <div>
              <h4 className="font-bold text-slate-800 text-sm line-clamp-2">
                {editingReview?.productName || writingReviewFor?.productName}
              </h4>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Phân loại: {editingReview?.variantName || writingReviewFor?.variantName || "Mặc định"}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Chọn mức độ hài lòng</label>
            <div className="flex items-center gap-3">
              {renderStarsSelector(rating, setRating)}
              <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded border border-amber-100">
                {rating === 5 ? "Rất hài lòng" : rating === 4 ? "Hài lòng" : rating === 3 ? "Bình thường" : rating === 2 ? "Không hài lòng" : "Rất tệ"}
              </span>
            </div>
          </div>

          {/* Text Area Content */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nội dung đánh giá</label>
            <textarea
              placeholder="Sản phẩm dùng tốt không? Đóng gói như thế nào? Thái độ dịch vụ ra sao? Chia sẻ để nhận điểm thưởng..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium transition-all"
            />
            {loyaltySettings?.enableReviewReward && (
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-1">
                <span>Tránh viết nội dung vô nghĩa, spam để đảm bảo nhận được điểm thưởng.</span>
                <div className="flex gap-2">
                  <span>
                    Ký tự: <span className={charCount >= loyaltySettings.minimumReviewChars ? "text-emerald-600 font-bold" : "text-slate-500"}>
                      {charCount}
                    </span>
                    /{loyaltySettings.minimumReviewChars}
                  </span>
                  <span>|</span>
                  <span>
                    Từ: <span className={wordCount >= loyaltySettings.minimumReviewWords ? "text-emerald-600 font-bold" : "text-slate-500"}>
                      {wordCount}
                    </span>
                    /{loyaltySettings.minimumReviewWords}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Attachment Media */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Hình ảnh & Video đính kèm</label>
            <div className="flex flex-wrap gap-3 items-center">
              {attachedMedia.map((m, index) => (
                <div key={index} className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                  {m.mediaType === "VIDEO" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white relative">
                      <Play size={20} className="text-white fill-white/80" />
                      <span className="text-[9px] font-bold mt-1">VIDEO</span>
                    </div>
                  ) : (
                    <img src={m.url} alt="Uploaded review asset" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachedMedia(index)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow transition-all hover:scale-105"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {attachedMedia.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-primary bg-white hover:bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-primary transition-all duration-200 disabled:opacity-50"
                >
                  {uploadingMedia ? (
                    <Loader className="animate-spin" size={20} />
                  ) : (
                    <>
                      <div className="flex gap-0.5">
                        <ImageIcon size={16} />
                        <Video size={16} />
                      </div>
                      <span className="text-[10px] font-bold mt-1">Đính kèm</span>
                    </>
                  )}
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleMediaUpload}
                multiple
                accept="image/*,video/*"
                className="hidden"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Hỗ trợ ảnh JPG, PNG, WebP hoặc video MP4 dung lượng tối đa 20MB. Cho phép tối đa 5 tệp đính kèm.</p>
          </div>

          {/* Loyalty Rewards dynamic details */}
          {loyaltySettings?.enableReviewReward && (
            <div className={`p-4 rounded-lg border text-xs font-semibold space-y-2 transition-all ${
              matchesRules 
                ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" 
                : "bg-amber-50/50 border-amber-100 text-amber-800"
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                <Award size={16} className={matchesRules ? "text-emerald-600" : "text-amber-600"} />
                Chương trình quà tặng Loyalty điểm thưởng
              </div>
              <p className="leading-relaxed font-medium">
                Cơ cấu thưởng: Đạt tối thiểu <span className="font-bold">{loyaltySettings.requiredRatingForReward} sao</span> và <span className="font-bold">{loyaltySettings.minimumReviewChars} ký tự</span> để được cộng:
              </p>
              <ul className="list-disc pl-4 space-y-1 font-medium text-[11px]">
                <li>Viết đánh giá thuần chữ: <span className="font-bold text-primary">+{loyaltySettings.reviewRewardPoints} điểm</span>.</li>
                <li>Có kèm hình ảnh: <span className="font-bold text-primary">+{loyaltySettings.reviewWithImageRewardPoints} điểm</span>.</li>
                <li>Có kèm video: <span className="font-bold text-primary">+{loyaltySettings.reviewWithVideoRewardPoints} điểm</span>.</li>
              </ul>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t border-current/10 mt-2">
                <span className="font-semibold text-[11px]">Đánh giá hiện tại:</span>
                <div className="flex flex-wrap gap-2.5 font-bold text-[11px]">
                  <span className={rating >= loyaltySettings.requiredRatingForReward ? "text-emerald-600" : "text-amber-600"}>
                    ⭐ {rating}/{loyaltySettings.requiredRatingForReward} sao
                  </span>
                  <span className={charCount >= loyaltySettings.minimumReviewChars || wordCount >= loyaltySettings.minimumReviewWords ? "text-emerald-600" : "text-amber-600"}>
                    📝 {charCount}/{loyaltySettings.minimumReviewChars} ký tự
                  </span>
                  {matchesRules && (
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      Ước tính: +{expectedPoints} điểm
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || uploadingMedia}
              className="flex-1 bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg font-bold text-sm hover:shadow active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader className="animate-spin" size={16} />}
              {editingReview ? "Cập nhật đánh giá" : "Hoàn tất và đăng đánh giá"}
            </button>
          </div>
        </form>
      ) : (
        /* List UI */
        <div className="space-y-6">
          {activeTab === "to_review" ? (
            /* To Review list */
            toReviewList.length > 0 ? (
              <>
                {paginatedToReview.map((item) => (
                  <div
                  key={`${item.invoiceID}-${item.invoiceDetailID}`}
                  className="border border-slate-100/80 rounded-[8px] p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white hover:border-slate-200 hover:shadow-sm transition-all mb-3"
                >
                  <div className="flex gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-12 h-12 rounded-[6px] object-cover border border-slate-100 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-[6px] bg-primary/5 flex items-center justify-center text-primary font-bold text-[10px] flex-shrink-0">
                        LazPe
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 text-[12px] md:text-[13px] line-clamp-1">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold">{item.variantName || "Mặc định"}</p>
                      <p className="text-[9px] text-slate-400 font-bold">
                        Ngày mua: {new Date(item.purchaseDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleWriteReviewClick(item)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-[6px] font-bold text-[11px] active:scale-95 transition-all text-center self-stretch sm:self-auto shadow-sm shadow-primary/20"
                  >
                    Đánh giá ngay
                  </button>
                </div>
              ))}
              {renderPagination(toReviewPage, toReviewTotalPages, setToReviewPage)}
              </>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-[8px] border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-[32px] text-slate-300 mb-2">rate_review</span>
                <p className="text-slate-500 font-bold text-[12px]">Tuyệt vời! Bạn không còn sản phẩm nào chờ đánh giá.</p>
              </div>
            )
          ) : (
            /* Reviewed list */
            reviewedList.length > 0 ? (
              <>
                {paginatedReviewed.map((item) => (
                  <div
                  key={item.reviewID}
                  className="border border-slate-100/80 rounded-[8px] p-4 space-y-3 bg-white hover:border-slate-200 hover:shadow-sm transition-all relative mb-4"
                >
                  {/* Top product info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-50/50 pb-2">
                    <div className="flex gap-2.5 items-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt="Product thumbnail"
                          className="w-9 h-9 rounded-[6px] object-cover border border-slate-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-[6px] bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[9px] flex-shrink-0">
                          LazPe
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 text-[12px] md:text-[13px] line-clamp-1">
                          {item.productName || item.bundleName}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{item.variantName || "Mặc định"}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
                      <div className="text-right flex flex-col items-end gap-0.5">
                        {renderStars(item.rating)}
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>

                      {item.isHidden && item.autoModerationStatus === "AutoHidden" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 shadow-sm animate-pulse uppercase">
                          <ShieldAlert size={10} className="text-rose-500" />
                          Tạm ẩn (Kiểm duyệt)
                        </span>
                      )}

                      {item.isHidden && item.autoModerationStatus !== "AutoHidden" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[9px] font-bold bg-red-50 text-red-650 border border-red-100 shadow-sm uppercase">
                          <ShieldAlert size={10} className="text-red-500" />
                          Đã bị ẩn
                        </span>
                      )}

                      {!item.isHidden && item.autoModerationStatus === "NeedsReview" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 shadow-sm uppercase">
                          <ShieldAlert size={10} className="text-amber-500" />
                          Chờ xem xét
                        </span>
                      )}
                      
                      {item.hasEarnedRewardPoints && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-[4px] text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm uppercase">
                          <Award size={10} className="text-emerald-500" />
                          +{item.loyaltyPointsEarned} điểm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="bg-slate-50/40 p-2.5 rounded-[6px] border border-slate-100/40 mt-1">
                    <p className="text-[12px] text-slate-700 leading-relaxed break-words whitespace-pre-line">
                      {item.content || <em className="text-slate-400 text-[11px]">Không có nội dung đánh giá bằng chữ</em>}
                    </p>
                  </div>

                  {/* Attachment Media Grid */}
                  {item.reviewMedia && item.reviewMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-1">
                      {item.reviewMedia.map((m) => (
                        <div
                          key={m.mediaID}
                          onClick={() => setLightboxMedia({ url: m.url, mediaType: m.mediaType })}
                          className="relative w-16 h-16 rounded border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90 active:scale-95 transition-all group"
                        >
                          {m.mediaType === "VIDEO" ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white relative">
                              <Play size={16} className="text-white fill-white/80" />
                              <span className="text-[8px] font-bold absolute bottom-1">VIDEO</span>
                            </div>
                          ) : (
                            <img src={m.url} alt="Review attachment" className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons (Edit/Delete) */}
                  {(canEdit(item) || canDelete(item)) && (
                    <div className="flex gap-2 justify-end pt-1">
                      {canEdit(item) && (
                        <button
                          onClick={() => handleEditReviewClick(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-primary bg-slate-100 hover:bg-slate-200/50 px-2.5 py-1.5 rounded transition-all"
                        >
                          <Edit3 size={12} />
                          Sửa
                        </button>
                      )}
                      {canDelete(item) && (
                        <button
                          onClick={() => handleDeleteReview(item.reviewID)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded transition-all"
                        >
                          <Trash2 size={12} />
                          Xóa
                        </button>
                      )}
                    </div>
                  )}

                  {/* Detailed Moderation Warnings */}
                  {item.isHidden && item.autoModerationStatus === "AutoHidden" && (
                    <div className="bg-rose-50/50 border border-rose-100/50 rounded-[6px] p-3 flex items-start gap-2 text-xs">
                      <ShieldAlert size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                      <div className="text-[11px] text-rose-800">
                        <span className="font-bold text-rose-900 block mb-0.5">Đánh giá của bạn tạm thời bị ẩn.</span>
                        Nội dung chứa từ khóa nhạy cảm. Ban quản trị đang xem xét đánh giá này.
                        {item.flaggedReason && (
                          <span className="block mt-1 font-bold text-rose-600/90 text-[10px]">Từ khóa: {item.flaggedReason}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {item.isHidden && item.autoModerationStatus !== "AutoHidden" && (
                    <div className="bg-red-50/50 border border-red-100/50 rounded-[6px] p-3 flex items-start gap-2 text-xs">
                      <ShieldAlert size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="text-[11px] text-red-800">
                        <span className="font-bold text-red-900 block mb-0.5">Đánh giá đã bị ẩn bởi Quản trị viên.</span>
                        Nội dung không tuân thủ quy chuẩn của hệ thống.
                        {item.censorshipReason && (
                          <span className="block mt-1 font-bold text-red-600/90 text-[10px]">Lý do: {item.censorshipReason}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {!item.isHidden && item.autoModerationStatus === "NeedsReview" && (
                    <div className="bg-amber-50/50 border border-amber-100/50 rounded-[6px] p-3 flex items-start gap-2 text-xs">
                      <ShieldAlert size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-800">
                        <span className="font-bold text-amber-900 block mb-0.5">Đang chờ Quản trị viên xem xét lại.</span>
                        Hệ thống phát hiện một số từ khóa cần xem xét lại.
                        {item.flaggedReason && (
                          <span className="block mt-1 font-bold text-amber-700 text-[10px]">Nghi vấn: {item.flaggedReason}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shop response */}
                  {item.comments && item.comments.length > 0 && (
                    <div className="pl-4 border-l-2 border-primary/20 space-y-1 bg-slate-50/30 p-3 rounded-r-lg border border-slate-100 border-l-0">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Phản hồi từ người bán</p>
                      {item.comments.map((comm) => (
                        <p key={comm.commentID} className="text-xs font-semibold text-slate-500 break-words leading-relaxed">
                          {comm.content}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {renderPagination(reviewedPage, reviewedTotalPages, setReviewedPage)}
              </>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rate_review</span>
                <p className="text-slate-500 font-bold text-sm">Bạn chưa viết đánh giá nào.</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Lightbox Media Modal */}
      {lightboxMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-center items-center shadow-2xl">
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-transform hover:scale-105 z-10"
            >
              <X size={20} />
            </button>
            <div className="w-full flex justify-center items-center p-6 min-h-[300px]">
              {lightboxMedia.mediaType === "VIDEO" ? (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded-lg shadow-inner"
                />
              ) : (
                <img
                  src={lightboxMedia.url}
                  alt="Full preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

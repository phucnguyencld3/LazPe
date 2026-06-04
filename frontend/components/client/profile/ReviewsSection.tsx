import React, { useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";
import { getUserReviews, getPendingReviews, submitProductReview, getLoyaltySettings, LoyaltySettings } from "@/lib/api";
import { Loader } from "lucide-react";

interface ReviewItem {
  id: string;
  productName: string;
  variant: string;
  purchaseDate: string;
  reviewDate?: string;
  rating?: number;
  comment?: string;
  shopResponse?: string;
  invoiceId?: number;
  invoiceDetailId?: number;
  imageUrl?: string;
  hasEarnedRewardPoints?: boolean;
  loyaltyPointsEarned?: number;
}

interface ReviewsSectionProps {
  userId: string;
  token: string;
}

export function ReviewsSection({ userId, token }: ReviewsSectionProps) {
  const [activeTab, setActiveTab] = useState<"to_review" | "reviewed">("to_review");
  const [toReviewList, setToReviewList] = useState<ReviewItem[]>([]);
  const [reviewedList, setReviewedList] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // States for writing a review
  const [writingReviewFor, setWritingReviewFor] = useState<ReviewItem | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      if (token) {
        try {
          const settings = await getLoyaltySettings(token);
          setLoyaltySettings(settings);
        } catch (error) {
          console.error("Error fetching loyalty settings:", error);
        }
      }
    }
    fetchSettings();
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!userId || !token) return;
    setLoading(true);
    try {
      // 1. Fetch pending reviews
      const pendingData = await getPendingReviews(userId, token);
      if (pendingData) {
        const mappedPending: ReviewItem[] = pendingData.map((item: any) => ({
          id: `pending-${item.invoiceDetailID}`,
          productName: item.productName,
          variant: item.variantName || "Mặc định",
          purchaseDate: item.purchaseDate ? item.purchaseDate.split("T")[0] : "",
          invoiceId: item.invoiceID,
          invoiceDetailId: item.invoiceDetailID,
          imageUrl: item.imageUrl
        }));
        setToReviewList(mappedPending);
      }

      // 2. Fetch completed reviews
      const reviewedData = await getUserReviews(userId, token, 1, 100);
      if (reviewedData && reviewedData.reviews) {
        const mappedReviewed: ReviewItem[] = reviewedData.reviews.map((r: any) => {
          const shopComment = r.comments?.find((c: any) => 
            c.user?.fullName?.toLowerCase().includes("admin") || 
            c.user?.fullName?.toLowerCase().includes("shop") || 
            c.user?.fullName?.toLowerCase().includes("lazpe")
          );
          const shopResponse = shopComment ? shopComment.content : (r.comments && r.comments.length > 0 ? r.comments[0].content : undefined);

          return {
            id: `reviewed-${r.reviewID}`,
            productName: r.productName || r.bundleName || "Sản phẩm",
            variant: r.variantName || "",
            purchaseDate: r.createdAt ? r.createdAt.split("T")[0] : "",
            reviewDate: r.createdAt ? r.createdAt.split("T")[0] : "",
            rating: r.rating,
            comment: r.content,
            shopResponse: shopResponse,
            imageUrl: r.imageUrl,
            hasEarnedRewardPoints: r.hasEarnedRewardPoints,
            loyaltyPointsEarned: r.loyaltyPointsEarned
          };
        });
        setReviewedList(mappedReviewed);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("Không thể tải thông tin đánh giá.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWriteReviewClick = (item: ReviewItem) => {
    setWritingReviewFor(item);
    setNewRating(5);
    setNewComment("");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writingReviewFor) return;

    if (!newComment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    if (!writingReviewFor.invoiceId || !writingReviewFor.invoiceDetailId) {
      toast.error("Thông tin đơn hàng không hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitProductReview(token, {
        invoiceID: writingReviewFor.invoiceId,
        invoiceDetailID: writingReviewFor.invoiceDetailId,
        rating: newRating,
        content: newComment.trim()
      });

      if (result.success) {
        const rewardPoints = result.data?.loyaltyPointsEarned;
        if (result.data?.hasEarnedRewardPoints && rewardPoints) {
          toast.success(`Đánh giá thành công! Bạn đã nhận được +${rewardPoints} điểm Loyalty! 🎉`);
        } else {
          toast.success("Gửi đánh giá thành công! Cảm ơn ý kiến đóng góp của bạn.");
        }
        setWritingReviewFor(null);
        setActiveTab("reviewed");
        await fetchData();
      } else {
        toast.error(result.message || "Không thể gửi đánh giá.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối mạng.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (star: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => interactive && onStarClick && onStarClick(star)}
            className={`material-symbols-outlined select-none text-xl ${
              star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            style={!interactive ? { fontVariationSettings: ` 'FILL' ${star <= rating ? 1 : 0}, 'wght' 400 ` } : undefined}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100 min-h-[300px] flex flex-col items-center justify-center">
        <Loader className="animate-spin text-primary mb-3" size={40} />
        <p className="text-slate-500 font-bold text-sm">Đang tải danh sách đánh giá...</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-md pb-3 border-b border-slate-100">
        <h2 className="font-headline-md text-xl font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">reviews</span> Đánh giá của tôi
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-6 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => {
            setActiveTab("to_review");
            setWritingReviewFor(null);
          }}
          className={`py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "to_review" && !writingReviewFor
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-primary"
          }`}
        >
          Chưa đánh giá ({toReviewList.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("reviewed");
            setWritingReviewFor(null);
          }}
          className={`py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "reviewed"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-primary"
          }`}
        >
          Đã đánh giá ({reviewedList.length})
        </button>
      </div>

      {/* Writing Review UI Overlay */}
      {writingReviewFor ? (
        <form onSubmit={handleReviewSubmit} className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Viết đánh giá sản phẩm</h3>
            <button
              type="button"
              onClick={() => setWritingReviewFor(null)}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              Hủy
            </button>
          </div>

          <div className="flex gap-4">
            {writingReviewFor.imageUrl ? (
              <img
                src={writingReviewFor.imageUrl}
                alt={writingReviewFor.productName}
                className="w-12 h-12 rounded-lg object-cover shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                LazPe
              </div>
            )}
            <div>
              <h4 className="font-bold text-slate-700 text-sm line-clamp-1">{writingReviewFor.productName}</h4>
              <p className="text-[11px] text-slate-400 font-semibold">{writingReviewFor.variant}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Chọn số sao đánh giá</label>
            <div className="flex items-center gap-2">
              {renderStars(newRating, true, setNewRating)}
              <span className="text-xs text-amber-600 font-bold">
                {newRating === 5 ? "Rất hài lòng" : newRating === 4 ? "Hài lòng" : newRating === 3 ? "Bình thường" : newRating === 2 ? "Không hài lòng" : "Rất tệ"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nội dung đánh giá</label>
            <textarea
              placeholder="Chia sẻ trải nghiệm thực tế về sản phẩm..."
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-sm font-semibold"
            />
            {loyaltySettings?.enableReviewReward && (
              <div className="flex justify-end text-[11px] text-slate-400 font-bold">
                Số từ: <span className={newComment.trim() === "" ? "text-slate-400 ml-1" : newComment.trim().split(/\s+/).length >= loyaltySettings.minimumReviewWords ? "text-emerald-600 ml-1" : "text-amber-600 ml-1"}>
                  {newComment.trim() === "" ? 0 : newComment.trim().split(/\s+/).length}
                </span>
                /{loyaltySettings.minimumReviewWords} từ
              </div>
            )}
          </div>

          {loyaltySettings?.enableReviewReward && (() => {
            const wordCount = newComment.trim() === "" ? 0 : newComment.trim().split(/\s+/).length;
            const reqRating = loyaltySettings.requiredRatingForReward;
            const minWords = loyaltySettings.minimumReviewWords;
            const rewardPoints = loyaltySettings.reviewRewardPoints;
            const qualifiesForReward = newRating >= reqRating && wordCount >= minWords;

            return (
              <div className={`p-4 rounded-xl border text-xs font-semibold space-y-1.5 transition-all ${
                qualifiesForReward 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                  : "bg-amber-50 border-amber-100 text-amber-800"
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm">
                    {qualifiesForReward ? "check_circle" : "info"}
                  </span>
                  Chương trình quà tặng Loyalty
                </div>
                <p className="leading-relaxed">
                  Đánh giá đạt tối thiểu <span className="font-bold">{reqRating} sao</span> và <span className="font-bold">{minWords} từ</span> để nhận <span className="font-bold text-primary">+{rewardPoints} điểm Loyalty</span> thưởng.
                </p>
                <div className="flex justify-between items-center pt-1 border-t border-current/10 mt-1">
                  <span>Tiêu chí hiện tại:</span>
                  <div className="flex gap-3">
                    <span className={newRating >= reqRating ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                      ⭐ {newRating}/{reqRating} sao
                    </span>
                    <span className={wordCount >= minWords ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                      📝 {wordCount}/{minWords} từ
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl font-bold text-sm bouncy-hover active:scale-95 transition-transform"
          >
            Hoàn tất và gửi đánh giá
          </button>
        </form>
      ) : (
        /* List UI */
        <div className="space-y-md">
          {activeTab === "to_review" ? (
            /* To Review list */
            toReviewList.length > 0 ? (
              toReviewList.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-md bg-white hover:shadow-sm transition-shadow"
                >
                  <div className="flex gap-4">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-14 h-14 rounded-xl object-cover shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center text-primary font-bold text-sm shadow-sm flex-shrink-0">
                        LazPe
                      </div>
                    )}
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm md:text-base line-clamp-1">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold">{item.variant}</p>
                      <p className="text-[10px] text-slate-400">
                        Ngày mua: {new Date(item.purchaseDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleWriteReviewClick(item)}
                    className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold text-xs bouncy-hover active:scale-95 transition-all text-center self-stretch md:self-auto"
                  >
                    Viết đánh giá
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rate_review</span>
                <p className="text-slate-500 font-semibold text-sm">Tuyệt vời! Bạn không còn sản phẩm nào chờ đánh giá.</p>
              </div>
            )
          ) : (
            /* Reviewed list */
            reviewedList.length > 0 ? (
              reviewedList.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-white"
                >
                  {/* Top product info */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">
                          LazPe
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-700 text-xs md:text-sm line-clamp-1">
                          {item.productName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{item.variant}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {item.rating && renderStars(item.rating)}
                      {item.hasEarnedRewardPoints && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 mt-1 shadow-sm">
                          <span className="material-symbols-outlined text-[12px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                          +{item.loyaltyPointsEarned} điểm
                        </span>
                      )}
                      {item.reviewDate && (
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                          {new Date(item.reviewDate).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                      {item.comment}
                    </p>
                  </div>

                  {/* Shop response */}
                  {item.shopResponse && (
                    <div className="pl-6 border-l-2 border-primary/20 space-y-1">
                      <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Phản hồi của người bán</p>
                      <p className="text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        {item.shopResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rate_review</span>
                <p className="text-slate-500 font-semibold text-sm">Bạn chưa viết đánh giá nào.</p>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

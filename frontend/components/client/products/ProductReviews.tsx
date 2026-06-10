"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, ThumbsUp, ChevronLeft, ChevronRight, Play, X, Loader2, Award } from "lucide-react";
import { getProductReviews, toggleReviewLike, ReviewItem, ReviewStats } from "@/lib/api";
import { toast } from "@/lib/toast";

interface ProductReviewsProps {
  productId: number;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<number | null>(null);

  // Lightbox modal state
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; mediaType: string } | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProductReviews(productId, page, 5); // 5 reviews per page
      if (result) {
        setReviews(result.reviews || []);
        setStats(result.stats);
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleLikeToggle = async (reviewId: number) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để thích đánh giá!");
      return;
    }

    setLikingId(reviewId);
    try {
      const res = await toggleReviewLike(reviewId);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.reviewID === reviewId
              ? { ...r, isLikedByCurrentUser: res.isLiked, likeCount: res.likeCount }
              : r
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikingId(null);
    }
  };

  const renderStars = (score: number, size = 16) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= score ? "fill-amber-400 text-amber-400" : "text-slate-200"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary mb-3" size={32} />
        <p className="text-slate-500 font-bold text-xs">Đang tải đánh giá...</p>
      </div>
    );
  }

  // Calculate distributions safely
  const distribution = stats?.ratingDistribution || {};
  const totalDistributionReviews = stats?.totalReviews || totalCount || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Bento Grid Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 border border-slate-100 p-6 rounded-3xl">
        {/* Rating summary */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-100">
          <h4 className="text-5xl font-black text-slate-800 tracking-tight">
            {stats?.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
          </h4>
          <div className="my-2.5">
            {renderStars(Math.round(stats?.averageRating || 0), 22)}
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            {totalCount} đánh giá
          </p>
        </div>

        {/* Distribution Bars */}
        <div className="md:col-span-2 flex flex-col justify-center space-y-2 p-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const percentage = totalDistributionReviews > 0 ? (count / totalDistributionReviews) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <span className="w-12 text-right">{star} sao</span>
                <div className="flex-grow h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-14 text-slate-400 text-left">
                  {count} ({Math.round(percentage)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          <div className="divide-y divide-slate-100">
            {reviews.map((item) => (
              <div key={item.reviewID} className="py-6 first:pt-0 last:pb-0 space-y-3.5">
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 items-center">
                    {/* Avatar placeholder with initials */}
                    <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center font-bold text-sm text-primary shadow-inner shrink-0">
                      {item.user?.fullName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">
                        {item.user?.fullName || "Khách hàng ẩn danh"}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        {renderStars(item.rating)}
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5">
                    {item.variantName && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded">
                        Phân loại: {item.variantName}
                      </span>
                    )}
                    {item.hasEarnedRewardPoints && (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold shadow-2xs">
                        <Award size={10} className="text-emerald-500" />
                        Đã xác minh mua hàng
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm font-semibold text-slate-600 leading-relaxed break-words whitespace-pre-line bg-slate-50/30 p-3 rounded-2xl border border-slate-100/50">
                  {item.content || <em className="text-slate-400 text-xs font-semibold">Khách hàng không để lại nhận xét bằng chữ.</em>}
                </p>

                {/* Media attachments */}
                {item.reviewMedia && item.reviewMedia.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.reviewMedia.map((m) => (
                      <div
                        key={m.mediaID}
                        onClick={() => setLightboxMedia({ url: m.url, mediaType: m.mediaType })}
                        className="relative w-16 h-16 rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm group bg-slate-50"
                      >
                        {m.mediaType === "VIDEO" ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white relative">
                            <Play size={16} className="text-white fill-white/80" />
                            <span className="text-[8px] font-bold absolute bottom-1.5 uppercase">VIDEO</span>
                          </div>
                        ) : (
                          <img src={m.url} alt="Review attachment" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Seller Reply */}
                {item.comments && item.comments.length > 0 && (
                  <div className="mt-3 p-4 bg-primary/[0.02] border border-primary/10 border-l-4 border-l-primary/45 rounded-r-2xl space-y-1.5 animate-in slide-in-from-left duration-250">
                    <div className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px]">reply</span>
                      <span className="text-xs font-extrabold uppercase tracking-wider">Phản hồi từ người bán</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-505 leading-relaxed break-words whitespace-pre-wrap">
                      {item.comments[0].content}
                    </p>
                  </div>
                )}

                {/* Interactions (Like Button) */}
                <div className="flex justify-between items-center pt-1">
                  <button
                    onClick={() => handleLikeToggle(item.reviewID)}
                    disabled={likingId === item.reviewID}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                      item.isLikedByCurrentUser
                        ? "bg-primary/5 text-primary border-primary/20"
                        : "text-slate-400 bg-white border-slate-200 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ThumbsUp
                      size={12}
                      className={`${item.isLikedByCurrentUser ? "fill-primary text-primary" : ""}`}
                    />
                    <span>Hữu ích ({item.likeCount})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs font-bold text-slate-500">
              <span>Hiển thị {reviews.length} trên tổng số {totalCount} đánh giá</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-slate-800">Trang {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rate_review</span>
          <p className="text-slate-500 font-bold text-sm">Chưa có đánh giá nào cho sản phẩm này.</p>
        </div>
      )}

      {/* Lightbox Media Modal */}
      {lightboxMedia && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full max-h-[85vh] bg-slate-900 rounded-[2rem] overflow-hidden flex flex-col justify-center items-center shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 z-10"
            >
              <X size={16} />
            </button>
            <div className="w-full flex justify-center items-center p-6 min-h-[300px]">
              {lightboxMedia.mediaType === "VIDEO" ? (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded-2xl"
                />
              ) : (
                <img
                  src={lightboxMedia.url}
                  alt="Full preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

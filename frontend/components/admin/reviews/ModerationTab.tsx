"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Star,
  Play,
  ChevronDown,
  ChevronUp,
  ListFilter,
  CheckCircle,
  EyeOff,
  History,
  Reply,
} from "lucide-react";
import {
  searchReviews,
  censorReview,
  getReviewCensorshipLogs,
  createReviewComment,
  ReviewItem,
  ReviewCensorshipLog,
} from "@/lib/api";
import { toast } from "@/lib/toast";
import { Pagination } from "@/components/admin/shared/Pagination";

// Import Modals
import { CensorshipModal } from "./modals/CensorshipModal";
import { CensorshipLogsModal } from "./modals/CensorshipLogsModal";
import { ReplyModal } from "./modals/ReplyModal";
import { LightboxModal } from "./modals/LightboxModal";

interface ModerationTabProps {
  activeTab: "moderation" | "approved" | "rejected";
  onReviewsCountChange: (count: number) => void;
  onReviewActionSuccess: () => void;
}

export const ModerationTab: React.FC<ModerationTabProps> = ({
  activeTab,
  onReviewsCountChange,
  onReviewActionSuccess,
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Moderation Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, VISIBLE, HIDDEN
  const [mediaFilter, setMediaFilter] = useState<string>("ALL"); // ALL, HAS_MEDIA, NO_MEDIA
  const [sortBy, setSortBy] = useState("createdat");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedReviewForCensorship, setSelectedReviewForCensorship] = useState<ReviewItem | null>(null);
  const [censorshipAction, setCensorshipAction] = useState<"HIDE" | "RESTORE">("HIDE");
  const [submittingCensorship, setSubmittingCensorship] = useState(false);

  const [selectedReviewForLogs, setSelectedReviewForLogs] = useState<ReviewItem | null>(null);
  const [censorshipLogs, setCensorshipLogs] = useState<ReviewCensorshipLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [selectedReviewForReply, setSelectedReviewForReply] = useState<ReviewItem | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; mediaType: string } | null>(null);

  const presetReasons = [
    { value: "SPAM", label: "Chứa quảng cáo, liên kết rác, spam" },
    { value: "ABUSE", label: "Chứa từ ngữ thô tục, xúc phạm người khác" },
    { value: "UNRELATED", label: "Nội dung không liên quan đến sản phẩm" },
    { value: "FAKE", label: "Đánh giá giả mạo hoặc sai sự thật" },
    { value: "CUSTOM", label: "Lý do tùy chỉnh..." }
  ];

  const fetchReviewsQueue = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const params: any = {
        page,
        pageSize: 10,
        searchTerm: searchTerm.trim() || undefined,
        rating: ratingFilter === "ALL" ? undefined : parseInt(ratingFilter),
        sortBy,
        sortOrder,
        isHidden: statusFilter === "ALL" ? undefined : statusFilter === "HIDDEN",
        hasMedia: mediaFilter === "ALL" ? undefined : mediaFilter === "HAS_MEDIA",
      };

      const result = await searchReviews(params);
      if (result) {
        let filteredReviews: ReviewItem[] = [];
        if (activeTab === "moderation") {
          filteredReviews = (result.reviews || []).filter(
            (r) =>
              r.violationScore &&
              r.violationScore > 0 &&
              r.autoModerationStatus !== "Approved" &&
              r.autoModerationStatus !== "Rejected" &&
              (!r.isHidden || !r.censorshipReason) &&
              !(r.autoModerationStatus === "AutoHidden" && !r.isHidden)
          );
        } else if (activeTab === "approved") {
          filteredReviews = (result.reviews || []).filter(
            (r) => !r.isHidden
          );
        } else if (activeTab === "rejected") {
          filteredReviews = (result.reviews || []).filter(
            (r) => r.isHidden
          );
        }
        setReviews(filteredReviews);
        setTotalCount(filteredReviews.length);
        setTotalPages(Math.ceil(filteredReviews.length / 10) || 1);
        onReviewsCountChange(filteredReviews.length);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách kiểm duyệt đánh giá.");
    } finally {
      setLoadingReviews(false);
    }
  }, [page, searchTerm, ratingFilter, statusFilter, mediaFilter, sortBy, sortOrder, activeTab, onReviewsCountChange]);

  useEffect(() => {
    fetchReviewsQueue();
  }, [fetchReviewsQueue]);

  // Censor action submit
  const handleCensorshipSubmit = async (reviewId: number, action: "HIDE" | "RESTORE", reason: string) => {
    setSubmittingCensorship(true);
    try {
      const result = await censorReview({
        reviewID: reviewId,
        action,
        reason,
      });

      if (result.success) {
        toast.success(action === "HIDE" ? "Đã ẩn đánh giá thành công." : "Đã khôi phục hiển thị đánh giá.");
        setSelectedReviewForCensorship(null);
        await fetchReviewsQueue();
        onReviewActionSuccess();
      } else {
        toast.error(result.message || "Lỗi xử lý kiểm duyệt.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setSubmittingCensorship(false);
    }
  };

  // Reply submit handler
  const handleReplySubmit = async (reviewId: number, content: string) => {
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    setSubmittingReply(true);
    try {
      const result = await createReviewComment({
        reviewID: reviewId,
        parentCommentID: null,
        content: content.trim(),
      });

      if (result.success) {
        toast.success("Gửi phản hồi thành công!");
        setShowReplyModal(false);
        setSelectedReviewForReply(null);
        await fetchReviewsQueue(); // Refresh reviews list
      } else {
        toast.error(result.message || "Lỗi khi gửi phản hồi.");
      }
    } catch (err) {
      console.error("Error replying to review:", err);
      toast.error("Lỗi kết nối server.");
    } finally {
      setSubmittingReply(false);
    }
  };

  // View logs submit
  const handleViewLogs = async (review: ReviewItem) => {
    setSelectedReviewForLogs(review);
    setLoadingLogs(true);
    try {
      const logs = await getReviewCensorshipLogs(review.reviewID);
      setCensorshipLogs(logs || []);
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải lịch sử kiểm duyệt.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Filters Bar */}
      <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
        {/* Search box */}
        <div className="flex-1 min-w-[260px] relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Tìm nội dung hoặc tên khách hàng..."
          />
        </div>

        {/* Stars rating */}
        <select
          value={ratingFilter}
          onChange={(e) => {
            setRatingFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
        >
          <option value="ALL">Tất cả số sao</option>
          <option value="5">5 Sao</option>
          <option value="4">4 Sao</option>
          <option value="3">3 Sao</option>
          <option value="2">2 Sao</option>
          <option value="1">1 Sao</option>
        </select>

        {/* Censorship status */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[180px] cursor-pointer"
        >
          <option value="ALL">Trạng thái: Tất cả</option>
          <option value="VISIBLE">Đang hiển thị</option>
          <option value="HIDDEN">Đang bị ẩn (Censored)</option>
        </select>

        {/* Media presence */}
        <select
          value={mediaFilter}
          onChange={(e) => {
            setMediaFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[180px] cursor-pointer"
        >
          <option value="ALL">File đính kèm: Tất cả</option>
          <option value="HAS_MEDIA">Có ảnh/video</option>
          <option value="NO_MEDIA">Chỉ chứa chữ</option>
        </select>

        {/* Reset Filters button */}
        {(searchTerm || ratingFilter !== "ALL" || statusFilter !== "ALL" || mediaFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setRatingFilter("ALL");
              setStatusFilter("ALL");
              setMediaFilter("ALL");
              setPage(1);
            }}
            className="px-6 py-3 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">clear</span>
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table list grid queue */}
      {loadingReviews ? (
        <div className="p-20 text-center">
          <Loader2 className="animate-spin text-primary mx-auto" size={32} />
          <p className="text-slate-400 mt-4 font-semibold text-sm">Đang tải dữ liệu kiểm duyệt...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div>
          {/* List Header / Sorting Bar */}
          <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tìm thấy {totalCount} đánh giá</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/25"
              >
                <option value="createdat">Mới nhất</option>
                <option value="rating">Số sao</option>
                <option value="likes">Số lượt Thích</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/25"
              >
                <option value="desc">Giảm dần</option>
                <option value="asc">Tăng dần</option>
              </select>
            </div>
          </div>

          {/* Items List */}
          <div className="divide-y divide-slate-100">
            {reviews.map((r) => {
              const isExpanded = !!expandedReviews[r.reviewID];
              return (
                <div key={r.reviewID} className="px-8 py-5 flex flex-col hover:bg-slate-50/30 transition-colors">
                  {/* Basic Info Row */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Left portion: User & Product info */}
                    <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
                      {/* User Avatar */}
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-sm text-slate-500 overflow-hidden shrink-0 shadow-sm">
                        {r.user?.avatar ? (
                          <img src={r.user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                        ) : (
                          r.user?.fullName?.charAt(0) || "U"
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{r.user?.fullName || "Khách hàng ẩn danh"}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">({r.userID})</span>
                          {/* Stars */}
                          <div className="ml-1 shrink-0">{renderStars(r.rating)}</div>
                          {/* Date */}
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(r.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {/* Product detail */}
                          <div className="bg-slate-50 border border-slate-100 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Sản phẩm:</span>
                            <span className="text-primary font-extrabold">{r.productName || r.bundleName || "Sản phẩm"}</span>
                            {r.variantName && (
                              <>
                                <span className="text-slate-200">|</span>
                                <span className="text-secondary font-extrabold">Phân loại: {r.variantName}</span>
                              </>
                            )}
                          </div>

                          {/* Points earned badge */}
                          {r.hasEarnedRewardPoints && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary border border-secondary/10 text-[10px] font-bold shadow-sm">
                              <span className="material-symbols-outlined text-[11px] text-secondary">award_star</span>
                              Loyalty +{r.loyaltyPointsEarned}
                            </span>
                          )}

                          {/* Hidden Censored status */}
                          {r.isHidden && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container/20 text-error border border-error/10 text-[10px] font-bold shadow-sm">
                              <span className="material-symbols-outlined text-[11px] text-error">visibility_off</span>
                              Đang ẩn
                            </span>
                          )}

                          {/* Auto Moderation Status Badge */}
                          {r.autoModerationStatus && r.autoModerationStatus !== "Approved" && (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm border ${
                                r.autoModerationStatus === "AutoHidden"
                                  ? "bg-rose-50 text-rose-605 text-rose-600 border-rose-100"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[11px]">security_update_warning</span>
                              {r.autoModerationStatus === "AutoHidden" ? "Tự động ẩn" : "Cần xem xét"} (Điểm vi phạm:{" "}
                              {r.violationScore})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right portion: Collapse / Expand toggle button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedReviewForReply(r);
                          setShowReplyModal(true);
                        }}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-xs font-bold text-violet-600 transition-all cursor-pointer"
                        title="Phản hồi đánh giá"
                      >
                        <Reply size={14} />
                        <span>{r.comments && r.comments.length > 0 ? "Sửa" : "Phản hồi"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setExpandedReviews((prev) => ({
                            ...prev,
                            [r.reviewID]: !prev[r.reviewID],
                          }));
                        }}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-105 border border-slate-200 text-xs font-bold text-slate-600 transition-all cursor-pointer hover:bg-slate-100"
                      >
                        <span>{isExpanded ? "Thu gọn" : "Chi tiết"}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Detailed/Expanded Section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-dashed border-slate-100 space-y-4">
                      {/* Comment text */}
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-sm font-medium text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                        {r.content || <em className="text-slate-400">Không ghi nội dung đánh giá bằng chữ</em>}
                      </div>

                      {/* Media attachments */}
                      {r.reviewMedia && r.reviewMedia.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {r.reviewMedia.map((m) => (
                            <div
                              key={m.mediaID}
                              onClick={() => setLightboxMedia({ url: m.url, mediaType: m.mediaType })}
                              className="relative w-16 h-16 rounded-2xl border border-slate-150 overflow-hidden bg-slate-50 cursor-pointer hover:scale-105 transition-all shadow-sm flex items-center justify-center"
                            >
                              {m.mediaType === "VIDEO" ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white relative">
                                  <Play size={14} className="text-white fill-white/80" />
                                  <span className="text-[7px] font-bold absolute bottom-1.5 tracking-wider">
                                    VIDEO
                                  </span>
                                </div>
                              ) : (
                                <img src={m.url} alt="Review attachment" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Censorship reason warning */}
                      {r.isHidden && r.censorshipReason && (
                        <div className="bg-error-container/10 border border-error/10 rounded-2xl p-4 text-xs font-semibold text-error flex gap-2 items-center">
                          <span className="material-symbols-outlined text-error">warning</span>
                          <span>
                            Lý do ẩn: <strong className="font-extrabold">{r.censorshipReason}</strong>
                          </span>
                        </div>
                      )}

                      {/* Flagged warning */}
                      {r.flaggedReason && (
                        <div className="bg-amber-50/50 border border-amber-250/20 rounded-2xl p-4 text-xs font-semibold text-amber-700 flex gap-2 items-center">
                          <span className="material-symbols-outlined text-amber-600 text-[18px]">gavel</span>
                          <span>
                            Hệ thống phát hiện nghi vấn:{" "}
                            <strong className="font-extrabold text-amber-900">{r.flaggedReason}</strong>
                          </span>
                        </div>
                      )}

                      {/* Seller reply / Admin response */}
                      {r.comments && r.comments.length > 0 && (
                        <div className="pl-4 border-l-2 border-primary/20 space-y-1 bg-slate-50/30 p-3 rounded-r-lg border border-slate-100 border-l-0">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Phản hồi của Shop</p>
                          {r.comments.map((comm) => (
                            <p
                              key={comm.commentID}
                              className="text-xs font-semibold text-slate-500 break-words leading-relaxed"
                            >
                              {comm.content}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Moderation Actions Block */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        {/* If in moderation queue (Bị gắn cờ vi phạm), show both buttons */}
                        {activeTab === "moderation" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedReviewForCensorship(r);
                                setCensorshipAction("RESTORE");
                              }}
                              className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Duyệt hiển thị"
                            >
                              <CheckCircle size={18} />
                              Duyệt hiển thị (Restore)
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReviewForCensorship(r);
                                setCensorshipAction("HIDE");
                              }}
                              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Không duyệt"
                            >
                              <EyeOff size={18} />
                              Không duyệt (Reject)
                            </button>
                          </>
                        )}

                        {/* If in approved tab (Đã được duyệt), show Hide button to reject/hide it */}
                        {activeTab === "approved" && (
                          <button
                            onClick={() => {
                              setSelectedReviewForCensorship(r);
                              setCensorshipAction("HIDE");
                            }}
                            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Không duyệt"
                          >
                            <EyeOff size={18} />
                            Không duyệt (Reject)
                          </button>
                        )}

                        {/* If in rejected tab (Không được duyệt), show Restore button to approve/restore it */}
                        {activeTab === "rejected" && (
                          <button
                            onClick={() => {
                              setSelectedReviewForCensorship(r);
                              setCensorshipAction("RESTORE");
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Duyệt hiển thị"
                          >
                            <CheckCircle size={18} />
                            Duyệt hiển thị (Restore)
                          </button>
                        )}

                        <button
                          onClick={() => handleViewLogs(r)}
                          className="px-4 py-2 rounded-xl bg-primary-container/20 text-primary hover:bg-primary-container/30 border border-primary/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Lịch sử kiểm duyệt"
                        >
                          <History size={18} />
                          Lịch sử kiểm duyệt (Logs)
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReviewForReply(r);
                            setShowReplyModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-secondary-container/20 text-secondary hover:bg-secondary-container/30 border border-secondary/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Phản hồi đánh giá"
                        >
                          <Reply size={18} />
                          {r.comments && r.comments.length > 0 ? "Sửa phản hồi" : "Phản hồi (Reply)"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Circular Pagination */}
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={10}
              onPageChange={setPage}
            />
          </div>
        </div>
      ) : (
        <div className="p-20 text-center">
          <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">gavel</span>
          <p className="text-slate-400 font-bold text-sm">Không tìm thấy đánh giá nào khớp với bộ lọc tìm kiếm.</p>
        </div>
      )}

      {/* Modals */}
      <CensorshipModal
        isOpen={!!selectedReviewForCensorship}
        onClose={() => setSelectedReviewForCensorship(null)}
        review={selectedReviewForCensorship}
        action={censorshipAction}
        onSubmit={handleCensorshipSubmit}
        submitting={submittingCensorship}
      />

      <CensorshipLogsModal
        isOpen={!!selectedReviewForLogs}
        onClose={() => setSelectedReviewForLogs(null)}
        review={selectedReviewForLogs}
        logs={censorshipLogs}
        loading={loadingLogs}
      />

      <ReplyModal
        isOpen={showReplyModal}
        onClose={() => {
          setShowReplyModal(false);
          setSelectedReviewForReply(null);
        }}
        review={selectedReviewForReply}
        onSubmit={handleReplySubmit}
        submitting={submittingReply}
      />

      <LightboxModal
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
      />
    </div>
  );
};


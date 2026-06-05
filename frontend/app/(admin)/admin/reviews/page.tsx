"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";
import {
  searchReviews,
  censorReview,
  getReviewCensorshipLogs,
  getReviewAdminStats,
  getReviewLoyaltySettings,
  updateReviewLoyaltySettings,
  ReviewItem,
  ReviewCensorshipLog
} from "@/lib/api";
import { 
  Loader, Search, Star, ShieldAlert, CheckCircle, Eye, EyeOff, 
  Settings, BarChart3, ListFilter, Calendar, Clock, AlertTriangle, Play, X, Award
} from "lucide-react";
import { Pagination } from "@/components/admin/shared/Pagination";

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<"moderation" | "settings" | "analytics">("moderation");
  
  // Moderation state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
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

  // Moderation Action modals
  const [selectedReviewForCensorship, setSelectedReviewForCensorship] = useState<ReviewItem | null>(null);
  const [censorshipAction, setCensorshipAction] = useState<"HIDE" | "RESTORE">("HIDE");
  const [censorshipReason, setCensorshipReason] = useState("");
  const [submittingCensorship, setSubmittingCensorship] = useState(false);
  
  const [selectedReviewForLogs, setSelectedReviewForLogs] = useState<ReviewItem | null>(null);
  const [censorshipLogs, setCensorshipLogs] = useState<ReviewCensorshipLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Settings state
  const [loyaltySettings, setLoyaltySettings] = useState<any>({
    enableReviewReward: true,
    reviewRewardPoints: 200,
    minimumReviewWords: 50,
    requiredRatingForReward: 5,
    allowMultipleRewardsPerProduct: false,
    reviewWithImageRewardPoints: 300,
    reviewWithVideoRewardPoints: 500,
    minimumReviewChars: 100,
    allowEditReviewTimeLimitMinutes: 30,
    maxReviewDaysAfterReceipt: 30,
    requireDeliveryToReview: true
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Analytics state
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Lightbox preview
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; mediaType: 'IMAGE' | 'VIDEO' } | null>(null);

  // Fetch reviews queue
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
        isHidden: statusFilter === "ALL" ? undefined : (statusFilter === "HIDDEN"),
        hasMedia: mediaFilter === "ALL" ? undefined : (mediaFilter === "HAS_MEDIA")
      };

      const result = await searchReviews(params);
      if (result) {
        setReviews(result.reviews || []);
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách kiểm duyệt đánh giá.");
    } finally {
      setLoadingReviews(false);
    }
  }, [page, searchTerm, ratingFilter, statusFilter, mediaFilter, sortBy, sortOrder]);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const result = await getReviewLoyaltySettings();
      if (result) {
        setLoyaltySettings(result);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải cấu hình đánh giá.");
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const result = await getReviewAdminStats();
      if (result) {
        setStats(result);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải số liệu thống kê kiểm duyệt.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "moderation") {
      fetchReviewsQueue();
    } else if (activeTab === "settings") {
      fetchSettings();
    } else if (activeTab === "analytics") {
      fetchStats();
    }
  }, [activeTab, fetchReviewsQueue, fetchSettings, fetchStats]);

  // Censor action submit
  const handleCensorshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewForCensorship) return;
    if (censorshipAction === "HIDE" && !censorshipReason.trim()) {
      toast.error("Vui lòng nhập lý do ẩn đánh giá.");
      return;
    }

    setSubmittingCensorship(true);
    try {
      const result = await censorReview({
        reviewID: selectedReviewForCensorship.reviewID,
        action: censorshipAction,
        reason: censorshipAction === "HIDE" ? censorshipReason.trim() : "Khôi phục hiển thị đánh giá bởi Quản trị viên"
      });

      if (result.success) {
        toast.success(censorshipAction === "HIDE" ? "Đã ẩn đánh giá thành công." : "Đã khôi phục hiển thị đánh giá.");
        setSelectedReviewForCensorship(null);
        setCensorshipReason("");
        await fetchReviewsQueue();
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

  // Save Settings submit
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const result = await updateReviewLoyaltySettings(loyaltySettings);
      if (result.success) {
        toast.success("Cập nhật cấu hình thưởng điểm đánh giá thành công!");
        await fetchSettings();
      } else {
        toast.error(result.message || "Cập nhật cấu hình thất bại.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi máy chủ.");
    } finally {
      setSavingSettings(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${
              star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
            Kiểm duyệt Đánh giá sản phẩm
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Quản lý, phản hồi và thiết lập quy tắc thưởng Loyalty cho module đánh giá sản phẩm.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab("moderation")}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "moderation" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListFilter size={14} />
            Hàng đợi duyệt
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "settings" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Settings size={14} />
            Cấu hình thưởng
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "analytics" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 size={14} />
            Thống kê & Báo cáo
          </button>
        </div>
      </div>

      {/* Moderation Queue Tab */}
      {activeTab === "moderation" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative col-span-1 sm:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm nội dung hoặc tên khách hàng..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25"
              />
            </div>

            {/* Stars rating */}
            <div>
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="ALL">⭐ Tất cả số sao</option>
                <option value="5">⭐ 5 Sao</option>
                <option value="4">⭐ 4 Sao</option>
                <option value="3">⭐ 3 Sao</option>
                <option value="2">⭐ 2 Sao</option>
                <option value="1">⭐ 1 Sao</option>
              </select>
            </div>

            {/* Censorship status */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="ALL">🔒 Trạng thái: Tất cả</option>
                <option value="VISIBLE">🟢 Đang hiển thị</option>
                <option value="HIDDEN">🔴 Đang bị ẩn (Censored)</option>
              </select>
            </div>

            {/* Media presence */}
            <div>
              <select
                value={mediaFilter}
                onChange={(e) => {
                  setMediaFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="ALL">📁 File đính kèm: Tất cả</option>
                <option value="HAS_MEDIA">📷 Có ảnh/video</option>
                <option value="NO_MEDIA">📝 Chỉ chứa chữ</option>
              </select>
            </div>
          </div>

          {/* Table list grid queue */}
          {loadingReviews ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 flex flex-col justify-center items-center">
              <Loader className="animate-spin text-primary mb-3" size={36} />
              <p className="text-slate-400 font-bold text-xs">Đang tải dữ liệu kiểm duyệt...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">Tìm thấy {totalCount} đánh giá</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Sắp xếp:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded text-[11px] font-bold text-slate-600 focus:outline-none"
                    >
                      <option value="createdat">Mới nhất</option>
                      <option value="rating">Số sao</option>
                      <option value="likes">Số lượt Thích</option>
                    </select>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded text-[11px] font-bold text-slate-600 focus:outline-none"
                    >
                      <option value="desc">Giảm dần</option>
                      <option value="asc">Tăng dần</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {reviews.map((r) => (
                    <div key={r.reviewID} className="p-5 flex flex-col lg:flex-row justify-between gap-6 hover:bg-slate-50/20 transition-colors">
                      {/* Left Block (User + Review detail) */}
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* User Avatar */}
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 overflow-hidden">
                            {r.user?.avatar ? (
                              <img src={r.user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                            ) : (
                              r.user?.fullName?.charAt(0) || "U"
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-700 text-xs md:text-sm">{r.user?.fullName || "Khách hàng ẩn danh"}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">({r.userID})</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {renderStars(r.rating)}
                              <span className="text-[10px] text-slate-400 font-semibold">{new Date(r.createdAt).toLocaleString("vi-VN")}</span>
                            </div>
                          </div>

                          {/* Points earned badge */}
                          {r.hasEarnedRewardPoints && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold ml-2">
                              <Award size={10} className="fill-emerald-500/10 text-emerald-500" />
                              Loyalty +{r.loyaltyPointsEarned}
                            </span>
                          )}

                          {/* Hidden Censored status */}
                          {r.isHidden && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold ml-2">
                              <EyeOff size={10} />
                              Đang ẩn
                            </span>
                          )}
                        </div>

                        {/* Product detail */}
                        <div className="bg-slate-100/50 p-2.5 rounded-lg border border-slate-200/50 inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                          <span className="text-slate-400">Sản phẩm:</span>
                          <span className="font-bold text-slate-700">{r.productName || r.bundleName || "Sản phẩm"}</span>
                          {r.variantName && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="text-slate-500">Phân loại: {r.variantName}</span>
                            </>
                          )}
                        </div>

                        {/* Comment text */}
                        <div className="bg-white p-3.5 rounded-lg border border-slate-100 text-xs font-semibold text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                          {r.content || <em className="text-slate-400">Không ghi nội dung đánh giá bằng chữ</em>}
                        </div>

                        {/* Media attachments */}
                        {r.reviewMedia && r.reviewMedia.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {r.reviewMedia.map((m) => (
                              <div
                                key={m.mediaID}
                                onClick={() => setLightboxMedia({ url: m.url, mediaType: m.mediaType })}
                                className="relative w-14 h-14 rounded border border-slate-200 overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                              >
                                {m.mediaType === "VIDEO" ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white relative">
                                    <Play size={14} className="text-white fill-white/80" />
                                    <span className="text-[7px] font-bold absolute bottom-1">VIDEO</span>
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
                          <div className="bg-red-50 border border-red-100/50 rounded-lg p-2.5 text-[11px] text-red-800 font-semibold flex gap-1.5 items-center">
                            <ShieldAlert size={14} className="text-red-500" />
                            <span>Lý do kiểm duyệt: <strong className="font-bold text-red-600">{r.censorshipReason}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Right Block (Moderation Actions) */}
                      <div className="flex flex-row lg:flex-col justify-end lg:justify-start items-center lg:items-stretch gap-2.5 self-end lg:self-auto border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-44 border-slate-100">
                        {r.isHidden ? (
                          <button
                            onClick={() => {
                              setSelectedReviewForCensorship(r);
                              setCensorshipAction("RESTORE");
                              setCensorshipReason("");
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 px-3.5 py-2 rounded-lg transition-all"
                          >
                            <CheckCircle size={14} />
                            Duyệt hiển thị
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedReviewForCensorship(r);
                              setCensorshipAction("HIDE");
                              setCensorshipReason("");
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 hover:text-white bg-red-50 hover:bg-red-500 border border-red-100 hover:border-red-500 px-3.5 py-2 rounded-lg transition-all"
                          >
                            <EyeOff size={14} />
                            Ẩn đánh giá
                          </button>
                        )}

                        <button
                          onClick={() => handleViewLogs(r)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-lg transition-all bg-white"
                        >
                          <AlertTriangle size={14} />
                          Lịch sử xử lý
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={10}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">gavel</span>
              <p className="text-slate-500 font-bold text-sm">Không tìm thấy đánh giá nào khớp với bộ lọc tìm kiếm.</p>
            </div>
          )}
        </div>
      )}

      {/* Loyalty & Policies Configuration Tab */}
      {activeTab === "settings" && (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm max-w-3xl">
          {loadingSettings ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <Loader className="animate-spin text-primary mb-2" size={24} />
              <span className="text-slate-400 font-bold text-xs">Đang tải cấu hình...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h2 className="font-bold text-slate-700 text-sm md:text-base flex items-center gap-1.5">
                  <Settings size={18} className="text-primary" />
                  Quy tắc thưởng Loyalty & Cài đặt đánh giá
                </h2>
              </div>

              {/* Reward Point Enable Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 block">Kích hoạt tặng điểm thưởng Loyalty</span>
                  <span className="text-[10px] text-slate-400 font-semibold block">Tự động tặng điểm khi người dùng viết đánh giá chất lượng sản phẩm</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={loyaltySettings.enableReviewReward}
                    onChange={(e) => setLoyaltySettings({ ...loyaltySettings, enableReviewReward: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Settings parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Review Points */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Thưởng đánh giá cơ bản (chỉ có chữ)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.reviewRewardPoints}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewRewardPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-400">điểm</span>
                  </div>
                </div>

                {/* Review with Image Points */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Thưởng đánh giá có kèm HÌNH ẢNH</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.reviewWithImageRewardPoints}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithImageRewardPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-400">điểm</span>
                  </div>
                </div>

                {/* Review with Video Points */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Thưởng đánh giá có kèm VIDEO</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.reviewWithVideoRewardPoints}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithVideoRewardPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-400">điểm</span>
                  </div>
                </div>

                {/* Minimum Character count */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Số ký tự tối thiểu để nhận quà</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.minimumReviewChars}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, minimumReviewChars: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-400">ký tự</span>
                  </div>
                </div>

                {/* Required Rating stars */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Số sao tối thiểu để nhận quà</label>
                  <select
                    value={loyaltySettings.requiredRatingForReward}
                    onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requiredRatingForReward: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                  >
                    <option value="5">⭐ 5 Sao</option>
                    <option value="4">⭐ 4 Sao</option>
                    <option value="3">⭐ 3 Sao</option>
                    <option value="2">⭐ 2 Sao</option>
                    <option value="1">⭐ 1 Sao</option>
                  </select>
                </div>

                {/* Edit Time limit */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Thời gian tối đa để chỉnh sửa đánh giá</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.allowEditReviewTimeLimitMinutes}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, allowEditReviewTimeLimitMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-400">phút</span>
                  </div>
                </div>

                {/* Max Review days limit after order receipt */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Số ngày tối đa để đánh giá sau khi mua</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.maxReviewDaysAfterReceipt}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, maxReviewDaysAfterReceipt: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-400">ngày</span>
                  </div>
                </div>

                {/* Require Delivery Verification */}
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 select-none cursor-pointer border border-slate-200 p-2.5 rounded-lg bg-white">
                    <input
                      type="checkbox"
                      checked={loyaltySettings.requireDeliveryToReview}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requireDeliveryToReview: e.target.checked })}
                      className="rounded border-slate-300 text-primary focus:ring-primary/20"
                    />
                    <span className="text-xs font-bold text-slate-600">Yêu cầu hoàn thành giao hàng mới được đánh giá</span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-lg font-bold text-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {savingSettings && <Loader className="animate-spin" size={16} />}
                Lưu cấu hình cài đặt
              </button>
            </form>
          )}
        </div>
      )}

      {/* Analytics Dashboard Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 flex flex-col justify-center items-center">
              <Loader className="animate-spin text-primary mb-2" size={24} />
              <span className="text-slate-400 font-bold text-xs">Đang xử lý số liệu...</span>
            </div>
          ) : stats ? (
            <>
              {/* Widgets cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Tổng số đánh giá</span>
                    <span className="text-2xl font-bold text-slate-800 block mt-0.5">{stats.totalReviews}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Đánh giá hiển thị</span>
                    <span className="text-2xl font-bold text-slate-800 block mt-0.5">{stats.visibleReviews}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                    <EyeOff size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Đánh giá bị ẩn</span>
                    <span className="text-2xl font-bold text-slate-800 block mt-0.5">{stats.hiddenReviews}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-500 flex items-center justify-center">
                    <Star size={24} className="fill-amber-500/20" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Điểm trung bình</span>
                    <span className="text-2xl font-bold text-slate-800 block mt-0.5">⭐ {stats.averageRating}/5</span>
                  </div>
                </div>
              </div>

              {/* Charts visual block */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm max-w-xl">
                <h3 className="font-bold text-slate-700 text-sm md:text-base mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary" />
                  Phân bố điểm đánh giá (Sao)
                </h3>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.ratingDistribution?.[star] || 0;
                    const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                    return (
                      <div key={star} className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                        <span className="w-10 text-right">{star} sao</span>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="w-16 text-slate-400">
                          {count} ({Math.round(percent)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400 font-bold text-sm">
              Không có dữ liệu thống kê kiểm duyệt.
            </div>
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

      {/* Moderation Censorship Input Modal */}
      {selectedReviewForCensorship && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm">
                {censorshipAction === "HIDE" ? "Ẩn bài đánh giá khỏi trang khách" : "Khôi phục hiển thị đánh giá"}
              </span>
              <button
                onClick={() => setSelectedReviewForCensorship(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCensorshipSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                {censorshipAction === "HIDE" 
                  ? "Bài đánh giá bị ẩn sẽ không hiển thị công khai trên website. Một thông báo hệ thống kèm lý do sẽ được tự động gửi tới khách hàng viết đánh giá này." 
                  : "Duyệt hiển thị lại bài đánh giá trên trang chi tiết sản phẩm cho mọi khách hàng."}
              </p>

              {censorshipAction === "HIDE" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">Lý do ẩn đánh giá (Bắt buộc)</label>
                  <textarea
                    rows={3}
                    value={censorshipReason}
                    onChange={(e) => setCensorshipReason(e.target.value)}
                    placeholder="Ví dụ: Đánh giá chứa nội dung thô tục, spam link bán hàng khác hoặc không có nội dung trải nghiệm thực tế..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submittingCensorship}
                className={`w-full py-2.5 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow ${
                  censorshipAction === "HIDE" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                {submittingCensorship && <Loader className="animate-spin" size={14} />}
                Xác nhận thực hiện
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Censorship Logs View Modal */}
      {selectedReviewForLogs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-primary" />
                Lịch sử kiểm duyệt đánh giá #{selectedReviewForLogs.reviewID}
              </span>
              <button
                onClick={() => setSelectedReviewForLogs(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingLogs ? (
                <div className="py-8 flex flex-col justify-center items-center">
                  <Loader className="animate-spin text-primary mb-2" size={20} />
                  <span className="text-slate-400 text-xs font-bold">Đang tải lịch sử...</span>
                </div>
              ) : censorshipLogs.length > 0 ? (
                <div className="space-y-4 relative border-l-2 border-slate-100 pl-4 ml-2.5">
                  {censorshipLogs.map((log) => (
                    <div key={log.logID} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        log.action === "HIDE" ? "bg-red-500" : "bg-emerald-500"
                      }`} />
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                        <span className={log.action === "HIDE" ? "text-red-500" : "text-emerald-500"}>
                          {log.action === "HIDE" ? "ẨN ĐÁNH GIÁ" : "HIỂN THỊ LẠI"}
                        </span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString("vi-VN")}</span>
                      </div>

                      <div className="text-xs font-semibold text-slate-700">
                        Thực hiện bởi: <strong className="font-bold">{log.actorName}</strong>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded border border-slate-150 text-xs font-medium text-slate-500 leading-relaxed">
                        Lý do: <span className="text-slate-700 font-bold">{log.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-slate-400 font-bold text-xs">Không tìm thấy bản ghi lịch sử kiểm duyệt nào cho đánh giá này.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

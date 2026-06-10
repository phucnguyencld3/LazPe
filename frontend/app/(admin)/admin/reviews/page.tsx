"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/lib/toast";
import {
  searchReviews,
  censorReview,
  getReviewCensorshipLogs,
  getReviewAdminStats,
  getReviewLoyaltySettings,
  updateReviewLoyaltySettings,
  getReviewSensitiveKeywords,
  createReviewSensitiveKeyword,
  updateReviewSensitiveKeyword,
  deleteReviewSensitiveKeyword,
  importReviewSensitiveKeywords,
  getModerationDashboard,
  downloadSampleKeywordsExcel,
  ReviewItem,
  ReviewCensorshipLog,
  ReviewSensitiveKeyword,
  ModerationDashboard
} from "@/lib/api";
import {
  Loader, Search, Star, ShieldAlert, CheckCircle, Eye, EyeOff,
  Settings, BarChart3, ListFilter, Calendar, Clock, AlertTriangle, Play, X, Award, Plus, Trash2, Edit2, Upload, AlertOctagon, Flag, User, Box,
  ChevronDown, ChevronUp
} from "lucide-react";
import { Pagination } from "@/components/admin/shared/Pagination";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import TextArea from "@/components/admin/ui/TextArea";
import Badge from "@/components/admin/ui/Badge";
import Modal from "@/components/admin/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";
import { Card, StatsCard } from "@/components/admin/ui/Card";

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<"moderation" | "approved" | "rejected" | "settings" | "analytics" | "keywords">("moderation");

  // Moderation state
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

  // Moderation Action modals
  const [selectedReviewForCensorship, setSelectedReviewForCensorship] = useState<ReviewItem | null>(null);
  const [censorshipAction, setCensorshipAction] = useState<"HIDE" | "RESTORE">("HIDE");
  const [censorshipReason, setCensorshipReason] = useState("");
  const [selectedPresetReason, setSelectedPresetReason] = useState("SPAM");
  const presetReasons = [
    { value: "SPAM", label: "Chứa quảng cáo, liên kết rác, spam" },
    { value: "ABUSE", label: "Chứa từ ngữ thô tục, xúc phạm người khác" },
    { value: "UNRELATED", label: "Nội dung không liên quan đến sản phẩm" },
    { value: "FAKE", label: "Đánh giá giả mạo hoặc sai sự thật" },
    { value: "CUSTOM", label: "Lý do tùy chỉnh..." }
  ];
  const [submittingCensorship, setSubmittingCensorship] = useState(false);

  const [selectedReviewForLogs, setSelectedReviewForLogs] = useState<ReviewItem | null>(null);
  const [censorshipLogs, setCensorshipLogs] = useState<ReviewCensorshipLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Keywords state
  const [keywords, setKeywords] = useState<ReviewSensitiveKeyword[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<ReviewSensitiveKeyword | null>(null);
  
  // Keyword form fields
  const [keywordWord, setKeywordWord] = useState("");
  const [keywordSeverity, setKeywordSeverity] = useState("Warning");
  const [keywordCategory, setKeywordCategory] = useState("Abuse");
  const [submittingKeyword, setSubmittingKeyword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Moderation dashboard state
  const [modDashboard, setModDashboard] = useState<ModerationDashboard | null>(null);
  const [loadingModDashboard, setLoadingModDashboard] = useState(false);

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
        let filteredReviews: ReviewItem[] = [];
        if (activeTab === "moderation") {
          filteredReviews = (result.reviews || []).filter(
            (r) => 
              (r.violationScore && r.violationScore > 0) &&
              r.autoModerationStatus !== "Approved" &&
              r.autoModerationStatus !== "Rejected" &&
              (!r.isHidden || !r.censorshipReason) &&
              !(r.autoModerationStatus === "AutoHidden" && !r.isHidden)
          );
        } else if (activeTab === "approved") {
          filteredReviews = (result.reviews || []).filter(
            (r) => 
              (r.violationScore && r.violationScore > 0) &&
              (r.autoModerationStatus === "Approved" || (r.autoModerationStatus === "AutoHidden" && !r.isHidden))
          );
        } else if (activeTab === "rejected") {
          filteredReviews = (result.reviews || []).filter(
            (r) => 
              (r.violationScore && r.violationScore > 0) &&
              (r.autoModerationStatus === "Rejected" || (r.isHidden && (r.autoModerationStatus !== "Approved" || r.censorshipReason)))
          );
        }
        setReviews(filteredReviews);
        setTotalCount(filteredReviews.length);
        setTotalPages(Math.ceil(filteredReviews.length / 10) || 1);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách kiểm duyệt đánh giá.");
    } finally {
      setLoadingReviews(false);
    }
  }, [page, searchTerm, ratingFilter, statusFilter, mediaFilter, sortBy, sortOrder, activeTab]);

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

  const fetchKeywords = useCallback(async () => {
    setLoadingKeywords(true);
    try {
      const result = await getReviewSensitiveKeywords();
      if (result) {
        setKeywords(result);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách từ khóa.");
    } finally {
      setLoadingKeywords(false);
    }
  }, []);

  const fetchModDashboard = useCallback(async () => {
    setLoadingModDashboard(true);
    try {
      const result = await getModerationDashboard();
      if (result) {
        setModDashboard(result);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải số liệu dashboard kiểm duyệt.");
    } finally {
      setLoadingModDashboard(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "moderation" || activeTab === "approved" || activeTab === "rejected") {
      fetchReviewsQueue();
    } else if (activeTab === "settings") {
      fetchSettings();
    } else if (activeTab === "analytics") {
      fetchStats();
      fetchModDashboard();
    } else if (activeTab === "keywords") {
      fetchKeywords();
    }
  }, [activeTab, fetchReviewsQueue, fetchSettings, fetchStats, fetchKeywords, fetchModDashboard]);

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
        fetchStats();
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
            className={`${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
              }`}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="w-full pb-20">
      {/* Title Header Section */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold">Kiểm duyệt đánh giá</h1>
            <p className="font-body-md text-body-md text-on-surface-variant/70">Quản lý, phản hồi và thiết lập quy tắc thưởng Loyalty cho module đánh giá sản phẩm</p>
          </div>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Reviews */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">rate_review</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tổng số đánh giá</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats?.totalReviews ?? "..."}</h3>
          </div>
        </div>

        {/* Visible Reviews */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Đánh giá hiển thị</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats?.visibleReviews ?? "..."}</h3>
          </div>
        </div>

        {/* Hidden Reviews */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">visibility_off</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Đánh giá bị ẩn</p>
            <h3 className="text-3xl font-bold text-error mt-1">{stats?.hiddenReviews ?? "..."}</h3>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Điểm trung bình</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">
              {stats?.averageRating ? `${stats.averageRating} / 5` : "..."}
            </h3>
          </div>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex border-b border-outline-variant/30 w-full gap-4 overflow-x-auto scrollbar-none mb-6">
        <button
          onClick={() => setActiveTab("moderation")}
          className={`px-6 py-4 text-sm md:text-base font-bold flex items-center gap-2 border-b-[3px] transition-all shrink-0 cursor-pointer ${
            activeTab === "moderation"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-primary"
          }`}
        >
          <ListFilter size={18} />
          <span>Bị gắn cờ vi phạm {activeTab === "moderation" ? `(${reviews.length})` : ""}</span>
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-6 py-4 text-sm md:text-base font-bold flex items-center gap-2 border-b-[3px] transition-all shrink-0 cursor-pointer ${
            activeTab === "approved"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-primary"
          }`}
        >
          <CheckCircle size={18} />
          <span>Đã được duyệt {activeTab === "approved" ? `(${reviews.length})` : ""}</span>
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-6 py-4 text-sm md:text-base font-bold flex items-center gap-2 border-b-[3px] transition-all shrink-0 cursor-pointer ${
            activeTab === "rejected"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-primary"
          }`}
        >
          <EyeOff size={18} />
          <span>Không được duyệt {activeTab === "rejected" ? `(${reviews.length})` : ""}</span>
        </button>
        <button
          onClick={() => setActiveTab("keywords")}
          className={`px-6 py-4 text-sm md:text-base font-bold flex items-center gap-2 border-b-[3px] transition-all shrink-0 cursor-pointer ${
            activeTab === "keywords"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-primary"
          }`}
        >
          <ShieldAlert size={18} />
          <span>Từ khóa vi phạm ({keywords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-4 text-sm md:text-base font-bold flex items-center gap-2 border-b-[3px] transition-all shrink-0 cursor-pointer ${
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-primary"
          }`}
        >
          <Settings size={18} />
          <span>Cấu hình thưởng</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-6 py-4 text-sm md:text-base font-bold flex items-center gap-2 border-b-[3px] transition-all shrink-0 cursor-pointer ${
            activeTab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-primary"
          }`}
        >
          <BarChart3 size={18} />
          <span>Thống kê & Báo cáo</span>
        </button>
      </div>

      {/* Moderation Queue Tab */}
      {(activeTab === "moderation" || activeTab === "approved" || activeTab === "rejected") && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
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
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
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
                              <span className="text-[10px] text-slate-400 font-semibold">{new Date(r.createdAt).toLocaleString("vi-VN")}</span>
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
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm border ${
                                  r.autoModerationStatus === "AutoHidden" 
                                    ? "bg-rose-50 text-rose-600 border-rose-100" 
                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                }`}>
                                  <span className="material-symbols-outlined text-[11px]">security_update_warning</span>
                                  {r.autoModerationStatus === "AutoHidden" ? "Tự động ẩn" : "Cần xem xét"} (Điểm vi phạm: {r.violationScore})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right portion: Collapse / Expand toggle button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setExpandedReviews(prev => ({
                                ...prev,
                                [r.reviewID]: !prev[r.reviewID]
                              }));
                            }}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 transition-all cursor-pointer"
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
                                      <span className="text-[7px] font-bold absolute bottom-1.5 tracking-wider">VIDEO</span>
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
                              <span>Lý do ẩn: <strong className="font-extrabold">{r.censorshipReason}</strong></span>
                            </div>
                          )}

                          {/* Flagged warning */}
                          {r.flaggedReason && (
                            <div className="bg-amber-50/50 border border-amber-250/20 rounded-2xl p-4 text-xs font-semibold text-amber-705 flex gap-2 items-center">
                              <span className="material-symbols-outlined text-amber-600 text-[18px]">gavel</span>
                              <span>Hệ thống phát hiện nghi vấn: <strong className="font-extrabold text-amber-900">{r.flaggedReason}</strong></span>
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
                                    setCensorshipReason("");
                                  }}
                                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                  title="Duyệt hiển thị"
                                >
                                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                  Duyệt hiển thị (Restore)
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReviewForCensorship(r);
                                    setCensorshipAction("HIDE");
                                    setSelectedPresetReason("SPAM");
                                    setCensorshipReason(presetReasons[0].label);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                  title="Không duyệt"
                                >
                                  <span className="material-symbols-outlined text-[18px]">cancel</span>
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
                                  setSelectedPresetReason("SPAM");
                                  setCensorshipReason("Chứa quảng cáo, liên kết rác, spam");
                                }}
                                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Không duyệt"
                              >
                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                                Không duyệt (Reject)
                              </button>
                            )}

                            {/* If in rejected tab (Không được duyệt), show Restore button to approve/restore it */}
                            {activeTab === "rejected" && (
                              <button
                                onClick={() => {
                                  setSelectedReviewForCensorship(r);
                                  setCensorshipAction("RESTORE");
                                  setCensorshipReason("");
                                }}
                                className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Duyệt hiển thị"
                              >
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                Duyệt hiển thị (Restore)
                              </button>
                            )}

                            <button
                              onClick={() => handleViewLogs(r)}
                              className="px-4 py-2 rounded-xl bg-primary-container/20 text-primary hover:bg-primary-container/30 border border-primary/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Lịch sử kiểm duyệt"
                            >
                              <span className="material-symbols-outlined text-[18px]">history</span>
                              Lịch sử kiểm duyệt (Logs)
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
        </div>
      )}

      {/* Loyalty & Policies Configuration Tab */}
      {activeTab === "settings" && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 max-w-3xl">
          {loadingSettings ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <Loader className="animate-spin text-primary mb-2" size={24} />
              <span className="text-slate-400 font-bold text-xs">Đang tải cấu hình...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Reward Point Enable Toggle */}
              <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
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
                  <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thưởng đánh giá cơ bản (chỉ có chữ)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.reviewRewardPoints}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewRewardPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">điểm</span>
                  </div>
                </div>

                {/* Review with Image Points */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thưởng đánh giá có kèm HÌNH ẢNH</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.reviewWithImageRewardPoints}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithImageRewardPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">điểm</span>
                  </div>
                </div>

                {/* Review with Video Points */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thưởng đánh giá có kèm VIDEO</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.reviewWithVideoRewardPoints}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithVideoRewardPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">điểm</span>
                  </div>
                </div>

                {/* Minimum Character count */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Số ký tự tối thiểu để nhận quà</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.minimumReviewChars}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, minimumReviewChars: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">ký tự</span>
                  </div>
                </div>

                {/* Required Rating stars */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Số sao tối thiểu để nhận quà</label>
                  <select
                    value={loyaltySettings.requiredRatingForReward}
                    onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requiredRatingForReward: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
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
                  <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thời gian tối đa để chỉnh sửa đánh giá</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.allowEditReviewTimeLimitMinutes}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, allowEditReviewTimeLimitMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">phút</span>
                  </div>
                </div>

                {/* Max Review days limit after order receipt */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Số ngày tối đa để đánh giá sau khi mua</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={loyaltySettings.maxReviewDaysAfterReceipt}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, maxReviewDaysAfterReceipt: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">ngày</span>
                  </div>
                </div>

                {/* Require Delivery Verification */}
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 select-none cursor-pointer border border-slate-200 p-3.5 rounded-2xl bg-white hover:bg-slate-50 transition-colors">
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
                className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-full font-bold text-sm hover:scale-[1.01] active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-6 cursor-pointer"
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
        <div className="space-y-8">
          {/* Moderation Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <AlertOctagon size={24} />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cần xem xét (Warning)</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{modDashboard?.totalNeedsReview ?? 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <EyeOff size={24} />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tự động ẩn (Medium)</p>
                <h3 className="text-3xl font-bold text-rose-600 mt-1">{modDashboard?.totalAutoHidden ?? 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600">
                  <Flag size={24} />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Bị cảnh báo (Tổng số)</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{modDashboard?.totalFlagged ?? 0}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Star Rating distribution */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 text-sm md:text-base mb-6 flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                Phân bố điểm đánh giá (Sao)
              </h3>
              {loadingStats ? (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.ratingDistribution?.[star] || 0;
                    const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                    return (
                      <div key={star} className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                        <span className="w-10 text-right">{star} sao</span>
                        <div className="flex-1 h-3 bg-slate-50 border border-slate-100/50 rounded-full overflow-hidden">
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
              ) : (
                <p className="text-center text-slate-400 font-bold text-xs py-10">Không có dữ liệu</p>
              )}
            </div>

            {/* Top flagged keywords */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 text-sm md:text-base mb-6 flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-500" />
                Top từ khóa vi phạm nhiều nhất
              </h3>
              {loadingModDashboard ? (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : modDashboard && modDashboard.topKeywords && modDashboard.topKeywords.length > 0 ? (
                <div className="space-y-4">
                  {modDashboard.topKeywords.map((kw, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold text-slate-600 p-3 bg-slate-50/55 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        <span className="font-extrabold text-slate-700">{kw.keyword}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold">
                        {kw.count} lượt
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 font-bold text-xs py-10">Không có dữ liệu vi phạm</p>
              )}
            </div>

            {/* Top flagged products */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 text-sm md:text-base mb-6 flex items-center gap-2">
                <Box size={18} className="text-primary" />
                Sản phẩm có nhiều cảnh báo vi phạm
              </h3>
              {loadingModDashboard ? (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : modDashboard && modDashboard.topProducts && modDashboard.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {modDashboard.topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold text-slate-600 p-3 bg-slate-50/55 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 truncate max-w-[70%]">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                        <span className="font-extrabold text-slate-700 truncate">{p.productName}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold shrink-0">
                        {p.count} đánh giá
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 font-bold text-xs py-10">Không có sản phẩm vi phạm</p>
              )}
            </div>

            {/* Top flagged users */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 text-sm md:text-base mb-6 flex items-center gap-2">
                <User size={18} className="text-secondary" />
                Người dùng có nhiều đánh giá vi phạm
              </h3>
              {loadingModDashboard ? (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : modDashboard && modDashboard.topUsers && modDashboard.topUsers.length > 0 ? (
                <div className="space-y-4">
                  {modDashboard.topUsers.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold text-slate-600 p-3 bg-slate-50/55 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                        <span className="font-extrabold text-slate-700 truncate">{u.userFullName}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-error-container/20 text-error text-[10px] font-bold shrink-0">
                        {u.count} lần
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 font-bold text-xs py-10">Không có người dùng vi phạm</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sensitive Keywords Management Tab */}
      {activeTab === "keywords" && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          {/* Header Action Bar */}
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            {/* Search keyword */}
            <div className="flex-1 min-w-[260px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Tìm từ khóa vi phạm..."
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".xlsx"
                ref={fileInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const res = await importReviewSensitiveKeywords(file);
                    if (res.success) {
                      toast.success(res.message);
                      fetchKeywords();
                    } else {
                      toast.error(res.message);
                    }
                  } catch (err) {
                    toast.error("Lỗi khi import file Excel.");
                  } finally {
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
                className="hidden"
              />
              <button
                onClick={async () => {
                  try {
                    const blob = await downloadSampleKeywordsExcel();
                    if (!blob) {
                      toast.error("Không thể tải file mẫu.");
                      return;
                    }
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", "TuKhoaMau.xlsx");
                    document.body.appendChild(link);
                    link.click();
                    link.removeAttribute("download");
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    toast.error("Có lỗi xảy ra khi tải file mẫu.");
                  }
                }}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-650 bg-slate-50/50 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Tải file mẫu
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Upload size={14} />
                Import Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  setKeywordWord("");
                  setKeywordSeverity("Warning");
                  setKeywordCategory("Abuse");
                  setEditingKeyword(null);
                  setShowAddKeywordModal(true);
                }}
                className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary/95 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <Plus size={14} />
                Thêm từ khóa
              </button>
            </div>
          </div>

          {/* Keywords Table List */}
          {loadingKeywords ? (
            <div className="p-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-400 mt-4 font-semibold text-sm">Đang tải danh sách từ khóa...</p>
            </div>
          ) : keywords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Từ khóa</th>
                    <th className="py-4 px-6">Mức độ</th>
                    <th className="py-4 px-6">Phân loại</th>
                    <th className="py-4 px-6">Ngày tạo</th>
                    <th className="py-4 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600 font-semibold">
                  {keywords
                    .filter((k) => k.word.toLowerCase().includes(keywordSearch.toLowerCase()))
                    .map((k) => (
                      <tr key={k.keywordID} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-slate-400">#{k.keywordID}</td>
                        <td className="py-4 px-6 font-extrabold text-slate-800">{k.word}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            k.severity === "Critical"
                              ? "bg-rose-50 text-rose-600 border-rose-100"
                              : k.severity === "Medium"
                              ? "bg-orange-50 text-orange-600 border-orange-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}>
                            {k.severity}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-650 text-xs font-bold">
                            {k.category === "Abuse" && "Xúc phạm"}
                            {k.category === "Vulgarity" && "Tục tĩu"}
                            {k.category === "Spam" && "Spam quảng cáo"}
                            {k.category === "Phone" && "Số điện thoại"}
                            {k.category === "Link" && "Link liên kết"}
                            {k.category === "Scam" && "Lừa đảo"}
                            {k.category === "Violations" && "Vi phạm nguyên tắc"}
                            {!["Abuse", "Vulgarity", "Spam", "Phone", "Link", "Scam", "Violations"].includes(k.category) && k.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400">{new Date(k.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="py-4 px-6 text-right flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingKeyword(k);
                              setKeywordWord(k.word);
                              setKeywordSeverity(k.severity);
                              setKeywordCategory(k.category);
                              setShowAddKeywordModal(true);
                            }}
                            className="w-9 h-9 rounded-full hover:bg-primary-container/20 text-primary flex items-center justify-center transition-colors cursor-pointer"
                            title="Sửa từ khóa"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Bạn có chắc chắn muốn xóa từ khóa "${k.word}"?`)) return;
                              try {
                                const res = await deleteReviewSensitiveKeyword(k.keywordID);
                                if (res.success) {
                                  toast.success(res.message);
                                  fetchKeywords();
                                } else {
                                  toast.error(res.message);
                                }
                              } catch (err) {
                                  toast.error("Có lỗi xảy ra khi xóa.");
                              }
                            }}
                            className="w-9 h-9 rounded-full hover:bg-error-container/20 text-error flex items-center justify-center transition-colors cursor-pointer"
                            title="Xóa từ khóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center">
              <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">vpn_key</span>
              <p className="text-slate-400 font-bold text-sm">Chưa cấu hình từ khóa vi phạm nào.</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Keyword Modal */}
      <Modal
        isOpen={showAddKeywordModal}
        onClose={() => setShowAddKeywordModal(false)}
        showCloseButton={false}
        className="max-w-[450px] !p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">key</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {editingKeyword ? "Cập nhật từ khóa" : "Thêm từ khóa vi phạm"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddKeywordModal(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!keywordWord.trim()) {
            toast.error("Vui lòng nhập từ khóa.");
            return;
          }
          setSubmittingKeyword(true);
          try {
            let res;
            if (editingKeyword) {
              res = await updateReviewSensitiveKeyword(editingKeyword.keywordID, {
                word: keywordWord.trim(),
                severity: keywordSeverity,
                category: keywordCategory
              });
            } else {
              res = await createReviewSensitiveKeyword({
                word: keywordWord.trim(),
                severity: keywordSeverity,
                category: keywordCategory
              });
            }

            if (res.success) {
              toast.success(res.message);
              setShowAddKeywordModal(false);
              fetchKeywords();
            } else {
              toast.error(res.message);
            }
          } catch (err) {
            toast.error("Lỗi kết nối.");
          } finally {
            setSubmittingKeyword(false);
          }
        }}>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 block dark:text-gray-300">Từ khóa vi phạm</label>
              <Input
                type="text"
                value={keywordWord}
                onChange={(e) => setKeywordWord(e.target.value)}
                placeholder="Ví dụ: lừa đảo, cùi bắp, shop ngu..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 block dark:text-gray-300">Mức độ vi phạm</label>
              <Input
                options={[
                  { value: "Warning", label: "⚠️ Warning (Nhẹ - gắn cờ cần xem xét)" },
                  { value: "Medium", label: "🚫 Medium (Trung bình - tạm ẩn)" },
                  { value: "Critical", label: "❌ Critical (Nghiêm trọng - từ chối ngay)" }
                ]}
                value={keywordSeverity}
                onChange={(e) => setKeywordSeverity(e.target.value)}
                className="cursor-pointer font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 block dark:text-gray-300">Phân loại danh mục</label>
              <Input
                options={[
                  { value: "Abuse", label: "Abuse (Xúc phạm)" },
                  { value: "Vulgarity", label: "Vulgarity (Từ ngữ tục tĩu)" },
                  { value: "Spam", label: "Spam (Spam quảng cáo)" },
                  { value: "Phone", label: "Phone (Số điện thoại)" },
                  { value: "Link", label: "Link (Website, Zalo, Telegram...)" },
                  { value: "Scam", label: "Scam (Nội dung lừa đảo)" },
                  { value: "Violations", label: "Violations (Vi phạm nguyên tắc cộng đồng)" }
                ]}
                value={keywordCategory}
                onChange={(e) => setKeywordCategory(e.target.value)}
                className="cursor-pointer font-bold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                onClick={() => setShowAddKeywordModal(false)}
                variant="outline"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submittingKeyword}
                isLoading={submittingKeyword}
                variant="primary"
              >
                Xác nhận lưu
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Lightbox Media Modal */}
      <Modal
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        showCloseButton={false}
        className="max-w-3xl !bg-slate-900 !border-none !p-0 overflow-hidden"
      >
        <div className="relative max-h-[85vh] flex flex-col justify-center items-center">
          <button
            type="button"
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 z-10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <div className="w-full flex justify-center items-center p-6 min-h-[300px]">
            {lightboxMedia?.mediaType === "VIDEO" ? (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[70vh] rounded-2xl shadow-inner"
              />
            ) : (
              lightboxMedia && (
                <img
                  src={lightboxMedia.url}
                  alt="Full preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-2xl"
                />
              )
            )}
          </div>
        </div>
      </Modal>

      {/* Moderation Censorship Input Modal */}
      {selectedReviewForCensorship && (
        <Modal
          isOpen={!!selectedReviewForCensorship}
          onClose={() => setSelectedReviewForCensorship(null)}
          showCloseButton={false}
          className="max-w-[520px] !p-0 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${censorshipAction === "HIDE" ? "bg-rose-100 text-error" : "bg-emerald-100 text-secondary"}`}>
                <span className="material-symbols-outlined text-[24px]">
                  {censorshipAction === "HIDE" ? "visibility_off" : "check_circle"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {censorshipAction === "HIDE" ? "Không duyệt đánh giá" : "Duyệt hiển thị đánh giá"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedReviewForCensorship(null)}
              className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-slate-400 text-[24px]">close</span>
            </button>
          </div>

          {/* Body & Form */}
          <form onSubmit={handleCensorshipSubmit}>
            <div className="p-6 space-y-5">
              <p className="text-slate-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                {censorshipAction === "HIDE"
                  ? "Đánh giá bị không duyệt (ẩn) sẽ không xuất hiện trên trang sản phẩm. Điểm thưởng Loyalty liên quan sẽ không được cộng hoặc bị thu hồi."
                  : "Duyệt hiển thị lại bài đánh giá trên trang chi tiết sản phẩm cho mọi khách hàng."}
              </p>

              {censorshipAction === "HIDE" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-gray-300 block">Lý do ẩn có sẵn</label>
                    <Input
                      options={presetReasons}
                      value={selectedPresetReason}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPresetReason(val);
                        if (val !== "CUSTOM") {
                          const found = presetReasons.find(p => p.value === val);
                          if (found) setCensorshipReason(found.label);
                        } else {
                          setCensorshipReason("");
                        }
                      }}
                      className="cursor-pointer font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-gray-300 block">Nội dung lý do chi tiết</label>
                    <TextArea
                      rows={3}
                      value={censorshipReason}
                      onChange={(e) => setCensorshipReason(e.target.value)}
                      disabled={selectedPresetReason !== "CUSTOM"}
                      placeholder="Ví dụ: Đánh giá chứa nội dung thô tục, spam link bán hàng khác hoặc không có nội dung trải nghiệm thực tế..."
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setSelectedReviewForCensorship(null)}
                  variant="outline"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCensorship}
                  isLoading={submittingCensorship}
                  variant={censorshipAction === "HIDE" ? "danger" : "success"}
                  startIcon={
                    <span className="material-symbols-outlined text-[18px]">
                      {censorshipAction === "HIDE" ? "visibility_off" : "check_circle"}
                    </span>
                  }
                >
                  Xác nhận thực hiện
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Censorship Logs View Modal */}
      {selectedReviewForLogs && (
        <Modal
          isOpen={!!selectedReviewForLogs}
          onClose={() => setSelectedReviewForLogs(null)}
          showCloseButton={false}
          className="max-w-[500px] !p-0 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">history</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Lịch sử kiểm duyệt đánh giá #{selectedReviewForLogs.reviewID}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedReviewForLogs(null)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
            {loadingLogs ? (
              <div className="py-8 flex flex-col justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                <span className="text-slate-400 text-xs font-bold mt-2">Đang tải lịch sử...</span>
              </div>
            ) : censorshipLogs.length > 0 ? (
              <div className="space-y-4 relative border-l-2 border-slate-100 dark:border-slate-800 pl-4 ml-2.5">
                {censorshipLogs.map((log) => (
                  <div key={log.logID} className="relative space-y-1">
                    {/* Timeline dot */}
                    <span className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${log.action === "HIDE" ? "bg-red-500" : "bg-emerald-500"}`} />

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                      <span className={log.action === "HIDE" ? "text-red-500" : "text-emerald-500"}>
                        {log.action === "HIDE" ? "ẨN ĐÁNH GIÁ" : "HIỂN THỊ LẠI"}
                      </span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleString("vi-VN")}</span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                      Thực hiện bởi: <strong className="font-bold">{log.actorName}</strong>
                    </div>

                    <div className="bg-slate-50 dark:bg-gray-800 p-2.5 rounded border border-slate-150 dark:border-slate-700 text-xs font-medium text-slate-500 leading-relaxed">
                      Lý do: <span className="text-slate-700 dark:text-gray-300 font-bold">{log.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-slate-400 font-bold text-xs">Không tìm thấy bản ghi lịch sử kiểm duyệt nào cho đánh giá này.</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              onClick={() => setSelectedReviewForLogs(null)}
              variant="outline"
            >
              Đóng lại
            </Button>
          </div>
        </Modal>
      )}

    </main>
  );
}

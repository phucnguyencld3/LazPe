"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ListFilter,
  CheckCircle,
  EyeOff,
  ShieldAlert,
  Settings,
  BarChart3,
} from "lucide-react";
import { getReviewAdminStats, getReviewSensitiveKeywords, ReviewSensitiveKeyword } from "@/lib/api";
import { toast } from "@/lib/toast";

// Import Modular Tabs
import { ModerationTab } from "@/components/admin/reviews/ModerationTab";
import { KeywordsTab } from "@/components/admin/reviews/KeywordsTab";
import { SettingsTab } from "@/components/admin/reviews/SettingsTab";
import { AnalyticsTab } from "@/components/admin/reviews/AnalyticsTab";

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<"moderation" | "approved" | "rejected" | "settings" | "analytics" | "keywords">("moderation");
  
  // Stats bento grid
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Active reviews list count
  const [reviewsCount, setReviewsCount] = useState(0);

  // Keywords list (for tab header count)
  const [keywords, setKeywords] = useState<ReviewSensitiveKeyword[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

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

  useEffect(() => {
    fetchStats();
    fetchKeywords();
  }, [fetchStats, fetchKeywords]);

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      {/* Title Header Section */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold">Kiểm duyệt đánh giá</h1>
            <p className="font-body-md text-body-md text-on-surface-variant/70">
              Quản lý, phản hồi và thiết lập quy tắc thưởng Loyalty cho module đánh giá sản phẩm
            </p>
          </div>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Reviews */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">rate_review</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng đánh giá</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{stats?.totalReviews ?? "..."}</span>
        </div>

        {/* Visible Reviews */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đánh giá hiển thị</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{stats?.visibleReviews ?? "..."}</span>
        </div>

        {/* Hidden Reviews */}
        <div className={`px-5 py-4 rounded-2xl shadow-sm border flex items-center justify-between hover:shadow-md transition-all duration-300 ${
          (stats?.hiddenReviews ?? 0) > 0 
            ? 'bg-rose-50/50 border-rose-100' 
            : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              (stats?.hiddenReviews ?? 0) > 0 
                ? 'bg-rose-100 text-error' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              <span className="material-symbols-outlined text-[20px]">visibility_off</span>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${(stats?.hiddenReviews ?? 0) > 0 ? 'text-rose-950/60' : 'text-slate-500'}`}>
              Đánh giá bị ẩn
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(stats?.hiddenReviews ?? 0) > 0 && (
              <span className="px-2 py-0.5 bg-error text-white text-[9px] font-bold rounded-full">
                Lưu ý
              </span>
            )}
            <span className={`text-2xl font-extrabold ${(stats?.hiddenReviews ?? 0) > 0 ? 'text-error' : 'text-slate-800'}`}>
              {stats?.hiddenReviews ?? "..."}
            </span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Điểm trung bình</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">
            {stats?.averageRating ? `${stats.averageRating} / 5` : "..."}
          </span>
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
          <span>Bị gắn cờ vi phạm {activeTab === "moderation" ? `(${reviewsCount})` : ""}</span>
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
          <span>Đã được duyệt {activeTab === "approved" ? `(${reviewsCount})` : ""}</span>
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
          <span>Không được duyệt {activeTab === "rejected" ? `(${reviewsCount})` : ""}</span>
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

      {/* Tab Contents */}
      {(activeTab === "moderation" || activeTab === "approved" || activeTab === "rejected") && (
        <ModerationTab
          activeTab={activeTab}
          onReviewsCountChange={setReviewsCount}
          onReviewActionSuccess={fetchStats}
        />
      )}

      {activeTab === "keywords" && (
        <KeywordsTab
          keywords={keywords}
          loading={loadingKeywords}
          onRefresh={fetchKeywords}
        />
      )}

      {activeTab === "settings" && <SettingsTab />}

      {activeTab === "analytics" && <AnalyticsTab />}
    </main>
  );
}

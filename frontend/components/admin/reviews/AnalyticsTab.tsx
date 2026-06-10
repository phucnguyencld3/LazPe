"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertOctagon, EyeOff, Flag, BarChart3, AlertTriangle, Box, User } from "lucide-react";
import { getReviewAdminStats, getModerationDashboard, ModerationDashboard } from "@/lib/api";
import { toast } from "@/lib/toast";

export const AnalyticsTab: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [modDashboard, setModDashboard] = useState<ModerationDashboard | null>(null);
  const [loadingModDashboard, setLoadingModDashboard] = useState(true);

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
    fetchModDashboard();
  }, [fetchStats, fetchModDashboard]);

  if (loadingStats && loadingModDashboard) {
    return (
      <div className="flex flex-col justify-center items-center py-20 bg-white rounded-[2rem] border border-slate-100 min-h-[300px]">
        <Loader2 className="animate-spin text-primary mb-2" size={32} />
        <span className="text-slate-400 font-bold text-xs">Đang tải báo cáo thống kê...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
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
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-605">
              <EyeOff size={24} className="text-rose-600" />
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
              <Loader2 className="animate-spin text-primary mx-auto" size={24} />
            </div>
          ) : stats ? (
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.ratingDistribution?.[star] || 0;
                const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-3 text-xs font-semibold text-slate-650">
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
              <Loader2 className="animate-spin text-primary mx-auto" size={24} />
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
              <Loader2 className="animate-spin text-primary mx-auto" size={24} />
            </div>
          ) : modDashboard && modDashboard.topProducts && modDashboard.topProducts.length > 0 ? (
            <div className="space-y-4">
              {modDashboard.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold text-slate-650 p-3 bg-slate-50/55 rounded-xl border border-slate-100">
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
              <Loader2 className="animate-spin text-primary mx-auto" size={24} />
            </div>
          ) : modDashboard && modDashboard.topUsers && modDashboard.topUsers.length > 0 ? (
            <div className="space-y-4">
              {modDashboard.topUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold text-slate-650 p-3 bg-slate-50/55 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-605 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                    <span className="font-extrabold text-slate-700 truncate">{u.userFullName}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold shrink-0">
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
  );
};

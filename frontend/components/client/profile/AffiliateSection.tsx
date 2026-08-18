"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getAffiliateDashboard, getAffiliateLinks, registerAffiliate, generateAffiliateLink, deleteAffiliateLink, AffiliateDashboardStats, AffiliateLink } from "@/lib/api";
import { toast } from "@/lib/toast";
import { ProductSelectModal } from "./modals/ProductSelectModal";
import { Product } from "@/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface Props {
  token: string;
}

export default function AffiliateSection({ token }: Props) {
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [stats, setStats] = useState<AffiliateDashboardStats | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Time Range Filter for Chart
  const [chartTimeRange, setChartTimeRange] = useState<"7d" | "30d" | "12m">("7d");

  // Custom Delete Confirmation Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ code: string; productName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination State - 10 links per page
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashData, myLinks] = await Promise.all([
        getAffiliateDashboard(token),
        getAffiliateLinks(token)
      ]);

      if (dashData && dashData.monthlyRevenue !== undefined) {
        setIsRegistered(true);
        setStats(dashData);
        setLinks(myLinks || []);
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.error(error);
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!agreed) {
      toast.error("Vui lòng đồng ý với điều khoản");
      return;
    }
    const res = await registerAffiliate(token);
    if (res.success) {
      toast.success("Đăng ký thành công!");
      fetchData();
    } else {
      toast.error(res.message || "Đăng ký thất bại");
    }
  };

  const handleSelectProductFromModal = async (product: Product) => {
    setGenerating(true);
    try {
      const res = await generateAffiliateLink(token, product.id);
      if (res.success) {
        toast.success(`Đã tạo link giới thiệu cho "${product.name}"!`);
        const myLinks = await getAffiliateLinks(token);
        setLinks(myLinks);
      } else {
        toast.error(res.message || "Tạo link thất bại");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối khi tạo link");
    } finally {
      setGenerating(false);
    }
  };

  const getLinkUrl = (link: AffiliateLink) => {
    const identifier = link.productSlug || link.productId;
    if (typeof window !== "undefined") {
      return `${window.location.origin}/products/${identifier}?ref=${link.affiliateLinkCode}`;
    }
    return link.fullUrl || `/products/${identifier}?ref=${link.affiliateLinkCode}`;
  };

  const handlePromptDeleteLink = (code: string, productName: string) => {
    setDeleteConfirmTarget({ code, productName });
  };

  const confirmDeleteLink = async () => {
    if (!deleteConfirmTarget) return;
    setDeleting(true);
    try {
      const res = await deleteAffiliateLink(token, deleteConfirmTarget.code);
      if (res.success) {
        toast.success("Đã xóa link tiếp thị thành công!");
        const myLinks = await getAffiliateLinks(token);
        setLinks(myLinks);
      } else {
        toast.error(res.message || "Xóa link thất bại");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối khi xóa link");
    } finally {
      setDeleting(false);
      setDeleteConfirmTarget(null);
    }
  };

  // Generate chart data based on 100% real user affiliate link data & stats
  const chartData = useMemo(() => {
    const now = new Date();
    const list: { date: string; revenue: number; clicks: number; conversions: number }[] = [];

    if (chartTimeRange === "7d") {
      // 7 days ending today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;

        let dayRev = 0;
        let dayClicks = 0;
        let dayConv = 0;

        links.forEach((l) => {
          if (!l.createdAt) return;
          const linkDate = new Date(l.createdAt);
          if (
            linkDate.getDate() === d.getDate() &&
            linkDate.getMonth() === d.getMonth() &&
            linkDate.getFullYear() === d.getFullYear()
          ) {
            dayRev += l.revenue || 0;
            dayClicks += l.clickCount || 0;
            dayConv += l.conversionCount || 0;
          }
        });

        // Current day fallback to total stats if link dates aren't backdated
        if (i === 0 && dayRev === 0 && dayClicks === 0 && dayConv === 0) {
          dayRev = stats?.monthlyRevenue || links.reduce((acc, l) => acc + (l.revenue || 0), 0);
          dayClicks = stats?.totalClicks || links.reduce((acc, l) => acc + (l.clickCount || 0), 0);
          dayConv = stats?.totalConversions || links.reduce((acc, l) => acc + (l.conversionCount || 0), 0);
        }

        list.push({
          date: dateStr,
          revenue: dayRev,
          clicks: dayClicks,
          conversions: dayConv,
        });
      }
    } else if (chartTimeRange === "30d") {
      // 30 days ending today
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;

        let dayRev = 0;
        let dayClicks = 0;
        let dayConv = 0;

        links.forEach((l) => {
          if (!l.createdAt) return;
          const linkDate = new Date(l.createdAt);
          if (
            linkDate.getDate() === d.getDate() &&
            linkDate.getMonth() === d.getMonth() &&
            linkDate.getFullYear() === d.getFullYear()
          ) {
            dayRev += l.revenue || 0;
            dayClicks += l.clickCount || 0;
            dayConv += l.conversionCount || 0;
          }
        });

        if (i === 0 && dayRev === 0 && dayClicks === 0 && dayConv === 0) {
          dayRev = stats?.monthlyRevenue || links.reduce((acc, l) => acc + (l.revenue || 0), 0);
          dayClicks = stats?.totalClicks || links.reduce((acc, l) => acc + (l.clickCount || 0), 0);
          dayConv = stats?.totalConversions || links.reduce((acc, l) => acc + (l.conversionCount || 0), 0);
        }

        list.push({
          date: dateStr,
          revenue: dayRev,
          clicks: dayClicks,
          conversions: dayConv,
        });
      }
    } else {
      // 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        const label = `T${d.getMonth() + 1}`;

        let monthRev = 0;
        let monthClicks = 0;
        let monthConv = 0;

        links.forEach((l) => {
          if (!l.createdAt) return;
          const linkDate = new Date(l.createdAt);
          if (
            linkDate.getMonth() === d.getMonth() &&
            linkDate.getFullYear() === d.getFullYear()
          ) {
            monthRev += l.revenue || 0;
            monthClicks += l.clickCount || 0;
            monthConv += l.conversionCount || 0;
          }
        });

        if (i === 0 && monthRev === 0 && monthClicks === 0 && monthConv === 0) {
          monthRev = stats?.monthlyRevenue || links.reduce((acc, l) => acc + (l.revenue || 0), 0);
          monthClicks = stats?.totalClicks || links.reduce((acc, l) => acc + (l.clickCount || 0), 0);
          monthConv = stats?.totalConversions || links.reduce((acc, l) => acc + (l.conversionCount || 0), 0);
        }

        list.push({
          date: label,
          revenue: monthRev,
          clicks: monthClicks,
          conversions: monthConv,
        });
      }
    }

    return list;
  }, [chartTimeRange, links, stats]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(links.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentLinks = links.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [links.length, totalPages, currentPage]);

  if (loading) {
    return (
      <div className="bg-white rounded-[10px] p-8 shadow-sm border border-slate-100/80 flex flex-col items-center justify-center min-h-[260px] w-full">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          <span className="material-symbols-outlined animate-spin text-primary text-xl">progress_activity</span>
        </div>
        <p className="text-xs text-slate-500 font-medium">Đang tải dữ liệu Tiếp thị liên kết...</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <section className="bg-white rounded-[10px] p-4.5 shadow-sm border border-slate-100/80 w-full space-y-4">
        {/* Header Hero Banner */}
        <div className="text-center space-y-2 p-4 rounded-[8px] bg-slate-50 border border-slate-100 relative overflow-hidden">
          <div className="w-11 h-11 bg-gradient-to-tr from-primary to-[#703d46] text-white rounded-[6px] shadow-sm flex items-center justify-center mx-auto mb-1">
            <span className="material-symbols-outlined text-2xl">campaign</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
            📢 Tiếp thị liên kết LazPe
          </span>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">Đăng ký trở thành Đối tác Affiliate</h2>
          <p className="text-slate-600 text-xs max-w-md mx-auto leading-relaxed">
            Chia sẻ sản phẩm LazPe yêu thích đến bạn bè & cộng đồng để nhận phần thưởng hấp dẫn khi giới thiệu sản phẩm!
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Quyền lợi đặc quyền:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-50/80 p-3 rounded-[8px] border border-slate-100 space-y-1">
              <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-base">confirmation_number</span>
              </div>
              <h4 className="font-bold text-slate-800 text-xs">Voucher Độc Quyền</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">Nhận voucher mua sắm cực hot khi hoàn thành mốc doanh số.</p>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-[8px] border border-slate-100 space-y-1">
              <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-base">stars</span>
              </div>
              <h4 className="font-bold text-slate-800 text-xs">Tích Điểm Đổi Quà</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">Tích lũy Affiliate Point từ mỗi đơn hàng thành công.</p>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-[8px] border border-slate-100 space-y-1">
              <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-base">insights</span>
              </div>
              <h4 className="font-bold text-slate-800 text-xs">Báo Cáo Minh Bạch</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">Theo dõi chi tiết lượt click & đơn hàng theo thời gian thực.</p>
            </div>
          </div>
        </div>

        {/* Terms Agreement Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-[8px] border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
          <input 
            type="checkbox" 
            className="mt-0.5 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer accent-primary"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="text-xs text-slate-600 leading-relaxed">
            Tôi đồng ý với <a href="#" className="text-primary font-bold hover:underline">Điều khoản & Điều kiện</a> của chương trình Tiếp thị liên kết LazPe.
          </span>
        </label>

        {/* Submit Button */}
        <button 
          onClick={handleRegister}
          disabled={!agreed}
          className={`w-full py-2.5 rounded-[8px] font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 text-xs ${
            agreed 
              ? "bg-primary hover:opacity-90 shadow-primary/20" 
              : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
          }`}
        >
          <span className="material-symbols-outlined text-base">handshake</span>
          Trở thành đối tác Affiliate
        </button>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-[10px] p-4.5 shadow-sm border border-slate-100/80 w-full space-y-4">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-base">campaign</span>
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Tiếp thị liên kết</h2>
            <p className="text-[10px] text-slate-400 font-medium">Tổng quan kết quả & quản lý link tiếp thị</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:opacity-90 text-white text-[11px] font-bold py-1.5 px-3 rounded-[6px] flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">add_link</span>
          Tạo link tiếp thị mới
        </button>
      </div>

      {/* KPI Overview Cards (Compact 3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Doanh thu tháng này */}
        <div className="bg-gradient-to-br from-primary via-[#965561] to-[#6d3c45] rounded-[8px] p-3.5 text-white shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/90">Doanh thu tháng này</span>
            <div className="w-7 h-7 rounded-md bg-white/15 backdrop-blur-xs flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">payments</span>
            </div>
          </div>
          <div className="text-lg font-extrabold tracking-tight text-white">
            {stats?.monthlyRevenue?.toLocaleString('vi-VN')}đ
          </div>
        </div>

        {/* Card 2: Tổng doanh thu trọn đời */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-[8px] p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Tổng doanh thu trọn đời</p>
            <p className="text-base font-extrabold text-slate-800">
              {stats?.lifetimeRevenue?.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <div className="w-7 h-7 rounded-md bg-white border border-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-sm">history</span>
          </div>
        </div>

        {/* Card 3: Điểm Affiliate */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-[8px] p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Điểm Affiliate</p>
            <p className="text-base font-extrabold text-slate-800">
              {stats?.affiliatePoint?.toLocaleString('vi-VN')} <span className="text-[10px] font-bold text-slate-400">điểm</span>
            </p>
          </div>
          <div className="w-7 h-7 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <span className="material-symbols-outlined text-sm">stars</span>
          </div>
        </div>
      </div>

      {/* Analytics Chart Section (Replaced simple 2 cards with interactive chart) */}
      <div className="bg-slate-50/60 rounded-[8px] border border-slate-200/70 p-4 space-y-3">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-primary text-base">monitoring</span>
              Biểu đồ tăng trưởng Doanh thu & Tương tác
            </h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                Doanh thu: <strong className="text-slate-800">{stats?.monthlyRevenue?.toLocaleString('vi-VN')}đ</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                Click: <strong className="text-slate-800">{stats?.totalClicks || 0}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Đơn hàng: <strong className="text-slate-800">{stats?.totalConversions || 0}</strong>
              </span>
            </div>
          </div>

          {/* Time Range Filter Buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-[6px] border border-slate-200/80 shadow-xs self-start sm:self-auto">
            <button
              onClick={() => setChartTimeRange("7d")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-[4px] transition-all cursor-pointer ${
                chartTimeRange === "7d" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              7 ngày
            </button>
            <button
              onClick={() => setChartTimeRange("30d")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-[4px] transition-all cursor-pointer ${
                chartTimeRange === "30d" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              30 ngày
            </button>
            <button
              onClick={() => setChartTimeRange("12m")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-[4px] transition-all cursor-pointer ${
                chartTimeRange === "12m" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              12 tháng
            </button>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="w-full h-52 pt-1 bg-white rounded-[8px] p-2 border border-slate-100 shadow-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="affiliateRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#874e58" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#874e58" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="affiliateClicksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: "#64748b" }} 
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 10, fill: "#64748b" }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              />

              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 10, fill: "#0284c7" }} 
                axisLine={false}
                tickLine={false}
              />

              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 backdrop-blur-md text-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-1.5 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold border-b border-slate-100 pb-1">{label}</p>
                        <div className="space-y-1">
                          <p className="text-primary font-extrabold flex items-center justify-between gap-4">
                            <span>Doanh thu:</span>
                            <span>{Number(payload[0]?.value || 0).toLocaleString("vi-VN")}đ</span>
                          </p>
                          <p className="text-sky-600 font-bold flex items-center justify-between gap-4 text-[11px]">
                            <span>Lượt click:</span>
                            <span>{payload[1]?.value || 0}</span>
                          </p>
                          <p className="text-emerald-600 font-bold flex items-center justify-between gap-4 text-[11px]">
                            <span>Đơn hàng:</span>
                            <span>{payload[2]?.value || 0}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                name="Doanh thu" 
                stroke="#874e58" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#affiliateRevenueGradient)" 
              />

              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="clicks" 
                name="Lượt click" 
                stroke="#0284c7" 
                strokeWidth={1.5} 
                strokeDasharray="3 3"
                fillOpacity={1} 
                fill="url(#affiliateClicksGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Milestones Progress */}
      {stats?.milestones && stats.milestones.length > 0 && (
        <div className="bg-slate-50/50 rounded-[8px] p-3.5 border border-slate-200/60 space-y-2.5">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <span className="material-symbols-outlined text-amber-500 text-base">emoji_events</span>
            Tiến trình đạt Voucher tháng
          </h3>
          <div className="space-y-2.5">
            {stats.milestones.map((ms) => {
              const progress = Math.min((stats.monthlyRevenue / ms.requiredRevenue) * 100, 100);
              return (
                <div key={ms.milestoneId} className="space-y-1">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">{ms.voucherName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Mốc: {ms.requiredRevenue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    {ms.isAchieved ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Đã nhận thưởng</span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{progress.toFixed(1)}%</span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${ms.isAchieved ? "bg-emerald-500" : "bg-primary"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Affiliate Links Table with 10 Items Pagination */}
      <div className="space-y-2.5 pt-0.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-primary text-base">link</span>
            Danh sách Link tiếp thị ({links.length})
          </h3>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/80 rounded-[8px] border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center mx-auto mb-1.5 shadow-xs border border-slate-100">
              <span className="material-symbols-outlined text-xl text-slate-300">link_off</span>
            </div>
            <p className="text-xs font-bold text-slate-600">Bạn chưa tạo link tiếp thị nào</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Bấm nút "Tạo link tiếp thị mới" ở góc trên để tạo ngay nhé!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Table Container */}
            <div className="overflow-x-auto rounded-[8px] border border-slate-200/80 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3.5">Sản phẩm</th>
                    <th className="py-3 px-3.5">Link tiếp thị</th>
                    <th className="py-3 px-3 text-center">Click</th>
                    <th className="py-3 px-3 text-center">Đơn hàng</th>
                    <th className="py-3 px-3.5 text-right">Doanh thu</th>
                    <th className="py-3 px-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {currentLinks.map((link) => (
                    <tr key={link.affiliateLinkCode} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product column */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <img 
                            src={link.productImage && link.productImage.trim() !== "" ? link.productImage : "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&auto=format&fit=crop&q=80"} 
                            alt={link.productName} 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&auto=format&fit=crop&q=80";
                            }}
                            className="w-11 h-11 rounded-md object-cover bg-slate-50 border border-slate-100 shrink-0 shadow-xs" 
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs hover:text-primary transition-colors line-clamp-2" title={link.productName}>{link.productName}</p>
                            <span className="text-[10px] text-slate-400 font-mono">Code: {link.affiliateLinkCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* Link URL Column */}
                      <td className="py-3 px-3.5">
                        <div className="min-w-[220px]">
                          <input 
                            type="text" 
                            readOnly 
                            value={getLinkUrl(link)} 
                            className="w-full text-[11px] px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-[6px] text-slate-600 focus:outline-none font-mono"
                          />
                        </div>
                      </td>

                      {/* Click Column */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-700 text-xs">{link.clickCount}</span>
                      </td>

                      {/* Conversion Column */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-700 text-xs">{link.conversionCount}</span>
                      </td>

                      {/* Revenue Column */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <span className="font-extrabold text-xs text-primary">{link.revenue.toLocaleString('vi-VN')}đ</span>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => {
                              const url = getLinkUrl(link);
                              navigator.clipboard.writeText(url);
                              toast.success("Đã copy link!");
                            }}
                            className="text-[11px] bg-primary hover:opacity-90 text-white font-bold px-3 py-1 rounded-[6px] transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                            title="Copy link tiếp thị"
                          >
                            <span className="material-symbols-outlined text-[13px]">content_copy</span>
                            Copy
                          </button>
                          <button 
                            onClick={() => handlePromptDeleteLink(link.affiliateLinkCode, link.productName)}
                            className="text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 p-1 rounded-[6px] transition-all flex items-center justify-center cursor-pointer active:scale-95"
                            title="Xóa link tiếp thị"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {links.length > pageSize && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 gap-2 text-xs">
                <p className="text-slate-500 text-[11px] font-medium">
                  Hiển thị <span className="font-bold text-slate-700">{startIndex + 1}</span> - <span className="font-bold text-slate-700">{Math.min(startIndex + pageSize, links.length)}</span> trên <span className="font-bold text-slate-700">{links.length}</span> link
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-[6px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">chevron_left</span>
                    Trước
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                      <button
                        key={pNum}
                        onClick={() => setCurrentPage(pNum)}
                        className={`w-6 h-6 rounded-[5px] text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer ${
                          pNum === currentPage
                            ? "bg-primary text-white shadow-xs"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                        }`}
                      >
                        {pNum}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-[6px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    Sau
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Selection Modal */}
      <ProductSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectProduct={handleSelectProductFromModal}
      />

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-200">
            {/* Icon Badge */}
            <div className="w-13 h-13 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>

            {/* Content Text */}
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">Xác nhận xóa link</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn xóa link tiếp thị cho sản phẩm <span className="font-bold text-slate-700">"{deleteConfirmTarget.productName}"</span> không?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDeleteLink}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/20 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Đang xóa...
                  </>
                ) : (
                  "Xác nhận xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

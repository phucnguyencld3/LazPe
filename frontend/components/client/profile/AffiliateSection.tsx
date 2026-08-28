"use client";

import React, { useEffect, useState } from "react";
import { getAffiliateDashboard, getAffiliateLinks, registerAffiliate, generateAffiliateLink, deleteAffiliateLink, AffiliateDashboardStats, AffiliateLink } from "@/lib/api";
import { toast } from "@/lib/toast";
import { ProductSelectModal } from "./modals/ProductSelectModal";
import { RedeemPointsModal } from "./modals/RedeemPointsModal";
import { Product } from "@/types";

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
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // View Mode: 'grid' (dạng thẻ Card gọn nhẹ) vs 'list' (dạng danh sách chi tiết)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination, Search & Time Filter state for affiliate links
  const [linksPage, setLinksPage] = useState<number>(1);
  const [linksSearch, setLinksSearch] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<string>("newest");
  const LINKS_PER_PAGE = viewMode === "grid" ? 10 : 5;

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAffiliateDashboard(token);
      if (data && data.monthlyRevenue !== undefined) {
        setIsRegistered(true);
        setStats(data);
        
        const myLinks = await getAffiliateLinks(token);
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
      toast.error("Vui lòng đồng ý với điều khoản dịch vụ");
      return;
    }
    const res = await registerAffiliate(token);
    if (res.success) {
      toast.success("Đăng ký chương trình Tiếp thị liên kết thành công!");
      fetchData();
    } else {
      toast.error(res.message || "Đăng ký thất bại");
    }
  };

  const handleSelectProductsFromModal = async (selectedProducts: Product[]) => {
    if (!selectedProducts || selectedProducts.length === 0) return;
    setGenerating(true);
    try {
      const results = await Promise.all(
        selectedProducts.map((product) =>
          generateAffiliateLink(token, product.id)
            .then((res) => (res.success ? 1 : 0))
            .catch(() => 0)
        )
      );

      const successCount = results.reduce((acc, curr) => acc + curr, 0);
      const failCount = selectedProducts.length - successCount;

      if (successCount > 0) {
        toast.success(`Đã tạo thành công ${successCount} link tiếp thị mới!`);
        const myLinks = await getAffiliateLinks(token);
        setLinks(myLinks || []);
        setLinksPage(1);
      }
      if (failCount > 0) {
        toast.error(`Có ${failCount} sản phẩm không tạo được link`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối khi tạo link hàng loạt");
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

  const handleCopyLink = (link: AffiliateLink) => {
    const url = getLinkUrl(link);
    navigator.clipboard.writeText(url);
    setCopiedCode(link.affiliateLinkCode);
    toast.success("Đã sao chép link tiếp thị!");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Delete Link Confirm Modal state
  const [deleteTarget, setDeleteTarget] = useState<{ code: string; productName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const openDeleteModal = (code: string, productName: string) => {
    setDeleteTarget({ code, productName });
  };

  const confirmDeleteLink = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteAffiliateLink(token, deleteTarget.code);
      if (res.success) {
        toast.success("Đã xóa link tiếp thị thành công!");
        const myLinks = await getAffiliateLinks(token);
        setLinks(myLinks || []);
        setLinksPage(1);
        setDeleteTarget(null);
      } else {
        toast.error(res.message || "Xóa link thất bại");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối khi xóa link");
    } finally {
      setIsDeleting(false);
    }
  };

  // Point rate tier calculation:
  // < 10,000,000đ: 1%
  // 10,000,000đ - 30,000,000đ: 2%
  // >= 30,000,000đ: 3%
  const getPointRate = (lifetimeRevenue: number = 0) => {
    if (lifetimeRevenue >= 30000000) return 0.03;
    if (lifetimeRevenue >= 10000000) return 0.02;
    return 0.01;
  };

  const getTierBadge = (lifetimeRevenue: number = 0) => {
    if (lifetimeRevenue >= 30000000) return { label: "Hạng Vàng • 3% Xu", bg: "bg-primary text-white border-primary shadow-sm" };
    if (lifetimeRevenue >= 10000000) return { label: "Hạng Bạc • 2% Xu", bg: "bg-slate-800 text-white border-slate-800 shadow-sm" };
    return { label: "Hạng Đồng • 1% Xu", bg: "bg-primary/10 text-primary border-primary/20" };
  };

  const currentRate = getPointRate(stats?.lifetimeRevenue);
  const tierInfo = getTierBadge(stats?.lifetimeRevenue);

  // Filter, Time Sort & Paginate Links
  let filteredLinks = links.filter((l) =>
    l.productName.toLowerCase().includes(linksSearch.toLowerCase())
  );

  // Apply Time Filter
  const now = new Date();
  if (timeFilter === "today") {
    filteredLinks = filteredLinks.filter((l) => {
      const d = new Date(l.createdAt);
      return d.toDateString() === now.toDateString();
    });
  } else if (timeFilter === "7days") {
    const past7 = new Date();
    past7.setDate(now.getDate() - 7);
    filteredLinks = filteredLinks.filter((l) => new Date(l.createdAt) >= past7);
  } else if (timeFilter === "30days") {
    const past30 = new Date();
    past30.setDate(now.getDate() - 30);
    filteredLinks = filteredLinks.filter((l) => new Date(l.createdAt) >= past30);
  }

  // Sort Order
  if (timeFilter === "oldest") {
    filteredLinks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    // Default newest first
    filteredLinks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const totalLinksPages = Math.ceil(filteredLinks.length / LINKS_PER_PAGE) || 1;
  const paginatedLinks = filteredLinks.slice(
    (linksPage - 1) * LINKS_PER_PAGE,
    linksPage * LINKS_PER_PAGE
  );

  // Standard Default Milestones Fallback
  const defaultMilestones = [
    { milestoneId: 1, requiredRevenue: 500000, voucherName: "Voucher 20.000đ", isAchieved: (stats?.monthlyRevenue || 0) >= 500000 },
    { milestoneId: 2, requiredRevenue: 1000000, voucherName: "Voucher 50.000đ", isAchieved: (stats?.monthlyRevenue || 0) >= 1000000 },
    { milestoneId: 3, requiredRevenue: 2000000, voucherName: "Voucher 120.000đ", isAchieved: (stats?.monthlyRevenue || 0) >= 2000000 },
    { milestoneId: 4, requiredRevenue: 5000000, voucherName: "Voucher 300.000đ", isAchieved: (stats?.monthlyRevenue || 0) >= 5000000 },
    { milestoneId: 5, requiredRevenue: 10000000, voucherName: "Voucher 700.000đ", isAchieved: (stats?.monthlyRevenue || 0) >= 10000000 },
  ];

  const displayMilestones = (stats?.milestones && stats.milestones.length > 0)
    ? stats.milestones
    : defaultMilestones;

  if (loading) {
    return (
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center min-h-[250px]">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl mb-2">progress_activity</span>
        <p className="text-xs font-medium text-slate-500">Đang tải thông tin tiếp thị...</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
        <div className="flex items-center gap-2 p-5 border-b border-slate-100">
          <span className="material-symbols-outlined text-primary text-xl">campaign</span>
          <h1 className="text-xl font-bold text-slate-800">Tiếp thị liên kết LazPe</h1>
        </div>

        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <span className="material-symbols-outlined text-2xl">campaign</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Đăng ký Tiếp thị liên kết LazPe</h2>
            <p className="text-slate-500 text-xs md:text-sm max-w-md mx-auto">
              Chia sẻ sản phẩm LazPe đến mọi người để tích lũy doanh thu và đổi những phần quà hấp dẫn.
            </p>
          </div>

          <div className="bg-slate-50 rounded-[5px] p-4 border border-slate-100 space-y-2.5">
            <h3 className="font-bold text-slate-700 text-xs md:text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">verified</span>
              Quyền lợi của bạn:
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">check_circle</span>
                <span>Nhận Voucher thưởng khi đạt mốc doanh số hàng tháng</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">check_circle</span>
                <span>Tích lũy điểm Affiliate Point để quy đổi quà tặng</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">check_circle</span>
                <span>Theo dõi hiệu quả tiếp thị bằng bảng thống kê trực quan</span>
              </li>
            </ul>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input 
              type="checkbox" 
              className="mt-0.5 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="text-xs md:text-sm text-slate-600">
              Tôi đồng ý với <a href="#" className="text-primary font-bold hover:underline">Điều khoản & Điều kiện</a> của chương trình Tiếp thị liên kết.
            </span>
          </label>

          <button 
            onClick={handleRegister}
            disabled={!agreed}
            className={`w-full py-3 rounded-[5px] font-bold text-sm text-white transition-all ${
              agreed 
                ? "bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md hover:shadow-primary/20" 
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            Trở thành đối tác Affiliate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">campaign</span>
          <h1 className="text-xl font-bold text-slate-800">Tiếp thị liên kết LazPe</h1>
        </div>

        {/* Tier Status Badge */}
        <span className={`text-xs font-bold px-3 py-1 rounded-[5px] border ${tierInfo.bg}`}>
          {tierInfo.label}
        </span>
      </div>

      {/* Overview Stat Cards Section */}
      <div className="p-5 space-y-3">
        {/* Row 1: 3 Main Revenue & Point Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Stat 1: Doanh thu tháng */}
          <div className="bg-primary text-white rounded-[5px] p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-white/80 text-lg">payments</span>
                <span className="font-semibold text-xs text-white/90">Doanh thu tháng này</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                Tháng {new Date().getMonth() + 1}
              </span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.monthlyRevenue?.toLocaleString('vi-VN')}đ
            </div>
          </div>

          {/* Stat 2: Doanh thu trọn đời */}
          <div className="bg-slate-50 border border-slate-100 rounded-[5px] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-lg">history</span>
                <span className="font-semibold text-xs text-slate-500">Doanh thu trọn đời</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-[5px] bg-primary/10 text-primary border border-primary/20">
                {(currentRate * 100).toFixed(0)}% Xu
              </span>
            </div>
            <div className="text-xl font-bold text-slate-800">
              {stats?.lifetimeRevenue?.toLocaleString('vi-VN')}đ
            </div>
          </div>

          {/* Stat 3: Điểm Affiliate & Rút về Ví */}
          <div className="bg-slate-50 border border-slate-100 rounded-[5px] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-lg">stars</span>
                  <span className="font-semibold text-xs text-slate-500">Điểm Affiliate (Xu)</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-[5px]">
                  Rút {stats?.remainingRedeemCountThisMonth ?? 3}/3 lần
                </span>
              </div>
              <div className="text-xl font-bold text-slate-800 flex items-baseline gap-1">
                {stats?.affiliatePoint?.toLocaleString('vi-VN')}
                <span className="text-xs text-slate-400 font-medium">xu</span>
              </div>
            </div>

            <button
              onClick={() => setIsRedeemModalOpen(true)}
              className="mt-3 w-full py-1.5 px-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-[5px] flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-primary/20"
            >
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
              Rút về Ví LazPe
            </button>
          </div>
        </div>

        {/* Row 2: 2 Traffic & Sales Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-[5px] p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-slate-500 font-medium">Lượt click link</p>
              <p className="text-xl font-bold text-slate-800">{stats?.totalClicks || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm text-blue-500">
              <span className="material-symbols-outlined text-xl">touch_app</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-[5px] p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-slate-500 font-medium">Đơn hàng thành công</p>
              <p className="text-xl font-bold text-slate-800">{stats?.totalConversions || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm text-emerald-500">
              <span className="material-symbols-outlined text-xl">shopping_bag</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Revenue Policy Banner - Single Horizontal Line, Uniform Colors */}
      <div className="px-5 py-3 bg-slate-50/80 border-y border-slate-100 flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-primary text-base">workspace_premium</span>
          <span className="font-bold text-slate-800 text-xs">Tỷ lệ tích xu theo Doanh thu trọn đời:</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Tier 1: Đồng */}
          <div className={`px-2.5 py-1 rounded-[5px] border text-xs flex items-center gap-1 bg-white whitespace-nowrap ${
            stats?.lifetimeRevenue && stats.lifetimeRevenue < 10000000
              ? "border-primary text-primary font-bold shadow-sm"
              : "border-slate-200 text-slate-700"
          }`}>
            <span>Hạng Đồng (&lt;10M):</span>
            <span className="font-extrabold text-primary">1% Xu</span>
          </div>

          <span className="text-slate-300 font-bold text-xs">→</span>

          {/* Tier 2: Bạc */}
          <div className={`px-2.5 py-1 rounded-[5px] border text-xs flex items-center gap-1 bg-white whitespace-nowrap ${
            stats?.lifetimeRevenue && stats.lifetimeRevenue >= 10000000 && stats.lifetimeRevenue < 30000000
              ? "border-primary text-primary font-bold shadow-sm"
              : "border-slate-200 text-slate-700"
          }`}>
            <span>Hạng Bạc (10M - 30M):</span>
            <span className="font-extrabold text-primary">2% Xu</span>
          </div>

          <span className="text-slate-300 font-bold text-xs">→</span>

          {/* Tier 3: Vàng */}
          <div className={`px-2.5 py-1 rounded-[5px] border text-xs flex items-center gap-1 bg-white whitespace-nowrap ${
            stats?.lifetimeRevenue && stats.lifetimeRevenue >= 30000000
              ? "border-primary text-primary font-bold shadow-sm"
              : "border-slate-200 text-slate-700"
          }`}>
            <span>Hạng Vàng (&ge;30M):</span>
            <span className="font-extrabold text-primary">3% Xu</span>
          </div>
        </div>
      </div>

      {/* Milestones Progress & Standard Reward Tiers */}
      <div className="p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">emoji_events</span>
            Các mốc thưởng tiêu chuẩn theo doanh thu tháng
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Tự động nhận Voucher đặc quyền khi cán mốc
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {displayMilestones.map((ms) => {
            const currentRev = stats?.monthlyRevenue || 0;
            const progress = Math.min((currentRev / ms.requiredRevenue) * 100, 100);

            return (
              <div
                key={ms.milestoneId || ms.requiredRevenue}
                className={`p-3 rounded-[5px] border transition-all ${
                  ms.isAchieved
                    ? "bg-emerald-50/70 border-emerald-200"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Mốc doanh thu</span>
                    <p className="font-extrabold text-slate-800 text-xs md:text-sm">
                      {ms.requiredRevenue.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  {ms.isAchieved ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-[5px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">verified</span> Đã đạt
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-[5px]">
                      {progress.toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-xs">confirmation_number</span>
                      Phần thưởng:
                    </span>
                    <span className="font-bold text-primary">{ms.voucherName}</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ms.isAchieved ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Affiliate Links List with Search & Grid/List View */}
      <div className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">link</span>
            <h3 className="font-bold text-slate-800 text-sm">
              Link giới thiệu của bạn ({links.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Quick Search - Wider */}
            {links.length > 0 && (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-slate-400 text-base">search</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm tiếp thị..."
                  value={linksSearch}
                  onChange={(e) => {
                    setLinksSearch(e.target.value);
                    setLinksPage(1);
                  }}
                  className="pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-[5px] focus:outline-none focus:border-primary bg-white text-slate-700 w-44 sm:w-60 md:w-72 transition-all"
                />
              </div>
            )}

            {/* Time Filter Select Dropdown */}
            {links.length > 0 && (
              <div className="relative">
                <select
                  value={timeFilter}
                  onChange={(e) => {
                    setTimeFilter(e.target.value);
                    setLinksPage(1);
                  }}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-[5px] bg-white text-slate-700 focus:outline-none focus:border-primary cursor-pointer font-medium"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="today">Hôm nay</option>
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                </select>
              </div>
            )}

            {/* View Mode Toggle (Grid vs List) */}
            {links.length > 0 && (
              <div className="flex items-center border border-slate-200 rounded-[5px] bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("grid");
                    setLinksPage(1);
                  }}
                  title="Hiển thị dạng thẻ Card"
                  className={`p-1 rounded-[5px] transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-primary shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("list");
                    setLinksPage(1);
                  }}
                  title="Hiển thị dạng danh sách chi tiết"
                  className={`p-1 rounded-[5px] transition-all ${
                    viewMode === "list"
                      ? "bg-white text-primary shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">view_list</span>
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold py-1.5 px-3 rounded-[5px] flex items-center justify-center gap-1 transition-all shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">add_link</span>
              Tạo link mới
            </button>
          </div>
        </div>

        {filteredLinks.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-[5px] border border-dashed border-slate-200 space-y-1">
            <span className="material-symbols-outlined text-3xl text-slate-300">link_off</span>
            <p className="text-xs text-slate-500 font-medium">
              {links.length === 0 ? "Bạn chưa tạo link tiếp thị nào." : "Không tìm thấy link tiếp thị phù hợp với điều kiện lọc."}
            </p>
            <p className="text-[11px] text-slate-400">
              {links.length === 0 ? "Hãy bấm nút \"Tạo link mới\" ở trên để tạo link sản phẩm nhé!" : "Thử thay đổi từ khóa hoặc bộ lọc thời gian xem sao."}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* CARD GRID VIEW (Dạng thẻ Card gọn gàng chỉ gồm Ảnh, Tên, Giá & Nút Copy) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {paginatedLinks.map((link) => {
              const isCopied = copiedCode === link.affiliateLinkCode;
              const maxCap = 10000 * (currentRate / 0.01);
              const calculatedXu = Math.min(Math.floor(link.revenue * currentRate), maxCap);

              return (
                <div
                  key={link.affiliateLinkCode}
                  className="bg-slate-50/70 border border-slate-100 rounded-[5px] p-2.5 flex flex-col justify-between hover:bg-white hover:border-slate-200 hover:shadow-md transition-all group relative"
                >
                  {/* Delete Icon Button */}
                  <button
                    onClick={() => openDeleteModal(link.affiliateLinkCode, link.productName)}
                    className="absolute top-3 right-3 z-10 w-6 h-6 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full border border-slate-200 shadow-sm flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                    title="Xóa link tiếp thị"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>

                  <div className="space-y-1.5">
                    {/* Product Image */}
                    <div className="w-full h-32 bg-white rounded-[5px] border border-slate-100 flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={link.productImage || "/placeholder.png"}
                        alt={link.productName}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png";
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Product Name */}
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[32px] group-hover:text-primary transition-colors">
                      {link.productName}
                    </h4>

                    {/* Tích Xu */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">Tích xu ({(currentRate * 100).toFixed(0)}%):</span>
                      <span className="font-extrabold text-amber-600">
                        {link.revenue > 0 ? `${calculatedXu.toLocaleString('vi-VN')} xu` : "0 xu"}
                      </span>
                    </div>
                  </div>

                  {/* Copy Link Button */}
                  <button
                    onClick={() => handleCopyLink(link)}
                    className={`mt-2 w-full py-1 px-2 text-[11px] font-bold rounded-[5px] flex items-center justify-center gap-1 transition-all shadow-sm ${
                      isCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {isCopied ? "check" : "content_copy"}
                    </span>
                    {isCopied ? "Đã copy link" : "Sao chép link"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* DETAILED LIST VIEW (Dạng danh sách) */
          <div className="space-y-3">
            {paginatedLinks.map((link) => {
              const url = getLinkUrl(link);
              const isCopied = copiedCode === link.affiliateLinkCode;
              const maxCap = 10000 * (currentRate / 0.01);
              const calculatedXu = Math.min(Math.floor(link.revenue * currentRate), maxCap);

              return (
                <div key={link.affiliateLinkCode} className="flex gap-3 p-3 rounded-[5px] border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors">
                  <img
                    src={link.productImage || "/placeholder.png"}
                    alt={link.productName}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                    className="w-16 h-16 rounded-[5px] object-contain p-0.5 bg-white shrink-0 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs md:text-sm font-bold text-slate-800 line-clamp-1">{link.productName}</h4>
                      <span className="text-xs font-bold text-amber-600 shrink-0">
                        {link.revenue > 0 ? `${calculatedXu.toLocaleString('vi-VN')} xu (${(currentRate * 100).toFixed(0)}%)` : `0 xu (${(currentRate * 100).toFixed(0)}%)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">touch_app</span> 
                        {link.clickCount} click
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">shopping_bag</span> 
                        {link.conversionCount} đơn
                      </span>
                    </div>

                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        readOnly 
                        value={url} 
                        className="flex-1 text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-[5px] text-slate-600 outline-none select-all font-mono"
                      />
                      <button 
                        onClick={() => handleCopyLink(link)}
                        className={`text-xs px-3 py-1 rounded-[5px] font-medium transition-colors whitespace-nowrap ${
                          isCopied ? "bg-emerald-600 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        }`}
                      >
                        {isCopied ? "Đã copy" : "Copy"}
                      </button>
                      <button 
                        onClick={() => openDeleteModal(link.affiliateLinkCode, link.productName)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1 rounded-[5px] font-medium transition-colors flex items-center justify-center"
                        title="Xóa link tiếp thị"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {filteredLinks.length > LINKS_PER_PAGE && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500 text-[11px]">
              Hiển thị <strong>{(linksPage - 1) * LINKS_PER_PAGE + 1} - {Math.min(linksPage * LINKS_PER_PAGE, filteredLinks.length)}</strong> trên <strong>{filteredLinks.length}</strong> link
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLinksPage((prev) => Math.max(prev - 1, 1))}
                disabled={linksPage <= 1}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-[5px] text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <span className="text-xs font-medium text-slate-600 px-1">
                Trang {linksPage} / {totalLinksPages}
              </span>
              <button
                onClick={() => setLinksPage((prev) => Math.min(prev + 1, totalLinksPages))}
                disabled={linksPage >= totalLinksPages}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-[5px] text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal chọn sản phẩm */}
      <ProductSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectProducts={handleSelectProductsFromModal}
        existingProductIds={links.map((l) => l.productId)}
      />

      {/* Modal Rút xu về Ví LazPe */}
      <RedeemPointsModal
        isOpen={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
        token={token}
        currentPoints={stats?.affiliatePoint || 0}
        remainingRedeemCount={stats?.remainingRedeemCountThisMonth ?? 3}
        hasPaymentPin={stats?.hasPaymentPin ?? false}
        onSuccess={fetchData}
      />

      {/* Modal xác nhận xóa link tiếp thị */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 relative">
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">delete</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Xác nhận xóa link tiếp thị</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa link tiếp thị cho sản phẩm{" "}
              <strong className="text-slate-800">"{deleteTarget.productName}"</strong> không? 
              Sau khi xóa, link giới thiệu này sẽ không thể sử dụng để tích lũy doanh thu nữa.
            </p>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-1/3 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-[5px] hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteLink}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-[5px] flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>Xóa link tiếp thị</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

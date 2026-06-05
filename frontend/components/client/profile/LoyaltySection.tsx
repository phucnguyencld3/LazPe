import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Gift,
  History,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  Calendar,
  Sparkles,
  Shield,
  Award,
  Crown,
  Gem,
  CheckCircle2
} from "lucide-react";
import { getLoyaltyProfile, getLoyaltyHistory, getLoyaltyTiers, LoyaltyProfileResponse, LoyaltyPointHistoryItem, LoyaltyTierClientResponse } from "@/lib/api";
import { toast } from "@/lib/toast";
import { formatPrivilegeDetailLines } from "@/lib/utils/formatters";

interface LoyaltySectionProps {
  token: string;
}

const getTierIcon = (tierName: string) => {
  const nameUpper = tierName?.toUpperCase();
  if (nameUpper === "SILVER" || nameUpper === "BẠC") {
    return <Award className="h-5 w-5 text-slate-400" />;
  }
  if (nameUpper === "GOLD" || nameUpper === "VÀNG") {
    return <Crown className="h-5 w-5 text-amber-500" />;
  }
  if (nameUpper === "DIAMOND" || nameUpper === "KIM CƯƠNG") {
    return <Gem className="h-5 w-5 text-indigo-500 animate-pulse" />;
  }
  return <Shield className="h-5 w-5 text-slate-500" />;
};

export function LoyaltySection({ token }: LoyaltySectionProps) {
  const [profile, setProfile] = useState<LoyaltyProfileResponse | null>(null);
  const [tiersList, setTiersList] = useState<LoyaltyTierClientResponse[]>([]);
  const [historyItems, setHistoryItems] = useState<LoyaltyPointHistoryItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Filters & Pagination states
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterPeriod, setFilterPeriod] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 8;

  useEffect(() => {
    fetchProfileData();
    fetchTiersData();
  }, [token]);

  useEffect(() => {
    fetchHistoryData();
  }, [token, filterType, filterPeriod, currentPage]);

  const fetchProfileData = async () => {
    setLoadingProfile(true);
    try {
      const data = await getLoyaltyProfile(token);
      if (data) {
        setProfile(data);
      } else {
        toast.error("Không thể tải thông tin hạng thành viên.");
      }
    } catch (error) {
      console.error("Error fetching loyalty profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchTiersData = async () => {
    try {
      const data = await getLoyaltyTiers(token);
      if (data) {
        setTiersList(data);
      }
    } catch (error) {
      console.error("Error fetching loyalty tiers:", error);
    }
  };

  const fetchHistoryData = async () => {
    setLoadingHistory(true);
    try {
      const res = await getLoyaltyHistory(token, filterType, filterPeriod, currentPage, pageSize);
      if (res) {
        setHistoryItems(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalItems(res.pagination.totalItems || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching loyalty history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterTypeChange = (type: string) => {
    setFilterType(type);
    setCurrentPage(1); // Reset page to 1
  };

  const handleFilterPeriodChange = (period: string) => {
    setFilterPeriod(period);
    setCurrentPage(1); // Reset page to 1
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.getDate().toString().padStart(2, "0") + "/" + (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear() + " " + d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
  };

  // Get tier styling for card
  const getTierStyles = (tierName: string, colorHex?: string) => {
    const nameUpper = tierName?.toUpperCase();
    if (nameUpper === "SILVER" || nameUpper === "BẠC") {
      return {
        bg: "bg-gradient-to-br from-slate-300 via-zinc-400 to-slate-500",
        badgeBg: "bg-slate-100 text-slate-700",
        textColor: "text-slate-100",
        glow: "shadow-slate-400/20",
        subTextColor: "text-slate-200",
        accentColor: "text-slate-300"
      };
    }
    if (nameUpper === "GOLD" || nameUpper === "VÀNG") {
      return {
        bg: "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600",
        badgeBg: "bg-amber-100 text-amber-800",
        textColor: "text-amber-50",
        glow: "shadow-amber-500/20",
        subTextColor: "text-amber-100/90",
        accentColor: "text-amber-200"
      };
    }
    if (nameUpper === "DIAMOND" || nameUpper === "KIM CƯƠNG") {
      return {
        bg: "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500",
        badgeBg: "bg-indigo-100 text-indigo-800",
        textColor: "text-indigo-50",
        glow: "shadow-purple-500/20",
        subTextColor: "text-indigo-100/90",
        accentColor: "text-indigo-200"
      };
    }
    if (nameUpper === "STANDARD" || nameUpper === "THƯỜNG" || nameUpper === "MẶC ĐỊNH") {
      return {
        bg: "bg-gradient-to-br from-slate-600 to-slate-800",
        badgeBg: "bg-slate-700 text-slate-100",
        textColor: "text-slate-300",
        glow: "shadow-slate-800/20",
        subTextColor: "text-slate-400",
        accentColor: "text-slate-500"
      };
    }

    const safeColor = colorHex || "#64748b";
    return {
      bg: "",
      style: { backgroundColor: safeColor },
      badgeBg: "bg-white/20 text-white",
      textColor: "text-white",
      glow: "shadow-slate-500/20",
      subTextColor: "text-white/80",
      accentColor: "text-white/50"
    };
  };

  const getTransactionBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case "EARN":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Tích điểm</span>;
      case "SPEND":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100">Thanh toán</span>;
      case "REFUND":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Hoàn điểm</span>;
      case "REVOKE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Thu hồi</span>;
      case "BONUS":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">Thưởng</span>;
      case "RESET":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100">Hạ hạng</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">{type}</span>;
    }
  };

  if (loadingProfile) {
    return (
      <div className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin h-10 w-10 text-rose-500 mx-auto" />
          <p className="text-slate-500 font-medium">Đang tải thông tin khách hàng thân thiết...</p>
        </div>
      </div>
    );
  }

  const tier = profile?.currentTierName || "Standard";
  const userTierFromList = tiersList.find(t => t.tierID === profile?.currentTierID);
  const styles = getTierStyles(tier, userTierFromList?.colorHex);

  const sortedTiers = [...tiersList].sort((a, b) => a.minPoints - b.minPoints);
  const currentTierIndex = sortedTiers.findIndex(t => t.tierID === profile?.currentTierID);
  const isLastTier = currentTierIndex === sortedTiers.length - 1;
  const nextTier = !isLastTier && currentTierIndex !== -1 ? sortedTiers[currentTierIndex + 1] : null;

  let dynamicProgress = 0;
  if (profile && nextTier) {
    const currentMin = sortedTiers[currentTierIndex]?.minPoints || 0;
    const nextMin = nextTier.minPoints;
    const range = nextMin - currentMin;
    if (range > 0) {
      dynamicProgress = Math.round(((profile.totalPoints - currentMin) / range) * 100);
    }
  }
  if (dynamicProgress < 0) dynamicProgress = 0;
  if (dynamicProgress > 100) dynamicProgress = 100;

  return (
    <div className="space-y-6">

      {/* 1. MEMBERSHIP CARD & POINTS BANNER */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Virtual Membership Card */}
        <div
          className={"md:col-span-2 relative " + styles.bg + " rounded-2xl p-6 text-white overflow-hidden shadow-xl " + styles.glow + " flex flex-col justify-between min-h-[220px] transition-all hover:scale-[1.01]"}
          style={styles.style}
        >
          {/* Card background decoration */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12 select-none">
            <span className="material-symbols-outlined text-[260px] font-bold">military_tech</span>
          </div>
          <div className="absolute top-0 right-0 p-6 flex flex-col items-end">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border border-white/20">
              <Sparkles className="h-3 w-3" />
              <span>Hạng {profile?.currentTierName}</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-wide uppercase opacity-75">LazPe Membership</h2>
            <p className="text-2xl font-black tracking-widest">{profile?.fullName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Điểm hiện có</p>
              <p className="text-3xl font-black tracking-tight flex items-baseline gap-1">
                {profile?.availablePoints.toLocaleString("vi-VN")}
                <span className="text-xs font-bold opacity-80">điểm</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tích lũy xét hạng</p>
              <p className="text-xl font-bold opacity-90">
                {profile?.totalPoints.toLocaleString("vi-VN")} <span className="text-xs">điểm</span>
              </p>
            </div>
          </div>
        </div>

        {/* Info Box & Rules summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_12px_24px_rgba(135,78,88,0.04)] flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-500" />
              Quy tắc điểm tích lũy
            </h3>
            <ul className="text-xs text-slate-500 space-y-2.5 font-medium pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 mt-0.5">•</span>
                <span>Tích lũy <strong>10 điểm</strong> cho mỗi 1,000đ giá trị đơn hàng khi giao hàng thành công.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 mt-0.5">•</span>
                <span><strong>Điểm hiện có:</strong> dùng để giảm giá khi mua hàng (1 Điểm = 1 VNĐ).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500 mt-0.5">•</span>
                <span><strong>Điểm tích lũy:</strong> dùng để xét hạng, không giảm khi dùng thanh toán.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Reset chu kỳ: 6 tháng/lần (01/01 & 01/07)
            </span>
          </div>
        </div>

      </section>

      {/* 2. PROGRESS TO NEXT TIER */}
      {nextTier && profile && (
        <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_12px_24px_rgba(135,78,88,0.04)] space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-rose-500" />
              Tiến trình thăng hạng tiếp theo
            </span>
            <span>
              Cần thêm: <strong className="text-rose-500">{(nextTier.minPoints - profile.totalPoints).toLocaleString("vi-VN")} điểm</strong>
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={"absolute top-0 left-0 h-full " + styles.bg + " rounded-full transition-all duration-700"}
              style={styles.style ? { ...styles.style, width: dynamicProgress + "%" } : { width: dynamicProgress + "%" }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
            <span>Hạng hiện tại ({profile.currentTierName})</span>
            <span>{dynamicProgress}%</span>
            <span>Hạng tiếp theo ({nextTier.tierName})</span>
          </div>
        </section>
      )}

      {/* 3. TIER PRIVILEGES */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_12px_24px_rgba(135,78,88,0.04)] space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 pb-2 border-b border-slate-100">
          <Gift className="h-5 w-5 text-rose-500" />
          Đặc quyền VIP & Hạng thành viên
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedTiers.map((t, index) => {
            const isUserTier = profile?.currentTierID === t.tierID;
            const tierIcon = getTierIcon(t.tierName);

            return (
              <div
                key={t.tierID}
                className={`flex flex-col justify-between p-5 rounded-[10px] border transition-all duration-300 bg-white group hover:shadow-lg ${
                  isUserTier
                    ? "ring-2 ring-offset-2 scale-[1.02] z-10"
                    : "border-slate-100 hover:border-slate-200"
                }`}
                style={
                  isUserTier
                    ? {
                        borderColor: t.colorHex,
                        boxShadow: `0 12px 30px -10px ${t.colorHex}40`,
                        // @ts-ignore
                        "--tw-ring-color": t.colorHex,
                      }
                    : undefined
                }
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {tierIcon}
                        <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">
                          {t.tierName}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {index === sortedTiers.length - 1
                          ? `Từ ${t.minPoints.toLocaleString("vi-VN")} điểm`
                          : `${t.minPoints.toLocaleString("vi-VN")} - ${(sortedTiers[index + 1].minPoints - 1).toLocaleString("vi-VN")} điểm`}
                      </p>
                    </div>

                    {isUserTier && (
                      <span
                        className="text-[9px] text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse whitespace-nowrap"
                        style={{ backgroundColor: t.colorHex }}
                      >
                        Hạng của bạn
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] w-full bg-slate-100 group-hover:bg-slate-200/60 transition-colors" />

                  {/* Privileges List */}
                  <div className="space-y-3">
                    {t.privileges.length === 0 ? (
                      <div className="py-6 text-center space-y-2">
                        <span className="material-symbols-outlined text-slate-300 text-3xl block">lock_open</span>
                        <p className="text-slate-400 italic text-[11px] font-medium leading-relaxed px-2">
                          Hạng thành viên cơ bản. Tích luỹ thêm điểm để nhận quà và ưu đãi.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {t.privileges.map((p) => {
                          const lines = formatPrivilegeDetailLines(p.privilegeType, p.value);
                          return (
                            <div
                              key={p.privilegeID}
                              className="bg-slate-50/50 rounded-[10px] p-3 border border-slate-100 hover:bg-slate-50 transition-colors space-y-1.5"
                            >
                              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                                <div
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: t.colorHex }}
                                />
                                <span>{p.name}</span>
                              </div>
                              {lines.length > 0 && (
                                <ul className="pl-3.5 space-y-1 list-disc text-slate-500/80 text-[10px] font-semibold leading-relaxed">
                                  {lines.map((line, idx) => (
                                    <li key={idx} className="marker:text-slate-300">
                                      {line}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer status / button hint if not user tier */}
                {!isUserTier && (
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {profile && profile.totalPoints >= t.minPoints ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Đã đạt mức điểm
                      </span>
                    ) : (
                      profile && (
                        <span>
                          Cần thêm {(t.minPoints - profile.totalPoints).toLocaleString("vi-VN")} điểm
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. POINT HISTORY TABLE WITH FILTERS */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_12px_24px_rgba(135,78,88,0.04)] space-y-4">

        {/* Table Title and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            Lịch sử biến động điểm
          </h3>

          {/* Filter Widgets */}
          <div className="flex flex-wrap gap-2 items-center">

            {/* Period selector */}
            <select
              value={filterPeriod}
              onChange={(e) => handleFilterPeriodChange(e.target.value)}
              className="bg-slate-50 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-rose-300"
            >
              <option value="All">Tất cả thời gian</option>
              <option value="Month">Trong tháng này</option>
              <option value="CurrentCycle">Trong kỳ này (6 tháng)</option>
              <option value="Year">Trong năm nay</option>
            </select>

            {/* Type Filter Buttons */}
            <div className="flex items-center bg-slate-50 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 overflow-x-auto">
              {(
                [
                  { id: "ALL", label: "Tất cả" },
                  { id: "EARN", label: "Tích điểm" },
                  { id: "SPEND", label: "Tiêu điểm" },
                  { id: "REFUND", label: "Hoàn điểm" },
                  { id: "REVOKE", label: "Thu hồi" },
                ]
              ).map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleFilterTypeChange(type.id)}
                  className={"px-3 py-1 rounded-md transition-all whitespace-nowrap " + (
                    filterType === type.id
                      ? "bg-white text-slate-800 shadow-sm font-bold"
                      : "hover:text-slate-800"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* History content */}
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-rose-500 mb-2" />
            <p className="text-slate-400 text-xs font-semibold">Đang tải lịch sử điểm...</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <span className="material-symbols-outlined text-4xl text-slate-300 block select-none">history</span>
            <p className="text-slate-400 text-xs font-bold">Không tìm thấy giao dịch điểm nào.</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Table layout (desktop) */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="p-3.5">Thời gian</th>
                    <th className="p-3.5">Loại giao dịch</th>
                    <th className="p-3.5">Biến động</th>
                    <th className="p-3.5">Mã đơn hàng</th>
                    <th className="p-3.5">Nội dung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {historyItems.map((item) => (
                    <tr key={item.historyID} className="hover:bg-slate-50/40">
                      <td className="p-3.5 text-slate-400 font-medium">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="p-3.5">
                        {getTransactionBadge(item.transactionType)}
                      </td>
                      <td className="p-3.5">
                        <span className={"text-sm font-black " + (item.amount > 0 ? "text-emerald-500" : "text-rose-500")}>
                          {item.amount > 0 ? "+" + item.amount.toLocaleString("vi-VN") : item.amount.toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {item.invoiceID ? (
                          <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            #{item.invoiceID}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium max-w-[250px] truncate" title={item.description}>
                        {item.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-2 text-xs font-bold text-slate-500">
                <span>
                  Hiển thị {historyItems.length} trên tổng số {totalItems} giao dịch
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-slate-800">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </section>

    </div>
  );
}

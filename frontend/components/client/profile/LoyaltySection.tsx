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
    return <Crown className="h-5 w-5 text-amber-400" />;
  }
  if (nameUpper === "DIAMOND" || nameUpper === "KIM CƯƠNG") {
    return <Gem className="h-5 w-5 text-indigo-400" />;
  }
  return <Shield className="h-5 w-5 text-slate-400" />;
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
        bg: "bg-gradient-to-br from-slate-100 to-slate-200",
        badgeBg: "bg-white text-slate-600 border border-slate-200/60 shadow-sm",
        textColor: "text-slate-800",
        glow: "shadow-sm border border-slate-200/50",
        subTextColor: "text-slate-500 font-bold",
        dividerColor: "border-slate-300/40",
        style: undefined
      };
    }
    if (nameUpper === "GOLD" || nameUpper === "VÀNG") {
      return {
        bg: "bg-gradient-to-br from-zinc-900 to-[#292524]", 
        badgeBg: "bg-amber-900/40 text-amber-400 border border-amber-500/30",
        textColor: "text-amber-50",
        glow: "shadow-lg shadow-amber-900/10 border border-amber-900/30",
        subTextColor: "text-amber-200/50 font-bold",
        dividerColor: "border-white/10",
        style: undefined
      };
    }
    if (nameUpper === "DIAMOND" || nameUpper === "KIM CƯƠNG") {
      return {
        bg: "bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]", 
        badgeBg: "bg-indigo-900/40 text-indigo-300 border border-indigo-500/30",
        textColor: "text-white",
        glow: "shadow-lg shadow-indigo-900/10 border border-indigo-900/30",
        subTextColor: "text-indigo-200/50 font-bold",
        dividerColor: "border-white/10",
        style: undefined
      };
    }
    
    // Mặc định
    return {
      bg: "bg-slate-50 border border-slate-100",
      badgeBg: "bg-white text-slate-500 border border-slate-200/60 shadow-sm",
      textColor: "text-slate-700",
      glow: "shadow-sm",
      subTextColor: "text-slate-400 font-bold",
      dividerColor: "border-slate-200",
      style: undefined
    };
  };

  const getTransactionBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case "EARN":
        return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Tích điểm</span>;
      case "SPEND":
        return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100">Thanh toán</span>;
      case "REFUND":
        return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Hoàn điểm</span>;
      case "REVOKE":
        return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Thu hồi</span>;
      case "BONUS":
        return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">Thưởng</span>;
      case "RESET":
        return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100">Hạ hạng</span>;
      case "DAILY_CHECKIN":
        return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">Điểm danh</span>;
      default:
        return <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-slate-100 text-slate-800">{type}</span>;
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
    <div className="bg-white rounded-[16px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
      {/* 1. MEMBERSHIP CARD & POINTS BANNER */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 md:p-6 bg-slate-50/50">

        {/* Virtual Membership Card */}
        <div
          className={`md:col-span-2 relative ${styles.bg} rounded-[10px] p-5 ${styles.textColor} overflow-hidden ${styles.glow} flex flex-col justify-between min-h-[200px] transition-all hover:scale-[1.01]`}
          style={styles.style}
        >
          {/* Card background decoration */}
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-8 translate-y-8 select-none">
            <span className="material-symbols-outlined text-[200px] font-bold">military_tech</span>
          </div>
          <div className="absolute top-0 right-0 p-5 flex flex-col items-end">
            <div className={`flex items-center gap-1.5 ${styles.badgeBg} backdrop-blur-md px-3 py-1 rounded-[6px] text-[10px] font-black tracking-wider uppercase`}>
              <Sparkles className="h-3 w-3" />
              <span>Hạng {profile?.currentTierName}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-[11px] font-bold tracking-wide uppercase opacity-60">LazPe Membership</h2>
            <p className="text-xl font-black tracking-widest">{profile?.fullName}</p>
          </div>

          <div className={`grid grid-cols-2 gap-4 mt-5 pt-3 border-t ${styles.dividerColor || "border-white/10"}`}>
            <div>
              <p className={`text-[10px] uppercase tracking-wider ${styles.subTextColor}`}>Điểm hiện có</p>
              <p className="text-2xl font-black tracking-tight flex items-baseline gap-1">
                {profile?.availablePoints.toLocaleString("vi-VN")}
                <span className={`text-[10px] font-bold ${styles.subTextColor}`}>điểm</span>
              </p>
            </div>
            <div className="text-right z-10">
              <p className={`text-[10px] uppercase tracking-wider ${styles.subTextColor}`}>Tích lũy xét hạng</p>
              <p className="text-lg font-bold">
                {profile?.totalPoints.toLocaleString("vi-VN")} <span className={`text-[10px] ${styles.subTextColor}`}>điểm</span>
              </p>
            </div>
          </div>
        </div>

        {/* Info Box & Rules summary */}
        <div className="bg-white rounded-[10px] p-4 border border-slate-100/60 shadow-sm flex flex-col justify-between min-h-[200px]">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-400" />
              Quy tắc điểm tích lũy
            </h3>
            <ul className="text-[11px] text-slate-500 space-y-2 font-medium pl-1 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 mt-0.5">•</span>
                <span>Tích lũy <strong>10 điểm</strong> cho mỗi 1,000đ khi giao hàng thành công.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 mt-0.5">•</span>
                <span><strong>Điểm hiện có:</strong> dùng để giảm giá (1 Điểm = 1 VNĐ).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 mt-0.5">•</span>
                <span><strong>Điểm tích lũy:</strong> xét hạng, không dùng thanh toán.</span>
              </li>
            </ul>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-50 flex items-center text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Reset: 01/01 & 01/07
            </span>
          </div>
        </div>

      </section>

      {/* 2. PROGRESS TO NEXT TIER */}
      {nextTier && profile && (
        <section className="p-5 md:p-6 space-y-3 bg-white">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
            <span className="flex items-center gap-1.5 uppercase tracking-wide text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
              Tiến trình thăng hạng
            </span>
            <span>
              Cần thêm <strong className="text-rose-500">{(nextTier.minPoints - profile.totalPoints).toLocaleString("vi-VN")} điểm</strong>
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-2 bg-slate-100 rounded-[6px] overflow-hidden">
            <div
              className={"absolute top-0 left-0 h-full bg-primary rounded-[6px] transition-all duration-700"}
              style={{ width: dynamicProgress + "%" }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
            <span>{profile.currentTierName}</span>
            <span>{dynamicProgress}%</span>
            <span>{nextTier.tierName}</span>
          </div>
        </section>
      )}

      {/* 3. TIER PRIVILEGES */}
      <section className="p-5 md:p-6 space-y-4 bg-white">
        <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-2 pb-3 border-b border-slate-100">
          <Gift className="h-4 w-4 text-rose-500" />
          Đặc quyền VIP & Hạng thành viên
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedTiers.map((t, index) => {
            const isUserTier = profile?.currentTierID === t.tierID;
            const tierIcon = getTierIcon(t.tierName);

            return (
              <div
                key={t.tierID}
                className={`flex flex-col justify-between p-4 rounded-[8px] border transition-all duration-300 bg-white group relative ${isUserTier
                  ? "ring-1 ring-offset-2 shadow-md scale-[1.01] z-10 border-transparent ring-slate-800"
                  : "border-slate-100 hover:border-slate-200"
                  }`}
              >
                {isUserTier && (
                  <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 z-20">
                    <span
                      className="text-[9px] bg-slate-800 text-white font-black px-3 py-0.5 rounded-[4px] uppercase tracking-widest shadow-sm"
                    >
                      Hạng của bạn
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 w-full text-center">
                      <div className="flex justify-center items-center mb-2">
                        {tierIcon}
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-[13px] tracking-tight">
                        {t.tierName}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">
                        {index === sortedTiers.length - 1
                          ? `Từ ${t.minPoints.toLocaleString("vi-VN")} điểm`
                          : `${t.minPoints.toLocaleString("vi-VN")} - ${(sortedTiers[index + 1].minPoints - 1).toLocaleString("vi-VN")}`}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] w-8 mx-auto bg-slate-100 group-hover:bg-slate-200 transition-colors" />

                  {/* Privileges List */}
                  <div className="space-y-2">
                    {t.privileges.length === 0 ? (
                      <div className="py-4 text-center space-y-1">
                        <span className="material-symbols-outlined text-slate-300 text-2xl block">lock_open</span>
                        <p className="text-slate-400 italic text-[10px] font-medium leading-relaxed px-2">
                          Hạng cơ bản. Tích luỹ thêm để nhận quà.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {t.privileges.map((p) => {
                          const lines = formatPrivilegeDetailLines(p.privilegeType, p.value);
                          return (
                            <div
                              key={p.privilegeID}
                              className="bg-slate-50/80 rounded-md p-2.5 border border-slate-50 hover:bg-slate-50 transition-colors space-y-1"
                            >
                              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                                <div
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400"
                                />
                                <span>{p.name}</span>
                              </div>
                              {lines.length > 0 && (
                                <ul className="pl-3 space-y-0.5 list-disc text-slate-500/80 text-[9px] font-semibold leading-relaxed">
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
                  <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center">
                    {profile && profile.totalPoints >= t.minPoints ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Đã đạt
                      </span>
                    ) : (
                      profile && (
                        <span>
                          Thiếu {(t.minPoints - profile.totalPoints).toLocaleString("vi-VN")} đ
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
      <section className="bg-white rounded-[10px] p-5 border border-slate-100/60 shadow-sm space-y-4">

        {/* Table Title and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            Lịch sử biến động điểm
          </h3>

          {/* Filter Widgets */}
          <div className="flex flex-wrap gap-2 items-center">

            {/* Period selector */}
            <select
              value={filterPeriod}
              onChange={(e) => handleFilterPeriodChange(e.target.value)}
              className="bg-slate-50/50 text-slate-600 text-[11px] font-bold px-2 py-1.5 rounded-[6px] border border-slate-200/60 outline-none focus:border-rose-300"
            >
              <option value="All">Tất cả thời gian</option>
              <option value="Month">Trong tháng này</option>
              <option value="CurrentCycle">Trong kỳ này (6 tháng)</option>
              <option value="Year">Trong năm nay</option>
            </select>

            {/* Type Filter Buttons */}
            <div className="flex items-center bg-slate-50/50 p-0.5 rounded-[6px] border border-slate-200/60 text-[11px] font-bold text-slate-400 overflow-x-auto">
              {(
                [
                  { id: "ALL", label: "Tất cả" },
                  { id: "EARN", label: "Tích điểm" },
                  { id: "SPEND", label: "Tiêu điểm" },
                  { id: "REFUND", label: "Hoàn điểm" },
                  { id: "REVOKE", label: "Thu hồi" },
                  { id: "DAILY_CHECKIN", label: "Điểm danh" },
                ]
              ).map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleFilterTypeChange(type.id)}
                  className={"px-2.5 py-1 rounded-[4px] transition-all whitespace-nowrap " + (
                    filterType === type.id
                      ? "bg-white text-slate-700 shadow-sm"
                      : "hover:text-slate-600"
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
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-rose-500 mb-2" />
            <p className="text-slate-400 text-[11px] font-semibold">Đang tải lịch sử điểm...</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <span className="material-symbols-outlined text-3xl text-slate-200 block select-none">history</span>
            <p className="text-slate-400 text-[11px] font-bold">Không tìm thấy giao dịch điểm nào.</p>
          </div>
        ) : (
          <div className="space-y-3">

            {/* Table layout (desktop) */}
            <div className="overflow-x-auto rounded-[8px] border border-slate-100/80">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100/80">
                    <th className="px-3 py-2 w-[130px]">Thời gian</th>
                    <th className="px-3 py-2 w-[110px]">Loại giao dịch</th>
                    <th className="px-3 py-2 w-[90px]">Biến động</th>
                    <th className="px-3 py-2 w-[130px]">Mã đơn hàng</th>
                    <th className="px-3 py-2">Nội dung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/60 font-semibold text-slate-700">
                  {historyItems.map((item) => (
                    <tr key={item.historyID} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-3 py-2 text-slate-400 font-medium whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getTransactionBadge(item.transactionType)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={"text-[13px] font-black " + (item.amount > 0 ? "text-emerald-500" : "text-rose-500")}>
                          {item.amount > 0 ? "+" + item.amount.toLocaleString("vi-VN") : item.amount.toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.invoiceCode ? (
                          <span className="text-slate-800 bg-slate-100/80 px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold">
                            #{item.invoiceCode}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600 font-medium max-w-[450px] truncate" title={item.description}>
                        {item.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-1 text-[10px] font-bold text-slate-400">
                <span>
                  Hiển thị {historyItems.length} trên tổng số {totalItems} giao dịch
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded-[6px] border border-slate-200/80 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <span className="text-slate-600 px-1">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-[6px] border border-slate-200/80 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
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

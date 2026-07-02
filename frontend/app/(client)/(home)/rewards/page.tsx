"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCheckInStatus, performCheckIn, DailyCheckInStatus } from "@/lib/api";
import { Gift, CheckCircle, Calendar, Sparkles, AlertCircle, ChevronLeft } from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import LuckyWheelWidget from "@/components/client/lucky-wheel/LuckyWheelWidget";

export default function RewardsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<DailyCheckInStatus | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!savedToken) {
      router.push("/login?redirect=/rewards");
    } else {
      setToken(savedToken);
    }
  }, [router]);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getCheckInStatus(token);
      if (res.success && res.data) {
        setStatus(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchStatus();
    }
  }, [token, fetchStatus]);

  const handleCheckIn = async () => {
    if (!token || checkingIn || status?.hasCheckedInToday) return;
    setCheckingIn(true);

    try {
      const result = await performCheckIn(token);
      if (result.success) {
        // Trigger confetti
        const end = Date.now() + 2 * 1000;
        const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#ef4444'];

        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());

        toast.success(result.message || "Điểm danh thành công!");
        await fetchStatus(); // refresh status
      } else {
        toast.error(result.message || "Điểm danh thất bại.");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi, vui lòng thử lại sau.");
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const renderDays = () => {
    if (!status) return null;

    return (
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-6">
        {status.rewardSequence.map((reward, index) => {
          const dayNumber = index + 1;
          let visualStreak = status.currentStreak;
          let activeIndex = status.hasCheckedInToday ? -1 : visualStreak;

          if (visualStreak >= 7) {
            if (status.hasCheckedInToday) {
              visualStreak = 7;
              activeIndex = -1;
            } else {
              visualStreak = 6;
              activeIndex = 6;
            }
          }

          const isCompleted = index < visualStreak;
          const isToday = index === activeIndex;

          let stateClass = "bg-white border-slate-100 text-slate-400";
          let icon = <Gift size={20} className="text-slate-300 mb-1" />;
          let textClass = "text-[11px]";

          if (isCompleted) {
            stateClass = "bg-orange-50/50 border-orange-100 text-orange-600";
            icon = <CheckCircle size={20} className="text-orange-500 mb-1" />;
          } else if (isToday) {
            stateClass = status.hasCheckedInToday
              ? "bg-orange-50/50 border-orange-100 text-orange-600"
              : "bg-white border-orange-300 text-orange-600 shadow-sm";
            icon = status.hasCheckedInToday
              ? <CheckCircle size={20} className="text-orange-500 mb-1" />
              : <Gift size={22} className="text-orange-500 mb-1" />;
            textClass = status.hasCheckedInToday ? "text-[11px]" : "text-[13px] font-extrabold text-orange-500";
          }

          return (
            <div key={index} className={`flex flex-col items-center justify-center py-3 px-1 rounded-[8px] border transition-all duration-300 ${stateClass} ${dayNumber === 7 ? "col-span-4 md:col-span-1" : ""}`}>
              <span className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider opacity-70">Ngày {dayNumber}</span>
              {icon}
              <div className="mt-1.5 flex items-center font-bold">
                <span className={textClass}>+{reward}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full mb-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-orange-500 transition-colors">
        <ChevronLeft size={16} /> Quay lại trang chủ
      </Link>
      <div className="bg-white rounded-[10px] shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Header Banner Nhẹ Nhàng */}
        <div className="bg-orange-50/50 py-4 px-6 md:py-5 md:px-8 border-b border-orange-100/50 relative overflow-hidden flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-orange-200 bg-white shadow-sm mb-2 text-orange-500">
            <Calendar className="w-4 h-4" />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-1">Trung Tâm Nhận Thưởng</h2>
          <p className="text-[13px] text-slate-500">
            Chuỗi điểm danh của bạn đang là <strong className="text-orange-500 text-sm mx-0.5">{status?.currentStreak || 0}</strong> ngày liên tiếp.
          </p>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1 font-medium">
            <AlertCircle size={13} /> Đừng bỏ lỡ ngày nào để nhận tối đa 300 xu vào ngày thứ 7 nhé!
          </p>
        </div>

        <div className="p-5 md:p-6">
          {/* Days Grid */}
          {renderDays()}

          {/* Action Button */}
          <div className="flex justify-center mt-2">
            <button
              onClick={handleCheckIn}
              disabled={status?.hasCheckedInToday || checkingIn}
              className={`
                  relative overflow-hidden group font-bold text-[13px] rounded-[8px] px-8 py-2.5 transition-all duration-300 w-full sm:w-auto
                  ${status?.hasCheckedInToday
                  ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] shadow-sm border border-transparent"
                }
                `}
            >
              <span className="relative z-10 flex items-center gap-2 justify-center">
                {checkingIn ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : status?.hasCheckedInToday ? (
                  <>
                    <CheckCircle size={16} /> Đã Điểm Danh Hôm Nay
                  </>
                ) : (
                  <>
                    <Gift size={16} /> Nhận {status?.pointsForNextCheckIn || 0} Xu Ngay!
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Lucky Wheel Banner */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            {token ? (
              <LuckyWheelWidget token={token} />
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

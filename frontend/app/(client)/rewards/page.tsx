"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCheckInStatus, performCheckIn, DailyCheckInStatus } from "@/lib/api";
import { Gift, CheckCircle, Calendar, Sparkles, AlertCircle, ChevronLeft } from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

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

        toast.success(result.message || "Điểm danh thành công!", { icon: "🎉" });
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
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-8">
        {status.rewardSequence.map((reward, index) => {
          const dayNumber = index + 1;
          // Logic for UI representation
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
          const isFuture = index > activeIndex && index >= visualStreak;
          
          let stateClass = "bg-white border-slate-200 text-slate-400";
          let icon = <Gift size={24} className="text-slate-300 mb-1" />;
          
          if (isCompleted) {
            stateClass = "bg-orange-50 border-orange-200 text-orange-600";
            icon = <CheckCircle size={24} className="text-orange-500 mb-1" />;
          } else if (isToday) {
            stateClass = status.hasCheckedInToday 
              ? "bg-orange-50 border-orange-200 text-orange-600" 
              : "bg-gradient-to-br from-orange-100 to-amber-100 border-orange-300 text-orange-600 shadow-md ring-2 ring-orange-400 ring-offset-1 transform scale-105";
            icon = status.hasCheckedInToday 
              ? <CheckCircle size={24} className="text-orange-500 mb-1" />
              : <Gift size={28} className="text-orange-500 mb-1 animate-bounce" />;
          }

          return (
            <div key={index} className={`flex flex-col items-center justify-center p-3 rounded-[10px] border-2 transition-all duration-300 ${stateClass} ${dayNumber === 7 ? "col-span-4 md:col-span-1" : ""}`}>
              <span className="text-xs font-medium mb-2 uppercase opacity-80">Ngày {dayNumber}</span>
              {icon}
              <div className="mt-2 flex items-center font-bold">
                <span className={isToday && !status.hasCheckedInToday ? "text-lg text-orange-600" : "text-sm"}>+{reward}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 text-slate-600 transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-orange-500" /> Điểm Danh Hàng Ngày
          </h1>
        </div>

        <div className="bg-white rounded-[10px] shadow-sm border border-slate-100 overflow-hidden relative">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-20 transform translate-x-1/4 -translate-y-1/4">
              <Sparkles size={180} />
            </div>
            <div className="relative z-10 w-full md:w-3/4 lg:w-2/3">
              <h2 className="text-3xl font-extrabold mb-2 text-white whitespace-normal">Nhận Xu Mỗi Ngày!</h2>
              <p className="text-orange-50 text-lg">
                Chuỗi điểm danh của bạn đang là <strong className="bg-white text-orange-500 px-2 py-0.5 rounded-md text-xl mx-1">{status?.currentStreak || 0}</strong> ngày liên tiếp.
              </p>
              <p className="text-orange-100 text-sm mt-2 flex items-center gap-1">
                <AlertCircle size={16} /> Đừng bỏ lỡ ngày nào để nhận tối đa 100 xu vào ngày thứ 7 nhé!
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {/* Days Grid */}
            {renderDays()}

            {/* Action Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleCheckIn}
                disabled={status?.hasCheckedInToday || checkingIn}
                className={`
                  relative overflow-hidden group font-bold text-lg rounded-full px-12 py-4 shadow-lg transition-all duration-300 w-full sm:w-auto
                  ${status?.hasCheckedInToday 
                    ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed border border-slate-200" 
                    : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-orange-500/30 hover:scale-105 active:scale-95"
                  }
                `}
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shine z-0" />
                <span className="relative z-10 flex items-center gap-2 justify-center">
                  {checkingIn ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : status?.hasCheckedInToday ? (
                    <>
                      <CheckCircle size={24} /> Đã Điểm Danh Hôm Nay
                    </>
                  ) : (
                    <>
                      <Gift size={24} /> Nhận {status?.pointsForNextCheckIn || 0} Xu Ngay!
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

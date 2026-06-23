"use client";

import React, { useState, useEffect } from "react";
import { getLuckyWheelStatus, spinLuckyWheel, LuckyWheelStatusResponse } from "@/lib/features/minigame/minigameApi";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { CheckCircle, Play } from "lucide-react";

const options = [
  { name: "100 Xu", color: "#f97316", textColor: "#ffffff", id: 100 },
  { name: "500 Xu", color: "#fb923c", textColor: "#ffffff", id: 500 },
  { name: "1000 Xu", color: "#ea580c", textColor: "#ffffff", id: 1000 },
  { name: "Không trúng", color: "#94a3b8", textColor: "#ffffff", id: 0 },
  { name: "200 Xu", color: "#f97316", textColor: "#ffffff", id: 200 },
  { name: "300 Xu", color: "#fb923c", textColor: "#ffffff", id: 300 },
];

export default function LuckyWheelWidget({ token }: { token: string }) {
  const [status, setStatus] = useState<LuckyWheelStatusResponse | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [selectedReward, setSelectedReward] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    getLuckyWheelStatus(token)
      .then(res => setStatus(res))
      .catch(err => console.error(err));
  }, [token]);

  const triggerConfetti = () => {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    var interval: any = setInterval(function() {
      var timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      var particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleSpinClick = async () => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để tham gia");
      return;
    }
    if (status?.hasSpunToday) {
      toast.error("Bạn đã quay vòng quay hôm nay rồi!");
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedReward(null);

    try {
      const result = await spinLuckyWheel(token);
      let targetIndex = options.findIndex(o => o.id === result.wonPoints);
      if (targetIndex === -1) targetIndex = 3; 
      
      const centerAngle = targetIndex * 60 + 30;
      const targetRotation = 360 - centerAngle;
      
      const spins = 6; 
      const randomOffset = Math.floor(Math.random() * 30) - 15;
      const finalAngle = rotationAngle + (spins * 360) + (targetRotation - (rotationAngle % 360)) + randomOffset;
      
      setRotationAngle(finalAngle);
      
      setTimeout(() => {
        setIsSpinning(false);
        setSelectedReward(result);
        if (result.wonPoints > 0) {
          triggerConfetti();
          toast.success(result.message);
        } else {
          toast.info(result.message);
        }
        setStatus(prev => prev ? { ...prev, hasSpunToday: true, spinsRemaining: 0 } : null);
        window.dispatchEvent(new Event("auth-change"));
      }, 5500); 
      
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi khi quay");
      setIsSpinning(false);
    }
  };

  const conicGradient = options.map((opt, i) => `${opt.color} ${i * 60}deg ${(i + 1) * 60}deg`).join(", ");

  return (
    <div className="w-full flex flex-row flex-wrap justify-center items-stretch gap-6 py-4">
      
      {/* CARD 1: Wheel Container */}
      <div className="w-full flex-1 min-w-[300px] max-w-[420px] rounded-2xl p-6 md:p-8 flex items-center justify-center relative">
        <div className="relative w-full max-w-[300px] aspect-square mx-auto">
          
          {/* Pointer (Mũi tên) */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] text-orange-600">
            <svg width="40" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 24L0 0h24z" />
            </svg>
          </div>
          
          {/* Outer Rim */}
          <div className="w-full h-full rounded-full p-[10px] bg-orange-50 shadow-[0_4px_20px_rgba(249,115,22,0.15)] flex items-center justify-center relative border-[6px] border-orange-200">
            
            {/* Đèn trang trí */}
            {Array.from({ length: 6 }).map((_, i) => {
              const rotation = i * 30;
              return (
                <div
                  key={`light-${i}`}
                  className="absolute top-0 bottom-0 left-1/2 w-2.5 flex flex-col justify-between py-[4px] -translate-x-1/2 z-10"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-300 shadow-[0_0_6px_#fde047] animate-pulse"></div>
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-300 shadow-[0_0_6px_#fde047] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
              )
            })}
            
            {/* Vòng quay chính */}
            <div 
              className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
              style={{
                background: `conic-gradient(from 0deg, ${conicGradient})`,
                transform: `rotate(${rotationAngle}deg)`,
                transition: isSpinning ? "transform 5.5s cubic-bezier(0.2, 0.8, 0.15, 1)" : "none"
              }}
            >
              {/* Các đường kẻ phân cách */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`line-${i}`}
                  className="absolute top-0 bottom-1/2 left-1/2 w-[1.5px] bg-white/40 origin-bottom -translate-x-1/2"
                  style={{ transform: `rotate(${i * 60}deg)` }}
                ></div>
              ))}

              {/* Chữ trên vòng quay */}
              {options.map((opt, i) => {
                const rotateAngle = i * 60 + 30 - 90;
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 flex items-center font-bold text-[12px] sm:text-[14px] z-10"
                    style={{
                      transformOrigin: "0 0",
                      transform: `rotate(${rotateAngle}deg) translate(30px, -50%)`,
                      width: '100px',
                      color: opt.textColor
                    }}
                  >
                    <span className="w-full text-left whitespace-nowrap drop-shadow-sm ml-[15%]">
                      {opt.name}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Nút trung tâm */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg z-20 flex items-center justify-center border-4 border-orange-100">
              <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-inner"></div>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Thông tin & Button Quay */}
      <div className="w-full flex-1 min-w-[300px] max-w-[420px] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        
        <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[13px] font-bold border border-orange-100 whitespace-nowrap mb-4">
          <span className="text-sm">🎟️</span>
          Lượt quay còn lại: {status ? status.spinsRemaining : "..."}
        </div>
        
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3 whitespace-nowrap">Vòng Quay May Mắn</h3>
        
        <p className="text-slate-500 text-[14px] mb-8 w-full">
          Cơ hội trúng <strong className="text-orange-500">1000 Xu LazPe</strong> mỗi ngày!
        </p>

        <button
          onClick={handleSpinClick}
          disabled={isSpinning || status?.hasSpunToday}
          className={`
            relative overflow-hidden group font-bold text-[14px] rounded-[8px] px-8 py-3 transition-all duration-300 w-full max-w-[260px]
            ${isSpinning || status?.hasSpunToday 
              ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200" 
              : "bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] shadow-sm border border-transparent"
            }
          `}
        >
          <span className="relative z-10 flex items-center gap-2 justify-center whitespace-nowrap">
            {isSpinning ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : status?.hasSpunToday ? (
              <>
                <CheckCircle size={18} /> Đã Quay Hôm Nay
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" /> Quay Ngay!
              </>
            )}
          </span>
        </button>

        {/* Kết quả hiển thị */}
        {selectedReward && (
          <div className="mt-8 p-4 bg-orange-50/50 rounded-xl border border-orange-100 w-full animate-in fade-in slide-in-from-bottom-2">
            <p className="text-[13px] font-semibold text-slate-500 mb-1 whitespace-nowrap">Kết quả của bạn</p>
            <div className="text-xl font-bold text-slate-800 mb-1 whitespace-nowrap">
              {selectedReward.wonPoints > 0 ? (
                <span className="text-orange-600">{selectedReward.rewardName} 🎉</span>
              ) : (
                <span className="text-slate-600">Không trúng thưởng 😅</span>
              )}
            </div>
            <p className="text-[13px] text-slate-500">{selectedReward.message}</p>
          </div>
        )}
      </div>

    </div>
  );
}

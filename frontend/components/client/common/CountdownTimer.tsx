"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: string;
  onExpire?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light" | "rose";
}

export default function CountdownTimer({
  endTime,
  onExpire,
  size = "md",
  variant = "rose"
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    ended: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, ended: false });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        if (onExpire) onExpire();
        return { hours: 0, minutes: 0, seconds: 0, ended: true };
      }

      // Calculate hours, minutes, seconds directly (supports >24 hours as total hours)
      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return { hours, minutes, seconds, ended: false };
    };

    // Initial calculation
    setTimeLeft(calculateTime());

    const timer = setInterval(() => {
      const nextTime = calculateTime();
      setTimeLeft(nextTime);
      if (nextTime.ended) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (timeLeft.ended) {
    return (
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
        Đã kết thúc
      </span>
    );
  }

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  const sizeClasses = {
    sm: {
      box: "w-7 h-7 text-xs rounded-md",
      colon: "text-xs font-bold",
      label: "text-[9px]"
    },
    md: {
      box: "w-9 h-9 text-sm rounded-lg",
      colon: "text-sm font-bold",
      label: "text-[10px]"
    },
    lg: {
      box: "w-12 h-12 text-lg rounded-xl",
      colon: "text-lg font-bold",
      label: "text-xs"
    }
  }[size];

  const variantClasses = {
    dark: {
      box: "bg-slate-900 text-white font-extrabold shadow-sm",
      colon: "text-slate-800",
      labelColor: "text-slate-500"
    },
    light: {
      box: "bg-white text-slate-900 border border-slate-200 font-extrabold shadow-sm",
      colon: "text-slate-400",
      labelColor: "text-slate-400"
    },
    rose: {
      box: "bg-rose-600 text-white font-extrabold shadow-sm shadow-rose-500/20",
      colon: "text-rose-600",
      labelColor: "text-rose-500"
    }
  }[variant];

  return (
    <div className="flex items-center gap-1.5 select-none">
      {/* Hours */}
      <div className="flex flex-col items-center">
        <div className={`flex items-center justify-center ${sizeClasses.box} ${variantClasses.box}`}>
          {formatNumber(timeLeft.hours)}
        </div>
      </div>
      
      <span className={`${sizeClasses.colon} ${variantClasses.colon}`}>:</span>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        <div className={`flex items-center justify-center ${sizeClasses.box} ${variantClasses.box}`}>
          {formatNumber(timeLeft.minutes)}
        </div>
      </div>

      <span className={`${sizeClasses.colon} ${variantClasses.colon}`}>:</span>

      {/* Seconds */}
      <div className="flex flex-col items-center">
        <div className={`flex items-center justify-center ${sizeClasses.box} ${variantClasses.box}`}>
          {formatNumber(timeLeft.seconds)}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(59); // 00:59
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const verifyOtp = async (otpValue: string) => {
    setError("");
    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/Authentication/verify-reset-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          otp: otpValue,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push(`/reset-password?userId=${data.userId}&resetSessionToken=${data.resetSessionToken}`);
      } else {
        setError(data.message || "Xác thực OTP thất bại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (isNaN(Number(val))) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto-focus next field
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }

    // Auto-verify if all 6 digits are filled
    const completedOtp = newOtp.join("");
    if (completedOtp.length === 6 && newOtp.every(d => d !== "")) {
      verifyOtp(completedOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
        }
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return; // Only accept 6-digit numbers

    const newOtp = pasteData.split("");
    setOtp(newOtp);

    // Focus the last input field
    const lastInput = document.getElementById("otp-5");
    if (lastInput) {
      (lastInput as HTMLInputElement).focus();
    }

    // Trigger verification
    verifyOtp(pasteData);
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError("");
    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/Authentication/send-reset-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTimeLeft(59);
        setCanResend(false);
      } else {
        setError(data.message || "Gửi lại mã OTP thất bại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setError("Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.");
      return;
    }
    await verifyOtp(otpValue);
  };

  return (
    <div className="w-full max-w-[540px] bg-white rounded-xl p-6 md:p-12 joyful-shadow relative z-10 hover:scale-[1.01] transition-transform duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-container/30 text-primary rounded-full mb-6">
          <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            mark_email_read
          </span>
        </div>
        <h1 className="font-headline-lg text-3xl font-bold text-on-surface mb-2">Xác thực mã OTP</h1>
        <p className="font-body-md text-sm text-on-surface-variant px-4">
          Vui lòng nhập mã OTP đã được gửi đến email <span className="font-semibold text-primary">{email}</span>.
        </p>
      </div>

      <form className="space-y-8" onSubmit={handleVerify}>
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex justify-between gap-2 md:gap-4">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold bg-surface-container-low border-2 border-transparent rounded-lg focus:border-primary focus:bg-white outline-none transition-all duration-200"
              maxLength={1}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={handlePaste}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        <div className="text-center space-y-2">
          {!canResend ? (
            <p className="font-label-md text-sm text-on-surface-variant flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Gửi lại mã sau <span className="font-bold text-primary tabular-nums">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-label-md text-sm text-primary hover:underline cursor-pointer font-bold"
            >
              Gửi lại mã OTP
            </button>
          )}
        </div>

        <button
          className="w-full bg-primary text-on-primary py-4 rounded-full font-headline-md font-semibold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all duration-150 disabled:opacity-75"
          type="submit"
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Xác thực"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-surface-variant flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-secondary text-base">help</span>
        <span className="font-label-sm text-xs text-on-surface-variant">
          Không nhận được mã? Hãy kiểm tra hộp thư rác.
        </span>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden bg-gradient-to-br from-[#ffd9de] via-[#f8f9fa] to-white">
      {/* Decorative Orbs */}
      <div className="absolute rounded-full filter blur-[60px] opacity-40 bg-primary-container w-[300px] h-[300px] top-[-10%] left-[-5%] -z-10"></div>
      <div className="absolute rounded-full filter blur-[60px] opacity-40 bg-secondary-container w-[400px] h-[400px] bottom-[-10%] right-[-5%] -z-10"></div>

      <main className="flex-grow flex items-center justify-center px-4 py-12 md:py-24 w-full">
        <Suspense fallback={
          <div className="w-full max-w-[540px] bg-white rounded-xl p-12 flex justify-center items-center">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
          </div>
        }>
          <VerifyOtpContent />
        </Suspense>
      </main>
    </div>
  );
}

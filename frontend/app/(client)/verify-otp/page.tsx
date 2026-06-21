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
    <div className="w-full max-w-[500px] bg-surface-container-lowest rounded-[5px] overflow-hidden shadow-[0_20px_50px_-10px_rgba(135,78,88,0.2)] z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-8 md:p-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary-container rounded-[5px] flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              mark_email_read
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl font-bold text-primary mb-2">Xác thực mã OTP</h1>
          <p className="font-body-md text-[13px] text-on-surface-variant px-2">
            Vui lòng nhập mã OTP đã được gửi đến email <span className="font-semibold text-primary">{email}</span>.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleVerify}>
          {error && (
            <div className="p-2.5 bg-red-100 text-red-700 text-xs font-medium rounded-[5px] border border-red-200 text-center">
              {error}
            </div>
          )}

          <div className="flex justify-between gap-2 md:gap-3 px-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold bg-surface-container-low border-2 border-transparent rounded-[5px] focus:border-primary/50 focus:bg-white outline-none transition-all duration-200 shadow-inner"
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

          <div className="text-center space-y-2 pt-2">
            {!canResend ? (
              <p className="font-label-md text-xs text-on-surface-variant flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                Gửi lại mã sau <span className="font-bold text-primary tabular-nums">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-label-md text-[13px] text-primary hover:underline cursor-pointer font-bold flex items-center justify-center gap-1.5 mx-auto"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                Gửi lại mã OTP
              </button>
            )}
          </div>

          <div className="pt-2">
            <button
              className="w-full h-12 bg-primary text-on-primary rounded-[5px] font-headline-md text-[13px] flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-75 disabled:hover:translate-y-0"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  Xác thực
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-5 border-t border-outline-variant/30 flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-outline text-[16px]">help</span>
          <span className="font-label-sm text-[11px] text-on-surface-variant">
            Không nhận được mã? Hãy kiểm tra hộp thư rác.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="w-full flex-grow flex items-center justify-center px-4 py-8 relative overflow-hidden bg-primary-container min-h-screen">
      {/* Background Decorations for full page */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-30 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary-container opacity-40 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl"></div>

      <Suspense fallback={
        <div className="w-full max-w-[500px] bg-surface-container-lowest rounded-[5px] p-12 flex justify-center items-center shadow-[0_20px_50px_-10px_rgba(135,78,88,0.2)]">
          <span className="material-symbols-outlined animate-spin text-primary text-[40px]">sync</span>
        </div>
      }>
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}

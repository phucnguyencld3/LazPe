"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // Redirect to verify-otp page with userId and email
        router.push(`/verify-otp?userId=${data.userId}&email=${encodeURIComponent(email)}`);
      } else {
        setError(data.message || "Gửi OTP thất bại. Vui lòng kiểm tra lại email.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-grow flex items-center justify-center px-4 py-8 relative overflow-hidden bg-primary-container min-h-screen">
      {/* Background Decorations for full page */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-30 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary-container opacity-40 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl"></div>

      <div className="w-full max-w-[500px] bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_20px_50px_-10px_rgba(135,78,88,0.2)] z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-8 md:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-[32px]">lock_reset</span>
            </div>
            <h1 className="font-headline-lg text-2xl font-bold text-primary mb-2">Quên mật khẩu?</h1>
            <p className="font-body-md text-[13px] text-on-surface-variant max-w-[320px]">
              Nhập email của bạn để nhận mã OTP khôi phục mật khẩu.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-2.5 bg-red-100 text-red-700 text-xs font-medium rounded-xl border border-red-200 text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-label-md text-[13px] font-semibold text-on-surface-variant ml-1" htmlFor="email">
                Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">
                  mail
                </span>
                <input 
                  className="w-full h-12 pl-11 pr-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/50 outline-none font-medium text-[13px] text-on-surface transition-all placeholder:text-outline-variant" 
                  id="email" 
                  name="email" 
                  placeholder="example@gmail.com" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                className="w-full h-12 bg-primary text-on-primary rounded-xl font-headline-md text-[13px] flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-75 disabled:hover:translate-y-0" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    Gửi mã OTP
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-5 border-t border-outline-variant/30">
            <Link 
              className="inline-flex items-center gap-1 font-label-md text-[12px] text-primary hover:text-primary/80 transition-colors group" 
              href="/login"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              Quay lại trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      const response = await fetch("http://localhost:5101/api/Authentication/send-reset-otp", {
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
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden bg-gradient-to-br from-[#ffd9de] via-[#f8f9fa] to-white">
      {/* Decorative Orbs */}
      <div className="absolute rounded-full filter blur-[60px] opacity-40 bg-primary-container w-[400px] h-[400px] -top-20 -left-20 -z-10"></div>
      <div className="absolute rounded-full filter blur-[60px] opacity-40 bg-secondary-container w-[300px] h-[300px] top-[40%] -right-20 -z-10"></div>

      <main className="flex-grow flex items-center justify-center px-4 py-12 md:py-24 w-full">
        <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-xl p-6 md:p-12 w-full max-w-[540px] shadow-[0_20px_50px_rgba(135,78,88,0.1)]">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-primary-container/30 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-[40px]">lock_reset</span>
            </div>
            <h1 className="font-headline-lg text-3xl font-bold text-on-surface mb-2">Quên mật khẩu?</h1>
            <p className="font-body-md text-sm text-on-surface-variant max-w-[320px]">
              Nhập email của bạn để nhận mã OTP khôi phục mật khẩu.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <div className="group">
              <label className="block font-label-md text-sm text-on-surface-variant mb-1 ml-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                </div>
                <input 
                  className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border-none rounded-lg ring-1 ring-outline-variant focus:ring-2 focus:ring-primary outline-none font-body-md text-on-surface transition-all placeholder:text-outline-variant" 
                  id="email" 
                  name="email" 
                  placeholder="example@email.com" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button 
              className="w-full h-14 bg-primary text-on-primary rounded-full font-headline-md font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all duration-150 disabled:opacity-75" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Đang gửi...
                </>
              ) : (
                <>
                  Gửi mã OTP
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link 
              className="inline-flex items-center gap-1 font-label-md text-sm text-primary hover:text-on-primary-fixed-variant transition-colors group" 
              href="/login"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              Quay lại trang đăng nhập
            </Link>
          </div>
        </div>
      </main>     
    </div>
  );
}

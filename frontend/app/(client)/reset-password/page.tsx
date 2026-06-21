"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const resetSessionToken = searchParams.get("resetSessionToken") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/Authentication/reset-password-by-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          resetSessionToken,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Đặt lại mật khẩu thất bại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[500px] bg-surface-container-lowest rounded-[5px] overflow-hidden shadow-[0_20px_50px_-10px_rgba(135,78,88,0.2)] z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Decorative Header */}
      <div className="h-32 w-full bg-primary relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white rounded-[5px] blur-xl"></div>
          <div className="absolute top-10 -left-10 w-24 h-24 bg-secondary-container rounded-[5px] blur-xl"></div>
        </div>
        <span className="material-symbols-outlined text-[64px] text-white opacity-90 z-10">lock_reset</span>
      </div>

      {/* Content Container */}
      <div className="p-8 md:p-10">
        <div className="text-center mb-6">
          <h1 className="font-headline-lg text-2xl font-bold text-primary mb-2">Đặt lại mật khẩu</h1>
          <p className="font-body-md text-[13px] text-on-surface-variant px-2">Vui lòng nhập mật khẩu mới để bảo vệ tài khoản của bạn tại LazPe.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-2.5 bg-red-100 text-red-700 text-xs font-medium rounded-[5px] border border-red-200 text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="p-2.5 bg-green-100 text-green-700 text-xs font-medium rounded-[5px] border border-green-200 text-center">
              {success}
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-1">
            <label className="font-label-md text-[12px] font-semibold text-on-surface-variant block ml-1">Mật khẩu mới</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">
                lock
              </span>
              <input 
                className="w-full h-12 pl-11 pr-12 bg-surface-container-low border-none rounded-[5px] focus:ring-2 focus:ring-primary/50 outline-none font-medium text-[13px] text-on-surface transition-all placeholder:text-outline-variant" 
                id="password" 
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors w-8 h-8 flex items-center justify-center rounded-[5px] hover:bg-surface-container" 
                onClick={() => setShowPassword(!showPassword)} 
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="font-label-md text-[12px] font-semibold text-on-surface-variant block ml-1">Xác nhận mật khẩu</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-xl">
                lock_reset
              </span>
              <input 
                className="w-full h-12 pl-11 pr-12 bg-surface-container-low border-none rounded-[5px] focus:ring-2 focus:ring-primary/50 outline-none font-medium text-[13px] text-on-surface transition-all placeholder:text-outline-variant" 
                id="confirm-password" 
                placeholder="••••••••" 
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors w-8 h-8 flex items-center justify-center rounded-[5px] hover:bg-surface-container" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button 
              className="w-full h-12 bg-primary text-on-primary rounded-[5px] font-headline-md text-[13px] flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-75 disabled:hover:translate-y-0"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  Cập nhật mật khẩu
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </>
              )}
            </button>
          </div>

          {/* Back Link */}
          <div className="text-center pt-5 border-t border-outline-variant/30 mt-6">
            <Link 
              className="inline-flex items-center gap-1 font-label-md text-[12px] text-primary hover:text-primary/80 transition-colors group" 
              href="/login"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}

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
    <div className="w-full max-w-[540px] bg-white rounded-xl shadow-[0px_20px_60px_rgba(255,182,193,0.15)] overflow-hidden">
      {/* Decorative Header Image */}
      <div className="h-48 w-full bg-primary-fixed relative overflow-hidden">
        <img 
          alt="Reset Password Decoration" 
          className="w-full h-full object-cover mix-blend-overlay opacity-60" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl10ceiDFbIPla4JG0K9AUTDV8sg1qbvKj8W1McKAJeArPqVhDaBkCuzaKn922HEmF9H69Xao5PtQkPkG_obQm9lPuieljmTFTMAUsy14AjpozLEPFMT7mD_bqNLK3nTBlqRNovJznav3Mr8J27zrKcgQtTrs0lVvQq1VqS7YQYCUdEOHZRAODx8GxJiJpkRdWXYj5ikvPu4wZowRWNGqzkMdLkRrdCphVfAhZpMdpiUrvXYY7k-ayXyEvKfjBy-5fvpMHm6VEzSUx"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* Content Container */}
      <div className="px-6 md:px-12 py-8">
        <div className="text-center mb-8">
          <h1 className="font-headline-lg text-3xl font-bold text-primary mb-2">Đặt lại mật khẩu mới</h1>
          <p className="font-body-md text-sm text-on-surface-variant">Vui lòng nhập mật khẩu mới để bảo vệ tài khoản của bạn tại LazPe.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded">
              {success}
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <label className="font-label-md text-sm text-on-surface-variant block ml-2">Mật khẩu mới</label>
            <div className="relative group">
              <input 
                className="w-full h-14 px-4 bg-surface-container-low border-2 border-transparent rounded-lg focus:border-primary-container focus:bg-white focus:ring-0 transition-all outline-none text-lg" 
                id="password" 
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors" 
                onClick={() => setShowPassword(!showPassword)} 
                type="button"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="font-label-md text-sm text-on-surface-variant block ml-2">Xác nhận mật khẩu mới</label>
            <div className="relative group">
              <input 
                className="w-full h-14 px-4 bg-surface-container-low border-2 border-transparent rounded-lg focus:border-primary-container focus:bg-white focus:ring-0 transition-all outline-none text-lg" 
                id="confirm-password" 
                placeholder="••••••••" 
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                type="button"
              >
                <span className="material-symbols-outlined">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            className="w-full h-14 mt-4 bg-primary text-white font-headline-md font-semibold rounded-full bouncy-hover shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Đang cập nhật...
              </>
            ) : (
              <>
                Cập nhật mật khẩu
                <span className="material-symbols-outlined">check_circle</span>
              </>
            )}
          </button>

          {/* Back Link */}
          <div className="text-center pt-4">
            <Link 
              className="font-label-md text-sm text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 group" 
              href="/login"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
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
    <main className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center px-4 py-12 md:py-24 bg-gradient-to-br from-[#f8f9fa] to-[#ffd9de] relative">
      <Suspense fallback={
        <div className="w-full max-w-[540px] bg-white rounded-xl p-12 flex justify-center items-center shadow-lg">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}

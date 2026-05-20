"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // States to track input focus for icon colors (mirroring the original jquery/vanilla js logic)
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!termsAccepted) {
      setError("Bạn phải đồng ý với điều khoản và chính sách của LazPe.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5101/api/Authentication/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword,
          phoneNumber: phoneNumber || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || "Đăng ký thành công! Bạn đã được đăng nhập tự động.");
        
        // Save token to localStorage (automatic login on register)
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Redirect to homepage after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        setError(data.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInputIconClass = (fieldName: string) => {
    return `material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
      focusedField === fieldName ? "text-primary" : "text-outline-variant"
    }`;
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between selection:bg-primary-container selection:text-on-primary-container relative">
      {/* Decorative floating elements for boutique vibe */}
      <div className="fixed top-[20%] left-[5%] opacity-20 hidden lg:block -z-10">
        <span className="material-symbols-outlined text-6xl text-primary animate-bounce" style={{ animationDuration: "3s" }}>
          child_care
        </span>
      </div>
      <div className="fixed bottom-[20%] right-[5%] opacity-20 hidden lg:block -z-10">
        <span className="material-symbols-outlined text-6xl text-secondary animate-pulse" style={{ animationDuration: "4s" }}>
          toys
        </span>
      </div>

      <main className="flex-grow flex items-center justify-center px-4 py-12 md:py-24 bg-gradient-to-br from-[#f8f9fa] to-[#ffd9de]">
        <div className="w-full max-w-4xl bg-white rounded-xl soft-shadow overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side: Visual/Branding */}
          <div className="hidden md:flex flex-col justify-between w-1/3 bg-primary-container p-6 text-on-primary-container relative overflow-hidden">
            <div className="z-10">
              <h2 className="font-headline-lg text-2xl font-bold mb-3 leading-tight">Gia nhập ngôi nhà nhỏ</h2>
              <p className="font-body-md text-sm opacity-90">Khám phá thế giới đồ chơi gỗ và quần áo hữu cơ cho bé yêu.</p>
            </div>
            
            {/* Decorative Icon Illustration */}
            <div className="z-10 mt-auto flex justify-center py-6">
              <span 
                className="material-symbols-outlined text-[80px] text-on-primary-container opacity-80 fill-current" 
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                toys
              </span>
            </div>
            
            {/* Abstract background shapes for "Luminous Play" vibe */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary-container rounded-full opacity-40"></div>
            <div className="absolute top-20 -left-10 w-24 h-24 bg-white rounded-full opacity-20"></div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="flex-1 p-6 md:p-12">
            <div className="mb-8 text-center md:text-left">
              <h1 className="font-headline-lg text-3xl font-bold text-primary mb-1">Trang Đăng Ký</h1>
              <p className="font-body-md text-sm text-on-surface-variant">Tạo tài khoản để nhận ưu đãi dành riêng cho bé.</p>
            </div>

            <form className="space-y-6" onSubmit={handleRegister}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ và tên */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-sm text-primary ml-3" htmlFor="full-name">Họ và tên</label>
                  <div className="relative">
                    <span className={getInputIconClass("fullName")}>person</span>
                    <input 
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-none rounded-lg font-body-md focus:ring-2 focus:ring-primary-container transition-all" 
                      id="full-name" 
                      placeholder="Nguyễn Văn A" 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={() => setFocusedField("fullName")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-sm text-primary ml-3" htmlFor="phone">Số điện thoại</label>
                  <div className="relative">
                    <span className={getInputIconClass("phone")}>call</span>
                    <input 
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-none rounded-lg font-body-md focus:ring-2 focus:ring-primary-container transition-all" 
                      id="phone" 
                      placeholder="090 123 4567" 
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-sm text-primary ml-3" htmlFor="email">Email</label>
                <div className="relative">
                  <span className={getInputIconClass("email")}>mail</span>
                  <input 
                    className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-none rounded-lg font-body-md focus:ring-2 focus:ring-primary-container transition-all" 
                    id="email" 
                    placeholder="example@gmail.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              {/* Ngày sinh */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-sm text-primary ml-3" htmlFor="dob">Ngày sinh của bé (hoặc dự sinh)</label>
                <div className="relative">
                  <span className={getInputIconClass("dob")}>calendar_today</span>
                  <input 
                    className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-none rounded-lg font-body-md focus:ring-2 focus:ring-primary-container transition-all appearance-none" 
                    id="dob" 
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    onFocus={() => setFocusedField("dob")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mật khẩu */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-sm text-primary ml-3" htmlFor="password">Mật khẩu</label>
                  <div className="relative">
                    <span className={getInputIconClass("password")}>lock</span>
                    <input 
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-none rounded-lg font-body-md focus:ring-2 focus:ring-primary-container transition-all" 
                      id="password" 
                      placeholder="••••••••" 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>

                {/* Xác nhận mật khẩu */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-sm text-primary ml-3" htmlFor="confirm-password">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <span className={getInputIconClass("confirmPassword")}>lock_reset</span>
                    <input 
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-none rounded-lg font-body-md focus:ring-2 focus:ring-primary-container transition-all" 
                      id="confirm-password" 
                      placeholder="••••••••" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3 py-1">
                <div className="relative flex items-center h-5">
                  <input 
                    className="w-5 h-5 rounded-md border-outline-variant text-primary focus:ring-primary-container cursor-pointer accent-primary" 
                    id="terms" 
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                </div>
                <label className="font-label-md text-sm text-on-surface-variant cursor-pointer select-none" htmlFor="terms">
                  Tôi đồng ý với <a className="text-primary hover:underline font-bold" href="#">điều khoản và chính sách</a> của LazPe.
                </label>
              </div>

              {/* CTA Button */}
              <button 
                className="w-full h-14 bg-primary text-on-primary font-headline-md rounded-full bouncy-hover soft-shadow flex items-center justify-center gap-3 active:scale-95 transition-transform duration-200 disabled:opacity-75 disabled:hover:scale-100" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đăng Ký
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-8 text-center">
              <p className="font-body-md text-sm text-on-surface-variant">
                Đã có tài khoản?{" "}
                <Link className="text-primary font-bold hover:underline ml-1" href="/login">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

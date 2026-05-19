"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5101/api/Authentication/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Lưu token vào localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Chuyển hướng về trang chủ
        router.push("/");
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 md:px-16 py-20 relative overflow-hidden bg-background min-h-[calc(100vh-80px)]">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-container opacity-20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-container opacity-20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      {/* Login Card */}
      <div className="w-full max-w-5xl bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col md:flex-row shadow-[0_20px_40px_-10px_rgba(135,78,88,0.1)] z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Left Side: Visual/Branding */}
        <div className="hidden md:flex md:w-1/2 bg-primary-container relative flex-col justify-center items-center p-20 text-center">
          <div className="absolute inset-0 opacity-40">
            <img 
              alt="LazPe Kids" 
              className="w-full h-full object-cover" 
              src="/login-page-img/Login-img-001.png"
            />
          </div>
          <div className="relative z-10 space-y-6">
            <h1 className="font-headline-md text-5xl font-bold text-on-primary-container leading-[56px] tracking-[-0.02em]">
              Chào mừng trở lại!
            </h1>
            <p className="font-body-md text-lg text-on-primary-container font-medium px-12">
              Tiếp tục hành trình khám phá thế giới diệu kỳ cùng bé yêu của bạn tại LazPe.
            </p>
          </div>
          
          {/* Decorative Floater */}
          <div className="absolute bottom-6 left-6 bg-white/30 backdrop-blur-md p-6 rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-primary fill-current">favorite</span>
            <span className="font-label-md font-semibold text-sm text-on-primary-container">100% An toàn & Niềm vui</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-12 md:p-20 flex flex-col justify-center">
          <div className="mb-12 text-center md:text-left">
            <h2 className="font-headline-lg text-3xl font-bold text-primary mb-1">Đăng nhập</h2>
            <p className="font-body-md text-on-surface-variant">Nhập thông tin của bạn để truy cập tài khoản</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {/* Email Field */}
            <div className="space-y-1">
              <label className="font-label-md font-semibold text-sm text-on-surface-variant ml-2">Email</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-14 pl-12 pr-6 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary-container text-on-surface transition-all" 
                  placeholder="email@vidu.com" 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-2 pr-2">
                <label className="font-label-md font-semibold text-sm text-on-surface-variant">Mật khẩu</label>
                <Link href="/forgot-password" className="font-label-sm font-bold text-xs text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-14 pl-12 pr-12 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary-container text-on-surface transition-all" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 space-y-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary text-on-primary font-headline-md rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-outline-variant"></div>
                <span className="flex-shrink mx-6 font-bold text-xs text-on-surface-variant">Hoặc</span>
                <div className="flex-grow border-t border-outline-variant"></div>
              </div>

              <div className="text-center">
                <p className="font-body-md text-on-surface-variant">
                  Chưa có tài khoản? 
                  <Link href="/register" className="text-primary font-bold hover:underline ml-1">
                    Tạo tài khoản mới
                  </Link>
                </p>
              </div>
            </div>
          </form>

          {/* Social Proof / Footer inside card */}
          <div className="mt-20 flex justify-center gap-12">
            <button className="p-6 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
              <img alt="Google" className="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Y_bpawEZwQ_1quHszPtLK_TJUWkc36jcScJCfI5xMV1EfUAHwjuQbdjhs96DksoRjtmNalPjJPSUjkFjCZNsN2ZoUGUF_Jv0HlkTWXIgi4d0GBEfdxFikp_UaQb_aZKG2nNZb1VcxBmMB41BU1UkGjllV_jAJGxmWNr_TURD7gJoGagWO7etGsaOi--8QErYYkAHRo9Lhpw1HUnoPP4l2-R5KlaeF39CWSg8Xxe2LA5PwYkYPu5dtBg9pRjTXJAyprHgufcnqOnp" />
            </button>
            <button className="p-6 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
              <img alt="Facebook" className="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUGmQ4Wc7m1zyg2hFUHGSmepByqTAVfek9d6OZQg8s0CgrCaAhdgSv9Z7mZ89m-Q9kWJDCRCDsDEqZx42xG7cJsU_Hxxc-V18HPCgTVgdPrLVcDr_5it3Xcq0W5Hya-0T-KDnanrQa8cpYgZX2RZvndB6m6V-DaQq1v4VV3DvA_2LsOpmuWDQXfhb6G3mJ_D99OovmKrhxmT6B9ZclJ1mA819aExRGFsLZYOWFpL_K8eotdNFsqBfHxd4jeLISdvyTeUvC_fZ_FFpU" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

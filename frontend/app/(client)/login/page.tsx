"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getValidToken } from "@/lib/utils/auth";
import { verify2FaLogin, send2FaLoginEmailOtp, googleLogin } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // 2FA States
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorProvider, setTwoFactorProvider] = useState("");
  const [twoFactorProviders, setTwoFactorProviders] = useState<string[]>([]);
  const [tempUserId, setTempUserId] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for email OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendEmailOtp = async (userIdToUse?: string) => {
    const targetUserId = userIdToUse || tempUserId;
    if (!targetUserId) return;

    try {
      setLoading(true);
      setError("");
      const result = await send2FaLoginEmailOtp(targetUserId);
      if (result.success) {
        setEmailOtpSent(true);
        setCountdown(60);
      } else {
        setError(result.message || "Không thể gửi mã OTP qua email");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối khi gửi mã OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    setTwoFactorProvider(provider);
    setError("");
    setTwoFactorCode("");
    if (provider === "Email" && !emailOtpSent) {
      handleSendEmailOtp();
    }
  };

  const handleTwoFactorVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserId || !twoFactorCode) return;
    setError("");
    setLoading(true);

    try {
      const result = await verify2FaLogin(tempUserId, twoFactorCode, twoFactorProvider);
      if (result.success && result.token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        if (rememberMe) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));
        } else {
          sessionStorage.setItem("token", result.token);
          sessionStorage.setItem("user", JSON.stringify(result.user));
        }

        let hasDashboardAccess = false;
        try {
          const user = result.user;
          const roles = user?.roles || [];
          const permissions = user?.permissions || [];
          hasDashboardAccess = !!(user?.isAdmin || roles.includes("Admin") || permissions.length > 0);
        } catch (evalError) {
          console.error("Error evaluating redirect:", evalError);
        }

        if (hasDashboardAccess) {
          window.location.href = "/admin";
        } else if (!result.user?.isOnboarded) {
          window.location.href = "/onboarding";
        } else {
          window.location.href = "/";
        }
      } else {
        setError(result.message || "Xác thực 2FA thất bại");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getValidToken();
    if (token) {
      const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (savedUserJson) {
        try {
          const user = JSON.parse(savedUserJson);
          const roles = user?.roles || [];
          const permissions = user?.permissions || [];
          const hasDashboardAccess = !!(user?.isAdmin || roles.includes("Admin") || permissions.length > 0);

          if (hasDashboardAccess) {
            window.location.replace("/admin");
          } else if (!user?.isOnboarded) {
            window.location.replace("/onboarding");
          } else {
            window.location.replace("/");
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError("Đăng nhập Google thất bại (không có credential).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await googleLogin(credentialResponse.credential);
      if (data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        if (rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }

        let hasDashboardAccess = false;
        try {
          const user = data.user;
          const roles = user?.roles || [];
          const permissions = user?.permissions || [];
          hasDashboardAccess = !!(user?.isAdmin || roles.includes("Admin") || permissions.length > 0);
        } catch (evalError) {
          console.error("Error evaluating redirect:", evalError);
        }

        if (hasDashboardAccess) {
          window.location.href = "/admin";
        } else if (!data.user?.isOnboarded) {
          window.location.href = "/onboarding";
        } else {
          window.location.href = "/";
        }
      } else {
        setError(data.message || "Đăng nhập Google thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/Authentication/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.requiresTwoFactor) {
          setTempUserId(data.userId);
          setTwoFactorProviders(data.providers || []);
          const defaultProvider = data.providers?.includes("Authenticator")
            ? "Authenticator"
            : (data.providers?.includes("Email") ? "Email" : "Authenticator");
          setTwoFactorProvider(defaultProvider);
          setShowTwoFactor(true);
          setError("");

          if (defaultProvider === "Email") {
            handleSendEmailOtp(data.userId);
          }
          setLoading(false);
          return;
        }

        // Xóa sạch cả hai kho lưu trữ trước để tránh xung đột
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        if (rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }

        // Chuyển hướng: Admin hoặc User có các quyền được gán về trang quản trị, còn lại về trang chủ
        let hasDashboardAccess = false;
        try {
          const user = data.user;
          const roles = user?.roles || [];
          const permissions = user?.permissions || [];

          console.log("=== Login Debug ===");
          console.log("User:", user);
          console.log("Roles:", roles);
          console.log("Permissions:", permissions);

          hasDashboardAccess = !!(user?.isAdmin || roles.includes("Admin") || permissions.length > 0);
          console.log("hasDashboardAccess:", hasDashboardAccess);
        } catch (evalError) {
          console.error("Error evaluating redirect:", evalError);
        }

        if (hasDashboardAccess) {
          window.location.href = "/admin";
        } else if (!data.user?.isOnboarded) {
          window.location.href = "/onboarding";
        } else {
          window.location.href = "/";
        }
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

  if (showTwoFactor) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-20 relative overflow-hidden bg-background">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-container opacity-20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-container opacity-20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

        {/* 2FA Card */}
        <div className="w-full max-w-md min-w-[320px] md:min-w-[400px] flex-shrink-0 bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_20px_40px_-10px_rgba(135,78,88,0.1)] z-10 p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <h2 className="font-headline-lg text-2xl font-bold text-primary mb-2">Xác thực 2 bước</h2>
            <p className="font-body-md text-slate-500 text-sm">Tài khoản của bạn đã được bảo vệ. Vui lòng nhập mã xác thực để đăng nhập.</p>
          </div>

          {/* Segmented Buttons for Provider Choice if multiple are available */}
          {twoFactorProviders.length > 1 && (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              {twoFactorProviders.includes("Authenticator") && (
                <button
                  type="button"
                  onClick={() => handleProviderChange("Authenticator")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${twoFactorProvider === "Authenticator"
                    ? "bg-white text-slate-800 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800 font-semibold"
                    }`}
                >
                  Authenticator App
                </button>
              )}
              {twoFactorProviders.includes("Email") && (
                <button
                  type="button"
                  onClick={() => handleProviderChange("Email")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${twoFactorProvider === "Email"
                    ? "bg-white text-slate-800 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800 font-semibold"
                    }`}
                >
                  Email OTP
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleTwoFactorVerify} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Provider instructions */}
            <div className="text-center text-xs font-medium text-slate-500 bg-slate-50 rounded-xl p-4">
              {twoFactorProvider === "Authenticator" ? (
                <span>Mở ứng dụng xác thực của bạn (Google/Microsoft Authenticator) để lấy mã gồm 6 chữ số.</span>
              ) : (
                <span>Chúng tôi đã gửi mã xác thực gồm 6 chữ số về email của bạn. Vui lòng kiểm tra hộp thư.</span>
              )}
            </div>

            {/* Input code */}
            <div className="space-y-2">
              <label className="block text-center font-bold text-xs text-on-surface-variant uppercase tracking-wider">Mã xác thực</label>
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full text-center text-2xl font-bold tracking-[12px] pl-[12px] h-16 bg-surface-container-low border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface font-mono focus:bg-surface-container transition-all"
                required
              />
            </div>

            {/* Email OTP helper actions */}
            {twoFactorProvider === "Email" && (
              <div className="text-center">
                {countdown > 0 ? (
                  <span className="text-xs text-slate-400 font-semibold">Gửi lại mã sau {countdown} giây</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendEmailOtp()}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Gửi lại mã OTP qua email
                  </button>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-4">
              <button
                type="submit"
                disabled={loading || twoFactorCode.length < 6}
                className="w-full h-14 bg-primary text-on-primary font-headline-md rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
              >
                {loading ? "Đang xử lý..." : "Xác nhận & Đăng nhập"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTwoFactor(false);
                  setTwoFactorCode("");
                  setEmailOtpSent(false);
                  setError("");
                }}
                className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-headline-md rounded-full transition-colors flex items-center justify-center cursor-pointer"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-grow flex items-center justify-center px-4 md:px-16 py-20 relative overflow-hidden bg-background min-h-[calc(100vh-80px)]">
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

            {/* Nhớ đăng nhập Checkbox */}
            <div className="flex items-center ml-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-outline text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 font-label-md text-sm text-on-surface-variant cursor-pointer select-none">
                Nhớ đăng nhập
              </label>
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
          <div className="mt-8 flex justify-center gap-6">
            <div className="w-full max-w-sm flex justify-center flex-col items-center gap-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Đăng nhập Google thất bại")}
                useOneTap
                theme="outline"
                size="large"
                shape="pill"
                width="320"
                locale="vi"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

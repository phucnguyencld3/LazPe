"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { googleLogin } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";

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

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // States to track input focus for icon colors (mirroring the original jquery/vanilla js logic)
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError("Đăng ký Google thất bại (không có credential).");
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

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

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

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email không đúng định dạng (ví dụ: example@gmail.com).");
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/Authentication/register-send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email: email.trim(),
          password,
          confirmPassword,
          phoneNumber: phoneNumber || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || "Mã OTP đã được gửi đến email của bạn.");
        setIsOtpSent(true);
        startCountdown();
      } else {
        setError(data.message || "Không thể gửi mã xác thực. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Mã OTP phải gồm 6 chữ số.");
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/Authentication/register-verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpCode.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || "Xác thực OTP thành công! Đang đăng ký tài khoản...");
        
        // Save token to localStorage (automatic login on register)
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Redirect to onboarding or homepage after a short delay
        setTimeout(() => {
          if (data.user && !data.user.isOnboarded) {
            window.location.href = "/onboarding";
          } else {
            window.location.href = "/";
          }
        }, 1500);
      } else {
        setError(data.message || "Mã OTP không chính xác hoặc đã hết hạn.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối đến server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/Authentication/register-send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email: email.trim(),
          password,
          confirmPassword,
          phoneNumber: phoneNumber || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Mã OTP mới đã được gửi đến email của bạn.");
        startCountdown();
      } else {
        setError(data.message || "Không thể gửi lại mã OTP.");
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
    <div className="w-full flex-grow flex flex-col md:flex-row items-center justify-center pt-[100px] pb-6 px-4 bg-primary-container relative overflow-hidden">
      {/* Background Decorations for full page (đồng bộ với Login) */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-30 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary-container opacity-40 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl"></div>

      {/* Register Card */}
      <div className="w-full max-w-[900px] bg-surface-container-lowest rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_20px_50px_-10px_rgba(135,78,88,0.2)] z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Left Side: Visual/Branding */}
        <div className="hidden md:flex md:w-1/2 relative flex-col justify-end items-center p-8 lg:p-12 text-center pb-24 overflow-hidden rounded-l-3xl bg-primary-container">
          <div className="absolute inset-0 z-0 bg-primary-container">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-top"
              src="/login-page-img/Login-video-001.mp4"
            />
          </div>

          <div className="relative z-10 space-y-3 mt-auto w-full px-2">
            <h1 className="font-headline-md text-[28px] lg:text-[32px] font-extrabold text-gray-800 leading-tight tracking-tight drop-shadow-md whitespace-nowrap">
              Tạo tài khoản mới
            </h1>
            <p className="font-body-md text-[13px] lg:text-sm text-gray-800 font-semibold px-2 drop-shadow-sm">
              Bắt đầu hành trình mua sắm tuyệt vời dành cho bé yêu của bạn.
            </p>
          </div>

        </div>

        {/* Right Side: Registration Form */}
        <div className="w-full md:w-2/3 lg:w-3/5 p-6 sm:p-8 flex flex-col justify-center relative bg-surface-container-lowest">
          <div className="mb-5 text-center">
            <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-primary mb-1">
              {!isOtpSent ? "Tạo tài khoản" : "Xác Thực OTP"}
            </h1>
            <p className="font-body-md text-[13px] text-on-surface-variant">
              {!isOtpSent ? (
                "Đăng ký thành viên để nhận ưu đãi cho bé."
              ) : (
                <>Mã xác thực đã gửi tới <span className="font-bold text-primary">{email}</span></>
              )}
            </p>
          </div>

          {!isOtpSent ? (
            <div className="flex flex-col h-full justify-center">
              {/* Google Login đưa lên đầu */}
              <div className="mb-5 flex justify-center w-full">
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Đăng nhập Google thất bại")}
                    theme="outline"
                    size="large"
                    shape="pill"
                    width="320"
                    text="signup_with"
                  />
                </div>
              </div>

              <div className="relative flex items-center mb-5">
                <div className="flex-grow border-t border-outline-variant/60"></div>
                <span className="flex-shrink mx-4 font-bold text-[10px] text-outline tracking-wider uppercase">Hoặc đăng ký bằng Email</span>
                <div className="flex-grow border-t border-outline-variant/60"></div>
              </div>

              <form className="space-y-3" onSubmit={handleRegister}>
                {error && (
                  <div className="p-2 bg-red-100 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-2 bg-green-100 text-green-700 text-xs rounded-xl border border-green-200 font-medium">
                    {success}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Họ và tên */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface-variant ml-1" htmlFor="full-name">Họ và tên</label>
                    <div className="relative">
                      <span className={`text-[18px] ${getInputIconClass("fullName")}`}>person</span>
                      <input 
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-xl text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                        id="full-name" placeholder="Nguyễn Văn A" type="text"
                        value={fullName} onChange={(e) => setFullName(e.target.value)}
                        onFocus={() => setFocusedField("fullName")} onBlur={() => setFocusedField(null)} required
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface-variant ml-1" htmlFor="phone">Số điện thoại</label>
                    <div className="relative">
                      <span className={`text-[18px] ${getInputIconClass("phone")}`}>call</span>
                      <input 
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-xl text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                        id="phone" placeholder="090 123 4567" type="tel"
                        value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                        onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Email */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface-variant ml-1" htmlFor="email">Email</label>
                    <div className="relative">
                      <span className={`text-[18px] ${getInputIconClass("email")}`}>mail</span>
                      <input 
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-xl text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                        id="email" placeholder="example@gmail.com" type="email"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} required
                      />
                    </div>
                  </div>

                  {/* Năm sinh */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface-variant ml-1" htmlFor="dob">Ngày sinh</label>
                    <div className="relative">
                      <span className={`text-[18px] ${getInputIconClass("dob")}`}>calendar_today</span>
                      <input 
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-xl text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                        id="dob" type="date"
                        value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                        onFocus={() => setFocusedField("dob")} onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Mật khẩu */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface-variant ml-1" htmlFor="password">Mật khẩu</label>
                    <div className="relative">
                      <span className={`text-[18px] ${getInputIconClass("password")}`}>lock</span>
                      <input 
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-xl text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                        id="password" placeholder="••••••••" type="password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} required
                      />
                    </div>
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface-variant ml-1" htmlFor="confirm-password">Xác nhận</label>
                    <div className="relative">
                      <span className={`text-[18px] ${getInputIconClass("confirmPassword")}`}>lock_reset</span>
                      <input 
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-xl text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                        id="confirm-password" placeholder="••••••••" type="password"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField("confirmPassword")} onBlur={() => setFocusedField(null)} required
                      />
                    </div>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 cursor-pointer accent-primary transition-all" 
                    id="terms" type="checkbox"
                    checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <label className="font-label-md text-[11px] text-on-surface-variant cursor-pointer select-none" htmlFor="terms">
                    Tôi đồng ý với <a className="text-primary hover:underline font-bold" href="#">điều khoản và chính sách</a>.
                  </label>
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  <button 
                    className="w-full h-11 bg-primary text-on-primary font-headline-md text-[13px] rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-75 disabled:hover:translate-y-0" 
                    type="submit" disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        Đăng Ký Tài Khoản
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="p-3 bg-red-100 text-red-700 text-[13px] rounded-xl border border-red-200 font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-100 text-green-700 text-[13px] rounded-xl border border-green-200 font-medium">
                  {success}
                </div>
              )}

              {/* OTP Code input */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-[13px] font-semibold text-on-surface-variant ml-1" htmlFor="otp">Mã OTP (6 số)</label>
                <div className="relative">
                  <span className={`text-[20px] ${getInputIconClass("otp")}`}>lock</span>
                  <input 
                    className="w-full h-12 pl-11 pr-4 bg-surface-container-low border-none rounded-xl tracking-[0.25em] text-center text-lg font-bold focus:ring-2 focus:ring-primary/50 transition-all" 
                    id="otp" placeholder="• • • • • •" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                    value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    onFocus={() => setFocusedField("otp")} onBlur={() => setFocusedField(null)} required
                  />
                </div>
                <span className="text-[11px] text-on-surface-variant ml-1 mt-0.5">Kiểm tra hộp thư email của bạn.</span>
              </div>

              {/* Resend and timer section */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button" onClick={handleResendOtp} disabled={countdown > 0 || loading}
                  className="text-primary font-bold text-[12px] hover:underline disabled:text-outline disabled:no-underline transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                  {countdown > 0 ? `Gửi lại (${countdown}s)` : "Gửi lại mã"}
                </button>

                <button
                  type="button" onClick={() => { setIsOtpSent(false); setError(""); setSuccess(""); }}
                  className="text-on-surface-variant hover:text-primary font-bold text-[12px] hover:underline transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                  Quay lại
                </button>
              </div>

              {/* CTA Button */}
              <button 
                className="w-full h-12 bg-primary text-on-primary font-headline-md text-sm rounded-xl shadow-md shadow-primary/20 hover:shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-75" 
                type="submit" disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    Xác Nhận Đăng Ký
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer link */}
          <div className="mt-6 text-center pt-2 border-t border-outline-variant/30">
            <p className="font-body-md text-[12px] text-on-surface-variant">
              Đã có tài khoản?{" "}
              <Link className="text-primary font-bold hover:underline ml-1 transition-colors" href="/login">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [referralCode, setReferralCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
          referralCode: referralCode.trim() || null,
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
          referralCode: referralCode.trim() || null,
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
      <div className="w-full max-w-[900px] bg-surface-container-lowest rounded-[5px] overflow-hidden flex flex-col md:flex-row shadow-[0_20px_50px_-10px_rgba(135,78,88,0.2)] z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Left Side: Visual/Branding */}
        <div className="hidden md:flex md:w-1/2 relative flex-col justify-end items-center p-8 lg:p-12 text-center pb-24 overflow-hidden rounded-l-[5px] bg-primary-container">
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
                  <div className="p-2 bg-red-100 text-red-700 text-xs rounded-[5px] border border-red-200 font-medium">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-2 bg-green-100 text-green-700 text-xs rounded-[5px] border border-green-200 font-medium">
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
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-[5px] text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
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
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-[5px] text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
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
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-[5px] text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
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
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-[5px] text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
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
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-[5px] text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
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
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-[5px] text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                        id="confirm-password" placeholder="••••••••" type="password"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField("confirmPassword")} onBlur={() => setFocusedField(null)} required
                      />
                    </div>
                  </div>

                  {/* Mã giới thiệu */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface-variant ml-1" htmlFor="referral-code">Mã giới thiệu (không bắt buộc)</label>
                    <div className="relative">
                      <span className={`text-[18px] ${getInputIconClass("referralCode")}`}>loyalty</span>
                      <input 
                        className="w-full h-11 pl-10 pr-3 bg-surface-container-low border-none rounded-[5px] text-[13px] focus:ring-2 focus:ring-primary/50 transition-all font-medium uppercase" 
                        id="referral-code" placeholder="Ví dụ: REF_123456" type="text"
                        value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        onFocus={() => setFocusedField("referralCode")} onBlur={() => setFocusedField(null)}
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
                    Tôi đồng ý với <a className="text-primary hover:underline font-bold" href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}>điều khoản và chính sách</a>.
                  </label>
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  <button 
                    className="w-full h-11 bg-primary text-on-primary font-headline-md text-[13px] rounded-[5px] shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-75 disabled:hover:translate-y-0" 
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
                <div className="p-3 bg-red-100 text-red-700 text-[13px] rounded-[5px] border border-red-200 font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-100 text-green-700 text-[13px] rounded-[5px] border border-green-200 font-medium">
                  {success}
                </div>
              )}

              {/* OTP Code input */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-[13px] font-semibold text-on-surface-variant ml-1" htmlFor="otp">Mã OTP (6 số)</label>
                <div className="relative">
                  <span className={`text-[20px] ${getInputIconClass("otp")}`}>lock</span>
                  <input 
                    className="w-full h-12 pl-11 pr-4 bg-surface-container-low border-none rounded-[5px] tracking-[0.25em] text-center text-lg font-bold focus:ring-2 focus:ring-primary/50 transition-all" 
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
                className="w-full h-12 bg-primary text-on-primary font-headline-md text-sm rounded-[5px] shadow-md shadow-primary/20 hover:shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-75" 
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

      {/* Terms and Policy Modal (Word-like style) */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[5px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Điều khoản và Chính sách</h2>
              <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 md:p-12 overflow-y-auto text-slate-700 leading-relaxed text-[15px] text-justify bg-white" style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
              <div className="max-w-[800px] mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2 uppercase">Điều khoản Dịch vụ và Chính sách Bảo mật</h1>
                  <p className="text-sm italic text-slate-500">Cập nhật lần cuối: Tháng 6 năm 2026</p>
                </div>

                <p>Chào mừng bạn đến với <strong>LazPe</strong>. Bằng việc đăng ký tài khoản và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện dưới đây. Xin vui lòng đọc kỹ trước khi tiếp tục.</p>

                <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2">1. Chấp nhận điều khoản</h3>
                <p>Việc bạn đăng ký tài khoản, truy cập và sử dụng nền tảng thương mại điện tử LazPe đồng nghĩa với việc bạn xác nhận đã đọc, hiểu rõ và đồng ý bị ràng buộc bởi toàn bộ các Điều khoản Dịch vụ và Chính sách Bảo mật này. Nếu bạn không đồng ý với bất kỳ phần nào của Điều khoản, vui lòng ngừng sử dụng dịch vụ ngay lập tức.</p>

                <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2">2. Đăng ký Tài khoản và Trách nhiệm Người dùng</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Tính xác thực:</strong> Bạn cam kết cung cấp thông tin cá nhân (Họ tên, Số điện thoại, Email, Ngày sinh) chính xác, đầy đủ và cập nhật kịp thời khi có thay đổi. LazPe không chịu trách nhiệm cho các rủi ro phát sinh do thông tin sai lệch.</li>
                  <li><strong>Bảo mật tài khoản:</strong> Bạn có trách nhiệm tự bảo mật mật khẩu và các thông tin đăng nhập. Mọi hoạt động phát sinh từ tài khoản của bạn sẽ do bạn hoàn toàn chịu trách nhiệm.</li>
                  <li><strong>Hành vi nghiêm cấm:</strong> Nghiêm cấm sử dụng LazPe để thực hiện các hành vi gian lận thương mại, phát tán mã độc, spam, xâm phạm quyền sở hữu trí tuệ, hoặc các hành vi vi phạm pháp luật hiện hành của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.</li>
                </ul>

                <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2">3. Chính sách Mua bán, Thanh toán và Đổi trả</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Giao dịch:</strong> Mọi đơn đặt hàng trên LazPe đều phụ thuộc vào tình trạng sẵn có của sản phẩm. LazPe có quyền từ chối hoặc hủy đơn hàng vì lý do khách quan (lỗi hệ thống, hết hàng, hoặc nghi ngờ gian lận).</li>
                  <li><strong>Thanh toán:</strong> Người dùng có thể thanh toán qua các cổng thanh toán hợp pháp được tích hợp (như VNPay, thẻ tín dụng, ví điện tử) hoặc thanh toán khi nhận hàng (COD). LazPe cam kết bảo mật mọi thông tin thanh toán của bạn thông qua tiêu chuẩn mã hóa quốc tế.</li>
                  <li><strong>Giao hàng & Đổi trả:</strong> LazPe cam kết giao hàng đúng thời gian dự kiến nhưng không chịu trách nhiệm cho các sự cố do thiên tai hoặc lỗi từ bên thứ ba. Chính sách đổi trả/hoàn tiền áp dụng trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên tem mác và lỗi do nhà sản xuất.</li>
                </ul>

                <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2">4. Thu thập Dữ liệu & Ứng dụng Trí tuệ Nhân tạo (AI)</h3>
                <p className="mb-2">Để mang lại trải nghiệm mua sắm cá nhân hóa và tiện lợi nhất cho mẹ và bé, hệ thống LazPe có sử dụng các thuật toán Trí tuệ Nhân tạo (AI) tiên tiến. Bằng việc sử dụng dịch vụ, bạn đồng ý cho phép chúng tôi thu thập và xử lý các thông tin sau:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Hành vi mua sắm:</strong> Lịch sử truy cập, thời gian xem sản phẩm, các mặt hàng đã thêm vào giỏ, tần suất mua sắm và các đánh giá/phản hồi sản phẩm.</li>
                  <li><strong>Mục đích sử dụng AI:</strong> Toàn bộ dữ liệu hành vi này được đưa vào mô hình học máy (Machine Learning) <strong>duy nhất nhằm mục đích</strong> huấn luyện AI. Hệ thống sẽ phân tích để tự động hiểu sở thích, từ đó gợi ý những sản phẩm phù hợp nhất với nhu cầu, độ tuổi của bé và thói quen tiêu dùng của bạn.</li>
                  <li><strong>Cam kết an toàn:</strong> Quá trình phân tích dữ liệu AI được tự động hóa hoàn toàn, ẩn danh danh tính người dùng và được mã hóa an toàn tuyệt đối.</li>
                </ul>

                <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2">5. Chính sách Bảo mật Thông tin (Privacy Policy)</h3>
                <p className="mb-2">LazPe coi trọng quyền riêng tư của bạn. Việc thu thập và xử lý dữ liệu cá nhân tuân thủ nghiêm ngặt các quy định pháp luật:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Mục đích:</strong> Thông tin cá nhân (Email, SĐT, Địa chỉ) chỉ được sử dụng để xử lý đơn hàng, liên lạc hỗ trợ khách hàng, gửi thông báo bảo mật và nâng cao chất lượng dịch vụ.</li>
                  <li><strong>Không mua bán dữ liệu:</strong> LazPe <strong>cam kết tuyệt đối không bán, trao đổi hay chia sẻ trái phép</strong> dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại. Thông tin chỉ được cung cấp cho các đối tác vận chuyển và thanh toán để hoàn tất đơn hàng của bạn.</li>
                  <li><strong>Sử dụng Cookie:</strong> LazPe sử dụng cookie để lưu trữ phiên đăng nhập và cải thiện tốc độ tải trang. Bạn có quyền từ chối cookie qua cài đặt trình duyệt, tuy nhiên điều này có thể ảnh hưởng đến một số tính năng của trang web.</li>
                </ul>

                <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2">6. Quyền Sở hữu Trí tuệ</h3>
                <p>Toàn bộ nội dung, hình ảnh, mã nguồn, logo và thiết kế đồ họa trên nền tảng LazPe đều thuộc quyền sở hữu trí tuệ hợp pháp của LazPe hoặc các đối tác được cấp phép. Nghiêm cấm mọi hành vi sao chép, chỉnh sửa, phân phối hoặc sử dụng cho mục đích thương mại khi chưa có sự cho phép bằng văn bản.</p>

                <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2">7. Thay đổi Điều khoản</h3>
                <p>LazPe có toàn quyền cập nhật hoặc thay đổi Điều khoản Dịch vụ và Chính sách Bảo mật này vào bất kỳ lúc nào mà không cần báo trước. Tuy nhiên, các thay đổi lớn liên quan đến quyền lợi người dùng sẽ được thông báo qua Email hoặc thông báo đẩy trên hệ thống. Việc bạn tiếp tục sử dụng dịch vụ sau khi các sửa đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận các thay đổi đó.</p>

                <div className="mt-12 text-center pt-6 border-t border-slate-200 border-dashed">
                  <p className="font-semibold text-slate-800 mb-1">Cảm ơn bạn đã tin tưởng và đồng hành cùng LazPe.</p>
                  <p className="text-sm italic text-slate-500">Mọi thắc mắc xin vui lòng liên hệ bộ phận CSKH qua email: support@lazpe.vn</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowTermsModal(false)} 
                className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-[5px] hover:bg-slate-300 transition-colors shadow-sm"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }} 
                className="px-6 py-2 bg-primary text-white font-bold rounded-[5px] hover:bg-primary/90 transition-colors shadow-sm"
              >
                Tôi Đồng Ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

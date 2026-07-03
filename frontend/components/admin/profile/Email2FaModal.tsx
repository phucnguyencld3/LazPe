"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Mail, Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import { enableEmail2Fa, setupEmail2Fa } from "@/lib/api";

interface Email2FaModalProps {
  token: string;
  email: string;
  setShowEmail2FaModal: React.Dispatch<React.SetStateAction<boolean>>;
  fetchTwoFactorStatus: (authToken: string) => Promise<void>;
}

export default function Email2FaModal({
  token,
  email,
  setShowEmail2FaModal,
  fetchTwoFactorStatus,
}: Email2FaModalProps) {
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [submittingTwoFactor, setSubmittingTwoFactor] = useState(false);

  // Resend / Setup Email 2FA
  const handleSetupEmail2Fa = async () => {
    if (!token) return;
    try {
      const res = await setupEmail2Fa(token);
      if (res.success) {
        toast.success("Mã xác thực mới đã được gửi qua email!");
      } else {
        toast.error(res.message || "Không thể gửi mã xác nhận đến email");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối thiết lập Email 2FA");
    }
  };

  // Enable Email 2FA
  const handleEnableEmail2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || emailOtpCode.length < 6) return;

    setSubmittingTwoFactor(true);
    try {
      const res = await enableEmail2Fa(token, emailOtpCode);
      if (res.success) {
        toast.success("Bật xác thực qua Email thành công!");
        setShowEmail2FaModal(false);
        setEmailOtpCode("");
        await fetchTwoFactorStatus(token);
      } else {
        toast.error(res.message || "Mã xác thực không chính xác hoặc đã hết hạn");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi hệ thống khi kích hoạt Email 2FA");
    } finally {
      setSubmittingTwoFactor(false);
    }
  };

  return createPortal(
    <div className="fixed top-0 left-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-[448px] max-w-full p-6 md:p-8 border border-slate-100 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
            <Mail size={22} className="text-rose-500" /> Cấu hình Xác thực Email
          </h3>
          <button
            type="button"
            onClick={() => { setShowEmail2FaModal(false); setEmailOtpCode(""); }}
            className="text-slate-400 hover:text-slate-650 text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4 text-sm font-medium text-slate-650">
          <p>Chúng tôi đã gửi mã OTP gồm 6 chữ số vào địa chỉ email: <strong>{email}</strong>. Vui lòng nhập mã để hoàn tất kích hoạt.</p>

          <form onSubmit={handleEnableEmail2Fa} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={emailOtpCode}
                onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full py-3.5 bg-slate-50 border border-slate-200 rounded-[8px] text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-slate-800 tracking-[8px] font-mono text-center"
                required
              />
            </div>

            <div className="text-center text-xs">
              <button
                type="button"
                onClick={handleSetupEmail2Fa}
                className="text-rose-500 hover:text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Gửi lại mã OTP qua email
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowEmail2FaModal(false); setEmailOtpCode(""); }}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-[8px] text-sm transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingTwoFactor || emailOtpCode.length < 6}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-[8px] text-sm flex items-center gap-1.5 disabled:opacity-60 transition-all cursor-pointer"
              >
                {submittingTwoFactor && <Loader className="animate-spin" size={12} />}
                Xác nhận kích hoạt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

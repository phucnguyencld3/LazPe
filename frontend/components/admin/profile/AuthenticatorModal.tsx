"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { QrCode, Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import { enableAuthenticator } from "@/lib/api";

interface AuthenticatorModalProps {
  token: string;
  authenticatorSetupData: any;
  setShowAuthenticatorModal: React.Dispatch<React.SetStateAction<boolean>>;
  fetchTwoFactorStatus: (authToken: string) => Promise<void>;
}

export default function AuthenticatorModal({
  token,
  authenticatorSetupData,
  setShowAuthenticatorModal,
  fetchTwoFactorStatus,
}: AuthenticatorModalProps) {
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [submittingTwoFactor, setSubmittingTwoFactor] = useState(false);

  // Enable Authenticator
  const handleEnableAuthenticator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || authenticatorCode.length < 6) return;

    setSubmittingTwoFactor(true);
    try {
      const res = await enableAuthenticator(token, authenticatorCode);
      if (res.success) {
        toast.success("Bật xác thực 2 bước bằng Authenticator App thành công!");
        setShowAuthenticatorModal(false);
        setAuthenticatorCode("");
        await fetchTwoFactorStatus(token);
      } else {
        toast.error(res.message || "Mã xác thực không chính xác hoặc đã hết hạn");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi kích hoạt Authenticator");
    } finally {
      setSubmittingTwoFactor(false);
    }
  };

  return createPortal(
    <div className="fixed top-0 left-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-[448px] max-w-full p-6 md:p-8 border border-slate-100 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
            <QrCode size={22} className="text-rose-500" /> Cấu hình Authenticator App
          </h3>
          <button
            type="button"
            onClick={() => { setShowAuthenticatorModal(false); setAuthenticatorCode(""); }}
            className="text-slate-400 hover:text-slate-650 text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4 text-sm font-medium text-slate-650">
          <p><strong>Bước 1:</strong> Sử dụng ứng dụng Authenticator (Google/Microsoft Authenticator) để quét mã QR dưới đây:</p>

          <div className="flex justify-center py-2 flex-shrink-0">
            <div className="p-3 bg-white border border-slate-200 rounded-[8px] shadow-inner w-[184px] h-[184px] flex items-center justify-center flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(authenticatorSetupData?.qrCodeUri || "")}`}
                alt="2FA QR Code"
                width={160}
                height={160}
                className="w-40 h-40 object-contain aspect-square block flex-shrink-0"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-[8px] border border-slate-200/50 space-y-1">
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nếu không quét được, nhập khoá thủ công:</span>
            <code className="block text-xs font-mono font-bold select-all text-slate-800 tracking-wide text-center">{authenticatorSetupData?.sharedKey}</code>
          </div>

          <p><strong>Bước 2:</strong> Nhập mã 6 chữ số hiển thị trên ứng dụng xác thực để kích hoạt:</p>

          <form onSubmit={handleEnableAuthenticator} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={authenticatorCode}
                onChange={(e) => setAuthenticatorCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full py-3.5 bg-slate-50 border border-slate-200 rounded-[8px] text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-slate-800 tracking-[8px] font-mono text-center"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowAuthenticatorModal(false); setAuthenticatorCode(""); }}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-[8px] text-sm transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingTwoFactor || authenticatorCode.length < 6}
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

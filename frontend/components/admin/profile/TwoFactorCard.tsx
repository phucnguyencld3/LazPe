"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, Smartphone, Mail, Loader, Lock, QrCode } from "lucide-react";
import { toast } from "@/lib/toast";
import { disable2Fa, setupAuthenticator, setupEmail2Fa } from "@/lib/api";

interface TwoFactorCardProps {
  token: string;
  twoFactorEnabled: boolean;
  twoFactorProviders: string[];
  loadingTwoFactor: boolean;
  setLoadingTwoFactor: React.Dispatch<React.SetStateAction<boolean>>;
  fetchTwoFactorStatus: (authToken: string) => Promise<void>;
  setShowAuthenticatorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setAuthenticatorSetupData: React.Dispatch<React.SetStateAction<any>>;
  setShowEmail2FaModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TwoFactorCard({
  token,
  twoFactorEnabled,
  twoFactorProviders,
  loadingTwoFactor,
  setLoadingTwoFactor,
  fetchTwoFactorStatus,
  setShowAuthenticatorModal,
  setAuthenticatorSetupData,
  setShowEmail2FaModal,
}: TwoFactorCardProps) {

  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Disable 2FA
  const handleDisable2Fa = () => {
    setShowDisableConfirm(true);
  };

  const confirmDisable2Fa = async () => {
    if (!token) return;
    setShowDisableConfirm(false);
    setLoadingTwoFactor(true);
    try {
      const res = await disable2Fa(token);
      if (res.success) {
        toast.success("Tắt xác thực 2 bước thành công!");
        await fetchTwoFactorStatus(token);
      } else {
        toast.error(res.message || "Không thể tắt xác thực 2 bước");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi tắt xác thực 2 bước");
    } finally {
      setLoadingTwoFactor(false);
    }
  };

  // Setup Authenticator
  const handleSetupAuthenticator = async () => {
    if (!token) return;
    setLoadingTwoFactor(true);
    try {
      const res = await setupAuthenticator(token);
      if (res && res.success) {
        setAuthenticatorSetupData(res);
        setShowAuthenticatorModal(true);
      } else {
        toast.error(res?.message || "Không thể thiết lập Authenticator");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối thiết lập Authenticator");
    } finally {
      setLoadingTwoFactor(false);
    }
  };

  // Setup Email 2FA
  const handleSetupEmail2Fa = async () => {
    if (!token) return;
    setLoadingTwoFactor(true);
    try {
      const res = await setupEmail2Fa(token);
      if (res.success) {
        toast.success("Mã xác thực đã được gửi qua email!");
        setShowEmail2FaModal(true);
      } else {
        toast.error(res.message || "Không thể gửi mã xác nhận đến email");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối thiết lập Email 2FA");
    } finally {
      setLoadingTwoFactor(false);
    }
  };

  return (
    <div className="bg-white rounded-[8px] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
      <div className="space-y-6">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Xác Thực 2 Bước (2FA)</h3>
          <p className="font-body-md text-body-md text-on-surface-variant/70 mt-1">Bảo vệ tài khoản tối đa bằng hai lớp xác thực bảo mật.</p>
        </div>

        <div className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-[8px]">
            <span className="text-sm font-bold text-slate-700">Trạng thái 2FA:</span>
            <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              twoFactorEnabled 
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}>
              <span className={`w-2 h-2 rounded-full ${twoFactorEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
              {twoFactorEnabled ? "Đang bật" : "Đang tắt"}
            </span>
          </div>

          {/* Configured providers details */}
          {twoFactorEnabled && twoFactorProviders.length > 0 && (
            <div className="text-xs font-semibold text-slate-500 space-y-2">
              <span className="block text-[11px] uppercase tracking-wider text-slate-400">Phương thức kích hoạt:</span>
              <div className="flex flex-wrap gap-2">
                {twoFactorProviders.map(prov => (
                  <span key={prov} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-slate-700 flex items-center gap-1.5 font-bold">
                    {prov === "Authenticator" ? <Smartphone size={14} className="text-primary" /> : <Mail size={14} className="text-primary" />}
                    {prov === "Authenticator" ? "Authenticator App" : "Email OTP"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {twoFactorEnabled ? (
              <button
                type="button"
                onClick={handleDisable2Fa}
                disabled={loadingTwoFactor}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-655 rounded-[8px] text-sm font-bold border border-red-200/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {loadingTwoFactor ? <Loader className="animate-spin" size={16} /> : <Lock size={16} />}
                Tắt xác thực 2 bước
              </button>
            ) : (
              <div className="space-y-2.5">
                  <button
                  type="button"
                  onClick={handleSetupAuthenticator}
                  disabled={loadingTwoFactor}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-[8px] text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {loadingTwoFactor ? <Loader className="animate-spin" size={16} /> : <QrCode size={16} />}
                  Cài đặt Authenticator App
                </button>
                <button
                  type="button"
                  onClick={handleSetupEmail2Fa}
                  disabled={loadingTwoFactor}
                  className="w-full py-3 bg-primary hover:opacity-90 text-on-primary rounded-[8px] text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  {loadingTwoFactor ? <Loader className="animate-spin" size={16} /> : <Mail size={16} />}
                  Cài đặt qua Email OTP
                </button>
              </div>
            )}
          </div>
        </div>
      {mounted && showDisableConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[8px] w-[420px] max-w-full p-8 border border-slate-100 shadow-2xl space-y-7 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">shield_lock</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-slate-800 font-bold">Tắt xác thực 2 bước</h3>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                Bạn có chắc chắn muốn tắt tính năng xác thực 2 bước không? Tài khoản của bạn sẽ kém an toàn hơn.
              </p>
            </div>
            
            <div className="flex gap-4 pt-3">
              <button
                type="button"
                onClick={() => setShowDisableConfirm(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-[8px] text-sm transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDisable2Fa}
                className="flex-1 py-3.5 bg-error hover:bg-error/90 text-white font-bold rounded-[8px] text-sm transition-colors cursor-pointer"
              >
                Xác nhận tắt
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    </div>
  );
}

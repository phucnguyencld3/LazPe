"use client";

import React, { useState, useEffect } from "react";
import { Loader, X, Shield, ShieldCheck, Mail, Lock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { 
  setupWalletPinRequestOtp,
  setupWalletPinConfirm,
  changeWalletPin,
  forgotWalletPinRequestOtp,
  resetWalletPinWithOtp
} from "@/lib/api";

export type WalletSecurityMode = 
  | "input" 
  | "setup_request" 
  | "setup_confirm" 
  | "forgot_request" 
  | "forgot_confirm" 
  | "change";

interface WalletSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  initialMode?: WalletSecurityMode;
  onSuccess: (pin: string) => void;
}

export function WalletSecurityModal({ 
  isOpen, 
  onClose, 
  token,
  initialMode = "input",
  onSuccess
}: WalletSecurityModalProps) {
  const [mode, setMode] = useState<WalletSecurityMode>(initialMode);
  const [pin, setPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setPin("");
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setOtp("");
      setLoading(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      toast.error("Mã PIN phải gồm 6 chữ số");
      return;
    }
    onSuccess(pin);
  };

  const handleSetupRequest = async () => {
    setLoading(true);
    try {
      const res = await setupWalletPinRequestOtp(token);
      if (res.success) {
        toast.success(res.message || "OTP đã được gửi!");
        setMode("setup_confirm");
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      toast.error("Mã PIN xác nhận không khớp");
      return;
    }
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      toast.error("Mã PIN phải gồm 6 chữ số");
      return;
    }
    if (!otp) {
      toast.error("Vui lòng nhập mã OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await setupWalletPinConfirm(token, newPin, otp);
      if (res.success) {
        toast.success(res.message || "Thiết lập mã PIN thành công!");
        onSuccess(newPin);
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async () => {
    setLoading(true);
    try {
      const res = await forgotWalletPinRequestOtp(token);
      if (res.success) {
        toast.success(res.message || "OTP đã được gửi!");
        setMode("forgot_confirm");
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      toast.error("Mã PIN xác nhận không khớp");
      return;
    }
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      toast.error("Mã PIN phải gồm 6 chữ số");
      return;
    }
    if (!otp) {
      toast.error("Vui lòng nhập mã OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await resetWalletPinWithOtp(token, otp, newPin);
      if (res.success) {
        toast.success(res.message || "Đặt lại mã PIN thành công!");
        onSuccess(newPin);
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      toast.error("Mã PIN xác nhận không khớp");
      return;
    }
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      toast.error("Mã PIN mới phải gồm 6 chữ số");
      return;
    }
    if (!oldPin) {
      toast.error("Vui lòng nhập mã PIN cũ");
      return;
    }

    setLoading(true);
    try {
      const res = await changeWalletPin(token, oldPin, newPin);
      if (res.success) {
        toast.success(res.message || "Đổi mã PIN thành công!");
        onClose();
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
        if (res.isLocked) {
          setMode("forgot_request");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const renderPinInput = (value: string, onChange: (val: string) => void, placeholder: string = "Nhập 6 chữ số") => (
    <input
      type="password"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary text-center tracking-[1em] font-bold text-xl text-slate-800"
      placeholder="------"
      required
      autoComplete="new-password"
    />
  );
  const modalContent = (
    <div className="fixed inset-0 bg-black/40 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-[12px] w-[90vw] max-w-[450px] shadow-xl flex flex-col max-h-[90vh] border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100/80 bg-white">
          <h3 className="font-bold text-[15px] text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span> 
            Bảo mật Ví LazPe
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {mode === "input" && (
            <form onSubmit={handleInputSubmit} className="space-y-6" autoComplete="off">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <p className="text-slate-800 font-medium">Nhập mã PIN để tiếp tục</p>
                <p className="text-sm text-slate-500">Thao tác này yêu cầu xác thực bằng mã PIN 6 số</p>
              </div>
              <div>
                {renderPinInput(pin, setPin)}
              </div>
              <div className="flex justify-end items-center px-1">
                <button type="button" onClick={() => setMode("forgot_request")} className="text-sm text-primary hover:underline font-medium">
                  Quên mã PIN?
                </button>
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-primary text-white rounded-[8px] font-bold hover:bg-primary/95 transition-all shadow-sm text-[13px] active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                Xác nhận
              </button>
            </form>
          )}

          {mode === "setup_request" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-xl text-slate-800">Khởi tạo mã PIN</h4>
                <p className="text-slate-500 text-sm">
                  Bạn chưa thiết lập mã PIN bảo mật cho Ví LazPe. 
                  Mã PIN giúp bảo vệ số dư của bạn khỏi các giao dịch trái phép.
                </p>
              </div>
              <button 
                onClick={handleSetupRequest} 
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-[8px] font-bold hover:bg-primary/95 transition-all shadow-sm text-[13px] active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                Gửi mã xác nhận qua Email
              </button>
            </div>
          )}

          {mode === "setup_confirm" && (
            <form onSubmit={handleSetupConfirm} className="space-y-5" autoComplete="off">
              <div className="text-center mb-6">
                <p className="text-slate-800 font-medium">Nhập mã xác nhận</p>
                <p className="text-sm text-slate-500">Một mã OTP đã được gửi đến email của bạn.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã OTP (Email)</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary font-medium text-center tracking-[0.5em] text-slate-800"
                    placeholder="------"
                    required
                    autoComplete="one-time-code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã PIN mới (6 số)</label>
                  {renderPinInput(newPin, setNewPin)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận lại mã PIN</label>
                  {renderPinInput(confirmPin, setConfirmPin)}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-[8px] font-bold hover:bg-primary/95 transition-all shadow-sm text-[13px] active:scale-95 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Xác nhận khởi tạo
              </button>
            </form>
          )}

          {mode === "forgot_request" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-10 h-10 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-xl text-slate-800">Quên mã PIN?</h4>
                <p className="text-slate-500 text-sm">
                  Chúng tôi sẽ gửi một mã xác nhận (OTP) đến địa chỉ email đã đăng ký của bạn để thiết lập lại mã PIN.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleForgotRequest} 
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-white rounded-[8px] font-bold hover:bg-primary/95 transition-all shadow-sm text-[13px] active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                  Gửi mã xác nhận
                </button>
                <button 
                  onClick={() => setMode(initialMode)}
                  className="w-full py-2.5 border border-slate-200 rounded-[8px] font-bold text-slate-600 hover:bg-slate-50 transition-colors text-[13px]"
                >
                  Quay lại
                </button>
              </div>
            </div>
          )}

          {mode === "forgot_confirm" && (
            <form onSubmit={handleForgotConfirm} className="space-y-5" autoComplete="off">
              <div className="text-center mb-6">
                <p className="text-slate-800 font-medium">Đặt lại mã PIN</p>
                <p className="text-sm text-slate-500">Nhập mã OTP từ email và thiết lập mã PIN mới.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã OTP (Email)</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary font-medium text-center tracking-[0.5em] text-slate-800"
                    placeholder="------"
                    required
                    autoComplete="one-time-code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã PIN mới (6 số)</label>
                  {renderPinInput(newPin, setNewPin)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận lại mã PIN</label>
                  {renderPinInput(confirmPin, setConfirmPin)}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-[8px] font-bold hover:bg-primary/95 transition-all shadow-sm text-[13px] active:scale-95 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Lưu mã PIN mới
              </button>
            </form>
          )}

          {mode === "change" && (
            <form onSubmit={handleChangePin} className="space-y-5" autoComplete="off">
              <div className="text-center mb-6">
                <p className="text-slate-800 font-medium text-lg">Đổi mã PIN</p>
                <p className="text-sm text-slate-500">Nhập mã PIN hiện tại để đổi sang mã PIN mới.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã PIN cũ</label>
                  {renderPinInput(oldPin, setOldPin)}
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => setMode("forgot_request")} className="text-sm text-primary hover:underline font-medium">
                    Quên mã PIN cũ?
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã PIN mới</label>
                  {renderPinInput(newPin, setNewPin)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận lại mã PIN</label>
                  {renderPinInput(confirmPin, setConfirmPin)}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-[8px] font-bold hover:bg-primary/95 transition-all shadow-sm text-[13px] active:scale-95 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Đổi mã PIN
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return require('react-dom').createPortal(
      modalContent,
      document.getElementById('modal-root') || document.body
    );
  }

  return modalContent;
}

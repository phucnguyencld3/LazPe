"use client";

import React, { useState } from "react";
import { Key, Lock, Eye, EyeOff, AlertCircle, Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import { changePassword } from "@/lib/api";

interface PasswordCardProps {
  userId: string;
  token: string;
}

export default function PasswordCard({ userId, token }: PasswordCardProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!userId || !token) return;

    if (!currentPassword) {
      setPasswordError("Mật khẩu hiện tại không được để trống");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có độ dài ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Xác nhận mật khẩu mới không khớp");
      return;
    }

    setChangingPassword(true);
    try {
      const result = await changePassword(userId, token, {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (result.success) {
        toast.success("Thay đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPasswordError(result.message || "Mật khẩu hiện tại không chính xác");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối hệ thống");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
          <Key size={20} className="text-rose-500" /> Đổi Mật Khẩu
        </h3>
        <p className="text-sm text-slate-400 font-semibold mt-1">Bảo vệ tài khoản bằng cách sử dụng mật khẩu mạnh.</p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        {passwordError && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-600 text-sm font-bold">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{passwordError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Mật khẩu cũ */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu hiện tại *</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mật khẩu cũ..."
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu mới *</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự..."
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nhập lại mật khẩu mới */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Xác nhận mật khẩu *</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type={showConfirmPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu..."
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={changingPassword}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
          >
            {changingPassword ? (
              <>
                <Loader className="animate-spin" size={14} /> Đang xử lý...
              </>
            ) : (
              "Đổi mật khẩu"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

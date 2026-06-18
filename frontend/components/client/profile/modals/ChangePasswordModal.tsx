import React from "react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  };
  setPasswordForm: React.Dispatch<React.SetStateAction<any>>;
  passwordError: string | null;
  hasPassword?: boolean;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
  passwordForm,
  setPasswordForm,
  passwordError,
  hasPassword = true
}: ChangePasswordModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary px-6 py-4 rounded-t-[24px]">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-white">lock</span> {hasPassword ? "Đổi mật khẩu tài khoản" : "Thiết lập mật khẩu tài khoản"}
          </h3>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {passwordError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {passwordError}
            </div>
          )}
          
          {hasPassword && (
            <div className="space-y-1">
              <label className="font-bold text-sm text-slate-700 ml-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-sm text-slate-700 ml-1">Mật khẩu mới</label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-sm text-slate-700 ml-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              required
              value={passwordForm.confirmNewPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-full font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
            >
              {hasPassword ? "Lưu thay đổi" : "Thiết lập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

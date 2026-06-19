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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-[450px] flex flex-col bg-white rounded-[12px] shadow-xl overflow-hidden border border-slate-100">
        <div className="flex justify-between items-center p-5 border-b border-slate-100/80 bg-white">
          <h3 className="font-bold text-[15px] text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            {hasPassword ? "Đổi mật khẩu tài khoản" : "Thiết lập mật khẩu tài khoản"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[8px] text-[12px] font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {passwordError}
            </div>
          )}
          
          {hasPassword && (
            <div className="space-y-1.5">
              <label className="font-bold text-[12px] text-slate-700 ml-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-[12px] text-slate-700 ml-1">Mật khẩu mới</label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[12px] text-slate-700 ml-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              required
              value={passwordForm.confirmNewPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-5 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-[8px] font-bold text-slate-600 hover:bg-slate-50 transition-colors text-[13px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-primary text-white rounded-[8px] font-bold hover:bg-primary/95 transition-all shadow-sm text-[13px] active:scale-95"
            >
              {hasPassword ? "Lưu thay đổi" : "Thiết lập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

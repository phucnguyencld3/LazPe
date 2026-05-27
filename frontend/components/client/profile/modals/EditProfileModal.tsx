import React from "react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  profileForm: {
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
  };
  setProfileForm: React.Dispatch<React.SetStateAction<any>>;
  profileError: string | null;
}

export function EditProfileModal({
  isOpen,
  onClose,
  onSubmit,
  profileForm,
  setProfileForm,
  profileError
}: EditProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary text-white p-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-white">edit_square</span> Cập nhật thông tin cá nhân
          </h3>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {profileError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {profileError}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="font-bold text-sm text-slate-700 ml-1">Họ và Tên</label>
            <input
              type="text"
              required
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-sm text-slate-700 ml-1">Email</label>
            <input
              type="email"
              required
              disabled
              value={profileForm.email}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 border-slate-200 text-slate-500 border focus:outline-none cursor-not-allowed"
              title="Email không thể thay đổi"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-sm text-slate-700 ml-1">Số điện thoại</label>
            <input
              type="tel"
              value={profileForm.phoneNumber}
              onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
              placeholder="Nhập số điện thoại"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-sm text-slate-700 ml-1">Ngày sinh</label>
            <input
              type="date"
              value={profileForm.dateOfBirth}
              onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
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
              className="flex-1 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/95 transition-colors shadow-md shadow-primary/10"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

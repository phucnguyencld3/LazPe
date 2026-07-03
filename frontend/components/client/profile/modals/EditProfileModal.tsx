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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-[450px] flex flex-col bg-white rounded-[12px] shadow-xl overflow-hidden border border-slate-100">
        <div className="flex justify-between items-center p-5 border-b border-slate-100/80 bg-white">
          <h3 className="font-bold text-[15px] text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_square</span> 
            Cập nhật thông tin cá nhân
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {profileError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[8px] text-[12px] font-semibold flex items-center gap-2">
               <span className="material-symbols-outlined text-[16px]">error</span>
              {profileError}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="font-bold text-[12px] text-slate-700 ml-1">Họ và Tên</label>
            <input
              type="text"
              required
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[12px] text-slate-700 ml-1">Email</label>
            <input
              type="email"
              required
              disabled
              value={profileForm.email}
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-100/50 border-slate-200 text-slate-500 border focus:outline-none cursor-not-allowed text-[13px]"
              title="Email không thể thay đổi"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[12px] text-slate-700 ml-1">Số điện thoại</label>
            <input
              type="tel"
              value={profileForm.phoneNumber}
              onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
              placeholder="Nhập số điện thoại"
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[12px] text-slate-700 ml-1">Ngày sinh</label>
            <input
              type="date"
              value={profileForm.dateOfBirth}
              onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-5 mt-2">
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
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

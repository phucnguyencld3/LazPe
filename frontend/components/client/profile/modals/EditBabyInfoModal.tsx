import React from "react";

interface EditBabyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  profileForm: {
    momFavoriteColors?: string | null;
    childGender?: string | null;
    childAgeMonths?: string | number | null;
    childWeightKg?: string | number | null;
  };
  setProfileForm: React.Dispatch<React.SetStateAction<any>>;
  profileError: string | null;
}

export function EditBabyInfoModal({
  isOpen,
  onClose,
  onSubmit,
  profileForm,
  setProfileForm,
  profileError
}: EditBabyInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-primary text-white p-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-white">child_care</span> Thiết lập thông tin của Bé & Sở thích
          </h3>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {profileError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {profileError}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-sm text-slate-700 ml-1">Màu sắc yêu thích của Mẹ</label>
            <input
              type="text"
              value={profileForm.momFavoriteColors || ""}
              onChange={(e) => setProfileForm({ ...profileForm, momFavoriteColors: e.target.value })}
              placeholder="Ví dụ: Hồng, Xanh dương, Vàng"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-sm text-slate-700 ml-1">Giới tính bé cưng</label>
            <select
              value={profileForm.childGender || ""}
              onChange={(e) => setProfileForm({ ...profileForm, childGender: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-sm"
            >
              <option value="">-- Chưa chọn --</option>
              <option value="Boy">Bé trai</option>
              <option value="Girl">Bé gái</option>
              <option value="Secret">Bí mật</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-sm text-slate-700 ml-1">Tuổi của bé (tháng)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={profileForm.childAgeMonths !== undefined && profileForm.childAgeMonths !== null ? profileForm.childAgeMonths : ""}
                onChange={(e) => setProfileForm({ ...profileForm, childAgeMonths: e.target.value })}
                placeholder="Ví dụ: 12"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-sm text-slate-700 ml-1">Cân nặng (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={profileForm.childWeightKg !== undefined && profileForm.childWeightKg !== null ? profileForm.childWeightKg : ""}
                onChange={(e) => setProfileForm({ ...profileForm, childWeightKg: e.target.value })}
                placeholder="Ví dụ: 9.5"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-sm"
              />
            </div>
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

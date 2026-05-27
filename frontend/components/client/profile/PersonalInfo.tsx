import React from "react";
import { UserProfile } from "@/lib/api";

interface PersonalInfoProps {
  userProfile: UserProfile;
  onEditClick: () => void;
}

export function PersonalInfo({ userProfile, onEditClick }: PersonalInfoProps) {
  // Formatting utility for date
  const formatDateVietnamese = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  // General date display format
  const formatDob = (dateStr?: string) => {
    if (!dateStr) return "Chưa cập nhật";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  return (
    <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
      <div className="flex justify-between items-center mb-md pb-3 border-b border-slate-100">
        <h2 className="font-headline-md text-xl font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">person</span> Thông tin cá nhân
        </h2>
        <button
          onClick={onEditClick}
          className="text-primary font-bold flex items-center gap-1 hover:underline active:scale-95 transition-all text-sm py-1.5 px-3 rounded-full hover:bg-primary-container/20"
        >
          <span className="material-symbols-outlined text-sm font-bold">edit</span> Chỉnh sửa
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-2">
        <div className="space-y-xs">
          <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Họ và Tên</label>
          <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50">{userProfile.fullName}</div>
        </div>
        <div className="space-y-xs">
          <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Số điện thoại</label>
          <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50">
            {userProfile.phoneNumber || "Chưa cập nhật"}
          </div>
        </div>
        <div className="space-y-xs">
          <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Email đăng nhập</label>
          <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50">{userProfile.email}</div>
        </div>
        <div className="space-y-xs">
          <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Ngày sinh</label>
          <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50">
            {formatDob(userProfile.dateOfBirth)}
          </div>
        </div>
        <div className="space-y-xs md:col-span-2">
          <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Ngày tham gia hệ thống</label>
          <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary font-bold text-lg">verified_user</span>
            Thành viên LazPe từ {formatDateVietnamese(userProfile.registerDate)}
          </div>
        </div>
      </div>
    </section>
  );
}

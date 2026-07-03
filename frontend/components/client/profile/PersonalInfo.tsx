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
    <section className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-100/60">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-500 text-xl">person</span> Thông tin cá nhân
        </h2>
        <button
          onClick={onEditClick}
          className="text-primary font-bold flex items-center gap-1 hover:text-rose-600 active:scale-95 transition-all text-[11px] bg-slate-50 py-1.5 px-3 rounded-[8px] border border-slate-100 hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-[11px] font-bold">edit</span> Chỉnh sửa
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
        <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Họ và Tên</span>
          <span className="font-semibold text-[13px] text-slate-800">{userProfile.fullName}</span>
        </div>
        <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Số điện thoại</span>
          <span className="font-semibold text-[13px] text-slate-800">
            {userProfile.phoneNumber || "Chưa cập nhật"}
          </span>
        </div>
        <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email đăng nhập</span>
          <span className="font-semibold text-[13px] text-slate-800">{userProfile.email}</span>
        </div>
        <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ngày sinh</span>
          <span className="font-semibold text-[13px] text-slate-800">
            {formatDob(userProfile.dateOfBirth)}
          </span>
        </div>
        <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã giới thiệu của bạn</span>
          <span className="font-semibold text-[13px] text-slate-800 flex items-center gap-2">
            {userProfile.referralCode || "Chưa có"}
            {userProfile.referralCode && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(userProfile.referralCode || "");
                  alert("Đã sao chép mã giới thiệu: " + userProfile.referralCode);
                }}
                className="text-primary hover:text-rose-600 transition-colors"
                title="Sao chép mã"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
              </button>
            )}
          </span>
        </div>
        <div className="flex flex-col gap-1 md:col-span-2 pt-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ngày tham gia hệ thống</span>
          <div className="font-semibold text-[13px] text-slate-800 flex items-center gap-1.5 mt-1 bg-slate-50 p-2.5 rounded-[8px] border border-slate-100/60 w-fit">
            <span className="material-symbols-outlined text-emerald-500 font-bold text-[18px]">verified</span>
            Thành viên LazPe từ {formatDateVietnamese(userProfile.registerDate)}
          </div>
        </div>
      </div>
    </section>
  );
}

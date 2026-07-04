import React from "react";
import { UserStats as UserStatsType } from "@/lib/features/users/userApi";

interface UserStatsProps {
  stats: UserStatsType | null;
}

export const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  const lockedCount = stats?.lockedUsers || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/30">
      {/* Total Users */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">groups</span>
          </div>
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng người dùng</span>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{stats?.totalUsers || 0}</span>
      </div>

      {/* Active Users */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang hoạt động</span>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{stats?.activeUsers || 0}</span>
      </div>

      {/* Locked Users */}
      <div className={`px-6 py-5 flex items-center justify-between ${
        lockedCount > 0 
          ? 'bg-rose-50/50' 
          : ''
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            lockedCount > 0 
              ? 'bg-rose-100 text-error' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <span className="material-symbols-outlined text-[20px]">block</span>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${lockedCount > 0 ? 'text-rose-950/60' : 'text-slate-500'}`}>
            Bị khóa
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lockedCount > 0 && (
            <span className="px-2 py-0.5 bg-error text-white text-[9px] font-bold rounded-full">
              Lưu ý
            </span>
          )}
          <span className={`text-2xl font-extrabold ${lockedCount > 0 ? 'text-error' : 'text-slate-800'}`}>{lockedCount}</span>
        </div>
      </div>

      {/* New Users */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
          </div>
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Mới (Tháng này)</span>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{stats?.newUsersThisMonth || 0}</span>
      </div>
    </div>
  );
};

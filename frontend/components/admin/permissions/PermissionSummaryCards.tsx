import React from "react";

interface PermissionSummaryCardsProps {
  totalSystemPermissions: number;
  totalGroups: number;
}

export const PermissionSummaryCards: React.FC<PermissionSummaryCardsProps> = ({
  totalSystemPermissions,
  totalGroups,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/30">
      {/* Card 1: Tổng số quyền hệ thống */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">vpn_key</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Quyền hệ thống</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Định nghĩa trong DB</span>
          </div>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{totalSystemPermissions}</span>
      </div>

      {/* Card 2: Nhóm tài nguyên */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Nhóm tài nguyên</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Mô-đun bảo vệ</span>
          </div>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{totalGroups}</span>
      </div>

      {/* Card 3: Vai trò */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Vai trò chính</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Chuẩn Identity</span>
          </div>
        </div>
        <span className="text-sm font-extrabold text-slate-700">Admin / Staff</span>
      </div>
    </div>
  );
};

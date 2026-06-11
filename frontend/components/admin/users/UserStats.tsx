import React from "react";
import { UserStats as UserStatsType } from "@/lib/features/users/userApi";

interface UserStatsProps {
  stats: UserStatsType | null;
}

export const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
      <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Tổng người dùng</p>
            <h3 className="font-display-lg text-display-lg text-primary mt-xs">{stats?.totalUsers || 0}</h3>
          </div>
          <div className="p-sm bg-primary-container/20 rounded-lg">
            <span className="material-symbols-outlined text-primary text-[28px]">groups</span>
          </div>
        </div>
        <div className="mt-sm flex items-center gap-xs text-secondary">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          <span className="text-xs font-bold">+12% tháng này</span>
        </div>
      </div>
      <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Đang hoạt động</p>
            <h3 className="font-display-lg text-display-lg text-secondary mt-xs">{stats?.activeUsers || 0}</h3>
          </div>
          <div className="p-sm bg-secondary-container/20 rounded-lg">
            <span className="material-symbols-outlined text-secondary text-[28px]">check_circle</span>
          </div>
        </div>
      </div>
      <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Bị khóa</p>
            <h3 className="font-display-lg text-display-lg text-error mt-xs">{stats?.lockedUsers || 0}</h3>
          </div>
          <div className="p-sm bg-error-container/20 rounded-lg">
            <span className="material-symbols-outlined text-error text-[28px]">block</span>
          </div>
        </div>
      </div>
      <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Mới (Tháng này)</p>
            <h3 className="font-display-lg text-display-lg text-tertiary mt-xs">{stats?.newUsersThisMonth || 0}</h3>
          </div>
          <div className="p-sm bg-tertiary-container/20 rounded-lg">
            <span className="material-symbols-outlined text-tertiary text-[28px]">person_add</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { UserStats as UserStatsType } from "@/lib/features/users/userApi";
import { StatsCard } from "@/components/admin/ui/Card";

interface UserStatsProps {
  stats: UserStatsType | null;
}

export const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 font-outfit">
      <StatsCard
        title="Tổng người dùng"
        value={stats?.totalUsers || 0}
        icon={<span className="material-symbols-outlined text-[24px]">groups</span>}
        iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
        trend="+12%"
        trendType="up"
      />
      <StatsCard
        title="Đang hoạt động"
        value={stats?.activeUsers || 0}
        icon={<span className="material-symbols-outlined text-[24px]">check_circle</span>}
        iconBgColor="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400"
      />
      <StatsCard
        title="Bị khóa"
        value={stats?.lockedUsers || 0}
        icon={<span className="material-symbols-outlined text-[24px]">block</span>}
        iconBgColor="bg-error-50 text-error-500 dark:bg-error-500/10 dark:text-error-400"
      />
      <StatsCard
        title="Mới (Tháng này)"
        value={stats?.newUsersThisMonth || 0}
        icon={<span className="material-symbols-outlined text-[24px]">person_add</span>}
        iconBgColor="bg-warning-50 text-warning-500 dark:bg-warning-500/10 dark:text-orange-400"
      />
    </div>
  );
};


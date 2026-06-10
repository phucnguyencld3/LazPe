import React from "react";
import { StatsCard } from "@/components/admin/ui/Card";

interface PermissionSummaryCardsProps {
  totalSystemPermissions: number;
  totalGroups: number;
}

export const PermissionSummaryCards: React.FC<PermissionSummaryCardsProps> = ({
  totalSystemPermissions,
  totalGroups,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-outfit">
      <StatsCard
        title="Tổng số quyền hệ thống"
        value={totalSystemPermissions}
        icon={<span className="material-symbols-outlined text-[24px]">vpn_key</span>}
        iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
      />

      <StatsCard
        title="Nhóm tài nguyên phân quyền"
        value={totalGroups}
        icon={<span className="material-symbols-outlined text-[24px]">grid_view</span>}
        iconBgColor="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400"
      />

      <StatsCard
        title="Vai trò trong trang này"
        value="Admin / Staff"
        icon={<span className="material-symbols-outlined text-[24px]">shield</span>}
        iconBgColor="bg-warning-50 text-warning-500 dark:bg-warning-500/10 dark:text-orange-400"
      />
    </div>
  );
};


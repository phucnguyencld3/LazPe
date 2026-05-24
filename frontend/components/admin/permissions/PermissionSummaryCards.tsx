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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-lg">
      <div className="p-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-start justify-between">
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant font-bold">Tổng số quyền hệ thống</p>
          <h3 className="font-display-lg text-display-lg text-primary mt-xs">{totalSystemPermissions}</h3>
          <p className="text-xs text-on-surface-variant/60 mt-xs">Được định nghĩa trong cơ sở dữ liệu</p>
        </div>
        <div className="p-sm bg-primary-container/20 rounded-lg">
          <span className="material-symbols-outlined text-primary text-[28px]">vpn_key</span>
        </div>
      </div>

      <div className="p-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-start justify-between">
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant font-bold">Nhóm tài nguyên phân quyền</p>
          <h3 className="font-display-lg text-display-lg text-secondary mt-xs">{totalGroups}</h3>
          <p className="text-xs text-on-surface-variant/60 mt-xs">Mô-đun chức năng được bảo vệ</p>
        </div>
        <div className="p-sm bg-secondary-container/20 rounded-lg">
          <span className="material-symbols-outlined text-secondary text-[28px]">grid_view</span>
        </div>
      </div>

      <div className="p-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-start justify-between">
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant font-bold">Vai trò trong trang này</p>
          <h3 className="font-display-lg text-display-lg text-tertiary mt-xs">Admin / Staff / User</h3>
          <p className="text-xs text-on-surface-variant/60 mt-xs">Theo chuẩn phân quyền ASP.NET Identity</p>
        </div>
        <div className="p-sm bg-tertiary-container/20 rounded-lg">
          <span className="material-symbols-outlined text-tertiary text-[28px]">shield</span>
        </div>
      </div>
    </div>
  );
};

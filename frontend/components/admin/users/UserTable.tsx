import React from "react";
import { Pagination } from "../shared/Pagination";

interface UserTableProps {
  users: any[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onRowClick,
}) => {
  return (
    <div className="glass-card rounded-xl shadow-sm overflow-hidden border border-outline-variant/20 bg-surface-container-lowest">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-primary-container/10 border-b border-outline-variant/30 text-left">
            <tr>
              <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">ID</th>
              <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Họ và tên</th>
              <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Liên hệ</th>
              <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Vai trò</th>
              <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Trạng thái</th>
              <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Ngày tạo</th>
              <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-on-surface-variant font-body-md">Không có dữ liệu</td>
              </tr>
            ) : (
              users.map((u: any) => (
                <tr 
                  key={u.id} 
                  onClick={() => onRowClick(u.id)}
                  className="hover:bg-primary-container/10 transition-colors cursor-pointer group"
                >
                  <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">#{u.id.substring(0, 8)}</td>
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-primary-container overflow-hidden relative">
                        {u.avatar ? (
                          <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">person</span>
                        )}
                      </div>
                      <span className="font-label-md text-label-md text-on-surface font-bold">{u.fullName || u.userName}</span>
                    </div>
                  </td>
                  <td className="px-lg py-md">
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md text-on-surface-variant">{u.email || "N/A"}</span>
                      <span className="text-xs text-on-surface-variant/60">{u.phoneNumber || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-lg py-md text-center">
                    <span className="px-sm py-1 bg-tertiary-container/30 text-on-tertiary-container rounded-full text-xs font-bold">
                      {u.roles?.length > 0 ? u.roles[0] : "User"}
                    </span>
                  </td>
                  <td className="px-lg py-md text-center">
                    {u.isLocked ? (
                       <span className="bg-error-container text-on-error-container px-sm py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-error rounded-full"></span> Bị khóa
                       </span>
                    ) : (
                       <span className="bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span> Hoạt động
                       </span>
                    )}
                  </td>
                  <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">
                    {new Date(u.registerDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-lg py-md text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-sm">
                      <button onClick={() => onRowClick(u.id)} className="p-xs text-on-surface-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && users.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={10}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

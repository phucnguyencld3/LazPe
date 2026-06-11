import React from "react";
import { useRouter } from "next/navigation";

interface PermissionUsersTabProps {
  users: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  resetSearch: () => void;
  page: number;
  totalPages: number;
  totalCount: number;
  setPage: (page: number | ((p: number) => number)) => void;
}

export const PermissionUsersTab: React.FC<PermissionUsersTabProps> = ({
  users,
  loading,
  searchTerm,
  setSearchTerm,
  resetSearch,
  page,
  totalPages,
  totalCount,
  setPage,
}) => {
  const router = useRouter();

  return (
    <div className="space-y-md animate-fadeIn">
      {/* User Search & Filter */}
      <div className="p-md rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex flex-wrap items-center gap-md">
        <div className="flex-1 relative min-w-[300px]">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            className="w-full pl-xl pr-md py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
            placeholder="Tìm tên, email người dùng để phân quyền..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={resetSearch}
          className="text-primary font-label-md text-label-md font-bold hover:underline px-md py-md"
        >
          Đặt lại
        </button>
      </div>

      {/* User Table */}
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-primary-container/10 border-b border-outline-variant/30 text-left">
              <tr>
                <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Người dùng</th>
                <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Vai trò hệ thống</th>
                <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Trạng thái</th>
                <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-on-surface-variant font-body-md">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/admin/users/${u.id}/permissions`)}
                    className="hover:bg-primary-container/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-primary-container overflow-hidden relative">
                          {u.avatar ? (
                            <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant">person</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-bold">
                            {u.fullName || u.userName}
                          </span>
                          <span className="text-xs text-on-surface-variant/70">{u.email || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-md text-center">
                      <div className="flex justify-center gap-xs flex-wrap">
                        {u.roles?.length > 0 ? (
                          u.roles.map((role: string, idx: number) => {
                            const isAdminRole = role === "Admin";
                            const isStaffRole = role === "Staff";
                            return (
                              <span
                                key={idx}
                                className={`px-sm py-1 rounded-full text-xs font-bold ${
                                  isAdminRole
                                    ? "bg-primary-container text-on-primary-container border border-primary/20"
                                    : isStaffRole
                                    ? "bg-secondary-container text-on-secondary-container border border-secondary/20"
                                    : "bg-surface-variant text-on-surface-variant border border-outline-variant/30"
                                }`}
                              >
                                {role}
                              </span>
                            );
                          })
                        ) : (
                          <span className="px-sm py-1 bg-surface-variant text-on-surface-variant/75 rounded-full text-xs">
                            User
                          </span>
                        )}
                      </div>
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
                    <td className="px-lg py-md text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/admin/users/${u.id}/permissions`)}
                        className="bg-primary text-on-primary hover:bg-[#7b444e] px-md py-sm rounded-full font-label-md text-xs font-bold flex items-center gap-1 ml-auto shadow-sm hover:scale-105 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">shield</span>
                        Phân quyền chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="p-lg bg-surface-container-lowest border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-md">
            <p className="font-label-md text-label-md text-on-surface-variant">
              Hiển thị trang <span className="font-bold text-primary">{page}</span> / <span className="font-bold text-primary">{totalPages}</span> (Tổng {totalCount} người dùng)
            </p>
            <div className="flex items-center gap-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-primary-container/10 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-primary-container/10 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

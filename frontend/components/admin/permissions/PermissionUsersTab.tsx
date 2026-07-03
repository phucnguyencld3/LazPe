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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
          <div className="flex-1 relative min-w-[300px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Tìm tên, email người dùng để phân quyền..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <button
              onClick={resetSearch}
              className="px-6 py-3 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">clear</span>
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
              <tr>
                <th className="px-6 py-4 text-center w-[80px]">STT</th>
                <th className="px-6 py-4">Người dùng</th>
                <th className="px-6 py-4 text-center">Vai trò hệ thống</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-slate-400 mt-4 font-semibold text-xs">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-semibold text-xs">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u: any, index: number) => (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/admin/users/${u.id}/permissions`)}
                    className="hover:bg-slate-100/70 transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-400">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden relative shrink-0">
                          {u.avatar ? (
                            <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400">person</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-sm leading-tight">
                            {u.fullName || u.userName}
                          </span>
                          <span className="text-xs text-slate-400 mt-0.5">{u.email || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        {u.roles?.length > 0 ? (
                          u.roles.map((role: string, idx: number) => {
                            const isAdminRole = role === "Admin";
                            const isStaffRole = role === "Staff";
                            return (
                              <span
                                key={idx}
                                className={`text-sm font-bold ${
                                  isAdminRole
                                    ? "text-primary"
                                    : isStaffRole
                                    ? "text-blue-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {role}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-sm font-bold text-slate-400">
                            User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.isLocked ? (
                        <span className="text-sm font-bold text-error inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-error rounded-full"></span> Bị khóa
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-emerald-600 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/admin/users/${u.id}/permissions`)}
                        className="bg-primary text-on-primary hover:bg-[#7b444e] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 ml-auto shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-semibold text-slate-500">
              Hiển thị trang <span className="font-bold text-primary">{page}</span> / <span className="font-bold text-primary">{totalPages}</span> (Tổng {totalCount} người dùng)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
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


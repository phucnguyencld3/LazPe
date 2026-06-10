import React from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";
import Badge from "@/components/admin/ui/Badge";
import Button from "@/components/admin/ui/Button";

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
    <div className="space-y-6 animate-fadeIn font-outfit">
      {/* User Search & Filter */}
      <div className="bg-white dark:bg-gray-950 rounded-[2rem] p-6 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 relative w-full">
            <span className="material-symbols-outlined absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              className="w-full pl-12 pr-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-semibold text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 transition-all"
              placeholder="Tìm tên, email người dùng để phân quyền..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={resetSearch}
            className="text-brand-500 hover:text-brand-600 font-bold text-sm px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            Đặt lại
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-150 dark:border-white/[0.05] shadow-theme-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="border-none shadow-none rounded-none">
            <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader>Người dùng</TableCell>
                <TableCell isHeader className="text-center">Vai trò hệ thống</TableCell>
                <TableCell isHeader className="text-center">Trạng thái</TableCell>
                <TableCell isHeader className="text-right">Hành động</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-gray-400 dark:text-gray-500">
                    Không tìm thấy người dùng phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u: any) => (
                  <TableRow
                    key={u.id}
                    onClick={() => router.push(`/admin/users/${u.id}/permissions`)}
                    className="cursor-pointer group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-200 dark:border-gray-800 overflow-hidden relative shrink-0">
                          {u.avatar ? (
                            <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-gray-450">person</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 dark:text-white/90 text-sm group-hover:text-brand-500 transition-colors">
                            {u.fullName || u.userName}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{u.email || "N/A"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {u.roles?.length > 0 ? (
                          u.roles.map((role: string, idx: number) => {
                            const isAdminRole = role === "Admin";
                            const isStaffRole = role === "Staff";
                            return (
                              <Badge
                                key={idx}
                                color={isAdminRole ? "primary" : isStaffRole ? "info" : "light"}
                                variant="light"
                                size="sm"
                              >
                                {role}
                              </Badge>
                            );
                          })
                        ) : (
                          <Badge color="light" variant="light" size="sm">
                            User
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge color={u.isLocked ? "error" : "success"} variant="light" size="sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isLocked ? "bg-error-500" : "bg-success-500"}`}></span>
                        {u.isLocked ? "Bị khóa" : "Hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => router.push(`/admin/users/${u.id}/permissions`)}
                        variant="primary"
                        size="sm"
                        className="rounded-full text-xs font-bold py-1.5 ml-auto"
                        startIcon={<span className="material-symbols-outlined text-sm">shield</span>}
                      >
                        Phân quyền chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="p-6 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Hiển thị trang <span className="font-bold text-brand-500">{page}</span> / <span className="font-bold text-brand-500">{totalPages}</span> (Tổng {totalCount} người dùng)
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                className="w-10 h-10 p-0 rounded-lg"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                className="w-10 h-10 p-0 rounded-lg"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


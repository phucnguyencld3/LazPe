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
  onChatClick?: (id: string, name: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onReset: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onRowClick,
  onChatClick,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
}) => {
  return (
    <div className="overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
        {/* Search box */}
        <div className="flex-1 min-w-[260px] relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[165px] cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>

        {/* Reset Filters button */}
        {(searchTerm || statusFilter !== "all") && (
          <button
            onClick={onReset}
            className="px-6 py-3 text-slate-500 font-bold text-sm rounded-[8px] hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">clear</span>
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4 text-center w-[80px]">STT</th>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Họ và tên</th>
              <th className="px-6 py-4">Liên hệ</th>
              <th className="px-6 py-4 text-center">Vai trò</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4">Ngày tạo</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="text-slate-400 mt-4 font-semibold text-sm">Đang tải dữ liệu người dùng...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20 text-slate-400 font-bold text-sm">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            ) : (
              users.map((u: any, index) => (
                <tr 
                  key={u.id} 
                  onClick={() => onRowClick(u.id)}
                  className="hover:bg-slate-100/70 transition-all duration-200 cursor-pointer group"
                >
                  <td className="px-6 py-4 text-center text-sm font-semibold text-slate-400">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-500">#{u.id.substring(0, 8)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shrink-0 relative">
                        {u.avatar ? (
                          <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">person</span>
                        )}
                      </div>
                      <span className="text-sm text-slate-800 font-bold group-hover:text-primary transition-colors">{u.fullName || u.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-600">{u.email || "N/A"}</span>
                      <span className="text-xs font-bold text-slate-400 tracking-wider mt-0.5">{u.phoneNumber || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-600">
                      {u.roles?.length > 0 ? u.roles[0] : "User"}
                    </span>
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
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">
                    {new Date(u.registerDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onRowClick(u.id)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Xem chi tiết">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      {onChatClick && (
                        <button onClick={() => onChatClick(u.id, u.fullName || u.userName || "Khách")} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Nhắn tin">
                          <span className="material-symbols-outlined text-lg">chat</span>
                        </button>
                      )}
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


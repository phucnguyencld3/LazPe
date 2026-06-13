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
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
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
                  <td className="px-6 py-4 text-center text-xs font-semibold text-slate-400">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">#{u.id.substring(0, 8)}</td>
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
                      <span className="text-xs font-semibold text-slate-600">{u.email || "N/A"}</span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">{u.phoneNumber || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                      {u.roles?.length > 0 ? u.roles[0] : "User"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.isLocked ? (
                       <span className="bg-rose-50 text-error px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border border-rose-100">
                         <span className="w-1.5 h-1.5 bg-error rounded-full"></span> Bị khóa
                       </span>
                    ) : (
                       <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-100">
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Hoạt động
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">
                    {new Date(u.registerDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onRowClick(u.id)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-lg">visibility</span>
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

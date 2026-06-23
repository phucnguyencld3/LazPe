"use client";
import { useState, useEffect } from "react";
import { getSecurityAuditLogs, SecurityAuditLog } from "@/lib/features/security-logs/securityLogApi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const fetchLogs = async (currentPage: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập");
        return;
      }
      const res = await getSecurityAuditLogs(token, currentPage, 20);
      if (res.success) {
        setLogs(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách nhật ký Anti-Spam");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const getActionTypeStyle = (type: string) => {
    switch (type) {
      case "Warning":
        return "bg-amber-100 text-amber-700";
      case "BlockAccount":
        return "bg-orange-100 text-orange-700";
      case "BlockIP":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case "Warning":
        return "Cảnh báo";
      case "BlockAccount":
        return "Khóa tài khoản";
      case "BlockIP":
        return "Chặn IP";
      default:
        return type;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.ipAddress.includes(searchTerm) || 
    (log.userId && log.userId.includes(searchTerm)) ||
    log.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      <header className="mb-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Nhật ký Anti-Spam</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">Theo dõi các hành vi có dấu hiệu spam và lịch sử hệ thống xử lý</p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Tìm theo IP, UserID hoặc nội dung..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-[8px] focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none text-slate-700 font-medium shadow-sm" 
          />
        </div>
      </header>

      <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden w-full">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600">security</span>
            <h2 className="font-bold text-slate-700">Lịch sử hoạt động</h2>
          </div>
          <button 
            onClick={() => fetchLogs(page)}
            className="text-primary font-bold text-sm hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Làm mới
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/55 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Tài khoản (nếu có)</th>
                <th className="px-6 py-4 text-center">Hành động</th>
                <th className="px-6 py-4">Chi tiết</th>
                <th className="px-6 py-4 text-center">Số request</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-slate-400 mt-4 font-semibold text-sm">Đang tải nhật ký...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">check_circle</span>
                    <p className="text-slate-400 font-bold text-sm">Chưa có nhật ký hoạt động bất thường nào.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-100/70 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">
                          {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString("vi-VN")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 text-sm bg-slate-100 px-2.5 py-1 rounded-md">{log.ipAddress}</span>
                    </td>
                    <td className="px-6 py-4">
                      {log.userId ? (
                        <span className="text-sm font-medium text-blue-600 truncate max-w-[150px] inline-block" title={log.userId}>
                          {log.userId}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Khách (Ẩn danh)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full uppercase ${getActionTypeStyle(log.actionType)}`}>
                        {getActionTypeLabel(log.actionType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[250px] md:max-w-[350px] truncate text-slate-600 text-sm font-medium" title={log.description}>
                        {log.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {log.requestCount} / phút
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Trang {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Trước
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

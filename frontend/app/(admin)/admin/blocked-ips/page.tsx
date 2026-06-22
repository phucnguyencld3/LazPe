"use client";
import { useState, useEffect } from "react";
import { getAllBlockedIps, blockIp, unblockIp, BlockedIp } from "@/lib/features/ip-block/ipBlockApi";
import { toast } from "sonner";


export default function BlockedIpsPage() {
  const [ips, setIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailModalIp, setDetailModalIp] = useState<BlockedIp | null>(null);

  // Form state
  const [newIp, setNewIp] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(30);

  const fetchIps = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập");
        return;
      }
      const data = await getAllBlockedIps(token);
      setIps(data);
    } catch (error) {
      toast.error("Không thể tải danh sách IP bị chặn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIps();
  }, []);

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return toast.error("Vui lòng nhập IP");
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      const res = await blockIp(token, newIp, reason, duration);
      if (res.success) {
        toast.success(res.message);
        setNewIp("");
        setReason("");
        setDuration(30);
        setIsAddModalOpen(false);
        fetchIps();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi chặn IP");
    }
  };

  // Confirm Modal state
  const [confirmUnblockIp, setConfirmUnblockIp] = useState<string | null>(null);

  const handleUnblock = async () => {
    if (!confirmUnblockIp) return;
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      const res = await unblockIp(token, confirmUnblockIp);
      if (res.success) {
        toast.success(res.message);
        setDetailModalIp(null); // Close detail modal if open
        setConfirmUnblockIp(null); // Close confirm modal
        fetchIps();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi mở khóa IP");
    }
  };

  const handleLockUser = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn khóa tài khoản này 30 ngày?")) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const res = await fetch(`${API_URL}/Users/${userId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: "Spam đơn COD", lockoutDays: 30 })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Khóa tài khoản thành công");
      } else {
        toast.error(data.message || "Lỗi khi khóa tài khoản");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi khóa tài khoản");
    }
  };

  return (
    <>
      <main className="w-full pb-20 animate-in fade-in duration-300">
        {/* Header */}
        <header className="mb-lg flex items-center justify-between">
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold">Quản lý IP Bị Chặn</h1>
            <p className="font-body-md text-body-md text-on-surface-variant/70">Theo dõi và quản lý các địa chỉ IP có hành vi bất thường hoặc spam</p>
          </div>
          <div className="flex items-center gap-sm shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-white px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Thêm IP chặn mới
            </button>
          </div>
        </header>

        {/* Danh sách IP bị chặn (Full Width) */}
        <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden w-full">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600">list_alt</span>
            <h2 className="font-bold text-slate-700">Danh sách IP Bị Chặn</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/55 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Lý do</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Ngày hết hạn</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                      <p className="text-slate-400 mt-4 font-semibold text-sm">Đang tải danh sách IP...</p>
                    </td>
                  </tr>
                ) : ips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20">
                      <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">security</span>
                      <p className="text-slate-400 font-bold text-sm">Chưa có IP nào nằm trong danh sách đen.</p>
                    </td>
                  </tr>
                ) : (
                  ips.map((ip) => (
                    <tr key={ip.id} className="hover:bg-slate-100/70 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-sm">{ip.ipAddress}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[300px] truncate text-slate-600 text-sm" title={ip.reason}>
                          {ip.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {ip.isActive ? (
                          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-error/10 text-error uppercase">
                            Đang chặn
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                            Đã mở khóa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-500 text-sm font-medium">
                          {ip.expiresAt ? new Date(ip.expiresAt).toLocaleDateString("vi-VN") : "Vĩnh viễn"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetailModalIp(ip)}
                            className="bg-blue-50 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          {ip.isActive ? (
                            <button
                              onClick={() => setConfirmUnblockIp(ip.ipAddress)}
                              className="bg-emerald-50 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Mở khóa IP"
                            >
                              <span className="material-symbols-outlined text-[18px]">lock_open</span>
                            </button>
                          ) : (
                            <div className="w-8 h-8"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Add IP */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">block</span>
                <h2 className="font-bold text-lg text-slate-800">Chặn IP Mới</h2>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleBlock} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ IP</label>
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[8px] font-medium text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Ví dụ: 192.168.1.1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lý do chặn</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[8px] font-medium text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Ví dụ: Tài khoản email@gmail.com spam đơn hàng..."
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời gian chặn (Ngày)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[8px] font-medium text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    min={1}
                    required
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-[8px] font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-error text-white px-5 py-2.5 rounded-[8px] font-bold text-sm flex justify-center items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    Thực thi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Details */}
      {detailModalIp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[900px] max-w-full shrink-0 flex flex-col rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <h2 className="font-bold text-lg text-slate-800">Chi tiết IP bị chặn</h2>
              </div>
              <button 
                onClick={() => setDetailModalIp(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/50 overflow-y-auto flex-1">
              
              {/* Card 1: Thông tin IP */}
              <div className="p-2">
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined text-[18px]">public</span>
                  </div>
                  Thông tin kết nối
                </h4>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-slate-500">IP Address</span>
                    <span className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg w-fit">{detailModalIp.ipAddress}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-slate-500">Trạng thái IP</span>
                    <div>
                      {detailModalIp.isActive ? (
                        <span className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-error/10 text-error flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          Đang bị chặn
                        </span>
                      ) : (
                        <span className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Đã mở khóa
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-slate-500">Thời gian khóa</span>
                    <span className="text-sm font-medium text-slate-700">
                      {new Date(detailModalIp.blockedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-slate-500">Hết hạn vào</span>
                    <span className="text-sm font-medium text-slate-700">
                      {detailModalIp.expiresAt ? new Date(detailModalIp.expiresAt).toLocaleString("vi-VN") : "Vĩnh viễn"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Thông tin Vi phạm */}
              <div className="p-2">
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                  </div>
                  Chi tiết vi phạm
                </h4>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-slate-500">Tài khoản</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${!detailModalIp.userEmail ? "text-slate-400 italic font-normal" : "text-slate-800"}`}>
                        {detailModalIp.userEmail || "Không có (Bản ghi cũ)"}
                      </span>
                      {detailModalIp.userId && (
                        <button
                          onClick={() => handleLockUser(detailModalIp.userId!)}
                          className="bg-white border border-error/20 text-error px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-error hover:text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">person_off</span>
                          Khóa TK
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-slate-500 mt-1">Đơn hàng Spam</span>
                    <div className="flex flex-wrap gap-2">
                      {detailModalIp.recentInvoices && detailModalIp.recentInvoices.length > 0 ? (
                        detailModalIp.recentInvoices.map((code, idx) => (
                          <span key={idx} className="bg-white shadow-sm border border-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-md">
                            {code}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-sm py-1.5">Không có (Bản ghi cũ)</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-sm font-semibold text-slate-500 block mb-2">Lý do hệ thống xử lý:</span>
                    <div className="bg-white p-3.5 rounded-xl text-sm text-slate-700 leading-relaxed font-medium">
                      {detailModalIp.reason}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDetailModalIp(null)}
                className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-[8px] font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              {detailModalIp.isActive && (
                <button
                  onClick={() => setConfirmUnblockIp(detailModalIp.ipAddress)}
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-[8px] font-bold text-sm flex justify-center items-center gap-1.5 hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  Mở khóa IP ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Unblock */}
      {confirmUnblockIp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[400px] shrink-0 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">lock_open</span>
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">Xác nhận mở khóa</h3>
              <p className="text-slate-600 text-sm mb-6">
                Bạn có chắc chắn muốn mở khóa cho IP <span className="font-bold text-slate-800">{confirmUnblockIp}</span> không?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmUnblockIp(null)}
                  className="flex-1 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-[8px] font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleUnblock}
                  className="flex-1 bg-emerald-600 text-white px-5 py-2.5 rounded-[8px] font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md cursor-pointer"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

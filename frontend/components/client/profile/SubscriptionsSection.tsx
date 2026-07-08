"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Package, PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";

interface SubscriptionItem {
  subscriptionID: number;
  userID: string;
  productID: number;
  productName: string;
  variantID?: number;
  variantName?: string;
  quantity: number;
  frequencyType: 1 | 2 | 3;
  frequencyValue: number;
  startDate: string;
  nextBillingDate: string;
  status: 1 | 2 | 3 | 4; // 1: Active, 2: Paused, 3: Cancelled, 4: Completed
  shippingAddressId: number;
}

export const SubscriptionsSection = ({ token }: { token: string | null }) => {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<number>(0); // 0: All, 1: Active, 2: Paused, 3: Cancelled, 4: Completed
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null);
  const itemsPerPage = 3;

  const fetchSubscriptions = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const res = await fetch(`${API_BASE_URL}/Subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubscriptions(data.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách mua định kỳ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [token]);

  const handleAction = async (id: number, action: "pause" | "resume" | "cancel") => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      let url = `${API_BASE_URL}/Subscriptions/${id}`;
      let method = "DELETE";

      if (action === "pause") {
        url = `${API_BASE_URL}/Subscriptions/${id}/pause`;
        method = "PATCH";
      } else if (action === "resume") {
        url = `${API_BASE_URL}/Subscriptions/${id}/resume`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // toast.success(data.message); // Đã có thông báo từ SignalR (HeaderV2)
        fetchSubscriptions();
      } else {
        toast.error(data.message || "Thao tác thất bại");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Filter and sort subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    if (statusFilter === 0) return true;
    return sub.status === statusFilter;
  });

  // Sort: Active (1) first, then Paused (2), then others
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    if (a.status === b.status) {
      return new Date(b.nextBillingDate).getTime() - new Date(a.nextBillingDate).getTime();
    }
    return a.status - b.status;
  });

  const totalPages = Math.ceil(sortedSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = sortedSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <section className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-100/60 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <h2 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">autorenew</span> Quản lý Mua Định Kỳ
        </h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-100 mb-6 overflow-x-auto scrollbar-none w-full">
        {[
          { id: 0, label: "Tất cả" },
          { id: 1, label: "Đang hoạt động" },
          { id: 2, label: "Đang tạm dừng" },
          { id: 4, label: "Hoàn thành" },
          { id: 3, label: "Đã hủy" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
            className={`flex-1 py-3 px-2 text-[12px] sm:text-[13px] font-bold border-b-2 whitespace-nowrap text-center transition-all ${
              statusFilter === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sortedSubscriptions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-[10px] border border-dashed border-slate-200">
          <Package className="mx-auto text-slate-300 mb-2" size={40} strokeWidth={1.5} />
          <p className="text-slate-500 font-semibold text-sm">Không tìm thấy gói mua định kỳ nào trong mục này.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedSubscriptions.map(sub => (
            <div key={sub.subscriptionID} className="border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{sub.productName}</h3>
                {sub.variantName && <p className="text-xs text-slate-500 mt-1">Phân loại: {sub.variantName}</p>}
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Chu kỳ:</span> {sub.frequencyValue} {sub.frequencyType === 1 ? "Ngày" : sub.frequencyType === 2 ? "Tuần" : "Tháng"} / lần
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Số lượng:</span> {sub.quantity}
                  </div>
                </div>

                <div className="text-xs text-slate-600 mt-2">
                  <span className="font-semibold">Giao hàng tiếp theo:</span> {new Date(sub.nextBillingDate).toLocaleDateString("vi-VN")}
                </div>

                <div className="mt-3">
                  {sub.status === 1 && <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase">Đang hoạt động</span>}
                  {sub.status === 2 && <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase">Đang tạm dừng</span>}
                  {sub.status === 3 && <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded uppercase">Đã hủy</span>}
                  {sub.status === 4 && <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">Đã hoàn thành</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto shrink-0">
                {sub.status === 1 && (
                  <button onClick={() => handleAction(sub.subscriptionID, "pause")} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded text-xs font-bold transition-colors">
                    <PauseCircle size={14} /> Tạm dừng
                  </button>
                )}
                {sub.status === 2 && (
                  <button onClick={() => handleAction(sub.subscriptionID, "resume")} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded text-xs font-bold transition-colors">
                    <PlayCircle size={14} /> Tiếp tục
                  </button>
                )}
                {sub.status !== 3 && sub.status !== 4 && (
                  <button onClick={() => setCancelConfirmId(sub.subscriptionID)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-bold transition-colors">
                    <XCircle size={14} /> Hủy gói
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              <span className="text-sm font-semibold text-slate-700">
                Trang {currentPage} / {totalPages}
              </span>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmId !== null && (
        <div 
          className="fixed inset-0 flex items-center justify-center" 
          style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div 
            className="bg-white overflow-hidden shadow-lg"
            style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}
          >
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div 
                className="mx-auto flex items-center justify-center"
                style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fff1f2', marginBottom: '16px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#f43f5e' }}>warning</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Hủy Mua Định Kỳ</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn hủy gói mua định kỳ này không? Thao tác này sẽ dừng việc tự động giao hàng và thanh toán.
              </p>
            </div>
            <div className="flex w-full" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => setCancelConfirmId(null)}
                className="flex-1 transition-colors"
                style={{ padding: '16px 0', color: '#475569', fontWeight: '600', backgroundColor: '#f8fafc' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              >
                Giữ lại
              </button>
              <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>
              <button 
                onClick={() => {
                  handleAction(cancelConfirmId, "cancel");
                  setCancelConfirmId(null);
                }}
                className="flex-1 transition-colors"
                style={{ padding: '16px 0', color: '#e11d48', fontWeight: 'bold', backgroundColor: '#fff' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fff1f2'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

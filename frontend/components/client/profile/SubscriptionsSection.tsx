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
        toast.success(data.message);
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
    <div className="bg-white rounded-[16px] border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
        <span className="material-symbols-outlined text-primary text-2xl">autorenew</span>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Quản lý Mua Định Kỳ</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-none">
        {[
          { id: 0, label: "Tất cả" },
          { id: 1, label: "Đang hoạt động" },
          { id: 2, label: "Đang tạm dừng" },
          { id: 3, label: "Đã hủy" },
          { id: 4, label: "Hoàn thành" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === tab.id 
                ? "bg-primary text-white" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sortedSubscriptions.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <Package className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-sm font-semibold">Không tìm thấy gói mua định kỳ nào</p>
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
                  <button onClick={() => { if (confirm("Bạn có chắc muốn hủy gói mua định kỳ này?")) handleAction(sub.subscriptionID, "cancel"); }} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-bold transition-colors">
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
    </div>
  );
};

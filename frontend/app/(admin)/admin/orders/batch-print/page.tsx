"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderInfo, fetchOrders, formatCurrency, formatDateTime, resolveApiUrl } from "@/lib/features/orders/orderApi";
import { toast } from "@/lib/toast";
import Link from "next/link";

export default function BatchPrintPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"waiting" | "stored">("waiting");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại.");
        return;
      }
      
      const data = await fetchOrders(token);
      // Sắp xếp theo ngày tạo cũ nhất lên trước (để in theo thứ tự)
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Mới nhất lên trước
      
      setOrders(data);
    } catch (error: any) {
      console.error(error);
      toast.error(`Lỗi tải danh sách đơn hàng: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const waitingOrders = orders.filter(o => o.statusCode === 1 && !o.printTicketUrl).reverse(); // Cũ nhất lên trước
  const storedOrders = orders.filter(o => !!o.printTicketUrl);

  const displayOrders = activeTab === "waiting" ? waitingOrders : storedOrders;

  const handleSelectAll = () => {
    if (selectedIds.length === displayOrders.length) {
      setSelectedIds([]); // Deselect all
    } else {
      setSelectedIds(displayOrders.map(o => o.invoiceID)); // Select all
    }
  };

  const handleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchPrint = () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng để in.");
      return;
    }
    const idsParam = selectedIds.join(",");
    router.push(`/admin/orders/batch-print/execute?ids=${idsParam}`);
  };

  // Switch tab sẽ clear selection
  const switchTab = (tab: "waiting" | "stored") => {
    setActiveTab(tab);
    setSelectedIds([]);
  };

  return (
    <div className="p-6 w-full min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">print</span>
            {activeTab === "waiting" ? "In Hàng Loạt" : "Hóa Đơn Lưu Trữ"}
          </h1>
          <p className="text-slate-500 mt-1">
            {activeTab === "waiting" 
              ? "Danh sách các đơn hàng đã xác nhận, chờ in phiếu giao hàng."
              : "Danh sách các hóa đơn đã được in và lưu trữ bản PDF trên hệ thống."}
          </p>
        </div>
        
        {activeTab === "waiting" && (
          <button
            onClick={handleBatchPrint}
            disabled={selectedIds.length === 0}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">print</span>
            In {selectedIds.length > 0 ? `(${selectedIds.length}) đơn` : "hàng loạt"}
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => switchTab("waiting")}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            activeTab === "waiting" 
              ? "border-primary text-primary" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Chờ In ({waitingOrders.length})
        </button>
        <button
          onClick={() => switchTab("stored")}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            activeTab === "stored" 
              ? "border-primary text-primary" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Hóa Đơn Lưu Trữ ({storedOrders.length})
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">task_alt</span>
            <p className="text-lg font-medium text-slate-500">
              {activeTab === "waiting" ? "Không có đơn hàng nào chờ in" : "Chưa có hóa đơn nào được lưu trữ"}
            </p>
            <p className="text-sm mt-2">
              {activeTab === "waiting" 
                ? "Tất cả các đơn hàng đã được in hoặc chưa có đơn hàng mới được xác nhận."
                : "Khi bạn tiến hành in đơn hàng, phiếu in sẽ tự động được lưu trữ dưới dạng PDF tại đây."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-bold">
                  {activeTab === "waiting" && (
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 cursor-pointer accent-primary"
                        checked={selectedIds.length === displayOrders.length && displayOrders.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Thanh toán</th>
                  <th className="p-4 text-right">Tổng tiền</th>
                  <th className="p-4 text-center">Ngày tạo</th>
                  {activeTab === "stored" && <th className="p-4 text-center">Hành động</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayOrders.map((order) => {
                  const isCOD = !order.payMethodCode || order.payMethod?.toLowerCase().includes("cod");
                  const codAmount = isCOD ? (order.totalPrice + (order.shippingFee || 0) - (order.shippingDiscountAmount || 0)) : 0;
                  
                  return (
                    <tr 
                      key={order.invoiceID} 
                      className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(order.invoiceID) ? "bg-primary/5" : ""}`}
                    >
                      {activeTab === "waiting" && (
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 cursor-pointer accent-primary"
                            checked={selectedIds.includes(order.invoiceID)}
                            onChange={() => handleSelect(order.invoiceID)}
                          />
                        </td>
                      )}
                      <td className="p-4 font-bold text-slate-800">#{order.invoiceID}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{order.userFullName || order.userName}</div>
                        <div className="text-xs text-slate-500">{order.userPhone}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-600">
                          {order.payMethod || "COD"}
                        </span>
                        {isCOD && codAmount > 0 && (
                          <div className="text-xs text-rose-500 font-bold mt-1">Thu: {formatCurrency(codAmount)}</div>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="p-4 text-center text-sm text-slate-500">
                        {formatDateTime(order.createdAt)}
                      </td>
                      {activeTab === "stored" && (
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <Link
                              href={resolveApiUrl(order.printTicketUrl)}
                              target="_blank"
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors inline-flex items-center justify-center gap-1 font-bold text-xs"
                              title="Tải xuống / Xem PDF"
                            >
                              <span className="material-symbols-outlined text-[16px]">download</span>
                              Tải / Xem
                            </Link>
                            <Link
                              href={`/admin/orders/batch-print/execute?ids=${order.invoiceID}`}
                              className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center justify-center gap-1 font-bold text-xs"
                              title="In lại phiếu này"
                            >
                              <span className="material-symbols-outlined text-[16px]">print</span>
                              In lại
                            </Link>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

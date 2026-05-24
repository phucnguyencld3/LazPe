"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  OrderInfo,
  fetchOrders,
  formatCurrency,
  formatDateTime,
  getStatusBadgeColor,
  getStatusLabel
} from "@/lib/orderHelpers";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        setLoading(true);
        const data = await fetchOrders(token);
        setOrders(data);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [router]);

  // Derived state
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = statusFilter === null ? true : o.statusCode === statusFilter;
      const matchSearch = searchTerm === "" ? true : (
        o.invoiceID.toString().includes(searchTerm) ||
        (o.userFullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (o.userPhone || "").includes(searchTerm)
      );
      return matchStatus && matchSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Metrics
  const metrics = useMemo(() => {
    const pending = orders.filter(o => o.statusCode === 0).length;
    const shipping = orders.filter(o => o.statusCode === 2).length;
    const completed = orders.filter(o => o.statusCode === 4).length;
    return { pending, shipping, completed };
  }, [orders]);

  return (
    <main className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 w-full pb-10">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8 pt-4">
        <div>
          <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            <span>Trang chủ</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-rose-500">Đơn hàng</span>
          </nav>
          <h2 className="text-3xl font-bold text-slate-800">Quản lý đơn hàng</h2>
        </div>
        <button
          onClick={() => toast.info("Tính năng xuất Excel chưa khả dụng")}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">ios_share</span>
          Xuất file Excel
        </button>
      </div>

      {/* Summary Cards Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <span className="material-symbols-outlined text-3xl">list_alt</span>
            </div>
            <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">Tổng quát</span>
          </div>
          <p className="text-sm font-bold text-slate-400 mb-1 uppercase">Tổng đơn hàng</p>
          <h3 className="text-3xl font-bold text-slate-800">{orders.length}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-3xl">pending_actions</span>
            </div>
            <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full">Cần xử lý</span>
          </div>
          <p className="text-sm font-bold text-slate-400 mb-1 uppercase">Đang chờ</p>
          <h3 className="text-3xl font-bold text-slate-800">{metrics.pending}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">Trong kho</span>
          </div>
          <p className="text-sm font-bold text-slate-400 mb-1 uppercase">Đang giao</p>
          <h3 className="text-3xl font-bold text-slate-800">{metrics.shipping}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">Thành công</span>
          </div>
          <p className="text-sm font-bold text-slate-400 mb-1 uppercase">Hoàn thành</p>
          <h3 className="text-3xl font-bold text-slate-800">{metrics.completed}</h3>
        </div>
      </section>

      {/* Filters & Table Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filter Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setStatusFilter(null)}
              className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === null ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setStatusFilter(0)}
              className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 0 ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Chờ xác nhận
            </button>
            <button 
              onClick={() => setStatusFilter(2)}
              className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 2 ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đang giao
            </button>
            <button 
              onClick={() => setStatusFilter(3)}
              className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 3 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đã nhận
            </button>
            <button 
              onClick={() => setStatusFilter(4)}
              className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 4 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Hoàn thành
            </button>
            <button 
              onClick={() => setStatusFilter(5)}
              className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 5 ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đã hủy
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none w-64 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Tìm mã đơn, khách hàng..." 
                type="text" 
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white text-left text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 border-b border-slate-100">Mã đơn hàng</th>
                <th className="px-6 py-4 border-b border-slate-100">Khách hàng</th>
                <th className="px-6 py-4 border-b border-slate-100">Ngày đặt</th>
                <th className="px-6 py-4 border-b border-slate-100">Tổng tiền</th>
                <th className="px-6 py-4 border-b border-slate-100">Thanh toán</th>
                <th className="px-6 py-4 border-b border-slate-100">Trạng thái</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="text-slate-500 mt-4 font-medium">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">search_off</span>
                    <p className="text-slate-500 font-medium">Không tìm thấy đơn hàng nào.</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.invoiceID} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-5 font-bold text-indigo-600">
                      #{order.invoiceID.toString().padStart(6, '0')}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100">
                          {order.userFullName ? order.userFullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{order.userFullName || order.userName || 'Ẩn danh'}</span>
                          <span className="text-xs text-slate-400">{order.userPhone || 'Không có sđt'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-500 text-sm font-medium">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-800 text-sm">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="px-6 py-5">
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="material-symbols-outlined text-[16px]">
                          {order.payMethodCode === 0 ? 'payments' : 'credit_card'}
                        </span>
                        {order.payMethod}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${getStatusBadgeColor(order.statusCode)}`}>
                        {getStatusLabel(order.statusCode)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.invoiceID}`)}
                        className="w-9 h-9 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center justify-center"
                        title="Xem chi tiết"
                      >
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <span className="text-sm text-slate-500 font-medium">
              Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} trong <span className="font-bold">{filteredOrders.length}</span> đơn hàng
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 font-bold text-sm transition-colors shadow-sm"
              >
                Trước
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 font-bold text-sm transition-colors shadow-sm"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
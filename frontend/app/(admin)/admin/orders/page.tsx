"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderInfo, fetchOrders } from "@/lib/features/orders/orderApi";
import { OrderSummaryCards } from "@/components/admin/orders/OrderSummaryCards";
import { OrderFilters } from "@/components/admin/orders/OrderFilters";
import { OrderTable } from "@/components/admin/orders/OrderTable";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination State
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  // Fetch initial data
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

  // Derived state: Filtered orders
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

  // Derived state: Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Derived state: Metrics
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

      <OrderSummaryCards 
        totalOrders={orders.length}
        pending={metrics.pending}
        shipping={metrics.shipping}
        completed={metrics.completed}
      />

      {/* Filters & Table Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <OrderFilters 
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <OrderTable 
          orders={paginatedOrders}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </section>
    </main>
  );
}
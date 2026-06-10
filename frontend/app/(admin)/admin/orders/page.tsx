"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { OrderInfo, fetchOrders } from "@/lib/features/orders/orderApi";
import { OrderSummaryCards } from "@/components/admin/orders/OrderSummaryCards";
import { OrderFilters } from "@/components/admin/orders/OrderFilters";
import { OrderTable } from "@/components/admin/orders/OrderTable";
import Button from "@/components/admin/ui/Button";

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

  // Derived state: Metrics & Calculations
  const metrics = useMemo(() => {
    const pending = orders.filter(o => o.statusCode === 0).length;
    const shipping = orders.filter(o => o.statusCode === 2).length;
    const completed = orders.filter(o => o.statusCode === 4).length;
    return { pending, shipping, completed };
  }, [orders]);

  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders
      .filter(o => new Date(o.createdAt).toDateString() === today && o.statusCode !== 5)
      .reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [orders]);

  const cancelledCount = useMemo(() => {
    return orders.filter(o => o.statusCode === 5).length;
  }, [orders]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.statusCode === 0).length,
      processing: orders.filter(o => o.statusCode === 1).length,
      shipping: orders.filter(o => o.statusCode === 2).length,
      completed: orders.filter(o => o.statusCode === 4).length,
      cancelled: orders.filter(o => o.statusCode === 5).length,
    };
  }, [orders]);

  return (
    <main className="w-full space-y-6 animate-in fade-in duration-300 pb-10 font-outfit">
      {/* Title & Description Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Theo dõi và cập nhật trạng thái đơn hàng từ khách hàng của LazPe.</p>
        </div>
        <Button
          onClick={() => toast.info("Tính năng xuất Excel chưa khả dụng")}
          variant="outline"
          startIcon={<span className="material-symbols-outlined text-[18px]">ios_share</span>}
          className="font-bold"
        >
          Xuất file Excel
        </Button>
      </div>

      <OrderSummaryCards 
        totalOrders={orders.length}
        pending={metrics.pending}
        todayRevenue={todayRevenue}
        cancelledCount={cancelledCount}
        onViewRequests={() => setStatusFilter(5)}
      />

      {/* Filters & Table Section - Separated for Bento feel */}
      <OrderFilters 
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        counts={counts}
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
    </main>
  );
}
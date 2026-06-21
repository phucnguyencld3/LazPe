"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { OrderInfo, fetchOrdersPaginated, fetchOrderMetrics, bulkConfirmOrders, bulkMarkShippedOrders } from "@/lib/features/orders/orderApi";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortValue, setSortValue] = useState("created_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Metrics State
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    pending: 0,
    processing: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0,
    todayRevenue: 0
  });

  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedInvoiceIds([]);
  }, [statusFilter, debouncedSearch, sortValue]);

  const loadMetrics = async (token: string) => {
    try {
      const data = await fetchOrderMetrics(token);
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);
      
      let sortBy = 'created';
      let desc = true;
      if (sortValue === "created_asc") { sortBy = 'created'; desc = false; }
      if (sortValue === "total_desc") { sortBy = 'total'; desc = true; }
      if (sortValue === "total_asc") { sortBy = 'total'; desc = false; }
      
      const data = await fetchOrdersPaginated(token, currentPage, ITEMS_PER_PAGE, debouncedSearch, statusFilter, sortBy, desc);
      setOrders(data.items);
      setTotalCount(data.totalCount);
      setSelectedInvoiceIds([]);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial metrics
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      loadMetrics(token);
    }
  }, []);

  // Fetch paginated data whenever dependencies change
  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter, debouncedSearch, sortValue]);

  const handleBulkConfirm = async () => {
    if (selectedInvoiceIds.length === 0) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      const res = await bulkConfirmOrders(token, selectedInvoiceIds);
      if (res.errors && res.errors.length > 0) {
        toast.warning(res.message + " " + res.errors[0]);
      } else {
        toast.success(res.message || "Xác nhận hàng loạt thành công!");
      }
      loadOrders();
      loadMetrics(token);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xác nhận hàng loạt.");
    }
  };

  const handleBulkMarkShipped = async () => {
    if (selectedInvoiceIds.length === 0) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      const res = await bulkMarkShippedOrders(token, selectedInvoiceIds);
      if (res.errors && res.errors.length > 0) {
        toast.warning(res.message + " " + res.errors[0]);
      } else {
        toast.success(res.message || "Cập nhật giao hàng hàng loạt thành công!");
      }
      loadOrders();
      loadMetrics(token);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật giao hàng hàng loạt.");
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const counts = useMemo(() => {
    return {
      all: metrics.totalOrders,
      pending: metrics.pending,
      processing: metrics.processing,
      shipping: metrics.shipping,
      completed: metrics.completed,
      cancelled: metrics.cancelled,
    };
  }, [metrics]);

  return (
    <main className="w-full space-y-md animate-in fade-in duration-300 pb-10">
      {/* Title & Description Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 pt-4">
        <div className="space-y-2">
          <h1 className="text-headline-lg font-headline-lg text-on-background">Quản lý đơn hàng</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Theo dõi và cập nhật trạng thái đơn hàng từ khách hàng của LazPe.</p>
        </div>
        <button
          onClick={() => toast.info("Tính năng xuất Excel chưa khả dụng")}
          className="flex items-center gap-2 px-6 py-3 bg-surface-container-lowest border border-outline-variant text-on-surface-variant font-bold rounded-[8px] shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined">ios_share</span>
          Xuất file Excel
        </button>
      </div>

      <OrderSummaryCards 
        totalOrders={metrics.totalOrders}
        pending={metrics.pending}
        todayRevenue={metrics.todayRevenue}
        cancelledCount={metrics.cancelled}
        onViewRequests={() => setStatusFilter(5)}
      />

      {/* Filters & Table Section - Separated for Bento feel */}
      <OrderFilters 
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        counts={counts}
        sortValue={sortValue}
        setSortValue={setSortValue}
      />

      <OrderTable 
        orders={orders}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        statusFilter={statusFilter}
        selectedInvoiceIds={selectedInvoiceIds}
        setSelectedInvoiceIds={setSelectedInvoiceIds}
        onBulkConfirm={handleBulkConfirm}
        onBulkMarkShipped={handleBulkMarkShipped}
      />
    </main>
  );
}
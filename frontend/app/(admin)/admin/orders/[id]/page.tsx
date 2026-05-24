"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  OrderInfo,
  fetchOrderDetails,
  cancelOrder,
  updateOrderStatus
} from "@/lib/features/orders/orderApi";
import { CancelOrderModal } from "@/components/admin/orders/CancelOrderModal";
import { OrderActionBar } from "@/components/admin/orders/OrderActionBar";
import { OrderCustomerInfo } from "@/components/admin/orders/OrderCustomerInfo";
import { OrderShippingDetails } from "@/components/admin/orders/OrderShippingDetails";
import { OrderCostSummary } from "@/components/admin/orders/OrderCostSummary";
import { OrderProductList } from "@/components/admin/orders/OrderProductList";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Sản phẩm hết hàng");
  const [otherReason, setOtherReason] = useState("");
  const [canceling, setCanceling] = useState(false);

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);
      const data = await fetchOrderDetails(token, id as string);
      setOrder(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadOrder();
  }, [id, router]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reason = cancelReason === "other" ? otherReason : cancelReason;
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do hủy.");
      return;
    }
    
    setCanceling(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      await cancelOrder(token, id as string, reason);
      toast.success("Đã hủy đơn hàng thành công.");
      setShowCancelModal(false);
      loadOrder(); // Reload
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi hủy đơn hàng.");
    } finally {
      setCanceling(false);
    }
  };

  const handleUpdateStatus = async (actionUrl: string) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      await updateOrderStatus(token, id as string, actionUrl);
      toast.success("Cập nhật trạng thái thành công.");
      loadOrder();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật trạng thái.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-bold text-lg">Không tìm thấy đơn hàng</p>
        <button onClick={() => router.push("/admin/orders")} className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-xl font-bold">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <header className="h-24 flex items-center justify-between sticky top-0 z-10 bg-[#F9FAFB]/80 backdrop-blur-md mb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/admin/orders')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-bold">Quay lại</span>
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <h2 className="text-2xl font-bold text-slate-800">Đơn hàng #{order.invoiceID.toString().padStart(6, '0')}</h2>
        </div>
      </header>

      <div className="space-y-8 animate-in fade-in duration-300">
        <OrderActionBar 
          order={order}
          onUpdateStatus={handleUpdateStatus}
          onShowCancelModal={() => setShowCancelModal(true)}
          onPrintOrder={() => toast.info("Tính năng in đơn hàng chưa khả dụng")}
        />

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <OrderCustomerInfo order={order} />
            <OrderShippingDetails order={order} />
          </div>

          {/* Right Column: Summary */}
          <div className="space-y-8">
            <OrderCostSummary order={order} />
          </div>
        </div>

        <OrderProductList order={order} />
      </div>

      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSubmit={handleCancelSubmit}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        otherReason={otherReason}
        setOtherReason={setOtherReason}
        canceling={canceling}
      />
    </main>
  );
}

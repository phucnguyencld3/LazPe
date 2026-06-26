"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  OrderInfo,
  fetchOrderDetails,
  cancelOrder,
  updateOrderStatus,
  approveReturnOrder
} from "@/lib/features/orders/orderApi";
import { CancelOrderModal } from "@/components/admin/orders/CancelOrderModal";
import { ReturnOrderModal } from "@/components/admin/orders/ReturnOrderModal";
import { OrderActionBar } from "@/components/admin/orders/OrderActionBar";
import { OrderCustomerInfo } from "@/components/admin/orders/OrderCustomerInfo";
import { OrderCostSummary } from "@/components/admin/orders/OrderCostSummary";
import { OrderProductList } from "@/components/admin/orders/OrderProductList";
import { AlertTriangle, X } from "lucide-react";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("page") || "1";
  
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Sản phẩm hết hàng");
  const [otherReason, setOtherReason] = useState("");
  const [canceling, setCanceling] = useState(false);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleReturnSubmit = async (isRefundToCoins: boolean) => {
    setProcessingReturn(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      await approveReturnOrder(token, id as string, isRefundToCoins);
      toast.success("Đã duyệt yêu cầu hoàn trả thành công.");
      setShowReturnModal(false);
      loadOrder(); // Reload
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xử lý yêu cầu hoàn trả.");
    } finally {
      setProcessingReturn(false);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-error font-bold text-lg">Không tìm thấy đơn hàng</p>
        <button onClick={() => router.push(`/admin/orders?page=${fromPage}`)} className="mt-4 px-6 py-2 bg-primary text-on-primary rounded-[8px] font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <main className="w-full pb-20">
      {/* Header */}
      <header className="h-24 flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push(`/admin/orders?page=${fromPage}`)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-bold">Quay lại</span>
          </button>
          <div className="h-6 w-px bg-outline-variant"></div>
          <h2 className="text-2xl font-bold text-on-surface">Đơn hàng #{order.invoiceCode}</h2>
        </div>
        <OrderActionBar 
          order={order}
          onUpdateStatus={handleUpdateStatus}
          onShowCancelModal={() => setShowCancelModal(true)}
          onShowReturnModal={() => setShowReturnModal(true)}
          onPrintOrder={() => router.push(`/admin/orders/${id}/print`)}
        />
      </header>

      <div className="mt-2 space-y-5 animate-in fade-in duration-300">
        
        {/* Return Request Details */}
        {order?.returnReason && (order.statusCode === 6 || order.statusCode === 7) && (
          <div className="bg-white border border-orange-200 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-orange-500 shrink-0" size={20} />
              <h3 className="font-bold text-orange-800 text-sm md:text-base">
                Yêu cầu hoàn trả {order.statusCode === 7 ? "đã được xử lý" : "đang chờ xử lý"}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2 text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Thông tin yêu cầu</p>
                <p><strong>Lý do:</strong> {order.returnReason}</p>
                {order.returnDescription && <p><strong>Mô tả chi tiết:</strong> {order.returnDescription}</p>}
                {order.refundMethod !== undefined && (
                  <p><strong>Phương thức nhận tiền hoàn:</strong> {order.refundMethod === 1 ? 'Ví LazPe' : 'Xu LazPe'}</p>
                )}
              </div>
              
              {order.returnImageUrls && (
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 text-sm">Hình ảnh minh chứng</p>
                  <div className="flex flex-wrap gap-3">
                    {order.returnImageUrls.split(",").map((url: string, idx: number) => (
                      <img 
                        key={idx} 
                        src={url} 
                        alt={`Minh chứng ${idx+1}`} 
                        className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:scale-105 hover:opacity-80 transition-all duration-200" 
                        onClick={() => setSelectedImage(url)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column */}
          <div className="lg:col-span-2 bg-white rounded-[12px] shadow-sm border border-slate-100 overflow-hidden">
            <OrderCustomerInfo order={order} />
          </div>

          {/* Right Column: Summary */}
          <div className="space-y-5">
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

      {order && (
        <ReturnOrderModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          onSubmit={handleReturnSubmit}
          order={order}
          processing={processingReturn}
        />
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute -top-12 right-0 text-white hover:text-slate-300 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={selectedImage} 
              alt="Zoomed" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}

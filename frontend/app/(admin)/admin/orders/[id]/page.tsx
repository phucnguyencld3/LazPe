"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  OrderInfo,
  fetchOrderDetails,
  cancelOrder,
  approveCancelOrder,
  rejectCancelOrder,
  updateOrderStatus,
  approveReturnOrder,
  rejectReturnOrder,
  confirmReturnReceived
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
  const [showApproveCancelModal, setShowApproveCancelModal] = useState(false);
  const [showRejectCancelModal, setShowRejectCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Sản phẩm hết hàng");
  const [otherReason, setOtherReason] = useState("");
  const [canceling, setCanceling] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Confirm Return Received Modal State
  const [showConfirmReturnModal, setShowConfirmReturnModal] = useState(false);
  const [isRestockable, setIsRestockable] = useState(true);

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

  const handleApproveCancel = () => {
    setShowApproveCancelModal(true);
  };

  const handleRejectCancel = () => {
    setShowRejectCancelModal(true);
  };

  const executeApproveCancel = async () => {
    setCanceling(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      await approveCancelOrder(token, id as string);
      toast.success("Đã phê duyệt hủy đơn hàng thành công.");
      setShowApproveCancelModal(false);
      loadOrder();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi phê duyệt hủy.");
    } finally {
      setCanceling(false);
    }
  };

  const executeRejectCancel = async () => {
    setCanceling(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      await rejectCancelOrder(token, id as string);
      toast.success("Đã từ chối yêu cầu hủy đơn hàng.");
      setShowRejectCancelModal(false);
      loadOrder();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi từ chối yêu cầu hủy.");
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
      toast.success("Đã duyệt chờ khách gửi hàng hoàn.");
      setShowReturnModal(false);
      loadOrder(); // Reload
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi duyệt yêu cầu hoàn trả.");
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleRejectReturn = async (reason: string) => {
    setProcessingReturn(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      await rejectReturnOrder(token, id as string, reason);
      toast.success("Đã từ chối yêu cầu hoàn trả.");
      setShowReturnModal(false);
      loadOrder();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi từ chối yêu cầu hoàn trả.");
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleConfirmReturnReceived = async () => {
    setProcessingReturn(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      await confirmReturnReceived(token, id as string, isRestockable);
      toast.success("Đã xác nhận nhận hàng và hoàn tiền.");
      setShowConfirmReturnModal(false);
      loadOrder();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xác nhận nhận hàng hoàn.");
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "--/--/----";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

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
          <h2 className="font-headline-md text-headline-md text-primary font-bold">Đơn hàng #{order.invoiceCode}</h2>
        </div>
        <OrderActionBar 
          order={order}
          onUpdateStatus={handleUpdateStatus}
          onShowCancelModal={() => setShowCancelModal(true)}
          onApproveCancel={handleApproveCancel}
          onRejectCancel={handleRejectCancel}
          onShowReturnModal={() => setShowReturnModal(true)}
          onShowConfirmReturnModal={() => setShowConfirmReturnModal(true)}
          onPrintOrder={() => router.push(`/admin/orders/${id}/print`)}
        />
      </header>

      <div className="mt-2 animate-in fade-in duration-300">
        
        {/* Main Consolidated Wrapper */}
        <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100">
            
            {/* Left Column (8/12): Stepper, Customer, Return, Products */}
            <div className="lg:col-span-8 flex flex-col divide-y divide-slate-100">
              
              {/* Progress Timeline Graphic */}
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Trạng thái đơn hàng</h3>
                </div>
                <div className="relative flex justify-between items-center max-w-4xl mx-auto mt-4">
                  {/* Background Line Connector */}
                  <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-0">
                    <div
                      className="h-full bg-primary/70 transition-all duration-500"
                      style={{
                        width: (order.statusCode === 6 || order.statusCode === 7 || order.statusCode === 9 || order.statusCode === 10 || order.returnReason) ? (
                          order.statusCode === 0 ? "0%" :
                          order.statusCode === 1 ? "20%" :
                          order.statusCode === 2 ? "40%" :
                          order.statusCode === 3 ? "60%" :
                          [6, 9, 10].includes(order.statusCode) ? "80%" :
                          order.statusCode === 7 ? "100%" : "60%"
                        ) : (
                          order.statusCode === 0 ? "0%" :
                          order.statusCode === 1 ? "33.33%" :
                          order.statusCode === 2 ? "66.66%" : "100%"
                        )
                      }}
                    />
                  </div>

                  {/* Step 1: Ordered */}
                  <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${order.statusCode >= 0
                      ? "bg-primary/5 text-primary border-primary font-bold shadow-sm"
                      : "bg-white text-slate-300 border-slate-200"
                      }`}>
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>list_alt</span>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold ${order.statusCode >= 0 ? "text-primary" : "text-slate-400"}`}>Đã đặt hàng</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{formatDate(order.createdAt).split(" ")[0]}</p>
                    </div>
                  </div>

                  {/* Step 2: Confirmed */}
                  <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${order.statusCode >= 1
                      ? "bg-primary/5 text-primary border-primary font-bold shadow-sm"
                      : "bg-white text-slate-300 border-slate-200"
                      }`}>
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold ${order.statusCode >= 1 ? "text-primary" : "text-slate-400"}`}>Đã xác nhận</p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {order.confirmedAt ? formatDate(order.confirmedAt).split(" ")[0] : "--/--"}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Shipping */}
                  <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${order.statusCode >= 2
                      ? "bg-primary/5 text-primary border-primary font-bold shadow-sm"
                      : "bg-white text-slate-300 border-slate-200"
                      }`}>
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold ${order.statusCode >= 2 ? "text-primary" : "text-slate-400"}`}>Đang giao</p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {order.shippedAt ? formatDate(order.shippedAt).split(" ")[0] : "--/--"}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Completed */}
                  <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${(order.statusCode >= 3 || [6,7,9,10].includes(order.statusCode))
                      ? "bg-emerald-50 text-emerald-600 border-emerald-500 font-bold shadow-sm"
                      : "bg-white text-slate-300 border-slate-200"
                      }`}>
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold ${(order.statusCode >= 3 || [6,7,9,10].includes(order.statusCode)) ? "text-emerald-600" : "text-slate-400"}`}>Hoàn tất</p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {order.completedAt ? formatDate(order.completedAt).split(" ")[0] : "--/--"}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Return (Conditional) */}
                  {([6,7,9,10].includes(order.statusCode) || order.returnReason) && (
                    <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all 
                        ${order.statusCode === 10 ? "bg-red-50 text-red-500 border-red-400 font-bold shadow-sm" : 
                          ([6,7,9].includes(order.statusCode)) ? "bg-orange-50 text-orange-500 border-orange-400 font-bold shadow-sm"
                        : "bg-white text-slate-300 border-slate-200"
                        }`}>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{order.statusCode === 10 ? 'cancel' : 'assignment_return'}</span>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-bold ${order.statusCode === 10 ? "text-red-600" : ([6,7,9].includes(order.statusCode)) ? "text-orange-600" : "text-slate-400"}`}>
                          {order.statusCode === 10 ? "Từ chối hoàn hàng" : 
                           (order.statusCode === 9 || order.statusCode === 7) ? "Đã duyệt trả hàng" : "Yêu cầu trả hàng"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {order.statusCode === 7 || order.statusCode === 9 ? formatDate(order.cancelledAt || order.completedAt || order.createdAt).split(" ")[0] : "--/--"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Refund (Conditional) */}
                  {([6,7,9,10].includes(order.statusCode) || order.returnReason) && (
                    <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all 
                        ${order.statusCode === 7 ? "bg-emerald-50 text-emerald-600 border-emerald-500 font-bold shadow-sm" : 
                        "bg-white text-slate-300 border-slate-200"
                        }`}>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>paid</span>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-bold ${order.statusCode === 7 ? "text-emerald-600" : "text-slate-400"}`}>
                          Đã hoàn tiền
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {order.statusCode === 7 ? formatDate(order.cancelledAt || order.completedAt || order.createdAt).split(" ")[0] : "--/--"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <OrderCustomerInfo order={order} />
              </div>

              {/* Customer Cancel Request Section (statusCode === 4: Chờ duyệt hủy) */}
              {order.statusCode === 4 && (
                <div className="p-8 bg-rose-50/40">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                      <h3 className="font-bold text-sm md:text-base uppercase tracking-wider text-rose-800">
                        Yêu cầu hủy đơn hàng từ khách hàng
                      </h3>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-rose-100 text-rose-700 font-bold rounded-full">
                      Chờ duyệt hủy
                    </span>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lý do hủy từ khách hàng:</p>
                      <p className="text-base font-bold text-rose-900 mt-1">
                        "{order.cancelReason || "Không ghi rõ lý do"}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled Order Reason Banner (statusCode === 5 or 8) */}
              {(order.statusCode === 5 || order.statusCode === 8) && (
                <div className="p-8 bg-rose-50/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-rose-500 text-xl">cancel</span>
                    <h3 className="font-bold text-sm md:text-base uppercase tracking-wider text-rose-800">
                      Thông tin hủy đơn hàng {order.statusCode === 8 ? "& Hoàn tiền" : ""}
                    </h3>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lý do hủy:</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        "{order.cancelReason || "Không có lý do ghi nhận"}"
                      </p>
                    </div>
                    {order.cancelledAt && (
                      <p className="text-xs text-slate-400 pt-1">
                        Thời gian hủy: {formatDate(order.cancelledAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Return Request Details (If applicable) */}
              {order?.returnReason && (order.statusCode === 6 || order.statusCode === 7 || order.statusCode === 9 || order.statusCode === 10) && (
                <div className={`p-8 ${order.statusCode === 9 ? 'bg-slate-50' : 'bg-orange-50/30'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className={`${order.statusCode === 9 ? 'text-slate-500' : 'text-orange-500'} shrink-0`} size={20} />
                    <h3 className={`font-bold text-sm md:text-base uppercase tracking-wider ${order.statusCode === 9 ? 'text-slate-700' : 'text-orange-800'}`}>
                      Yêu cầu hoàn trả {
                        order.statusCode === 7 ? "đã được xử lý" 
                        : order.statusCode === 9 ? "đã duyệt chờ nhận hàng"
                        : order.statusCode === 10 ? "đã bị từ chối"
                        : "đang chờ xử lý"
                      }
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-2 text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Thông tin yêu cầu</p>
                      <p><strong>Lý do:</strong> {order.returnReason}</p>
                      {order.returnDescription && <p><strong>Mô tả chi tiết:</strong> {order.returnDescription}</p>}
                      {order.refundMethod !== undefined && (
                        <p><strong>Phương thức nhận tiền hoàn:</strong> {order.refundMethod === 1 ? 'Ví LazPe' : 'Xu LazPe'}</p>
                      )}
                    </div>
                    
                    {order.returnImageUrls && (
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
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

              {/* Product List */}
              <div className="bg-white">
                <OrderProductList order={order} />
              </div>
            </div>

            {/* Right Column (4/12): Cost Summary */}
            <div className="lg:col-span-4 flex flex-col divide-y divide-slate-100 bg-slate-50/50">
              <OrderCostSummary order={order} />
            </div>
            
          </div>
        </div>
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
          onReject={handleRejectReturn}
          order={order}
          processing={processingReturn}
        />
      )}

      {/* Confirm Return Received Modal */}
      {showConfirmReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600">inventory_2</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Xác nhận nhận hàng</h2>
              </div>
              <button
                onClick={() => setShowConfirmReturnModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="text-slate-400" size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-600">
                Bạn xác nhận đã nhận được kiện hàng hoàn trả từ khách hàng? Sau khi xác nhận, hệ thống sẽ tiến hành hoàn tiền cho khách.
              </p>
              
              <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={isRestockable}
                  onChange={(e) => setIsRestockable(e.target.checked)}
                />
                <div>
                  <p className="font-bold text-slate-800">Sản phẩm còn nguyên vẹn</p>
                  <p className="text-sm text-slate-500">Cho phép nhập lại kho để tiếp tục bán các sản phẩm trong đơn hàng này.</p>
                </div>
              </label>
            </div>
            
            <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmReturnModal(false)}
                className="px-5 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                disabled={processingReturn}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReturnReceived}
                disabled={processingReturn}
                className="px-5 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center gap-2"
              >
                {processingReturn ? "Đang xử lý..." : "Xác nhận & Hoàn tiền"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phê Duyệt Hủy Đơn */}
      {showApproveCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[480px] shrink-0 rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-rose-600">check_circle</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Phê duyệt hủy đơn hàng</h2>
              </div>
              <button
                onClick={() => setShowApproveCancelModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="text-slate-400" size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">
                Bạn có chắc chắn muốn phê duyệt yêu cầu hủy cho đơn hàng <strong className="text-slate-800">#{order?.invoiceCode || id}</strong>?
              </p>
              
              <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">Lý do hủy từ khách hàng:</p>
                <p className="text-sm font-semibold text-rose-900">
                  "{order?.cancelReason || "Không ghi rõ lý do"}"
                </p>
              </div>

              <p className="text-xs text-slate-500">
                Lưu ý: Hàng hóa, voucher, điểm thưởng và tiền thanh toán (nếu có) sẽ được hoàn trả tự động về tài khoản khách hàng.
              </p>
            </div>
            
            <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setShowApproveCancelModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm cursor-pointer"
                disabled={canceling}
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeApproveCancel}
                disabled={canceling}
                className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white text-sm active:scale-95 transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {canceling ? "Đang xử lý..." : "Xác nhận duyệt hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ Chối Hủy Đơn */}
      {showRejectCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[480px] shrink-0 rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-600">close</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Từ chối yêu cầu hủy</h2>
              </div>
              <button
                onClick={() => setShowRejectCancelModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="text-slate-400" size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">
                Bạn có chắc muốn từ chối yêu cầu hủy đơn hàng <strong className="text-slate-800">#{order?.invoiceCode || id}</strong>?
              </p>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lý do yêu cầu từ khách hàng:</p>
                <p className="text-sm font-semibold text-slate-800">
                  "{order?.cancelReason || "Không ghi rõ lý do"}"
                </p>
              </div>

              <p className="text-xs text-slate-500">
                Sau khi từ chối, đơn hàng sẽ quay trở về trạng thái xử lý và chuẩn bị đóng gói giao cho người mua.
              </p>
            </div>
            
            <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setShowRejectCancelModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm cursor-pointer"
                disabled={canceling}
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeRejectCancel}
                disabled={canceling}
                className="px-5 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white text-sm active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {canceling ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
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

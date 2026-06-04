import React, { useState, useEffect } from "react";
import { 
  getOrderDetails, 
  requestCancelOrder, 
  markOrderCompleted, 
  retryVnPayPayment 
} from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader, ArrowLeft, CheckCircle, HelpCircle, XCircle, Info, Copy, ClipboardCheck } from "lucide-react";

interface OrderDetailViewProps {
  orderId: number;
  token: string;
  onBack: () => void;
  onStatusUpdated?: () => void;
}

export function OrderDetailView({ 
  orderId, 
  token, 
  onBack, 
  onStatusUpdated 
}: OrderDetailViewProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await getOrderDetails(orderId, token);
      if (data) {
        setOrder(data);
      } else {
        toast.error("Không thể tải thông tin chi tiết đơn hàng.");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      toast.error("Đã xảy ra lỗi khi lấy thông tin đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId && token) {
      fetchOrder();
    }
  }, [orderId, token]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "--/--/----";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (statusCode: number) => {
    switch (statusCode) {
      case 0: return "text-amber-700 bg-amber-50 border-amber-200";
      case 1: return "text-blue-700 bg-blue-50 border-blue-200";
      case 2: return "text-sky-700 bg-sky-50 border-sky-200";
      case 3: return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case 4: return "text-rose-600 bg-rose-50 border-rose-200";
      case 5: return "text-rose-700 bg-rose-50 border-rose-200";
      default: return "text-slate-700 bg-slate-50 border-slate-200";
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy đơn hàng.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await requestCancelOrder(orderId, token, cancelReason);
      if (res.success) {
        toast.success("Đã gửi yêu cầu hủy đơn hàng thành công!");
        setShowCancelModal(false);
        setCancelReason("");
        await fetchOrder();
        if (onStatusUpdated) onStatusUpdated();
      } else {
        toast.error(res.message || "Hủy đơn hàng thất bại.");
      }
    } catch (err) {
      console.error("Error canceling order:", err);
      toast.error("Lỗi kết nối server.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceivedSubmit = async () => {
    setActionLoading(true);
    try {
      const res = await markOrderCompleted(orderId, token);
      if (res.success) {
        toast.success("Xác nhận nhận hàng thành công. Cảm ơn bạn đã mua sắm!");
        setShowCompleteModal(false);
        await fetchOrder();
        if (onStatusUpdated) onStatusUpdated();
      } else {
        toast.error(res.message || "Xác nhận nhận hàng thất bại.");
      }
    } catch (err) {
      console.error("Error confirming order completion:", err);
      toast.error("Lỗi kết nối server.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    setActionLoading(true);
    toast.loading("Đang khởi tạo lại cổng thanh toán VNPay...");
    try {
      const res = await retryVnPayPayment(orderId, token);
      toast.dismiss();
      if (res.success && res.paymentUrl) {
        toast.success("Kết nối thành công! Đang chuyển hướng...");
        window.location.href = res.paymentUrl;
      } else {
        toast.error(res.message || "Tạo liên kết thanh toán lại thất bại.");
      }
    } catch (err) {
      toast.dismiss();
      console.error("Error retrying VNPay payment:", err);
      toast.error("Lỗi kết nối mạng.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Loader className="animate-spin text-primary mb-4" size={40} />
        <p className="text-slate-500 font-medium">Đang tải thông tin chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
        <span className="material-symbols-outlined text-5xl text-rose-500 mb-2">error</span>
        <p className="text-slate-600 font-bold mb-4">Không tìm thấy thông tin đơn hàng này.</p>
        <button 
          onClick={onBack}
          className="px-6 py-2 rounded-xl bg-primary text-white font-bold transition-transform active:scale-95"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Check if VNPay Payment can be retried
  // Conditions: statusCode === 0 (Pending) AND payMethodCode === 3 (MobilePayment/Ví điện tử)
  const isVnPay = order.payMethodCode === 3 || order.payMethodCode === 2 || order.payMethod?.includes("VNPay") || order.payMethod?.includes("Ví điện tử");
  const canRetryPayment = order.statusCode === 0 && isVnPay;

  // Check if order can be canceled
  // Conditions: statusCode === 0 (Pending) OR statusCode === 1 (Confirmed)
  const canCancelOrder = order.statusCode === 0 || order.statusCode === 1;

  // Check if order can be completed by user
  // Conditions: statusCode === 2 (Shipped)
  const canCompleteOrder = order.statusCode === 2;

  // Timeline statuses
  const isTimelineVisible = order.statusCode !== 4 && order.statusCode !== 5;

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Quay lại danh sách đơn hàng
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              Chi tiết đơn hàng <span className="text-primary">#TT-{order.invoiceID}</span>
            </h1>
            <span className={`px-3 py-1 text-xs font-bold border rounded-full ${getStatusColor(order.statusCode)}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold">
            Ngày đặt hàng: {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {canCancelOrder && (
            <button 
              onClick={() => setShowCancelModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all"
              disabled={actionLoading}
            >
              Hủy đơn hàng
            </button>
          )}
          {canRetryPayment && (
            <button 
              onClick={handleRetryPayment}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center justify-center gap-1"
              disabled={actionLoading}
            >
              Thanh toán lại VNPay
            </button>
          )}
          {canCompleteOrder && (
            <button 
              onClick={() => setShowCompleteModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center justify-center gap-1"
              disabled={actionLoading}
            >
              Đã nhận được hàng
            </button>
          )}
        </div>
      </div>

      {/* Timeline or Cancel Alert */}
      {!isTimelineVisible ? (
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-start gap-4">
          <XCircle className="text-rose-500 shrink-0 mt-0.5" size={24} />
          <div className="space-y-1">
            <h3 className="font-bold text-rose-800 text-sm md:text-base">
              {order.statusCode === 4 ? "Đang chờ duyệt hủy đơn hàng" : "Đơn hàng đã được hủy thành công"}
            </h3>
            <p className="text-xs text-rose-700/80 font-medium">
              Thời gian cập nhật: {formatDate(order.cancelledAt || order.createdAt)}
            </p>
            {order.cancelReason && (
              <p className="text-xs md:text-sm text-rose-700 bg-rose-100/50 px-3 py-2 rounded-xl mt-2 italic font-semibold">
                Lý do hủy: "{order.cancelReason}"
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
          {/* Progress Timeline Graphic */}
          <div className="relative flex justify-between items-center max-w-3xl mx-auto">
            {/* Background Line Connector */}
            <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-0">
              <div 
                className="h-full bg-primary/70 transition-all duration-500" 
                style={{ 
                  width: order.statusCode === 0 ? "0%" : 
                         order.statusCode === 1 ? "33.33%" : 
                         order.statusCode === 2 ? "66.66%" : "100%" 
                }}
              />
            </div>

            {/* Step 1: Ordered */}
            <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                order.statusCode >= 0 
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                order.statusCode >= 1 
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                order.statusCode >= 2 
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                order.statusCode >= 3 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-500 font-bold shadow-sm" 
                  : "bg-white text-slate-300 border-slate-200"
              }`}>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div className="text-center">
                <p className={`text-xs font-bold ${order.statusCode >= 3 ? "text-emerald-600" : "text-slate-400"}`}>Hoàn tất</p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {order.completedAt ? formatDate(order.completedAt).split(" ")[0] : "--/--"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards (Recipient & Shipping Delivery) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recipient Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold border-b border-slate-50 pb-2.5">
            <span className="material-symbols-outlined text-lg">location_on</span>
            <h3 className="text-sm md:text-base text-slate-800">Địa chỉ nhận hàng</h3>
          </div>
          <div className="space-y-1 text-slate-700">
            <p className="font-bold text-sm md:text-base text-slate-800">
              {order.shippingRecipientName || order.userFullName || "Không rõ tên"}
            </p>
            <p className="text-xs md:text-sm font-semibold text-slate-500">
              SĐT: {order.shippingPhone || order.userPhone || "Không rõ số điện thoại"}
            </p>
            <p className="text-xs md:text-sm leading-relaxed text-slate-500 pt-1">
              {order.shippingAddress || "Chưa cập nhật địa chỉ giao hàng"}
            </p>
          </div>
        </div>

        {/* Carrier Info Card (Note: Vận chuyển chưa làm, đang hiển thị Đang cập nhật) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-secondary font-bold border-b border-slate-50 pb-2.5">
            <span className="material-symbols-outlined text-lg">local_shipping</span>
            <h3 className="text-sm md:text-base text-slate-800">Thông tin vận chuyển</h3>
          </div>
          
          <div className="flex flex-col gap-2.5 text-xs md:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Đơn vị vận chuyển:</span>
              <span className="font-bold text-slate-500 italic">Đang cập nhật (Chưa liên kết đối tác giao hàng)</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Mã vận đơn:</span>
              <span className="font-bold text-slate-400 italic">Chưa tạo mã</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Dự kiến giao hàng:</span>
              <span className="font-bold text-slate-500 italic">Đang cập nhật</span>
            </div>
            
            <div className="mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-1.5">
              <span className="material-symbols-outlined text-slate-400 text-xs mt-0.5">info</span>
              <p className="text-[10px] text-slate-400 font-medium leading-normal">
                Hệ thống vận chuyển tự động đang được kết nối. Khi đơn hàng được xác nhận và bàn giao, mã vận đơn GHN sẽ tự động được hiển thị tại đây.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content (Left Side: Products & Logs | Right Side: Summary Sticky) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Product List Table & Notes/Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Product List Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                Sản phẩm đã mua ({order.invoiceDetails?.length || 0})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                    <th className="px-5 py-3 w-1/2 min-w-[200px]">Sản phẩm</th>
                    <th className="px-5 py-3 text-center whitespace-nowrap">Đơn giá</th>
                    <th className="px-5 py-3 text-center whitespace-nowrap">Số lượng</th>
                    <th className="px-5 py-3 text-right whitespace-nowrap">Tạm tính</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                  {order.invoiceDetails && order.invoiceDetails.map((item: any, idx: number) => (
                    <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="px-5 py-4 w-1/2">
                        <div className="flex items-center gap-3">
                          {/* Product Thumbnail */}
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName} 
                              className="w-14 h-14 rounded-xl object-cover shadow-sm flex-shrink-0" 
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex flex-shrink-0 items-center justify-center text-primary font-bold text-[10px] shadow-sm">
                              LazPe
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-800 group-hover:text-primary transition-colors text-xs md:text-sm break-words leading-relaxed">
                              {item.productName}
                            </h4>
                            {item.variantName && (
                              <p className="text-[10px] text-slate-400 font-bold mt-1">Phân loại: {item.variantName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-slate-700 whitespace-nowrap">
                        {formatPrice(item.unitPrice)}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-600 whitespace-nowrap">
                        x{item.quantity}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-primary whitespace-nowrap">
                        {formatPrice(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Card */}
          {order.note && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-sm">edit_note</span> Ghi chú đơn hàng
              </h4>
              <p className="text-xs md:text-sm text-slate-500 italic bg-slate-50/50 p-3 rounded-xl">
                "{order.note}"
              </p>
            </div>
          )}

          {/* Payment Transactions Card */}
          {order.paymentTransactions && order.paymentTransactions.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
                <span className="material-symbols-outlined text-primary text-sm">account_balance_wallet</span> 
                Lịch sử giao dịch thanh toán VNPay
              </h4>
              <div className="space-y-3 divide-y divide-slate-55 max-h-[250px] overflow-y-auto pr-1">
                {order.paymentTransactions.map((tx: any, idx: number) => (
                  <div key={idx} className="pt-3 first:pt-0 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-600">Mã Ref: #{tx.txnRef}</span>
                        {tx.vnPayTransactionNo && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-semibold font-mono">
                            Mã VNPay: {tx.vnPayTransactionNo}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Thời gian: {formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        tx.statusCode === 1 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : tx.statusCode === 2
                          ? "bg-rose-50 text-rose-600 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {tx.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Totals Summary (Sticky - Tối ưu khoảng trống bên dưới) */}
        <aside className="lg:sticky lg:top-6 space-y-6 self-start w-full">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_12px_24px_rgba(135,78,88,0.02)] space-y-4">
            <h3 className="font-bold text-slate-800 text-base md:text-lg border-b border-slate-50 pb-3">
              Tóm tắt chi phí
            </h3>
            
            <div className="space-y-3 text-xs md:text-sm">
              <div className="flex justify-between items-center text-slate-400 font-semibold">
                <span>Tạm tính ({order.invoiceDetails?.length || 0} sản phẩm)</span>
                <span className="text-slate-700 font-bold">{formatPrice(order.subTotal)}</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-400 font-semibold">
                <span>Phí vận chuyển</span>
                <span className="text-slate-700 font-bold">{formatPrice(order.shippingFee)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center text-secondary font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">confirmation_number</span> Voucher giảm giá
                  </span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              
              <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                <span className="font-bold text-slate-700 text-sm md:text-base">Tổng thanh toán</span>
                <div className="text-right">
                  <span className="font-headline-lg text-lg md:text-xl font-bold text-primary">
                    {formatPrice(order.finalAmount || (order.totalPrice + order.shippingFee))}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold italic">(Đã bao gồm VAT & Phí ship)</p>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2.5">
              {canRetryPayment && (
                <button 
                  onClick={handleRetryPayment}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-bold transition-all hover:bg-primary/95 shadow-sm hover:shadow hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5 text-xs md:text-sm"
                  disabled={actionLoading}
                >
                  <span className="material-symbols-outlined text-sm">payment</span> Thanh toán ngay qua VNPay
                </button>
              )}
              <button 
                onClick={() => toast.info("Hotline hỗ trợ: 1800 1234. Chúng tôi trực 24/7.")}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold transition-colors hover:bg-slate-50 flex items-center justify-center gap-1 text-xs md:text-sm"
              >
                <HelpCircle size={15} /> Liên hệ hỗ trợ
              </button>
            </div>
          </div>
        </aside>

      </div>

      {/* Cancel Order Dialog Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-slate-800">Yêu cầu hủy đơn hàng</h3>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-sm font-bold">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Lý do hủy đơn hàng
                </label>
                <textarea 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng để cải thiện dịch vụ..."
                  rows={4}
                  maxLength={500}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary text-sm font-semibold placeholder-slate-400"
                  required
                />
                <p className="text-[10px] text-right text-slate-400 font-semibold">
                  {cancelReason.length}/500 ký tự
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
                  disabled={actionLoading}
                >
                  Bỏ qua
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader size={12} className="animate-spin" /> : null}
                  Xác nhận hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Completed Order Modal (Thay thế cho Modal mặc định của trình duyệt) */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <CheckCircle size={22} className="text-emerald-500 shrink-0" />
              <h3 className="text-base md:text-lg text-slate-800">Xác nhận nhận hàng</h3>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-semibold leading-relaxed">
              Bạn xác nhận đã nhận được đầy đủ các sản phẩm từ đơn hàng này và muốn hoàn tất giao dịch? Hành động này sẽ tích lũy điểm thưởng loyalty và không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={handleConfirmReceivedSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader size={12} className="animate-spin" /> : null}
                Đồng ý hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

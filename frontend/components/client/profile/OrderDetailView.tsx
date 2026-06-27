import React, { useState, useEffect } from "react";
import {
  getOrderDetails,
  requestCancelOrder,
  markOrderCompleted,
  retryVnPayPayment,
  requestReturn,
  cancelReturnRequest,
  uploadReturnImage
} from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader, ArrowLeft, CheckCircle, HelpCircle, XCircle, Info, Copy, ClipboardCheck, X, AlertTriangle, FileText, Wallet, Coins, ImagePlus } from "lucide-react";

interface OrderDetailViewProps {
  orderId: number;
  token: string;
  onBack: () => void;
  onStatusUpdated?: () => void;
  onChangeTab?: (tabId: string) => void;
}

export function OrderDetailView({
  orderId,
  token,
  onBack,
  onStatusUpdated,
  onChangeTab
}: OrderDetailViewProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundPolicyModal, setShowRefundPolicyModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [selectedReturnReason, setSelectedReturnReason] = useState("");
  const [returnRefundMethod, setReturnRefundMethod] = useState<1 | 2>(1);
  const [returnImageFiles, setReturnImageFiles] = useState<File[]>([]);
  const [returnDescription, setReturnDescription] = useState("");
  const [refundMethod, setRefundMethod] = useState<"wallet" | "coins">("wallet");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [autoApproveCountdown, setAutoApproveCountdown] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    const finalReason = selectedReason === "other" || !selectedReason ? cancelReason : selectedReason;
    
    if (!finalReason.trim()) {
      toast.error("Vui lòng chọn hoặc nhập lý do hủy đơn hàng.");
      return;
    }

    // Determine if order is prepaid or VNPay and needs a refund option
    const isPrepaid = order?.paymentStatus === 'Paid' || (order?.payMethodCode !== 1 && order?.statusCode > 0) || order?.payMethod?.toLowerCase().includes("ví lazpe") || order?.payMethodCode === 3;
    const reasonPayload = isPrepaid ? `[Hoàn tiền về: ${refundMethod === 'wallet' ? 'Ví LazPe' : 'Xu LazPe'}] ${finalReason}` : finalReason;

    setActionLoading(true);
    try {
      const res = await requestCancelOrder(orderId, token, reasonPayload);
      if (res.success) {
        toast.success(res.message || "Hủy đơn hàng thành công!");
        setShowCancelModal(false);
        setCancelReason("");
        setSelectedReason("");
        if (isPrepaid) {
          setAutoApproveCountdown(60);
        }
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

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReturnReason === "other" || !selectedReturnReason ? returnReason : selectedReturnReason;
    if (!finalReason.trim()) {
      toast.error("Vui lòng nhập lý do hoàn hàng.");
      return;
    }
    
    if (!returnDescription.trim()) {
      toast.error("Vui lòng nhập mô tả chi tiết.");
      return;
    }

    const fullReason = `${finalReason} - Chi tiết: ${returnDescription}`;

    if (["Không nhận được hàng", "Giao sai sản phẩm", "Sản phẩm lỗi/hỏng, không hoạt động", "Hàng hóa bị hư hỏng trong quá trình vận chuyển", "Sản phẩm không đúng mô tả"].includes(selectedReturnReason) && returnImageFiles.length === 0) {
      toast.error("Vui lòng tải lên ít nhất 1 hình ảnh chứng minh tình trạng hàng hóa.");
      return;
    }

    setActionLoading(true);
    try {
      let imageUrls: string[] = [];
      if (returnImageFiles.length > 0) {
        toast.loading("Đang tải lên hình ảnh...");
        
        const uploadPromises = returnImageFiles.map(file => uploadReturnImage(file, token));
        const uploadResults = await Promise.all(uploadPromises);
        toast.dismiss();
        
        for (const uploadRes of uploadResults) {
          if (uploadRes.success && uploadRes.url) {
            imageUrls.push(uploadRes.url);
          } else {
            toast.error(uploadRes.message || "Tải ảnh lên thất bại. Vui lòng thử lại.");
            setActionLoading(false);
            return;
          }
        }
      }

      const res = await requestReturn(orderId, token, finalReason, returnDescription, returnRefundMethod, imageUrls.join(","));
      if (res.success) {
        toast.success("Gửi yêu cầu hoàn hàng thành công! Admin sẽ xem xét trong vòng 1-3 ngày.");
        setShowReturnModal(false);
        setReturnReason("");
        setSelectedReturnReason("");
        setReturnDescription("");
        setReturnImageFiles([]);
        await fetchOrder();
        if (onStatusUpdated) onStatusUpdated();
      } else {
        toast.error(res.message || "Gửi yêu cầu hoàn hàng thất bại.");
      }
    } catch (err) {
      toast.dismiss();
      console.error("Error requesting return:", err);
      toast.error("Lỗi kết nối server.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReturnSubmit = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy yêu cầu hoàn hàng không? Hành động này không thể hoàn tác.")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await cancelReturnRequest(orderId, token);
      if (res.success) {
        toast.success("Đã hủy yêu cầu hoàn hàng thành công.");
        await fetchOrder();
        if (onStatusUpdated) onStatusUpdated();
      } else {
        toast.error(res.message || "Không thể hủy yêu cầu hoàn hàng.");
      }
    } catch (err) {
      console.error("Error canceling return request:", err);
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

  // Check if VNPay Payment can be retried
  // Conditions: statusCode === 0 (Pending) AND payMethodCode === 3 (MobilePayment/Ví điện tử)
  const isVnPay = order?.payMethodCode === 3 || order?.payMethodCode === 2 || order?.payMethod?.includes("VNPay") || order?.payMethod?.includes("Ví điện tử");
  const baseCanRetryPayment = order?.statusCode === 0 && isVnPay;

  // Countdown Timer logic for VNPay pending payment (24 hours expiration)
  useEffect(() => {
    if (!order || order.statusCode !== 0 || !isVnPay) return;

    const calculateTimeLeft = () => {
      const createdTime = new Date(order.createdAt).getTime();
      const expireTime = createdTime + 24 * 60 * 60 * 1000; // 24 hours
      const difference = expireTime - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          fetchOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [order?.invoiceID, order?.statusCode, isVnPay]);

  // Auto approve countdown effect
  useEffect(() => {
    if (autoApproveCountdown === null || autoApproveCountdown <= 0) return;
    
    const intervalId = setInterval(() => {
      setAutoApproveCountdown((prev) => {
        if (prev && prev <= 1) {
          clearInterval(intervalId);
          fetchOrder();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [autoApproveCountdown]);

  const formatTimeLeft = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")} giờ ${minutes.toString().padStart(2, "0")} phút ${secs.toString().padStart(2, "0")} giây`;
  };

  const isExpired = baseCanRetryPayment && timeLeft === 0;
  const canRetryPayment = baseCanRetryPayment && !isExpired;

  // Check if order can be canceled
  // Conditions: statusCode === 0 (Pending) OR statusCode === 1 (Confirmed)
  const canCancelOrder = (order?.statusCode === 0 || order?.statusCode === 1) && !isExpired;

  // Check if order can be completed by user
  // Conditions: statusCode === 2 (Shipped)
  const canCompleteOrder = order?.statusCode === 2;

  // Hoàn hàng: chỉ cho phép khi đơn Hoàn tất (3) và trong vòng 7 ngày
  const canRequestReturn = React.useMemo(() => {
    if (order?.statusCode !== 3 || !order?.completedAt) return false;
    const completedDate = new Date(order.completedAt);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - completedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }, [order?.statusCode, order?.completedAt]);

  // Hủy hoàn hàng: chỉ khi trạng thái là ReturnRequested (6)
  const canCancelReturnRequest = order?.statusCode === 6;

  // Timeline statuses
  const isTimelineVisible = order?.statusCode !== 4 && order?.statusCode !== 5 && !isExpired;

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

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1 flex-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Quay lại danh sách đơn hàng
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            Chi tiết đơn hàng <span className="text-primary">#{order.invoiceCode}</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold">
            Ngày đặt hàng: {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="shrink-0">
          {isExpired ? (
            <span className="px-4 py-1.5 text-sm font-bold border rounded-lg text-rose-800 bg-rose-50 border-rose-300">
              Đã hủy (Quá hạn)
            </span>
          ) : (
            <span className={`px-4 py-1.5 text-sm font-bold border rounded-lg ${getStatusColor(order.statusCode)}`}>
              {order.status}
            </span>
          )}
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
          {canRequestReturn && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 border border-orange-200 rounded-xl transition-all"
              disabled={actionLoading}
            >
              Yêu cầu hoàn hàng
            </button>
          )}
          {canCancelReturnRequest && (
            <button
              onClick={handleCancelReturnSubmit}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-xl transition-all"
              disabled={actionLoading}
            >
              Hủy yêu cầu hoàn hàng
            </button>
          )}
        </div>
      </div>

      {/* Expiration Countdown/Expired Warning Banners */}
      {baseCanRetryPayment && !isExpired && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex items-start gap-4 shadow-sm animate-pulse">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={22} />
          <div className="space-y-1">
            <h3 className="font-bold text-amber-800 text-sm md:text-base">
              Chờ thanh toán VNPay
            </h3>
            <p className="text-xs md:text-sm text-amber-700 font-semibold leading-relaxed">
              Đơn hàng này chưa hoàn tất thanh toán. Vui lòng thanh toán qua cổng VNPay trong vòng: <span className="font-extrabold text-rose-600 bg-white border border-amber-250 px-2.5 py-0.5 rounded-lg shadow-2xs font-mono">{formatTimeLeft(timeLeft)}</span> để tránh đơn hàng bị hủy tự động.
            </p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-start gap-4 shadow-sm">
          <XCircle className="text-rose-500 shrink-0 mt-0.5" size={22} />
          <div className="space-y-1">
            <h3 className="font-bold text-rose-800 text-sm md:text-base">
              Đơn hàng đã hết hạn
            </h3>
            <p className="text-xs md:text-sm text-rose-700 font-semibold leading-relaxed">
              Đơn hàng này đã bị hủy tự động do quá hạn 24 giờ chưa hoàn tất thanh toán qua cổng VNPay.
            </p>
          </div>
        </div>
      )}

      {/* Timeline or Cancel Alert */}
      {!isTimelineVisible ? (
        !isExpired && (
          <div className="bg-white border border-rose-100 shadow-sm p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex items-start gap-4 md:w-1/3 shrink-0">
              <XCircle className="text-rose-500 shrink-0 mt-0.5" size={24} />
              <div className="space-y-1">
                <h3 className="font-bold text-rose-800 text-sm md:text-base flex items-center gap-2">
                  {order.statusCode === 4 ? "Đang chờ duyệt hủy đơn hàng" : "Đơn hàng đã được hủy thành công"}
                  {order.statusCode === 4 && autoApproveCountdown !== null && autoApproveCountdown > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold animate-pulse">
                      Tự động duyệt sau: {autoApproveCountdown}s
                    </span>
                  )}
                </h3>
                <p className="text-xs text-rose-700/80 font-medium">
                  Thời gian cập nhật: {formatDate(order.cancelledAt || order.createdAt)}
                </p>
              </div>
            </div>
            {order.cancelReason && (
              <div className="md:border-l border-t md:border-t-0 border-rose-100 pt-3 md:pt-0 md:pl-6 md:w-2/3">
                <p className="text-xs md:text-sm text-rose-700 italic font-semibold">
                  Lý do hủy: "{order.cancelReason}"
                </p>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="bg-white p-4 md:py-5 md:px-8 rounded-2xl border border-slate-100 shadow-sm">
          {/* Progress Timeline Graphic */}
          <div className="relative flex justify-between items-center max-w-4xl mx-auto">
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
      )}

      {/* Return Request Details */}
      {order?.returnReason && ([6,7,9,10].includes(order.statusCode)) && (
        <div className="bg-white border border-orange-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-orange-500 shrink-0" size={20} />
            <h3 className="font-bold text-orange-800 text-sm md:text-base">
              Yêu cầu hoàn trả {
                order.statusCode === 7 ? "đã được xử lý thành công" :
                order.statusCode === 9 ? "đã được duyệt (Chờ nhận hàng hoàn)" :
                order.statusCode === 10 ? "đã bị từ chối" : "đang được xem xét"
              }
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
              <span className="font-bold text-slate-700">LazPe Express</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Mã vận đơn:</span>
              <span className="font-bold text-primary">{order.trackingCode || 'Đang cập nhật'}</span>
            </div>

            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-400 font-semibold whitespace-nowrap">Dự kiến giao hàng:</span>
              <span className="font-bold text-slate-500 italic text-right text-[11px] xl:text-xs">Từ 3-5 ngày kể từ ngày vận chuyển tùy khu vực</span>
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
                  {order.invoiceDetails && order.invoiceDetails.map((item: any, idx: number) => {
                    const isGift = item.unitPrice === 0;
                    return (
                      <tr key={idx} className={`group transition-colors ${isGift ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50/30'}`}>
                        <td className="px-5 py-4 w-1/2">
                          <div className="flex items-center gap-3">
                            {/* Product Thumbnail */}
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className={`w-14 h-14 rounded-xl object-cover shadow-sm flex-shrink-0 border ${isGift ? 'border-emerald-200' : 'border-slate-100'}`}
                              />
                            ) : (
                              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br flex flex-shrink-0 items-center justify-center font-bold text-[10px] shadow-sm ${isGift ? 'from-emerald-100 to-emerald-200 text-emerald-600' : 'from-primary/10 to-primary/20 text-primary'}`}>
                                LazPe
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-bold transition-colors text-xs md:text-sm break-words leading-relaxed ${isGift ? 'text-emerald-800' : 'text-slate-800 group-hover:text-primary'}`}>
                                  {item.productName}
                                </h4>
                                {isGift && (
                                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full shadow-sm tracking-wide shrink-0">
                                    QUÀ TẶNG
                                  </span>
                                )}
                              </div>
                              {item.variantName && (
                                <p className={`text-[10px] font-bold mt-1 ${isGift ? 'text-emerald-600' : 'text-slate-400'}`}>Phân loại: {item.variantName}</p>
                              )}
                              {order.statusCode === 3 && !isGift && (
                                <button
                                  onClick={() => {
                                    if (onChangeTab) {
                                      const url = new URL(window.location.href);
                                      url.searchParams.set("tab", "reviews");
                                      url.searchParams.set("invoiceId", String(order.invoiceID));
                                      url.searchParams.set("detailId", String(item.invoiceDetailID));
                                      window.history.pushState({}, "", url.pathname + url.search);
                                      onChangeTab("reviews");
                                    } else {
                                      window.location.href = `/profile?tab=reviews&invoiceId=${order.invoiceID}&detailId=${item.invoiceDetailID}`;
                                    }
                                  }}
                                  className="text-[11px] font-bold text-primary hover:underline mt-1.5 flex items-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-[14px]">rate_review</span>
                                  Đánh giá sản phẩm này
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`px-5 py-4 text-center font-semibold whitespace-nowrap ${isGift ? 'text-emerald-500' : 'text-slate-700'}`}>
                          {isGift ? '0 đ' : formatPrice(item.unitPrice)}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-slate-600 whitespace-nowrap">
                          x{item.quantity}
                        </td>
                        <td className={`px-5 py-4 text-right font-bold whitespace-nowrap ${isGift ? 'text-emerald-500' : 'text-primary'}`}>
                          {isGift ? 'Miễn phí' : formatPrice(item.totalPrice)}
                        </td>
                      </tr>
                    )
                  })}
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
                Lịch sử giao dịch thanh toán
              </h4>
              <div className="space-y-3 divide-y divide-slate-55 max-h-[250px] overflow-y-auto pr-1">
                {order.paymentTransactions.map((tx: any, idx: number) => (
                  <div key={idx} className="pt-3 first:pt-0 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-600">Mã giao dịch: #{order.invoiceCode}</span>
                        {tx.vnPayTransactionNo && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-semibold font-mono">
                            Mã VNPay: {tx.vnPayTransactionNo}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Thời gian: {formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tx.statusCode === 1
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

              {order.voucherDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-rose-500 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">confirmation_number</span> Voucher giảm giá
                  </span>
                  <span>-{formatPrice(order.voucherDiscountAmount)}</span>
                </div>
              )}
              
              {order.pointsDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-amber-500 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">military_tech</span> Điểm tích lũy
                  </span>
                  <span>-{formatPrice(order.pointsDiscountAmount)}</span>
                </div>
              )}

              {order.coinsDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-orange-500 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">monetization_on</span> LazPe Coins
                  </span>
                  <span>-{formatPrice(order.coinsDiscountAmount)}</span>
                </div>
              )}

              {order.walletDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-teal-600 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">account_balance_wallet</span> Trừ Ví LazPe
                  </span>
                  <span>-{formatPrice(order.walletDiscountAmount)}</span>
                </div>
              )}

              {(order.discountAmount > 0 && !order.voucherDiscountAmount && !order.pointsDiscountAmount && !order.coinsDiscountAmount && !order.walletDiscountAmount) && (
                <div className="flex justify-between items-center text-rose-500 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">confirmation_number</span> Giảm giá
                  </span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}

              {order.shippingDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-sky-600 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">local_shipping</span> Giảm phí vận chuyển
                  </span>
                  <span>-{formatPrice(order.shippingDiscountAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-end gap-3">
                <span className="font-bold text-slate-700 text-sm md:text-base whitespace-nowrap shrink-0">Tổng thanh toán</span>
                <div className="text-right">
                  <span className="font-headline-lg text-lg md:text-xl font-bold text-primary whitespace-nowrap">
                    {formatPrice(order.finalAmount || (order.totalPrice + order.shippingFee - (order.shippingDiscountAmount || 0)))}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold italic whitespace-nowrap">(Đã bao gồm VAT & Phí ship)</p>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className={`bg-white rounded-3xl shadow-2xl flex flex-col w-full min-w-[320px] md:min-w-[500px] relative animate-in zoom-in-95 duration-200 ${
              order?.payMethodCode === 2
                ? "max-w-4xl md:min-w-[800px]"
                : "max-w-xl"
            }`}
          >
            <div className="bg-white p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="text-rose-500 h-5 w-5" />
                Yêu cầu hủy đơn hàng
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-5 sm:p-6">
              <div className={`grid gap-6 ${order?.payMethodCode === 2 ? "md:grid-cols-2" : "grid-cols-1"}`}>
                
                {/* Left Column: Refund Method (Only for prepaid orders) */}
                {order?.payMethodCode === 2 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Hình thức hoàn tiền</h4>
                      <p className="text-xs text-slate-500 font-medium mb-4">
                        Vui lòng chọn nơi bạn muốn nhận lại tiền hoàn.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className={`block relative p-4 rounded-xl border-2 cursor-pointer transition-all ${refundMethod === 'wallet' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                        <input
                          type="radio"
                          name="refundMethod"
                          value="wallet"
                          checked={refundMethod === "wallet"}
                          onChange={() => setRefundMethod("wallet")}
                          className="absolute opacity-0 w-0 h-0"
                        />
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${refundMethod === 'wallet' ? 'border-emerald-500' : 'border-slate-300'}`}>
                            {refundMethod === 'wallet' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-slate-800">Hoàn vào Ví LazPe</span>
                            <span className="block text-xs text-slate-500 mt-0.5 font-medium">Nhận tiền hoàn tức thì, có thể rút về ngân hàng. (Khuyên dùng)</span>
                          </div>
                        </div>
                      </label>

                      <label className={`block relative p-4 rounded-xl border-2 cursor-pointer transition-all ${refundMethod === 'coins' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                        <input
                          type="radio"
                          name="refundMethod"
                          value="coins"
                          checked={refundMethod === "coins"}
                          onChange={() => setRefundMethod("coins")}
                          className="absolute opacity-0 w-0 h-0"
                        />
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${refundMethod === 'coins' ? 'border-amber-500' : 'border-slate-300'}`}>
                            {refundMethod === 'coins' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-slate-800">Hoàn thành Xu LazPe</span>
                            <span className="block text-xs text-slate-500 mt-0.5 font-medium">Nhận ngay lập tức, dùng để giảm giá cho các đơn hàng tiếp theo.</span>
                          </div>
                        </div>
                      </label>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => setShowRefundPolicyModal(true)} 
                      className="mt-4 text-[12px] font-bold text-primary hover:underline flex items-center gap-1.5 transition-all w-fit px-2 py-1.5 rounded-lg hover:bg-primary/5"
                    >
                      <Info className="w-4 h-4" />
                      Xem chính sách hoàn tiền
                    </button>
                  </div>
                )}

                {/* Right Column: Cancel Reason */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Lý do hủy đơn hàng</h4>
                    <p className="text-xs text-slate-500 font-medium mb-4">
                      Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <select
                      value={selectedReason}
                      onChange={(e) => {
                        setSelectedReason(e.target.value);
                        if (e.target.value !== "other") {
                          setCancelReason("");
                        }
                      }}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all bg-white cursor-pointer text-slate-700"
                    >
                      <option value="" disabled>-- Chọn lý do hủy đơn --</option>
                      {[
                        "Tôi muốn cập nhật địa chỉ/sđt giao hàng.",
                        "Tôi muốn thêm/thay đổi Mã giảm giá.",
                        "Tôi muốn thay đổi sản phẩm (Màu sắc, kích thước, số lượng).",
                        "Thủ tục thanh toán quá rắc rối.",
                        "Tôi tìm thấy giá rẻ hơn ở nơi khác.",
                        "Đổi ý, không muốn mua nữa."
                      ].map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                      <option value="other">Lý do khác...</option>
                    </select>
                  </div>

                  {selectedReason === "other" && (
                    <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Vui lòng nhập lý do cụ thể của bạn..."
                        rows={3}
                        maxLength={500}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium placeholder-slate-400 transition-all bg-white"
                        required={selectedReason === "other"}
                      />
                      <p className="text-[10px] text-right text-slate-400 font-semibold mt-1">
                        {cancelReason.length}/500 ký tự
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  disabled={actionLoading}
                >
                  Không, giữ lại đơn
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm shadow-rose-600/20 active:scale-[0.98]"
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader size={16} className="animate-spin" /> : null}
                  Xác nhận hủy đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Policy Modal */}
      {showRefundPolicyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
          <div 
            className={`bg-white rounded-3xl shadow-2xl flex flex-col w-full relative animate-in zoom-in-95 duration-200 border-t-8 border-t-primary ${
              (order?.paymentStatus === 'Paid' || (order?.payMethodCode !== 1 && order?.statusCode > 0) || order?.payMethod?.toLowerCase().includes("ví lazpe") || order?.payMethodCode === 3)
                ? "max-w-4xl"
                : "max-w-xl"
            }`}
          >
            {/* Paper texture/look */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
            
            <div className="relative p-6 sm:p-8">
              <button
                onClick={() => setShowRefundPolicyModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider font-serif">
                  Chính sách hoàn tiền
                </h3>
                <div className="w-16 h-1 bg-primary/20 rounded-full mt-3"></div>
              </div>

              <div className="space-y-6 text-sm text-slate-600 leading-relaxed font-medium">
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1.5">Hoàn tiền vào Ví LazPe</h4>
                    <div className="space-y-1.5 text-[13px]">
                      <p><strong className="text-slate-700">Thời gian hoàn:</strong> 1-24 giờ làm việc kể từ khi yêu cầu được phê duyệt.</p>
                      <p><strong className="text-slate-700">Chi tiết:</strong> Số tiền hoàn lại sẽ được tự động ghi có vào số dư Ví LazPe của Quý khách. Số dư này có thể được sử dụng để thanh toán tức thì cho các đơn hàng tiếp theo, hoặc Quý khách có thể thao tác rút tiền về tài khoản ngân hàng cá nhân đã liên kết. Thời gian xử lý lệnh rút tiền sẽ tuân thủ theo quy định của ngân hàng thụ hưởng (thường mất 1-3 ngày làm việc).</p>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-200/60 border-dashed" />

                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1.5">Hoàn trả Xu LazPe</h4>
                    <div className="space-y-1.5 text-[13px]">
                      <p><strong className="text-slate-700">Thời gian hoàn:</strong> Tự động hoàn ngay lập tức.</p>
                      <p><strong className="text-slate-700">Chi tiết:</strong> Toàn bộ số lượng Xu LazPe đã sử dụng cho đơn hàng sẽ được hoàn trả nguyên vẹn vào tài khoản của Quý khách. Xu LazPe có giá trị quy đổi (<strong className="text-amber-600">1 Xu = 1 VNĐ</strong>) và chỉ có tác dụng áp dụng ưu đãi giảm giá trực tiếp cho các giao dịch mua sắm trên nền tảng. <br/><span className="text-rose-500 italic mt-1 inline-block">*Lưu ý: Xu LazPe không có giá trị quy đổi thành tiền mặt hoặc rút về tài khoản ngân hàng dưới mọi hình thức.</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-200/60">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-[11px] text-slate-400 font-medium text-center italic">
                    Chính sách hoàn tiền được áp dụng theo quy định hiện hành và tuân thủ tuyệt đối <br className="hidden sm:block"/>
                    <strong className="text-slate-500 font-semibold">Luật số 122/2025/QH15 của Quốc hội: Luật Thương mại điện tử</strong>.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => setShowRefundPolicyModal(false)}
                    className="px-8 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95"
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Completed Order Modal (Thay thế cho Modal mặc định của trình duyệt) */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 shrink-0"
            style={{ width: '384px', maxWidth: 'calc(100vw - 32px)' }}
          >
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
      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[800px] max-w-[95vw] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-orange-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">assignment_return</span>
                Yêu cầu hoàn hàng
              </h3>
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason("");
                  setSelectedReturnReason("");
                  setReturnImageFiles([]);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleReturnSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cột trái */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Lý do hoàn hàng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedReturnReason}
                      onChange={(e) => setSelectedReturnReason(e.target.value)}
                      className="w-full rounded-xl border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500/20"
                      disabled={actionLoading}
                    >
                      <option value="">-- Chọn lý do --</option>
                      <option value="Không nhận được hàng">Không nhận được hàng</option>
                      <option value="Giao sai sản phẩm">Giao sai sản phẩm</option>
                      <option value="Sản phẩm lỗi/hỏng, không hoạt động">Sản phẩm lỗi/hỏng, không hoạt động</option>
                      <option value="Hàng hóa bị hư hỏng trong quá trình vận chuyển">Hàng hóa bị hư hỏng trong quá trình vận chuyển</option>
                      <option value="Sản phẩm không đúng mô tả">Sản phẩm không đúng mô tả</option>
                      <option value="other">Lý do khác...</option>
                    </select>
                  </div>

                  {selectedReturnReason === "other" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Lý do khác <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="Nhập ngắn gọn lý do của bạn..."
                        className="w-full rounded-xl border-slate-200 text-sm focus:border-orange-500 focus:ring-orange-500/20 px-3 py-2 border"
                        disabled={actionLoading}
                        required
                      />
                    </div>
                  )}

                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Mô tả chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={returnDescription}
                      onChange={(e) => setReturnDescription(e.target.value)}
                      placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                      className="w-full rounded-xl border-slate-200 text-sm h-32 resize-none focus:border-orange-500 focus:ring-orange-500/20 px-3 py-2 border"
                      disabled={actionLoading}
                      required
                    />
                  </div>
                </div>

                {/* Cột phải */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Hình ảnh minh chứng {["Không nhận được hàng", "Giao sai sản phẩm", "Sản phẩm lỗi/hỏng, không hoạt động", "Hàng hóa bị hư hỏng trong quá trình vận chuyển", "Sản phẩm không đúng mô tả"].includes(selectedReturnReason) ? <span className="text-rose-500">*</span> : "(không bắt buộc)"}
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">Vui lòng cung cấp hình ảnh sản phẩm lỗi, hoặc gói hàng còn nguyên vẹn nếu bạn đổi ý.</p>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      {returnImageFiles.length < 5 && (
                        <label className={`flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-xl cursor-pointer transition-all border-slate-300 hover:bg-slate-50 hover:border-slate-400`}>
                          <ImagePlus size={20} className="text-slate-400" />
                          <span className="text-[9px] font-bold mt-1 text-center px-1 text-slate-500">({returnImageFiles.length}/5)</span>
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/jpg" 
                            className="hidden"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                const filesArray = Array.from(e.target.files);
                                const validFiles = filesArray.filter(f => f.size <= 5 * 1024 * 1024);
                                if (validFiles.length !== filesArray.length) {
                                  toast.error("Một số ảnh quá kích thước 5MB đã bị loại bỏ");
                                }
                                
                                setReturnImageFiles(prev => {
                                  const newFiles = [...prev, ...validFiles];
                                  return newFiles.slice(0, 5); // Tối đa 5 ảnh
                                });
                              }
                            }}
                            disabled={actionLoading}
                          />
                        </label>
                      )}
                      
                      {returnImageFiles.map((file, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Minh chứng ${idx + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setReturnImageFiles(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 mt-2">
                      Phương thức hoàn tiền
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${returnRefundMethod === 1 ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}>
                        <input 
                          type="radio" 
                          name="refundMethod" 
                          value={1}
                          checked={returnRefundMethod === 1}
                          onChange={() => setReturnRefundMethod(1)}
                          className="text-primary focus:ring-primary h-4 w-4"
                          disabled={actionLoading}
                        />
                        <div className="flex items-center gap-2">
                          <Wallet size={16} className={returnRefundMethod === 1 ? "text-primary" : "text-slate-400"} />
                          <span className={`text-sm font-medium ${returnRefundMethod === 1 ? "text-primary" : "text-slate-600"}`}>Ví LazPe</span>
                        </div>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${returnRefundMethod === 2 ? "border-amber-500 bg-amber-50 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}>
                        <input 
                          type="radio" 
                          name="refundMethod" 
                          value={2}
                          checked={returnRefundMethod === 2}
                          onChange={() => setReturnRefundMethod(2)}
                          className="text-amber-500 focus:ring-amber-500 h-4 w-4"
                          disabled={actionLoading}
                        />
                        <div className="flex items-center gap-2">
                          <Coins size={16} className={returnRefundMethod === 2 ? "text-amber-500" : "text-slate-400"} />
                          <span className={`text-sm font-medium ${returnRefundMethod === 2 ? "text-amber-700" : "text-slate-600"}`}>Xu LazPe</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => setShowRefundPolicyModal(true)} 
                    className="mt-4 text-[12px] font-bold text-primary hover:underline flex items-center gap-1.5 transition-all w-fit px-2 py-1.5 rounded-lg hover:bg-primary/5"
                  >
                    <Info className="w-4 h-4" />
                    Xem chính sách hoàn tiền
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturnReason("");
                    setSelectedReturnReason("");
                    setReturnImageFiles([]);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  disabled={actionLoading}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  disabled={actionLoading || (!selectedReturnReason) || (selectedReturnReason === "other" && !returnReason.trim())}
                >
                  {actionLoading ? <Loader size={16} className="animate-spin" /> : null}
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center">
            <button 
              className="absolute -top-10 -right-2 md:-right-10 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={selectedImage} 
              alt="Phóng to minh chứng" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

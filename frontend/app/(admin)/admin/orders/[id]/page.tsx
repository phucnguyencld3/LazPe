"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  OrderInfo,
  fetchOrderDetails,
  formatCurrency,
  formatDateTime,
  getStatusBadgeColor,
  getStatusLabel,
  cancelOrder,
  updateOrderStatus
} from "@/lib/orderHelpers";

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
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${getStatusBadgeColor(order.statusCode)}`}>
              <span className="w-2 h-2 bg-current rounded-full"></span>
              {getStatusLabel(order.statusCode)}
            </span>
            <span className="px-4 py-1.5 bg-slate-200 text-slate-600 rounded-full text-sm font-bold">
              Thanh toán: {order.payMethod}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => toast.info("Tính năng in đơn hàng chưa khả dụng")}
              className="flex items-center gap-2 px-6 py-2.5 border border-indigo-600 text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">print</span>
              In đơn hàng
            </button>
            
            {order.statusCode === 0 && (
              <button
                onClick={() => handleUpdateStatus('confirm')}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-full shadow-md hover:bg-indigo-700 transition-all"
              >
                Xác nhận đơn
              </button>
            )}
            
            {order.statusCode === 1 && (
              <button
                onClick={() => handleUpdateStatus('mark-shipped')}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-full shadow-md hover:bg-indigo-700 transition-all"
              >
                Bắt đầu giao hàng
              </button>
            )}

            {(order.statusCode < 3 && order.statusCode !== 5) && (
              <button 
                onClick={() => setShowCancelModal(true)}
                className="px-6 py-2.5 bg-red-100 text-red-600 font-bold rounded-full hover:bg-red-200 transition-colors flex items-center gap-2 ml-2"
              >
                <span className="material-symbols-outlined">cancel</span>
                Hủy đơn
              </button>
            )}
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Information Card */}
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Thông tin khách hàng</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">HỌ VÀ TÊN</p>
                    <p className="text-lg font-bold text-slate-800">{order.userFullName || order.userName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">SỐ ĐIỆN THOẠI</p>
                    <p className="text-lg font-bold text-slate-800">{order.userPhone || 'Không có'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">EMAIL</p>
                    <p className="text-slate-600 font-medium">{order.userEmail || 'Không có'}</p>
                  </div>
                </div>
                <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-rose-500 text-lg">local_shipping</span>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">ĐỊA CHỈ NHẬN HÀNG</p>
                  </div>
                  <p className="text-slate-700 font-semibold leading-relaxed">
                    {order.shippingAddress || 'Chưa cập nhật địa chỉ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Details Card */}
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Phương thức thanh toán</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Loại thanh toán</p>
                  <p className="font-bold text-slate-700">{order.payMethod}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Thời gian tạo</p>
                  <p className="font-bold text-slate-700">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Mã tham chiếu</p>
                  <p className="font-bold text-slate-400 text-sm">N/A</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Tóm tắt chi phí</h2>
              <div className="space-y-4 text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(order.subTotal)}</span>
                </div>
                {order.hasVoucher && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Voucher ({order.voucherCode})</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>{formatCurrency(order.shippingFee)}</span>
                </div>
                <div className="border-t border-slate-200 mt-4 pt-6 flex justify-between items-center">
                  <span className="text-xl font-bold text-slate-800">Tổng cộng</span>
                  <span className="text-3xl font-bold text-rose-500 tracking-tight">{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product List Table Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-10 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-800">Danh sách sản phẩm</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-10 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Đơn giá
                  </th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Số lượng
                  </th>
                  <th className="px-10 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Tổng cộng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.invoiceDetails?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-400 text-3xl">inventory_2</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{item.productName || `Mã Sản phẩm: ${item.variantID || item.bundleID}`}</p>
                          <p className="text-xs text-slate-400 font-medium mt-1">ID Chi tiết: {item.invoiceDetailID}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-semibold text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-6 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="px-10 py-6 text-right font-bold text-slate-800 text-lg">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cancel Modal Backdrop */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-8 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500">report</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Hủy đơn hàng</h2>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-8">
              <p className="text-slate-600 mb-6">Vui lòng chọn lý do hủy đơn hàng này</p>
              <form id="cancelForm" onSubmit={handleCancelSubmit} className="space-y-4">
                <div className="grid gap-3">
                  <label className="group flex items-center p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-white">
                    <input
                      type="radio"
                      name="cancel_reason"
                      value="Sản phẩm hết hàng"
                      checked={cancelReason === "Sản phẩm hết hàng"}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="ml-4 font-bold text-slate-700">Sản phẩm hết hàng</span>
                  </label>
                  
                  <label className="group flex items-center p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-white">
                    <input
                      type="radio"
                      name="cancel_reason"
                      value="Khách hàng đổi ý"
                      checked={cancelReason === "Khách hàng đổi ý"}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="ml-4 font-bold text-slate-700">Khách hàng đổi ý</span>
                  </label>

                  <label className="group flex items-center p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-white">
                    <input
                      type="radio"
                      name="cancel_reason"
                      value="other"
                      checked={cancelReason === "other"}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="ml-4 font-bold text-slate-700">Lý do khác</span>
                  </label>
                </div>
                
                {/* Other Reason Textarea */}
                {cancelReason === "other" && (
                  <div className="animate-in slide-in-from-top-2 mt-4">
                    <textarea
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      className="w-full h-32 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 text-sm resize-none outline-none"
                      placeholder="Nhập lý do cụ thể..."
                      required
                    ></textarea>
                  </div>
                )}
              </form>
            </div>
            
            {/* Footer */}
            <div className="p-8 bg-slate-50 flex justify-end gap-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-8 py-3 rounded-full font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                disabled={canceling}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="cancelForm"
                disabled={canceling}
                className="px-8 py-3 rounded-full font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-md flex items-center gap-2"
              >
                {canceling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang hủy...
                  </>
                ) : (
                  "Xác nhận hủy"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

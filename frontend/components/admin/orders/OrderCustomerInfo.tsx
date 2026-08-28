import React from "react";
import { OrderInfo, getStatusBadgeColor, getStatusLabel, formatDateTime } from "@/lib/features/orders/orderApi";
import { formatAddress } from "@/lib/utils/formatters";

interface OrderCustomerInfoProps {
  order: OrderInfo;
}

const getVnPayErrorMessage = (code: string | null | undefined) => {
  if (!code) return "Lỗi thanh toán không xác định";
  switch (code) {
    case "07": return "Trừ tiền thành công nhưng giao dịch bị nghi ngờ (cần kiểm tra lại)";
    case "09": return "Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking";
    case "10": return "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần";
    case "11": return "Hết hạn chờ thanh toán";
    case "12": return "Thẻ/Tài khoản bị khóa";
    case "24": return "Khách hàng hủy giao dịch thanh toán";
    case "51": return "Tài khoản không đủ số dư để thực hiện giao dịch";
    case "65": return "Giao dịch vượt quá hạn mức trong ngày";
    case "75": return "Ngân hàng thanh toán đang bảo trì";
    case "99": return "Lỗi hệ thống cổng thanh toán VNPay";
    default: return `Mã lỗi cổng thanh toán VNPay: ${code}`;
  }
};

export const OrderCustomerInfo: React.FC<OrderCustomerInfoProps> = ({ order }) => {
  const customerName = order.userFullName || order.userName || "Ẩn danh";

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColors = (name: string) => {
    const chars = name ? name.trim().toUpperCase() : "AD";
    const code = chars.charCodeAt(0) || 0;
    switch (code % 3) {
      case 0:
        return "bg-primary-fixed text-on-primary-fixed";
      case 1:
        return "bg-secondary-fixed text-on-secondary-fixed";
      case 2:
      default:
        return "bg-primary-fixed-dim text-on-primary-fixed-variant";
    }
  };

  const latestTx = order.paymentTransactions && order.paymentTransactions.length > 0
    ? order.paymentTransactions[0]
    : null;

  const refCode = latestTx 
    ? (latestTx.vnPayTransactionNo || latestTx.txnRef || "Không có")
    : "N/A";

  const hasPaymentError = latestTx && (
    latestTx.status === "Failed" || 
    latestTx.statusCode === 2 || 
    (latestTx.responseCode && latestTx.responseCode !== "00")
  );

  const errorMessage = hasPaymentError ? getVnPayErrorMessage(latestTx.responseCode) : null;

  return (
    <div className="p-8 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {order.userAvatar && order.userAvatar.trim() !== "" ? (
            <img
              src={order.userAvatar}
              alt={customerName}
              className="w-10 h-10 rounded-[6px] object-cover shrink-0 border border-slate-100"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-[6px] flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColors(
                customerName
              )}`}
            >
              {getInitials(customerName)}
            </div>
          )}
          <h3 className="text-base font-bold text-slate-800">Thông tin khách hàng</h3>
        </div>
        <span className={`inline-flex px-3 py-1 rounded-[8px] text-sm font-bold items-center gap-1.5 ${getStatusBadgeColor(order.statusCode)}`}>
          <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
          {getStatusLabel(order.statusCode)}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">HỌ VÀ TÊN</p>
            <p className="text-sm font-bold text-slate-800">{order.userFullName || order.userName}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">SỐ ĐIỆN THOẠI</p>
            <p className="text-sm font-bold text-slate-800">{order.userPhone || 'Không có'}</p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">LOẠI THANH TOÁN</p>
            <p className="text-sm font-bold text-slate-800">{order.payMethod || "Thanh toán khi nhận hàng (COD)"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">THỜI GIAN TẠO</p>
            <p className="text-sm font-bold text-slate-800">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">ĐỊA CHỈ NHẬN HÀNG</p>
            <p className="text-sm font-bold text-slate-800 leading-relaxed">
              {formatAddress(order.shippingAddress) || 'Chưa cập nhật địa chỉ'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">MÃ VẬN ĐƠN</p>
            {order.trackingCode ? (
              <p className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit border border-blue-100">{order.trackingCode}</p>
            ) : (
              <p className="text-sm font-medium text-slate-500 italic">Chưa có mã vận đơn</p>
            )}
          </div>
          {(order.payMethod === "Ví điện tử" || order.payMethod?.includes("ZaloPay") || order.payMethodCode === 2 || order.payMethodCode === 3 || order.payMethodCode === 5) && (
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">MÃ THAM CHIẾU (THANH TOÁN)</p>
              <p className="text-sm font-bold text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap" title={refCode}>
                {refCode}
              </p>
            </div>
          )}
        </div>
      </div>
      {hasPaymentError && errorMessage && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-[8px] flex items-start gap-4">
          <div className="w-10 h-10 rounded-[6px] bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <span className="material-symbols-outlined">error</span>
          </div>
          <div>
            <h4 className="font-bold text-rose-900 text-sm mb-1">Giao dịch thanh toán thất bại</h4>
            <p className="text-xs text-rose-700 font-semibold">{errorMessage}</p>
            {latestTx?.responseCode && (
              <p className="text-[10px] text-rose-500 font-medium mt-1">Mã phản hồi từ ngân hàng: {latestTx.responseCode}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

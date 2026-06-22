import React from "react";
import { OrderInfo, formatDateTime } from "@/lib/features/orders/orderApi";

interface OrderShippingDetailsProps {
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

export const OrderShippingDetails: React.FC<OrderShippingDetailsProps> = ({ order }) => {
  // Lấy giao dịch mới nhất (nếu có)
  const latestTx = order.paymentTransactions && order.paymentTransactions.length > 0
    ? order.paymentTransactions[0]
    : null;

  // Xác định mã tham chiếu
  const refCode = latestTx 
    ? (latestTx.vnPayTransactionNo || latestTx.txnRef || "Không có")
    : "N/A";

  // Kiểm tra xem có lỗi thanh toán không
  const hasPaymentError = latestTx && (
    latestTx.status === "Failed" || 
    latestTx.statusCode === 2 || 
    (latestTx.responseCode && latestTx.responseCode !== "00")
  );

  const errorMessage = hasPaymentError ? getVnPayErrorMessage(latestTx.responseCode) : null;

  return (
    <div className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[6px] bg-emerald-50 flex items-center justify-center text-emerald-600">
          <span className="material-symbols-outlined text-xl">payments</span>
        </div>
        <h3 className="text-base font-bold text-slate-800">Phương thức thanh toán</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">LOẠI THANH TOÁN</p>
          <p className="text-sm font-bold text-slate-800">{order.payMethod || "Thanh toán khi nhận hàng (COD)"}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">THỜI GIAN TẠO</p>
          <p className="text-sm font-bold text-slate-800">{formatDateTime(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">MÃ THAM CHIẾU</p>
          <p className="text-sm font-bold text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap" title={refCode}>
            {refCode}
          </p>
        </div>
      </div>

      {hasPaymentError && errorMessage && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-[8px] flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-10 h-10 rounded-[6px] bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <span className="material-symbols-outlined">error</span>
          </div>
          <div>
            <h4 className="font-bold text-rose-900 text-sm mb-1">Giao dịch thanh toán thất bại</h4>
            <p className="text-xs text-rose-700 font-semibold">{errorMessage}</p>
            {latestTx.responseCode && (
              <p className="text-[10px] text-rose-500 font-medium mt-1">Mã phản hồi từ ngân hàng: {latestTx.responseCode}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

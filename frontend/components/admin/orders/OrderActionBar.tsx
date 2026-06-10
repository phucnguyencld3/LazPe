import React from "react";
import { OrderInfo, getStatusBadgeColor, getStatusLabel } from "@/lib/features/orders/orderApi";

interface OrderActionBarProps {
  order: OrderInfo;
  onUpdateStatus: (action: string) => void;
  onShowCancelModal: () => void;
  onPrintOrder: () => void;
}

export const OrderActionBar: React.FC<OrderActionBarProps> = ({
  order,
  onUpdateStatus,
  onShowCancelModal,
  onPrintOrder,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-3">
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${getStatusBadgeColor(order.statusCode)}`}>
          <span className="w-2 h-2 bg-current rounded-full"></span>
          {getStatusLabel(order.statusCode)}
        </span>
        <span className="px-4 py-1.5 bg-slate-200 text-slate-600 rounded-full text-sm font-bold">
          Thanh toán: {order.payMethod || "Thanh toán khi nhận hàng (COD)"}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={onPrintOrder}
          className="flex items-center gap-2 px-6 py-2.5 border border-primary text-primary font-bold rounded-full hover:bg-primary-container/20 transition-all cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">print</span>
          In đơn hàng
        </button>
        
        {order.statusCode === 0 && (
          <button
            onClick={() => onUpdateStatus('confirm')}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary/95 transition-all cursor-pointer active:scale-95"
          >
            Xác nhận đơn
          </button>
        )}
        
        {order.statusCode === 1 && (
          <button
            onClick={() => onUpdateStatus('mark-shipped')}
            className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-on-secondary font-bold rounded-full shadow-md hover:bg-secondary/95 transition-all cursor-pointer active:scale-95"
          >
            Bắt đầu giao hàng
          </button>
        )}

        {(order.statusCode === 0 || order.statusCode === 1) && (
          <button 
            onClick={onShowCancelModal}
            className="px-6 py-2.5 bg-error-container text-on-error-container hover:bg-error-container/80 font-bold rounded-full transition-colors flex items-center gap-2 ml-2 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined">cancel</span>
            Hủy đơn
          </button>
        )}
      </div>
    </div>
  );
};

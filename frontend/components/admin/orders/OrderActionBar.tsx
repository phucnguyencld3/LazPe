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
          Thanh toán: {order.payMethod}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={onPrintOrder}
          className="flex items-center gap-2 px-6 py-2.5 border border-indigo-600 text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">print</span>
          In đơn hàng
        </button>
        
        {order.statusCode === 0 && (
          <button
            onClick={() => onUpdateStatus('confirm')}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-full shadow-md hover:bg-indigo-700 transition-all"
          >
            Xác nhận đơn
          </button>
        )}
        
        {order.statusCode === 1 && (
          <button
            onClick={() => onUpdateStatus('mark-shipped')}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-full shadow-md hover:bg-indigo-700 transition-all"
          >
            Bắt đầu giao hàng
          </button>
        )}

        {(order.statusCode < 3 && order.statusCode !== 5) && (
          <button 
            onClick={onShowCancelModal}
            className="px-6 py-2.5 bg-red-100 text-red-600 font-bold rounded-full hover:bg-red-200 transition-colors flex items-center gap-2 ml-2"
          >
            <span className="material-symbols-outlined">cancel</span>
            Hủy đơn
          </button>
        )}
      </div>
    </div>
  );
};

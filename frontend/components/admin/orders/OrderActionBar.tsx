import React from "react";
import { OrderInfo, getStatusBadgeColor, getStatusLabel } from "@/lib/features/orders/orderApi";

interface OrderActionBarProps {
  order: OrderInfo;
  onUpdateStatus: (action: string) => void;
  onShowCancelModal: () => void;
  onApproveCancel?: () => void;
  onRejectCancel?: () => void;
  onShowReturnModal?: () => void;
  onShowConfirmReturnModal?: () => void;
  onPrintOrder: () => void;
}

export const OrderActionBar: React.FC<OrderActionBarProps> = ({
  order,
  onUpdateStatus,
  onShowCancelModal,
  onApproveCancel,
  onRejectCancel,
  onShowReturnModal,
  onShowConfirmReturnModal,
  onPrintOrder,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div></div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onPrintOrder}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          In đơn hàng
        </button>
        
        {order.statusCode === 0 && (
          <button
            onClick={() => onUpdateStatus('confirm')}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Xác nhận đơn
          </button>
        )}
        
        {order.statusCode === 1 && (
          <button
            onClick={() => onUpdateStatus('mark-shipped')}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            Bắt đầu giao
          </button>
        )}

        {(order.statusCode === 0 || order.statusCode === 1) && (
          <button 
            onClick={onShowCancelModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            Hủy đơn
          </button>
        )}

        {order.statusCode === 4 && (
          <>
            {onRejectCancel && (
              <button 
                onClick={onRejectCancel}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-colors cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Từ chối hủy
              </button>
            )}
            {onApproveCancel && (
              <button 
                onClick={onApproveCancel}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white hover:bg-rose-600 font-bold rounded-xl shadow-md shadow-rose-500/20 transition-colors cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Duyệt hủy đơn
              </button>
            )}
          </>
        )}

        {order.statusCode === 6 && onShowReturnModal && (
          <button 
            onClick={onShowReturnModal}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white hover:bg-orange-600 font-bold rounded-xl shadow-md shadow-orange-500/20 transition-colors cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">assignment_return</span>
            Xử lý hoàn hàng
          </button>
        )}

        {order.statusCode === 9 && onShowConfirmReturnModal && (
          <button 
            onClick={onShowConfirmReturnModal}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white hover:bg-indigo-600 font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-colors cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Đã nhận hàng hoàn
          </button>
        )}
      </div>
    </div>
  );
};

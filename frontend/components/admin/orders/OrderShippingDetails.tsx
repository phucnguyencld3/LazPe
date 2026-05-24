import React from "react";
import { OrderInfo, formatDateTime } from "@/lib/features/orders/orderApi";

interface OrderShippingDetailsProps {
  order: OrderInfo;
}

export const OrderShippingDetails: React.FC<OrderShippingDetailsProps> = ({ order }) => {
  return (
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
  );
};

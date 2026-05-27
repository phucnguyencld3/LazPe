import React from "react";
import { OrderInfo } from "@/lib/features/orders/orderApi";

interface OrderCustomerInfoProps {
  order: OrderInfo;
}

export const OrderCustomerInfo: React.FC<OrderCustomerInfoProps> = ({ order }) => {
  return (
    <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center text-primary">
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
  );
};

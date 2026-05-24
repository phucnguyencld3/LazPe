import React from "react";

interface OrderSummaryCardsProps {
  totalOrders: number;
  pending: number;
  shipping: number;
  completed: number;
}

export const OrderSummaryCards: React.FC<OrderSummaryCardsProps> = ({
  totalOrders,
  pending,
  shipping,
  completed,
}) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
            <span className="material-symbols-outlined text-3xl">list_alt</span>
          </div>
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">Tổng quát</span>
        </div>
        <p className="text-sm font-bold text-slate-400 mb-1 uppercase">Tổng đơn hàng</p>
        <h3 className="text-3xl font-bold text-slate-800">{totalOrders}</h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
            <span className="material-symbols-outlined text-3xl">pending_actions</span>
          </div>
          <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full">Cần xử lý</span>
        </div>
        <p className="text-sm font-bold text-slate-400 mb-1 uppercase">Đang chờ</p>
        <h3 className="text-3xl font-bold text-slate-800">{pending}</h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
            <span className="material-symbols-outlined text-3xl">local_shipping</span>
          </div>
          <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">Trong kho</span>
        </div>
        <p className="text-sm font-bold text-slate-400 mb-1 uppercase">Đang giao</p>
        <h3 className="text-3xl font-bold text-slate-800">{shipping}</h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">Thành công</span>
        </div>
        <p className="text-sm font-bold text-slate-400 mb-1 uppercase">Hoàn thành</p>
        <h3 className="text-3xl font-bold text-slate-800">{completed}</h3>
      </div>
    </section>
  );
};

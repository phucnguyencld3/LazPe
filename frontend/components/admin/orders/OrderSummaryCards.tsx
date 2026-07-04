import React from "react";
import { formatCurrency } from "@/lib/features/orders/orderApi";

interface OrderSummaryCardsProps {
  totalOrders: number;
  pending: number;
  todayRevenue: number;
  cancelledCount: number;
  onViewRequests?: () => void;
}

export const OrderSummaryCards: React.FC<OrderSummaryCardsProps> = ({
  totalOrders,
  pending,
  todayRevenue,
  cancelledCount,
  onViewRequests,
}) => {
  const formatCompactRevenue = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return val.toString();
  };

  return (
    <div className="border-b border-slate-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x lg:divide-x divide-slate-100">
        {/* Card 1: Tổng đơn hàng */}
        <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng đơn hàng</span>
            <span className="text-[10px] text-secondary font-semibold flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              +12% so với tháng trước
            </span>
          </div>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">
          {totalOrders.toLocaleString()}
        </span>
      </div>

      {/* Card 2: Đang xử lý */}
      <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang xử lý</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Cần xử lý ngay</span>
          </div>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">
          {pending.toLocaleString()}
        </span>
      </div>

      {/* Card 3: Doanh thu hôm nay */}
      <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <span className="material-symbols-outlined text-[20px]">payments</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Doanh thu hôm nay</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5" title={formatCurrency(todayRevenue)}>
              {formatCompactRevenue(todayRevenue)} VNĐ
            </span>
          </div>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">
          {formatCompactRevenue(todayRevenue)}
        </span>
      </div>

      {/* Card 4: Đơn hàng bị hủy */}
      <div className={`px-5 py-4 flex items-center justify-between transition-all duration-300 ${
        cancelledCount > 0 
          ? 'bg-rose-50/50' 
          : 'hover:bg-slate-50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-[6px] flex items-center justify-center shrink-0 ${
            cancelledCount > 0 
              ? 'bg-rose-100 text-error' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <span className="material-symbols-outlined text-[20px]">cancel</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-bold uppercase tracking-wider ${cancelledCount > 0 ? 'text-rose-950/60' : 'text-slate-500'}`}>
              Đơn bị hủy
            </span>
            {onViewRequests && (
              <button
                onClick={onViewRequests}
                className="text-[10px] text-primary hover:underline font-bold text-left mt-0.5 cursor-pointer"
              >
                Xem yêu cầu
              </button>
            )}
          </div>
        </div>
        <span className={`text-2xl font-extrabold ${cancelledCount > 0 ? 'text-error' : 'text-slate-800'}`}>
          {cancelledCount.toString().padStart(2, "0")}
        </span>
      </div>
      </div>
    </div>
  );
};


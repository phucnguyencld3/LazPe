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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-8">
      {/* Card 1: Tổng đơn hàng */}
      <div className="bg-surface-container-lowest p-md rounded-lg shadow-[0_10px_20px_rgba(135,78,88,0.08)] border border-primary-container/30 hover:shadow-lg transition-all duration-300">
        <p className="text-label-md text-on-surface-variant font-medium">Tổng đơn hàng</p>
        <h3 className="text-display-lg font-display-lg text-primary my-2 leading-none">
          {totalOrders.toLocaleString()}
        </h3>
        <div className="flex items-center gap-1 text-secondary text-label-sm font-semibold">
          <span className="material-symbols-outlined text-[16px]">trending_up</span>
          <span>+12% so với tháng trước</span>
        </div>
      </div>

      {/* Card 2: Đang xử lý */}
      <div className="bg-surface-container-lowest p-md rounded-lg shadow-[0_10px_20px_rgba(135,78,88,0.08)] border border-secondary-container/30 hover:shadow-lg transition-all duration-300">
        <p className="text-label-md text-on-surface-variant font-medium">Đang xử lý</p>
        <h3 className="text-display-lg font-display-lg text-secondary my-2 leading-none">
          {pending.toLocaleString()}
        </h3>
        <p className="text-label-sm text-on-surface-variant font-medium">Cần xử lý ngay</p>
      </div>

      {/* Card 3: Doanh thu hôm nay */}
      <div className="bg-surface-container-lowest p-md rounded-lg shadow-[0_10px_20px_rgba(135,78,88,0.08)] hover:shadow-lg transition-all duration-300">
        <p className="text-label-md text-on-surface-variant font-medium">Doanh thu hôm nay</p>
        <h3 className="text-display-lg font-display-lg text-on-background my-2 leading-none">
          {formatCompactRevenue(todayRevenue)}
        </h3>
        <p className="text-label-sm text-on-surface-variant font-medium">VNĐ ({formatCurrency(todayRevenue)})</p>
      </div>

      {/* Card 4: Đơn hàng bị hủy */}
      <div className="bg-primary text-on-primary p-md rounded-lg shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all duration-300 min-h-[160px]">
        <div>
          <p className="text-label-md opacity-90 font-medium">Đơn hàng bị hủy</p>
          <h3 className="text-display-lg font-display-lg my-1 leading-none text-white">
            {cancelledCount.toString().padStart(2, "0")}
          </h3>
        </div>
        <button
          onClick={onViewRequests}
          className="bg-white/20 hover:bg-white/30 text-white text-label-md py-2 px-4 rounded-full transition-all text-center font-bold active:scale-95 cursor-pointer mt-2"
        >
          Xem yêu cầu
        </button>
      </div>
    </div>
  );
};


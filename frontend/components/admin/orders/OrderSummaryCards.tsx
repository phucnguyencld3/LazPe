import React from "react";
import { formatCurrency } from "@/lib/features/orders/orderApi";
import { StatsCard } from "@/components/admin/ui/Card";
import Button from "@/components/admin/ui/Button";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 font-outfit">
      {/* Card 1: Tổng đơn hàng */}
      <StatsCard
        title="Tổng đơn hàng"
        value={totalOrders.toLocaleString()}
        icon={<span className="material-symbols-outlined text-[24px]">shopping_bag</span>}
        iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
        trend="+12%"
        trendType="up"
      />

      {/* Card 2: Đang xử lý */}
      <StatsCard
        title="Đang xử lý"
        value={pending.toLocaleString()}
        icon={<span className="material-symbols-outlined text-[24px]">hourglass_empty</span>}
        iconBgColor="bg-warning-50 text-warning-500 dark:bg-warning-500/10 dark:text-orange-400"
      />

      {/* Card 3: Doanh thu hôm nay */}
      <StatsCard
        title="Doanh thu hôm nay"
        value={formatCompactRevenue(todayRevenue)}
        icon={<span className="material-symbols-outlined text-[24px]">payments</span>}
        iconBgColor="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400"
        trend={formatCurrency(todayRevenue)}
        trendType="neutral"
      />

      {/* Card 4: Đơn hàng bị hủy */}
      <div className="bg-brand-500 dark:bg-brand-600 text-white p-6 rounded-[2rem] shadow-theme-xs flex flex-col justify-between hover:shadow-theme-md transition-shadow duration-300 min-h-[160px]">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/20 text-white">
            <span className="material-symbols-outlined text-[24px]">cancel</span>
          </div>
          {onViewRequests && (
            <Button
              onClick={onViewRequests}
              variant="outline"
              size="sm"
              className="!bg-white/10 !text-white hover:!bg-white/20 !ring-0 border-0 text-[11px] font-bold rounded-full uppercase px-3 py-1"
            >
              Xem yêu cầu
            </Button>
          )}
        </div>
        <div className="mt-4">
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Đơn hàng bị hủy</p>
          <h3 className="text-3xl font-bold text-white mt-1">
            {cancelledCount.toString().padStart(2, "0")}
          </h3>
        </div>
      </div>
    </div>
  );
};


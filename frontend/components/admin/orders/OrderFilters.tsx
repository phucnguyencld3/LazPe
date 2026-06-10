import React, { useState } from "react";
import Input from "@/components/admin/ui/Input";
import Button from "@/components/admin/ui/Button";

interface OrderFiltersProps {
  statusFilter: number | null;
  setStatusFilter: (status: number | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  counts?: {
    all: number;
    pending: number;
    processing: number;
    shipping: number;
    completed: number;
    cancelled: number;
  };
  onApplyFilters?: (filters: { dateRange: string; orderValue: string }) => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  counts,
  onApplyFilters,
}) => {
  const [dateRange, setDateRange] = useState("");
  const [orderValue, setOrderValue] = useState("Mọi mức giá");

  const handleFilterClick = () => {
    if (onApplyFilters) {
      onApplyFilters({ dateRange, orderValue });
    }
  };

  const getTabClass = (isActive: boolean, isError: boolean = false) => {
    if (isActive) {
      if (isError) {
        return "px-5 py-2 bg-error-500 text-white rounded-full font-semibold transition-all whitespace-nowrap shadow-theme-xs hover:bg-error-600 active:scale-95 duration-200 text-xs";
      }
      return "px-5 py-2 bg-brand-500 text-white rounded-full font-semibold transition-all whitespace-nowrap shadow-theme-xs hover:bg-brand-600 active:scale-95 duration-200 text-xs";
    }
    if (isError) {
      return "px-5 py-2 bg-error-50 dark:bg-error-500/10 hover:bg-error-100 dark:hover:bg-error-500/20 text-error-600 dark:text-error-400 rounded-full font-semibold transition-all whitespace-nowrap border border-error-100 dark:border-error-500/20 active:scale-95 duration-200 text-xs";
    }
    return "px-5 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-full font-semibold transition-all whitespace-nowrap border border-gray-200 dark:border-white/5 active:scale-95 duration-200 text-xs";
  };

  return (
    <div className="bg-white dark:bg-white/[0.03] p-6 rounded-[2rem] shadow-theme-xs border border-gray-100 dark:border-white/[0.05] space-y-6 font-outfit">
      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setStatusFilter(null)}
          className={getTabClass(statusFilter === null)}
        >
          Tất cả {counts ? `(${counts.all})` : ""}
        </button>
        <button
          onClick={() => setStatusFilter(0)}
          className={getTabClass(statusFilter === 0)}
        >
          Chờ xác nhận {counts ? `(${counts.pending})` : ""}
        </button>
        <button
          onClick={() => setStatusFilter(1)}
          className={getTabClass(statusFilter === 1)}
        >
          Đang xử lý {counts ? `(${counts.processing})` : ""}
        </button>
        <button
          onClick={() => setStatusFilter(2)}
          className={getTabClass(statusFilter === 2)}
        >
          Đang giao {counts ? `(${counts.shipping})` : ""}
        </button>
        <button
          onClick={() => setStatusFilter(4)}
          className={getTabClass(statusFilter === 4)}
        >
          Hoàn thành {counts ? `(${counts.completed})` : ""}
        </button>
        <button
          onClick={() => setStatusFilter(5)}
          className={getTabClass(statusFilter === 5, true)}
        >
          Đã hủy {counts ? `(${counts.cancelled})` : ""}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[280px] relative group">
          <Input
            label="Tìm kiếm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11"
            placeholder="Mã đơn hàng, tên khách hàng..."
          />
          <span className="material-symbols-outlined absolute left-4 bottom-[11px] text-gray-400 dark:text-gray-500 text-[20px] pointer-events-none group-focus-within:text-brand-500 transition-colors">
            search
          </span>
        </div>

        {/* Date Range */}
        <div className="w-64 relative group">
          <Input
            label="Khoảng thời gian"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="pl-11"
            placeholder="01/10/2023 - 31/10/2023"
          />
          <span className="material-symbols-outlined absolute left-4 bottom-[11px] text-gray-400 dark:text-gray-500 text-[20px] pointer-events-none group-focus-within:text-brand-500 transition-colors">
            calendar_today
          </span>
        </div>

        {/* Price Value */}
        <div className="w-48">
          <Input
            label="Giá trị đơn"
            options={[
              { value: "Mọi mức giá", label: "Mọi mức giá" },
              { value: "Dưới 500k", label: "Dưới 500k" },
              { value: "500k - 2M", label: "500k - 2M" },
              { value: "Trên 2M", label: "Trên 2M" },
            ]}
            value={orderValue}
            onChange={(e) => setOrderValue(e.target.value)}
          />
        </div>

        {/* Filter Action Button */}
        <Button
          onClick={handleFilterClick}
          variant="secondary"
          className="font-bold h-11 px-5"
          startIcon={<span className="material-symbols-outlined text-[18px]">filter_list</span>}
        >
          Lọc dữ liệu
        </Button>
      </div>
    </div>
  );
};


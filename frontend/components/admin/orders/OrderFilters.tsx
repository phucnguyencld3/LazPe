import React, { useState } from "react";

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
      return "px-6 py-2 bg-primary text-on-primary rounded-full font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm active:scale-95 duration-200";
    }
    if (isError) {
      return "px-6 py-2 bg-surface hover:bg-red-50 text-error rounded-full font-label-md transition-all whitespace-nowrap border border-outline-variant/30 cursor-pointer active:scale-95 duration-200";
    }
    return "px-6 py-2 bg-surface hover:bg-primary-container/20 text-on-surface rounded-full font-label-md transition-all whitespace-nowrap border border-outline-variant/30 cursor-pointer active:scale-95 duration-200";
  };

  return (
    <div className="bg-surface-container-lowest p-md rounded-lg shadow-sm border border-outline-variant/20 space-y-md">
      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
      <div className="flex flex-wrap items-end gap-md">
        {/* Search */}
        <div className="flex-1 min-w-[280px] space-y-1">
          <label className="text-label-sm text-on-surface-variant ml-2 block">Tìm kiếm</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-surface rounded-full border-2 border-transparent focus:border-primary focus:ring-0 transition-all text-body-md outline-none"
              placeholder="Mã đơn hàng, tên khách hàng..."
              type="text"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="w-64 space-y-1">
          <label className="text-label-sm text-on-surface-variant ml-2 block">Khoảng thời gian</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              calendar_today
            </span>
            <input
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-surface rounded-full border-2 border-transparent focus:border-primary focus:ring-0 transition-all text-body-md outline-none"
              placeholder="01/10/2023 - 31/10/2023"
              type="text"
            />
          </div>
        </div>

        {/* Price Value */}
        <div className="w-48 space-y-1">
          <label className="text-label-sm text-on-surface-variant ml-2 block">Giá trị đơn</label>
          <select
            value={orderValue}
            onChange={(e) => setOrderValue(e.target.value)}
            className="w-full h-14 px-6 bg-surface rounded-full border-2 border-transparent focus:border-primary focus:ring-0 transition-all text-body-md appearance-none outline-none cursor-pointer"
          >
            <option>Mọi mức giá</option>
            <option>Dưới 500k</option>
            <option>500k - 2M</option>
            <option>Trên 2M</option>
          </select>
        </div>

        {/* Filter Action Button */}
        <button
          onClick={handleFilterClick}
          className="h-14 px-8 bg-secondary hover:bg-secondary/90 text-on-secondary rounded-full font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined">filter_list</span>
          Lọc dữ liệu
        </button>
      </div>
    </div>
  );
};


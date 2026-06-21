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
  sortValue: string;
  setSortValue: (val: string) => void;
  onApplyFilters?: (filters: { dateRange: string; orderValue: string }) => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  counts,
  sortValue,
  setSortValue,
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
        return "px-5 py-2.5 bg-rose-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 duration-200 cursor-pointer whitespace-nowrap";
      }
      return "px-5 py-2.5 bg-primary text-on-primary rounded-2xl font-bold text-xs shadow-md shadow-primary/20 transition-all active:scale-95 duration-200 cursor-pointer whitespace-nowrap";
    }
    if (isError) {
      return "px-5 py-2.5 bg-slate-50 hover:bg-rose-50 hover:text-error text-slate-600 rounded-2xl font-bold text-xs border border-slate-200 transition-all active:scale-95 duration-200 cursor-pointer whitespace-nowrap";
    }
    return "px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs border border-slate-200 transition-all active:scale-95 duration-200 cursor-pointer whitespace-nowrap";
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Status Tabs */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-hide">
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
          onClick={() => setStatusFilter(3)}
          className={getTabClass(statusFilter === 3)}
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
      <div className="p-6 flex flex-wrap items-center gap-4 bg-slate-50/50">
        {/* Search */}
        <div className="flex-1 min-w-[260px] relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Mã đơn hàng, tên khách hàng..."
            type="text"
          />
        </div>

        {/* Date Range */}
        <div className="relative min-w-[200px]">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            calendar_today
          </span>
          <input
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Khoảng thời gian..."
            type="text"
          />
        </div>

        {/* Price Value */}
        <select
          value={orderValue}
          onChange={(e) => setOrderValue(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
        >
          <option>Mọi mức giá</option>
          <option>Dưới 500k</option>
          <option>500k - 2M</option>
          <option>Trên 2M</option>
        </select>

        {/* Sort Option */}
        <select
          value={sortValue}
          onChange={(e) => setSortValue(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[180px] cursor-pointer"
        >
          <option value="created_desc">Mới nhất đến cũ nhất</option>
          <option value="created_asc">Cũ nhất đến mới nhất</option>
          <option value="total_desc">Giá trị cao nhất</option>
          <option value="total_asc">Giá trị thấp nhất</option>
        </select>

        {/* Filter Action Button */}
        <button
          onClick={handleFilterClick}
          className="px-5 py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          Lọc dữ liệu
        </button>

        {/* Reset Filters button */}
        {(searchTerm || dateRange || orderValue !== "Mọi mức giá" || statusFilter !== null || sortValue !== "created_desc") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setDateRange("");
              setOrderValue("Mọi mức giá");
              setStatusFilter(null);
              setSortValue("created_desc");
            }}
            className="px-6 py-3 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">clear</span>
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
};


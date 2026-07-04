import React, { useState, useRef, useEffect } from "react";

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
    cancelRequested: number;
    returnRequested: number;
    returnedRefunded: number;
    cancelledRefunded: number;
    returnApproved: number;
    returnRejected: number;
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dropdownOptions = [
    { value: 4, label: "Chờ duyệt hủy", count: counts?.cancelRequested },
    { value: 6, label: "Yêu cầu trả hàng", count: counts?.returnRequested },
    { value: 9, label: "Đã duyệt trả hàng", count: counts?.returnApproved },
    { value: 10, label: "Từ chối trả hàng", count: counts?.returnRejected },
    { value: 7, label: "Trả hàng & hoàn tiền", count: counts?.returnedRefunded },
    { value: 8, label: "Hủy & hoàn tiền", count: counts?.cancelledRefunded },
  ];

  const activeDropdownOption = dropdownOptions.find(opt => opt.value === statusFilter);

  const handleFilterClick = () => {
    if (onApplyFilters) {
      onApplyFilters({ dateRange, orderValue });
    }
  };

  const getTabClass = (isActive: boolean, isError: boolean = false) => {
    const baseClass = "flex-1 px-5 py-2.5 rounded-[8px] font-bold text-xs transition-all active:scale-95 duration-200 cursor-pointer whitespace-nowrap text-center";
    if (isActive) {
      if (isError) {
        return `${baseClass} bg-rose-600 text-white shadow-md shadow-rose-600/20`;
      }
      return `${baseClass} bg-primary text-on-primary shadow-md shadow-primary/20`;
    }
    if (isError) {
      return `${baseClass} bg-slate-50 hover:bg-rose-50 hover:text-error text-slate-600 border border-slate-200`;
    }
    return `${baseClass} bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200`;
  };

  return (
    <div className="border-b border-slate-100">
      {/* Status Tabs */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center gap-2 w-full overflow-x-auto scrollbar-hide">
        <button
          onClick={() => {
            setStatusFilter(null);
            setDropdownOpen(false);
          }}
          className={getTabClass(statusFilter === null)}
        >
          Tất cả {counts ? `(${counts.all})` : ""}
        </button>
        <button
          onClick={() => {
            setStatusFilter(0);
            setDropdownOpen(false);
          }}
          className={getTabClass(statusFilter === 0)}
        >
          Chờ xác nhận {counts ? `(${counts.pending})` : ""}
        </button>
        <button
          onClick={() => {
            setStatusFilter(1);
            setDropdownOpen(false);
          }}
          className={getTabClass(statusFilter === 1)}
        >
          Đang xử lý {counts ? `(${counts.processing})` : ""}
        </button>
        <button
          onClick={() => {
            setStatusFilter(2);
            setDropdownOpen(false);
          }}
          className={getTabClass(statusFilter === 2)}
        >
          Đang giao {counts ? `(${counts.shipping})` : ""}
        </button>
        <button
          onClick={() => {
            setStatusFilter(3);
            setDropdownOpen(false);
          }}
          className={getTabClass(statusFilter === 3)}
        >
          Hoàn thành {counts ? `(${counts.completed})` : ""}
        </button>

        {/* Dropdown for Cancel & Return/Refund statuses using native select to avoid overflow clipping */}
        <div className="relative flex min-w-[160px]">
          <select
            value={activeDropdownOption ? activeDropdownOption.value : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setStatusFilter(parseInt(val));
              }
            }}
            className={`${getTabClass(
              activeDropdownOption !== undefined,
              activeDropdownOption?.value === 8 || activeDropdownOption?.value === 10
            )} appearance-none pr-8 pl-5 py-2.5 rounded-[8px] font-bold text-xs cursor-pointer w-full text-center focus:outline-none`}
            style={{
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
          >
            <option value="" disabled hidden>Hủy & Trả hàng</option>
            {dropdownOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-slate-700 bg-white">
                {opt.label} {opt.count !== undefined ? `(${opt.count})` : ""}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none text-slate-500">
            keyboard_arrow_down
          </span>
        </div>

        <button
          onClick={() => {
            setStatusFilter(5);
            setDropdownOpen(false);
          }}
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
            className="w-full pl-12 pr-4 h-[44px] bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Mã đơn hàng, tên khách hàng..."
            type="text"
          />
        </div>

        {/* Date Range */}
        <div className="relative min-w-[200px]">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            calendar_today
          </span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full pl-12 pr-4 h-[44px] bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer appearance-none"
          >
            <option value="">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="3months">3 tháng gần nhất</option>
          </select>
        </div>

        {/* Price Value */}
        <select
          value={orderValue}
          onChange={(e) => setOrderValue(e.target.value)}
          className="px-4 h-[44px] bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
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
          className="px-4 h-[44px] bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[180px] cursor-pointer"
        >
          <option value="created_desc">Mới nhất đến cũ nhất</option>
          <option value="created_asc">Cũ nhất đến mới nhất</option>
          <option value="total_desc">Giá trị cao nhất</option>
          <option value="total_asc">Giá trị thấp nhất</option>
        </select>

        {/* Filter Action Button */}
        <button
          onClick={handleFilterClick}
          className="px-5 h-[44px] bg-primary text-on-primary rounded-[8px] border border-transparent font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
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
            className="px-6 h-[44px] text-slate-500 font-bold text-sm rounded-[8px] border border-transparent hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">clear</span>
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
};



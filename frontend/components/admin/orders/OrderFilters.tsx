import React from "react";

interface OrderFiltersProps {
  statusFilter: number | null;
  setStatusFilter: (status: number | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6 bg-slate-50/50">
      {/* Status Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setStatusFilter(null)}
          className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === null ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => setStatusFilter(0)}
          className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 0 ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Chờ xác nhận
        </button>
        <button 
          onClick={() => setStatusFilter(2)}
          className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 2 ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Đang giao
        </button>
        <button 
          onClick={() => setStatusFilter(3)}
          className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 3 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Đã nhận
        </button>
        <button 
          onClick={() => setStatusFilter(4)}
          className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 4 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Hoàn thành
        </button>
        <button 
          onClick={() => setStatusFilter(5)}
          className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${statusFilter === 5 ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Đã hủy
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none w-64 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            placeholder="Tìm mã đơn, khách hàng..." 
            type="text" 
          />
        </div>
      </div>
    </div>
  );
};

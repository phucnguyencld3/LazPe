import React from "react";

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({ searchTerm, onSearchChange, onReset }) => {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
        {/* Search box */}
        <div className="flex-1 min-w-[260px] relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Reset Filters button */}
        {searchTerm && (
          <button
            onClick={onReset}
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

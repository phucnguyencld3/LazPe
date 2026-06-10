import React from "react";

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({ searchTerm, onSearchChange, onReset }) => {
  return (
    <div className="bg-white dark:bg-gray-950 rounded-[2rem] p-6 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs font-outfit">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <span className="material-symbols-outlined absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            className="w-full pl-12 pr-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-semibold text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 transition-all"
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select className="w-full sm:w-auto px-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-bold text-gray-850 dark:text-white/95 dark:bg-gray-900 cursor-pointer transition-all min-w-[180px]">
          <option value="">Trạng thái (Tất cả)</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
        <button 
          onClick={onReset} 
          className="text-brand-500 hover:text-brand-600 font-bold text-sm px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
};


import React from "react";

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({ searchTerm, onSearchChange, onReset }) => {
  return (
    <div className="glass-card p-md rounded-xl shadow-sm bg-surface-container-lowest border border-outline-variant/20">
      <div className="flex flex-wrap items-center gap-md">
        <div className="flex-1 relative min-w-[300px]">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            className="w-full pl-xl pr-md py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select className="bg-surface-container-low border-none rounded-lg px-lg py-md font-label-md text-on-surface focus:ring-2 focus:ring-primary/30 min-w-[180px]">
          <option value="">Trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
        <button 
          onClick={onReset} 
          className="text-primary font-label-md text-label-md font-bold hover:underline px-md py-md"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
};

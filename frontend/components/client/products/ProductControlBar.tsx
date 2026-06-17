import React from "react";
import { SlidersHorizontal } from "lucide-react";

interface ProductControlBarProps {
  totalFiltered: number;
  totalItems: number;
  setShowMobileFilters: (show: boolean) => void;
  sortBy: string;
  sortDirection: string;
  handleSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const ProductControlBar: React.FC<ProductControlBarProps> = ({
  totalFiltered,
  totalItems,
  setShowMobileFilters,
  sortBy,
  sortDirection,
  handleSortChange,
}) => {
  const currentSortValue = () => {
    if (sortBy === "Price" && sortDirection === "asc") return "price_asc";
    if (sortBy === "Price" && sortDirection === "desc") return "price_desc";
    if (sortBy === "Rating") return "popular";
    return "newest";
  };

  return (
    <div className="p-4 sm:px-5 flex flex-col sm:flex-row justify-between items-center gap-4">
      {/* Product Counter */}
      <div className="text-sm text-slate-600 font-medium flex items-center gap-2">
        <span>Hiển thị:</span>
        <span className="text-slate-900 font-bold">{totalFiltered}</span>
        <span>/ {totalItems} sản phẩm</span>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Mobile Filter Toggle Button */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden h-10 px-4 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <SlidersHorizontal size={14} />
          Bộ lọc
        </button>

        {/* Sắp xếp */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sắp xếp:</span>
          <select
            value={currentSortValue()}
            onChange={handleSortChange}
            className="bg-transparent border-none text-sm text-slate-700 font-bold focus:ring-0 cursor-pointer py-1 pl-2 pr-8 outline-none"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="popular">Phổ biến nhất</option>
          </select>
        </div>
      </div>
    </div>
  );
};

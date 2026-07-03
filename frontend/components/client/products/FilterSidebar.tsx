"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Category } from "@/types";

interface FilterSidebarProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  selectedCategory: number | null;
  handleCategorySelect: (id: number | null) => void;
  categories: Category[];
  maxPrice: number;
  setMaxPrice: (val: number) => void;
  handleClearFilters: () => void;
}

export default function FilterSidebar({
  searchInput,
  setSearchInput,
  handleSearchSubmit,
  selectedCategory,
  handleCategorySelect,
  categories,
  maxPrice,
  setMaxPrice,
  handleClearFilters,
}: FilterSidebarProps) {
  return (
    <div className="space-y-8">
      {/* Search Widget */}
      <div>
        <h3 className="font-headline-md text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Search size={18} className="text-primary" />
          Tìm kiếm
        </h3>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Tìm tên sản phẩm..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-11 pl-4 pr-10 rounded-[8px] border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Category Selection */}
      <div>
        <h3 className="font-headline-md text-lg font-bold text-slate-800 mb-4">Danh mục</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Tất cả sản phẩm
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                selectedCategory === cat.id
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-xs ${selectedCategory === cat.id ? "text-white/80" : "text-slate-400"}`}>
                ({cat.productCount ?? 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Slider */}
      <div className="pt-6 border-t border-slate-200">
        <h3 className="font-headline-md text-lg font-bold text-slate-800 mb-4">
          Khoảng giá tối đa
        </h3>
        <input
          type="range"
          min="100000"
          max="2000000"
          step="50000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-primary h-2 bg-slate-200 rounded-full cursor-pointer"
        />
        <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
          <span>100.000đ</span>
          <span className="text-primary font-bold text-sm">
            {maxPrice.toLocaleString("vi-VN")}đ
          </span>
          <span>2.000.000đ+</span>
        </div>
      </div>

      {/* Clear Button */}
      <button
        onClick={handleClearFilters}
        className="w-full h-11 rounded-[8px] border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <X size={16} />
        Đặt lại bộ lọc
      </button>
    </div>
  );
}

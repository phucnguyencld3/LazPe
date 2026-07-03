"use client";

import React, { useMemo, useState } from "react";
import { Category } from "@/types";
import { Check, ChevronDown, Filter, Star, TicketPercent } from "lucide-react";

interface HorizontalFilterBarProps {
  categories: Category[];
  selectedCategory: number | null;
  handleCategorySelect: (id: number | null) => void;
  filter4Star: boolean;
  setFilter4Star: (val: boolean) => void;
  filterSale: boolean;
  setFilterSale: (val: boolean) => void;
}

export const HorizontalFilterBar: React.FC<HorizontalFilterBarProps> = ({
  categories,
  selectedCategory,
  handleCategorySelect,
  filter4Star,
  setFilter4Star,
  filterSale,
  setFilterSale,
}) => {
  // Logic to determine which categories to show
  const displayCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    if (selectedCategory === null) {
      // Show top level categories
      return categories.filter((c) => c.parentId == null || c.parentId === 0);
    }

    const currentCat = categories.find((c) => c.id === selectedCategory);
    if (!currentCat) return categories.filter((c) => c.parentId == null || c.parentId === 0);

    // Find children of current category
    const children = categories.filter((c) => c.parentId === selectedCategory);

    if (children.length > 0) {
      return children;
    }

    // If no children, show siblings
    const siblings = categories.filter((c) => c.parentId === currentCat.parentId);
    return siblings.length > 0 ? siblings : [currentCat];
  }, [categories, selectedCategory]);

  // Create breadcrumb for category
  const categoryBreadcrumb = useMemo(() => {
    if (selectedCategory === null) return "Tất cả danh mục";
    const current = categories.find(c => c.id === selectedCategory);
    if (!current) return "Tất cả danh mục";
    
    if (current.parentId) {
      const parent = categories.find(c => c.id === current.parentId);
      return parent ? `${parent.name} ❯ ${current.name}` : current.name;
    }
    return current.name;
  }, [categories, selectedCategory]);

  return (
    <div className="p-4 sm:p-5">
      {/* Top Row: Side-by-side Filters */}
      <div className="flex flex-col md:flex-row gap-6 relative">
        
        {/* Categories Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-[13px] font-semibold text-rose-500">{categoryBreadcrumb}</h4>
            {selectedCategory !== null && (
              <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Đang chọn</span>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(selectedCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded border text-[13px] whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? "border-rose-500 text-rose-500 bg-rose-50 font-medium"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filter / All */}
        <div className="flex items-end pb-1 md:border-l md:border-slate-100 md:pl-6 shrink-0 mt-2 md:mt-0">
          <button
            onClick={() => {
              handleCategorySelect(null);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 rounded text-[13px] text-slate-600 hover:bg-slate-50 transition-colors h-[34px]"
          >
            <Filter size={14} />
            <span>Tất cả</span>
          </button>
        </div>
      </div>

      <hr className="border-slate-100 my-4" />

      {/* Bottom Row: Quick Filters */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setFilter4Star(!filter4Star)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-[13px] font-medium transition-colors ${
              filter4Star ? "border-amber-500 bg-amber-50 text-amber-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Star size={16} className={filter4Star ? "text-amber-500 fill-amber-500" : "text-amber-400"} />
            từ 4 sao
          </button>
          
          <button 
            onClick={() => setFilterSale(!filterSale)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-[13px] font-medium transition-colors ${
              filterSale ? "border-rose-500 bg-rose-50 text-rose-600" : "border-rose-100 bg-rose-50 text-rose-600 hover:border-rose-200"
            }`}
          >
            <TicketPercent size={16} className={filterSale ? "text-rose-500" : "text-rose-400"} />
            Giảm giá
          </button>
        </div>
        
        {/* Note: The sorting dropdown is currently managed in ProductControlBar below this component */}
      </div>
    </div>
  );
};

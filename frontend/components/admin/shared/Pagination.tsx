"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  size?: "sm" | "md";
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  size = "md",
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const isSm = size === "sm";

  return (
    <div className={`flex items-center justify-between bg-surface-container-low border-t border-outline-variant ${
      isSm ? "px-4 py-2" : "px-6 py-4"
    }`}>
      <p className={`text-on-surface-variant ${isSm ? "text-[11px] font-bold" : "text-label-sm"}`}>
        Hiển thị {startItem} - {endItem} trong tổng số {totalItems} mục
      </p>
      <div className={`flex items-center ${isSm ? "gap-1.5" : "gap-2"}`}>
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-all disabled:opacity-30 cursor-pointer ${
            isSm ? "w-8 h-8" : "w-10 h-10"
          }`}
        >
          <span className={`material-symbols-outlined ${isSm ? "text-base" : ""}`}>chevron_left</span>
        </button>
        <div className={`flex items-center ${isSm ? "gap-1" : "gap-1"}`}>
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span key={`dots-${index}`} className={`text-outline-variant ${isSm ? "px-1 text-xs" : "px-2"}`}>
                  ...
                </span>
              );
            }
            const isPageActive = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                onClick={() => onPageChange(page as number)}
                className={`rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isSm ? "w-8 h-8 text-xs font-bold" : "w-10 h-10 text-sm font-bold"
                } ${
                  isPageActive
                    ? "bg-primary text-on-primary shadow-sm"
                    : `hover:bg-primary-container/20 text-on-surface-variant ${isSm ? "font-bold" : "font-label-md"}`
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={`rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-all disabled:opacity-30 cursor-pointer ${
            isSm ? "w-8 h-8" : "w-10 h-10"
          }`}
        >
          <span className={`material-symbols-outlined ${isSm ? "text-base" : ""}`}>chevron_right</span>
        </button>
      </div>
    </div>
  );
};


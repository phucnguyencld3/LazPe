import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-12 flex justify-center items-center gap-2">
      <button
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-[8px] flex items-center justify-center border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={18} />
      </button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => setCurrentPage(pageNumber)}
          className={`w-10 h-10 rounded-[8px] flex items-center justify-center font-bold transition-all ${
            currentPage === pageNumber
              ? "bg-primary text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:border-primary hover:text-primary"
          }`}
        >
          {pageNumber}
        </button>
      ))}

      <button
        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-[8px] flex items-center justify-center border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

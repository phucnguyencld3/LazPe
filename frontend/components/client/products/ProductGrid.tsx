import React from "react";
import ProductCard from "@/app/components/ProductCard";
import { Product } from "@/types";

interface ProductGridProps {
  loading: boolean;
  error: string;
  filteredProducts: Product[];
  handleClearFilters: () => void;
  handleRetry: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  loading,
  error,
  filteredProducts,
  handleClearFilters,
  handleRetry,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Đang tải danh sách sản phẩm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-primary text-white rounded-full font-medium shadow hover:brightness-110 active:scale-95 transition-all"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-slate-500 font-medium mb-4">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
        <button
          onClick={handleClearFilters}
          className="px-6 py-2 bg-primary text-white rounded-full font-medium shadow hover:brightness-110 active:scale-95 transition-all"
        >
          Xóa bộ lọc
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

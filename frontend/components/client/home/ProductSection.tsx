import React from "react";
import Link from "next/link";
import { ChevronRight, Loader } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "@/components/client/common/ProductCard";

interface ProductSectionProps {
  products: Product[];
  loadingProducts: boolean;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  loadingProducts,
}) => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Sản phẩm nổi bật</h2>
            <p className="text-slate-600">Những sản phẩm được yêu thích nhất tháng này</p>
          </div>
          <Link
            href="/products"
            className="hidden md:flex items-center gap-2 text-rose-600 font-semibold hover:text-rose-700 transition-colors"
          >
            Xem tất cả
            <ChevronRight size={20} />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-rose-600" size={32} />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-600 py-8">Không có sản phẩm nào</p>
        )}

        <div className="text-center md:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-rose-600 font-semibold hover:text-rose-700 transition-colors"
          >
            Xem tất cả sản phẩm
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
};

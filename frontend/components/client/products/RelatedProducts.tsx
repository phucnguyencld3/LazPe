import React from "react";
import ProductCard from "@/app/components/ProductCard";
import { Product } from "@/types";

interface RelatedProductsProps {
  relatedProducts: Product[];
  recommendedProducts: Product[];
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  relatedProducts,
  recommendedProducts,
}) => {
  return (
    <>
      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            Sản phẩm tương tự
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Products Grid */}
      {recommendedProducts.length > 0 && (
        <section className="mt-16 pt-16 border-t border-slate-100">
          <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            Đề xuất sản phẩm cho bạn
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};

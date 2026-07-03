import React from "react";
import ProductCard from "@/components/client/common/ProductCard";
import { Product } from "@/types";

interface RelatedProductsProps {
  relatedProducts: Product[];
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  relatedProducts,
}) => {
  return (
    <>
      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="mt-3">
          <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            Sản phẩm tương tự
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </>
  );
};

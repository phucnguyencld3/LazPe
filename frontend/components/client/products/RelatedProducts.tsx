"use client";

import React, { useRef } from "react";
import ProductCard from "@/components/client/common/ProductCard";
import { Product } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RelatedProductsProps {
  relatedProducts: Product[];
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  relatedProducts,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth + 100 : current.offsetWidth - 100;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="mt-3 relative group">
          <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            Sản phẩm tương tự
          </h2>

          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-[55%] -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 rounded-full p-2 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block -ml-4"
          >
            <ChevronLeft size={24} />
          </button>

          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-3 md:gap-4 lg:gap-5 pb-4 snap-x hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {relatedProducts.slice(0, 10).map((p) => (
              <div key={p.id} className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px] md:min-w-[200px] md:w-[200px] shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-[55%] -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 rounded-full p-2 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block -mr-4"
          >
            <ChevronRight size={24} />
          </button>
        </section>
      )}

    </>
  );
};

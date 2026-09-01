"use client";

import React, { useEffect, useState, useRef } from "react";
import { Product } from "@/types";
import { getRecommendations } from "@/lib/recommendationApi";
import ProductCard from "@/components/client/common/ProductCard";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductRecommendationsProps {
  limit?: number;
  excludeProductId?: number;
  title?: string;
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({ 
  limit = 10,
  excludeProductId,
  title = "Đề xuất cho bạn"
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth + 100 : current.offsetWidth - 100;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const data = await getRecommendations(limit + (excludeProductId ? 1 : 0));
        if (data && data.length > 0) {
          let filtered = data;
          if (excludeProductId) {
            filtered = filtered.filter(p => p.id !== excludeProductId);
          }
          setProducts(filtered.slice(0, limit));
        }
      } catch (error) {
        console.error("Error loading recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [limit, excludeProductId]);

  if (loading) {
    return (
      <section className="mt-2 pt-2 relative group">
        <h2 className="font-headline-lg text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
          {title}
        </h2>

        <div className="flex overflow-x-auto gap-3 md:gap-4 lg:gap-5 pb-4 snap-x hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px] md:min-w-[200px] md:w-[200px] shrink-0 snap-start animate-pulse bg-slate-200 rounded-2xl h-64"></div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-2 pt-2 relative group">
      <h2 className="font-headline-lg text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
        {title}
      </h2>

      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-[60%] -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 rounded-full p-2 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block -ml-4"
      >
        <ChevronLeft size={24} />
      </button>

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-3 md:gap-4 lg:gap-5 pb-4 snap-x hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {products.map((p) => (
          <div key={p.id} className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px] md:min-w-[200px] md:w-[200px] shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-[60%] -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 rounded-full p-2 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block -mr-4"
      >
        <ChevronRight size={24} />
      </button>
    </section>
  );
};

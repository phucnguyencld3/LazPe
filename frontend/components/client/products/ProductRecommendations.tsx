"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import { getRecommendations } from "@/lib/recommendationApi";
import ProductCard from "@/components/client/common/ProductCard";
import { Sparkles } from "lucide-react";

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
      <section className="mt-3 pt-3 border-t border-slate-100">
        <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          {title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-64 w-full"></div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-3 pt-3 border-t border-slate-100">
      <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-yellow-500" />
        {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};

"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import { getRecentlyViewed } from "@/lib/recommendationApi";
import ProductCard from "@/components/client/common/ProductCard";
import { RotateCcw } from "lucide-react";

interface RecentlyViewedProductsProps {
  limit?: number;
  title?: string;
}

export const RecentlyViewedProducts: React.FC<RecentlyViewedProductsProps> = ({ 
  limit = 10,
  title = "Sản phẩm bạn vừa xem"
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      setLoading(true);
      try {
        // Read recentIds from localStorage if user is not logged in or as fallback
        const localRecentIds = localStorage.getItem("lazpe_recent_views") || "";
        const data = await getRecentlyViewed(limit, localRecentIds);
        
        if (data && data.length > 0) {
          setProducts(data.slice(0, limit));
        }
      } catch (error) {
        console.error("Error loading recently viewed products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, [limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-[10px] shadow-sm p-5 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <RotateCcw className="text-orange-500" size={24} /> {title}
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-64 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-[10px] shadow-sm p-5 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
          <RotateCcw className="text-orange-500" size={24} /> {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

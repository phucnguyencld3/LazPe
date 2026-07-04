"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/types";

interface TopRandomBannerProps {
  products: Product[];
}

export const TopRandomBanner: React.FC<TopRandomBannerProps> = ({ products }) => {
  const router = useRouter();
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Pick random products only on client side (no cache)
  useEffect(() => {
    if (products && products.length > 0) {
      // Shuffle products and pick a subset
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setRandomProducts(shuffled.slice(0, 10)); // Pick up to 10 random items
    } else {
      setRandomProducts([]);
    }
  }, [products]);

  if (randomProducts.length === 0) return null;

  // Ensure we have enough items to fill the screen to prevent marquee jump
  let baseItems = [...randomProducts];
  if (baseItems.length > 0 && baseItems.length < 6) {
    while (baseItems.length < 6) {
      baseItems = [...baseItems, ...randomProducts];
    }
  }

  // Duplicate the array once to create the seamless loop effect
  const marqueeItems = [...baseItems, ...baseItems];

  return (
    <div className="w-full overflow-hidden bg-white py-6 relative">
      {/* Title Badge */}
      <div className="absolute top-0 left-0 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-br-lg z-10 shadow-sm tracking-wide">
        GỢI Ý HÔM NAY
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="animate-marquee pt-4">
        {marqueeItems.map((prod, idx) => (
          <div 
            key={`${prod.id}-${idx}`}
            onClick={() => router.push(prod.isBundle ? `/bundles/${prod.slug || prod.id}` : `/products/${prod.slug || prod.id}`)}
            className="inline-flex flex-col items-center w-[180px] mx-4 bg-white group cursor-pointer transition-transform duration-300 hover:scale-105"
          >
            <div className="relative w-full h-[140px] mb-3 bg-slate-50/50 rounded-xl p-2 border border-slate-50">
              <Image
                src={prod.image ? (prod.image.startsWith("http") ? prod.image : `http://localhost:5101${prod.image}`) : "/placeholder.png"}
                alt={prod.name}
                fill
                className="object-contain mix-blend-multiply drop-shadow-sm"
                sizes="180px"
              />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 text-center w-full leading-tight mb-1 group-hover:text-primary transition-colors">
              {prod.name}
            </h3>
            <p className="text-rose-500 font-bold text-sm">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                prod.discountPrice || prod.price
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

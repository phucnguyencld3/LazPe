"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product } from "@/types";

interface TopRandomBannerProps {
  products: Product[];
}

export const TopRandomBanner: React.FC<TopRandomBannerProps> = ({ products }) => {
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Pick random products only on client side (no cache)
  useEffect(() => {
    if (products && products.length > 0) {
      // Shuffle products and pick a subset so it's not heavy
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setRandomProducts(shuffled.slice(0, 10)); // Pick 10 random items
      setCurrentIndex(0);
    } else {
      setRandomProducts([]);
    }
  }, [products]);

  // Rotate every 3 seconds
  useEffect(() => {
    if (randomProducts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % randomProducts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [randomProducts]);

  if (randomProducts.length === 0) return null;

  // We want to show 3 products at a time
  const getProductsToShow = () => {
    if (randomProducts.length < 3) return randomProducts;
    const items = [];
    for (let i = 0; i < 3; i++) {
      items.push(randomProducts[(currentIndex + i) % randomProducts.length]);
    }
    return items;
  };

  const currentProducts = getProductsToShow();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {currentProducts.map((prod, idx) => (
        <div key={prod.id + "-" + idx} className="h-[180px] rounded-xl overflow-hidden relative shadow-sm border border-slate-100 group bg-gradient-to-br from-blue-50 to-rose-50 cursor-pointer">
          {/* Background Image Layer */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-end pr-4">
            <div className="relative w-1/2 h-[80%]">
              <Image
                src={prod.image ? (prod.image.startsWith("http") ? prod.image : `http://localhost:5101${prod.image}`) : "/placeholder.png"}
                alt={prod.name}
                fill
                className="object-contain opacity-90 transition-transform duration-700 group-hover:scale-105 drop-shadow-md"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>

          {/* Content Overlay */}
          <div className="absolute inset-0 p-4 flex flex-col justify-center items-start pointer-events-none w-2/3">
            <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-[4px] mb-2 shadow-sm transform transition-transform duration-500 group-hover:-translate-y-1">
              GỢI Ý HÔM NAY
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-2 transform transition-transform duration-500 group-hover:-translate-y-1 line-clamp-2 leading-tight">
              {prod.name}
            </h3>
            <p className="text-white/90 text-xs sm:text-sm font-medium transform transition-transform duration-500 group-hover:-translate-y-1">
              Chỉ từ{" "}
              <span className="text-yellow-400 font-bold text-base sm:text-lg block">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                  prod.discountPrice || prod.price
                )}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

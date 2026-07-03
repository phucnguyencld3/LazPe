"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product } from "@/types";

interface InlineGridBannerProps {
  products: Product[];
}

export const InlineGridBanner: React.FC<InlineGridBannerProps> = ({ products }) => {
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (products.length > 0) {
      // Shuffle products and take up to 5
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setRandomProducts(shuffled.slice(0, 5));
      setCurrentIndex(0); // Reset index when products change
    } else {
      setRandomProducts([]);
    }
  }, [products]);

  useEffect(() => {
    if (randomProducts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % randomProducts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [randomProducts]);

  if (randomProducts.length === 0) return null;

  const currentProduct = randomProducts[currentIndex] || randomProducts[0];
  if (!currentProduct) return null;

  return (
    <div className="row-start-1 col-span-2 sm:col-start-2 md:col-start-3 xl:col-start-4 rounded-2xl overflow-hidden relative shadow-sm border border-slate-100 group bg-white hidden sm:block h-full min-h-[300px]">
      {/* Background Image Layer */}
      {currentProduct.image && (
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={currentProduct.image.startsWith("http") ? currentProduct.image : `http://localhost:5101${currentProduct.image}`}
            alt={currentProduct.name}
            fill
            className="object-contain transition-transform duration-700 group-hover:scale-105 p-6"
            sizes="(max-width: 1024px) 100vw, 320px"
          />
          {/* Subtle gradient only at the bottom for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>
      )}

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 z-10 text-white">
        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded w-fit mb-3 uppercase tracking-wider">
          Đang thịnh hành
        </span>
        <h3 className="font-bold text-lg sm:text-xl line-clamp-2 mb-2 drop-shadow-md">
          {currentProduct.name}
        </h3>

        {/* Navigation Dots */}
        <div className="flex gap-1.5 mt-4">
          {randomProducts.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

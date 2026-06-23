"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Scale } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import Image from "next/image";

export const CompareFloatingBar = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (compareItems.length === 0) return null;

  const compareUrl = `/compare?ids=${compareItems.map(item => item.id).join(",")}`;

  if (isCollapsed) {
    return (
      <button 
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-[168px] right-6 z-[45] w-14 h-14 bg-white text-slate-700 border border-slate-200 rounded-2xl shadow-lg flex items-center justify-center hover:text-primary hover:border-primary/50 hover:-translate-y-1 active:scale-95 transition-all duration-300 group"
        title="Mở thanh so sánh"
      >
        <div className="relative flex items-center justify-center w-full h-full">
          <Scale size={24} className="group-hover:scale-110 transition-transform text-slate-600 group-hover:text-primary" />
          <span className="absolute top-1.5 right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {compareItems.length}
          </span>
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Right-aligned floating modal style - Super Compact version */}
      <div className="fixed bottom-[168px] right-4 sm:right-6 z-[50] w-[100px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 rounded-[20px] p-2.5 animate-in zoom-in-95 slide-in-from-right-8 duration-300 flex flex-col origin-bottom-right">
        {/* Header */}
        <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-2 mb-2 shrink-0 relative">
          <h3 className="text-[11px] font-black text-slate-800 uppercase leading-none mt-1">
            So sánh
          </h3>
          <p className="text-[10px] font-medium text-slate-500 mt-0.5">
            {compareItems.length}/3
          </p>
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            title="Thu gọn"
          >
            <X size={12} />
          </button>
        </div>

        {/* Product Slots - Vertical Stack */}
        <div className="flex flex-col items-center gap-2 pb-2">
          {[0, 1, 2].map((index) => {
            const item = compareItems[index];
            if (item) {
              const image = item.image || item.imageUrls?.[0] || item.variants?.[0]?.imageUrl || "/assets/img/products/default-product.jpg";
              return (
                <Link 
                  href={`/products/${item.slug || item.id}`}
                  key={item.id} 
                  className="w-[64px] h-[64px] bg-white border border-slate-200 rounded-[12px] p-0.5 relative group hover:border-primary/40 hover:shadow-md transition-all shadow-sm shrink-0 block"
                >
                  <div className="w-full h-full bg-slate-50/50 rounded-[8px] overflow-hidden relative" title={item.name}>
                    <Image
                      src={image}
                      alt={item.name}
                      fill
                      className="object-contain mix-blend-multiply p-1"
                    />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromCompare(item.id);
                    }} 
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10 hover:bg-rose-600 hover:scale-110"
                    title="Xoá khỏi danh sách"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </Link>
              );
            } else {
              return (
                <div 
                  key={`empty-${index}`} 
                  className="flex items-center justify-center w-[64px] h-[64px] border-2 border-dashed border-slate-200 rounded-[10px] bg-slate-50/50 text-slate-300 shrink-0"
                  title="Chỗ trống"
                >
                  <span className="text-xl font-light">+</span>
                </div>
              );
            }
          })}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 shrink-0 bg-white">
          <Link 
            href={compareUrl}
            className={`w-full py-1.5 rounded-[8px] font-bold text-[11px] transition-all text-center flex flex-col items-center justify-center ${
              compareItems.length > 1 
                ? "bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 shadow-sm shadow-primary/25" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
            onClick={(e) => {
              if (compareItems.length < 2) {
                e.preventDefault();
              }
            }}
          >
            <Scale size={14} className="mb-0.5" />
            So sánh
          </Link>
          <button 
            onClick={clearCompare}
            className="w-full py-1 text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors"
          >
            Xoá tất cả
          </button>
        </div>
      </div>
    </>
  );
};

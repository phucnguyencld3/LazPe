"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Scale, ChevronRight, ChevronDown, Trash2 } from "lucide-react";
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
        className="fixed bottom-[168px] right-6 z-[45] w-14 h-14 bg-primary text-white rounded-2xl shadow-lg flex flex-col items-center justify-center hover:bg-primary/90 hover:-translate-y-1 active:scale-95 transition-all duration-300 group"
        title="Mở thanh so sánh"
      >
        <div className="relative">
          <Scale size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md">
            {compareItems.length}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-[168px] right-6 z-50 w-24 bg-white rounded-xl shadow-[0_5px_25px_rgba(0,0,0,0.1)] border border-slate-200 p-3 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 pb-3 border-b border-slate-100 relative">
        <button
          onClick={() => setIsCollapsed(true)}
          className="absolute -top-1 -right-1 w-6 h-6 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md flex items-center justify-center transition-colors"
          title="Thu gọn"
        >
          <X size={14} />
        </button>
        <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mt-2">
          <Scale size={16} />
        </div>
        <span className="text-[11px] font-bold text-slate-600 text-center leading-tight uppercase tracking-wide">
          So sánh<br/><span className="text-primary">({compareItems.length}/3)</span>
        </span>
      </div>

      {/* Product Slots */}
      <div className="flex flex-col items-center gap-2.5">
        {[0, 1, 2].map((index) => {
          const item = compareItems[index];
          return (
            <div 
              key={index}
              className={`relative w-16 h-16 rounded-lg border-2 ${item ? 'border-slate-100 bg-white shadow-sm' : 'border-dashed border-slate-200 bg-slate-50'} flex items-center justify-center overflow-hidden shrink-0 group transition-all`}
            >
              {item ? (
                <>
                  <Image
                    src={item.image || "/images/placeholder.png"}
                    alt={item.name}
                    fill
                    className="object-contain p-1 mix-blend-multiply"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromCompare(item.id);
                    }}
                    className="absolute inset-y-0 right-0 w-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-white hover:text-red-400"
                    title="Xoá khỏi danh sách"
                  >
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                </>
              ) : (
                <span className="text-slate-300 text-lg font-light">+</span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Clear Button */}
      <button 
        onClick={clearCompare}
        className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors text-center mt-1"
      >
        Xoá tất cả
      </button>

      {/* Action Buttons */}
      <Link 
        href={compareUrl}
        className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg font-bold text-[12px] transition-all shadow-sm text-center ${
          compareItems.length > 1 
            ? "bg-primary text-white hover:bg-primary/90 hover:shadow-md" 
            : "bg-slate-50 text-slate-400 cursor-not-allowed"
        }`}
        onClick={(e) => {
          if (compareItems.length < 2) {
            e.preventDefault();
          }
        }}
      >
        Xem
        <br/>
        so sánh
      </Link>
    </div>
  );
};

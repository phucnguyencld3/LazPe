"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/client/common/ProductCard";

export default function WishlistPage() {
  const { wishlist, loading } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a clean loading state during server hydration to prevent mismatch
  if (!mounted || loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <section className="bg-gradient-to-br from-[#ffd9de]/30 via-white to-white border-b border-slate-100 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1 className="font-headline-lg text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 flex items-center justify-center gap-3">
              <Heart className="text-rose-500 fill-rose-500" size={36} />
              Sản phẩm yêu thích
            </h1>
            <p className="max-w-2xl mx-auto font-body-lg text-base md:text-lg text-slate-600 leading-relaxed">
              Lưu giữ những sản phẩm bạn yêu thích để dễ dàng mua sắm bất cứ lúc nào.
            </p>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-rose-500 transition-colors">
        <ChevronLeft size={16} /> Quay lại trang chủ
      </Link>
      
      {/* Header */}
      <div className="bg-white rounded-[10px] shadow-sm border border-slate-100 overflow-hidden relative mb-6">
        <div className="bg-rose-50/50 py-4 px-6 md:py-5 md:px-8 border-b border-rose-100/50 relative flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-rose-200 bg-white shadow-sm mb-2 text-rose-500">
              <Heart className="w-4 h-4 fill-rose-500" />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-1">Sản Phẩm Yêu Thích</h2>
          <p className="text-[13px] text-slate-500 max-w-[600px] mx-auto">
            Lưu giữ những sản phẩm bạn yêu thích để dễ dàng mua sắm bất cứ lúc nào.
          </p>
        </div>
        
        {/* Count */}
        <div className="p-3 bg-white flex justify-center border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100/50">
            Danh sách gồm <strong className="text-rose-600 font-bold">{wishlist.length}</strong> sản phẩm
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[10px] shadow-sm p-5 md:p-6 min-h-[400px]">
        {wishlist.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Heart size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">Chưa có sản phẩm yêu thích nào</h3>
            <p className="text-slate-500 text-sm">Bạn chưa lưu sản phẩm nào. Hãy khám phá cửa hàng và thả tim cho những sản phẩm bạn yêu thích nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

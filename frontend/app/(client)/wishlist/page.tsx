"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";
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
    <div className="bg-slate-50 min-h-screen">
      {/* Header section matching ProductsHero style */}
      <section className="bg-gradient-to-br from-[#ffd9de]/30 via-white to-white border-b border-slate-100 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="font-headline-lg text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 flex items-center justify-center gap-3">
            <Heart className="text-rose-500 fill-rose-500 animate-pulse" size={36} />
            Sản phẩm yêu thích
          </h1>
          <p className="max-w-2xl mx-auto font-body-lg text-base md:text-lg text-slate-600 leading-relaxed">
            Lưu giữ những sản phẩm bạn yêu thích để dễ dàng mua sắm bất cứ lúc nào.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm hover:shadow active:scale-95"
          >
            <ArrowLeft size={16} />
            Tiếp tục mua sắm
          </Link>
          <span className="text-sm text-slate-500 font-medium bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
            Danh sách gồm <strong className="text-rose-600 font-bold">{wishlist.length}</strong> sản phẩm
          </span>
        </div>

        {wishlist.length === 0 ? (
          <div className="relative w-full max-w-[40rem] mx-auto mt-8 mb-16">
            {/* Decorative background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-200/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-300/30 rounded-full blur-2xl -z-10 pointer-events-none"></div>
            
            <div className="text-center py-16 px-6 sm:px-12 bg-white/70 backdrop-blur-md rounded-[2rem] border border-white shadow-[0_20px_40px_rgba(225,29,72,0.05)] relative overflow-hidden group">
              {/* Floating micro-elements */}
              <div className="absolute top-10 left-10 text-rose-200 opacity-50 group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                <Heart size={24} className="fill-rose-200" />
              </div>
              <div className="absolute bottom-16 right-12 text-pink-200 opacity-60 group-hover:-translate-y-3 group-hover:scale-110 transition-all duration-1000 delay-100 pointer-events-none">
                <Heart size={32} className="fill-pink-200" />
              </div>
              <div className="absolute top-20 right-20 text-rose-100 opacity-40 group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-500 delay-200 pointer-events-none">
                <Heart size={16} className="fill-rose-100" />
              </div>

              {/* Main Icon */}
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 bg-rose-200 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-full h-full bg-gradient-to-tr from-rose-50 to-pink-50/50 rounded-full flex items-center justify-center shadow-inner border border-white">
                  <Heart size={48} className="text-rose-500 fill-rose-500/20 drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tight">Danh sách yêu thích trống</h2>
              <p className="w-full max-w-[28rem] mx-auto text-slate-500 mb-10 leading-relaxed font-medium">
                Bạn chưa lưu sản phẩm nào. Hãy khám phá cửa hàng và thả tim cho những sản phẩm bạn yêu thích nhé!
              </p>
              
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-lg rounded-full shadow-[0_8px_20px_rgba(225,29,72,0.25)] hover:shadow-[0_12px_25px_rgba(225,29,72,0.35)] hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all"
              >
                <ShoppingBag size={20} />
                Khám phá sản phẩm ngay
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

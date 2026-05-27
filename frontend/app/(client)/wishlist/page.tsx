"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/app/components/ProductCard";

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
          <div className="w-full max-w-[36rem] mx-auto text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm px-6">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Heart size={36} className="text-rose-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Danh sách yêu thích trống</h2>
            <p className="w-full max-w-[28rem] mx-auto text-slate-500 mb-8 leading-relaxed">
              Bạn chưa lưu sản phẩm nào. Hãy khám phá cửa hàng và thả tim cho những sản phẩm bạn yêu thích nhé!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-full shadow-md hover:brightness-110 active:scale-95 transition-all shadow-primary/20"
            >
              <ShoppingBag size={18} />
              Khám phá sản phẩm ngay
            </Link>
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

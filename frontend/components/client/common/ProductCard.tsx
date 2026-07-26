"use client";

import { Product } from "@/types";
import { Heart, Star, ShoppingCart, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import React, { useState } from "react";
import QuickAddModal from "@/components/client/products/QuickAddModal";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  
  const isLiked = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <>
    <div 
      onClick={() => router.push(product.isBundle ? `/bundles/${product.slug || product.id}` : `/products/${product.slug || product.id}`)} 
      className="h-full flex flex-col"
    >
      <div className={`bg-white rounded-[10px] shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group flex flex-col flex-grow h-full justify-between ${product.limitExceeded || !product.inStock ? "opacity-60 grayscale-[50%]" : ""}`}>
        {/* Product Image */}
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-slate-400 text-sm">No image</span>
            </div>
          )}

          {/* Bestseller Badge */}
          {product.rating && product.rating >= 4.4 && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm z-10">
              Bán chạy
            </div>
          )}

          {/* Discount Badge */}
          {(() => {
            const hasVariants = product.variantCount !== undefined && product.variantCount > 0;
            let percent = 0;
            if (hasVariants && product.minPrice && product.minEffectivePrice && product.minEffectivePrice < product.minPrice) {
              percent = Math.ceil(((product.minPrice - product.minEffectivePrice) / product.minPrice) * 100);
            } else if (hasVariants && product.maxPrice && product.maxEffectivePrice && product.maxEffectivePrice < product.maxPrice) {
              percent = Math.ceil(((product.maxPrice - product.maxEffectivePrice) / product.maxPrice) * 100);
            } else if (!hasVariants && product.discountPrice && product.discountPrice < product.price) {
              percent = Math.ceil(((product.price - product.discountPrice) / product.price) * 100);
            }
            
            if (percent <= 0 && product.discountPercent && product.discountPercent > 0) {
              percent = Math.ceil(product.discountPercent);
            }
            
            if (percent <= 0) return null;

            return (
              <div className={`absolute ${product.rating && product.rating >= 4.4 ? 'top-8 sm:top-12' : 'top-2 sm:top-3'} left-2 sm:left-3 bg-rose-600 text-white px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold shadow-sm z-10`}>
                -{percent}%
              </div>
            );
          })()}

          {/* Stock Status */}
          {(!product.inStock || product.limitExceeded) && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="text-white font-semibold text-lg text-center px-2">
                {!product.inStock ? "Hết hàng" : "Hết lượt mua"}
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/90 hover:bg-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-10 ${isLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'}`}
          >
            <Heart
              size={16}
              className={
                isLiked
                  ? "fill-rose-500 text-rose-500"
                  : "text-slate-600 hover:text-rose-500 transition-colors"
              }
            />
          </button>

          {/* Quick Add Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuickAdd(true);
            }}
            className="absolute top-12 sm:top-14 right-2 sm:right-3 bg-white/90 hover:bg-rose-500 hover:text-white text-slate-600 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-10 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 delay-75"
          >
            <ShoppingCart size={16} />
          </button>

          {/* Compare Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isCompared) {
                removeFromCompare(product.id);
              } else {
                addToCompare(product);
              }
            }}
            className={`absolute top-[88px] sm:top-[104px] right-2 sm:right-3 bg-white/90 hover:bg-rose-500 hover:text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-10 ${isCompared ? 'opacity-100 bg-primary/10' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'} delay-150`}
          >
            <Scale size={16} className={isCompared ? "text-primary" : "text-slate-600"} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col justify-between flex-grow min-h-[140px]">
          {/* Top Section */}
          <div className="space-y-1">
            {/* Category */}
            <div className="text-xs text-slate-500 uppercase tracking-wider h-4 overflow-hidden truncate">
              {product.categoryName || "\u00a0"}
            </div>

            {/* Product Name */}
            <h3
              title={product.name}
              className="font-semibold text-slate-900 text-[13px] sm:text-sm leading-snug group-hover:text-rose-600 transition-colors line-clamp-2 min-h-[36px] sm:min-h-[40px]"
            >
              {product.name}
            </h3>

            {/* Rating */}
            <div className="h-5 flex items-center">
              {product.rating !== undefined && product.ratingCount !== undefined ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < Math.round(product.rating!)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">({product.ratingCount})</span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400">Chưa có đánh giá</div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="space-y-1">
            {/* Price */}
            <div className="flex items-baseline gap-1 flex-wrap overflow-hidden whitespace-nowrap">
              {(() => {
                const hasVariants = product.variantCount !== undefined && product.variantCount > 0;
                const hasDiscount = hasVariants
                  ? (product.minEffectivePrice !== undefined && product.minPrice !== undefined && product.minEffectivePrice < product.minPrice)
                  : (product.discountPrice !== undefined && product.discountPrice < product.price);

                if (hasVariants) {
                  const minEff = product.minEffectivePrice ?? 0;
                  const maxEff = product.maxEffectivePrice ?? 0;
                  const minOrig = product.minPrice ?? 0;
                  const maxOrig = product.maxPrice ?? 0;

                  if (hasDiscount) {
                    const discountRangeText = minEff === maxEff
                      ? `${minEff.toLocaleString("vi-VN")} ₫`
                      : `Chỉ từ ${minEff.toLocaleString("vi-VN")} ₫`;

                    return (
                      <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-rose-600 whitespace-nowrap truncate" title={discountRangeText}>
                        {discountRangeText}
                      </span>
                    );
                  } else {
                    const priceRangeText = minOrig === maxOrig
                      ? `${minOrig.toLocaleString("vi-VN")} ₫`
                      : `Chỉ từ ${minOrig.toLocaleString("vi-VN")} ₫`;

                    return (
                      <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-900 whitespace-nowrap truncate" title={priceRangeText}>
                        {priceRangeText}
                      </span>
                    );
                  }
                } else {
                  // Fallback for simple products
                  if (hasDiscount && product.discountPrice) {
                    return (
                      <>
                        <span className="text-xs sm:text-sm md:text-base font-bold text-rose-600 whitespace-nowrap">
                          {product.discountPrice.toLocaleString("vi-VN")} ₫
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 line-through whitespace-nowrap">
                          {product.price.toLocaleString("vi-VN")} ₫
                        </span>
                      </>
                    );
                  } else {
                    return (
                      <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 whitespace-nowrap">
                        {product.price.toLocaleString("vi-VN")} ₫
                      </span>
                    );
                  }
                }
              })()}
            </div>

            {/* Stock Indicator */}
            <div className="h-4 flex items-center">
              {product.inStock && product.quantity !== undefined && product.quantity > 0 ? (
                <p className="text-[11px] text-green-600 font-medium">
                  Còn {product.quantity} sản phẩm
                </p>
              ) : (
                <p className="text-[11px] text-rose-500 font-medium">
                  {!product.inStock ? "Hết hàng" : "\u00a0"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    {showQuickAdd && (
      <QuickAddModal productId={product.id} onClose={() => setShowQuickAdd(false)} />
    )}
    </>
  );
}

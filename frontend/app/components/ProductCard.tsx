"use client";

import { Product } from "@/types";
import { Heart, Star } from "lucide-react";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group">
        {/* Product Image */}
        <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-slate-400 text-sm">No image</span>
            </div>
          )}

          {/* Discount Badge */}
          {product.discountPrice && product.discountPrice < product.price && (
            <div className="absolute top-3 right-3 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
            </div>
          )}

          {/* Stock Status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">Hết hàng</span>
            </div>
          )}

          {/* Wishlist Button */}
          <button className="absolute top-3 left-3 bg-white/90 hover:bg-white w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors shadow-sm">
            <Heart size={18} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col justify-between h-[180px]">
          {/* Top Section */}
          <div className="space-y-1">
            {/* Category */}
            <div className="text-xs text-slate-500 uppercase tracking-wider h-4 overflow-hidden truncate">
              {product.categoryName || "\u00a0"}
            </div>

            {/* Product Name */}
            <h3 className="font-semibold text-slate-900 text-sm leading-tight group-hover:text-rose-600 transition-colors line-clamp-2 h-10 overflow-hidden">
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
            <div className="flex items-center gap-2">
              {product.discountPrice && product.discountPrice < product.price ? (
                <>
                  <span className="text-base font-bold text-rose-600">
                    ₫{product.discountPrice.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    ₫{product.price.toLocaleString("vi-VN")}
                  </span>
                </>
              ) : (
                <span className="text-base font-bold text-slate-900">
                  ₫{product.price.toLocaleString("vi-VN")}
                </span>
              )}
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
    </Link>
  );
}

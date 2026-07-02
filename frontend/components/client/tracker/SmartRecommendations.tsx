"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  productID: number;
  productName: string;
  slug: string;
  price: number;
  images: any[];
  variants: any[];
}

interface Props {
  status: string;
  products: Product[];
}

export default function SmartRecommendations({ status, products }: Props) {
  if (products.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-rose-50/50 to-indigo-50/50 p-6 rounded-[16px] shadow-sm border border-rose-100/30">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full text-white shadow-md">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-slate-800">Gợi ý dành riêng cho bé</h3>
          <p className="text-[12px] text-slate-500 font-medium">
            Dựa trên tình trạng: <span className="font-bold text-rose-600">{status === 'Underweight' ? 'Cần bổ sung dinh dưỡng' : status === 'Overweight' ? 'Cần kiểm soát cân nặng' : 'Phát triển tốt'}</span>
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {products.map((product) => (
          <Link key={product.productID} href={`/products/${product.slug}`} className="bg-white rounded-[12px] p-3 shadow-sm hover:shadow-md transition-all border border-slate-100 hover:border-rose-200 group">
            <div className="aspect-square relative mb-2 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <Image 
                    src={product.images[0].imageUrl} 
                    alt={product.productName}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.variants && product.variants.length > 0 && product.variants[0].imageUrl ? (
                  <Image 
                    src={product.variants[0].imageUrl} 
                    alt={product.productName}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                  </div>
                )}
            </div>
            <h4 className="text-[12px] font-bold text-slate-700 line-clamp-2 mt-2 group-hover:text-rose-600 transition-colors" title={product.productName}>
              {product.productName}
            </h4>
            <div className="mt-1.5 text-rose-600 font-bold text-[13px]">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

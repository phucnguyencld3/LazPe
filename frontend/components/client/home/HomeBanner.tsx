'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useBanners } from '@/hooks/useBanners';
import { BannerRenderer } from '@/components/shared/banner/BannerRenderer';

export default function HomeBanner() {
  const { banners, loading } = useBanners('home');
  const [currentBanner, setCurrentBanner] = useState(0);
  
  // Original fallback banners if DB is empty
  const bannerImages = [
    '/banner/banner1.png.png',
    '/banner/banner2.png.png',
    '/banner/banner3.png.png',
    '/banner/banner4.png.png',
    '/banner/banner5.png.png',
  ];

  useEffect(() => {
    if (banners && banners.length > 0) return; // Không cần tự xoay vòng nếu xài BannerRenderer (tuỳ vào Template)
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  if (loading) {
    return <div className="rounded-[10px] w-full h-[180px] sm:h-[250px] md:h-[350px] bg-slate-200 animate-pulse flex items-center justify-center">Đang tải banner...</div>;
  }

  // Nếu có banner cấu hình từ Admin thì render BannerRenderer
  if (banners && banners.length > 0) {
    return (
      <div className="relative w-full">
        {banners.map(b => <BannerRenderer key={b.id || 'preview'} banner={b} />)}
      </div>
    );
  }

  return (
    <div className="rounded-[10px] w-full h-[180px] sm:h-[250px] md:h-[350px] relative overflow-hidden shadow-sm flex items-center justify-center group bg-slate-100">
      {bannerImages.map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
        >
          <img
            src={src}
            alt={`Banner LazPe ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hiển thị nội dung giữ chỗ nếu chưa có ảnh
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center bg-blue-100 text-blue-800">
                  <span class="font-bold text-2xl">Banner ${index + 1}</span>
                  <span class="text-sm">Hãy chèn ảnh vào public/images/banner${index + 1}.png</span>
                </div>
              `;
            }}
          />
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
        {bannerImages.map((_, index) => (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); setCurrentBanner(index); }}
            className={`h-2.5 rounded-full transition-all ${index === currentBanner ? 'bg-white w-6 opacity-100' : 'bg-white/50 hover:bg-white/80 w-2.5'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); setCurrentBanner(prev => (prev - 1 + bannerImages.length) % bannerImages.length); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setCurrentBanner(prev => (prev + 1) % bannerImages.length); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}

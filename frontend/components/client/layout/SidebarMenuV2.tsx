'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCategories } from '@/lib/api';
import { Category } from '@/types';
import { useBanners } from '@/hooks/useBanners';
import { BannerRenderer } from '@/components/shared/banner/BannerRenderer';

export default function SidebarMenuV2() {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { banners, loading: bannersLoading } = useBanners('left');

  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        if (isMounted && data) {
          setAllCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCats();
    return () => { isMounted = false; };
  }, []);

  const parentCats = allCategories.filter(c => c.parentId === null || c.level === 0).slice(0, 12);
  const displayCats = parentCats.length > 0 ? parentCats : [
    { id: 1, name: 'Sữa bột cao cấp' },
    { id: 2, name: 'Bỉm Tã khuyến mãi' },
    { id: 3, name: 'Sữa nước' },
    { id: 4, name: 'Ăn dặm, dinh dưỡng' },
    { id: 5, name: 'Vitamin & sức khỏe' },
  ];

  const subCats = activeMenu ? allCategories.filter(c => c.parentId === activeMenu) : [];

  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-4 relative">
      <div 
        className="relative"
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-sm text-slate-500">Đang tải danh mục...</div>
        ) : (
          <ul className="py-2">
            {displayCats.map((cat: any) => {
              const hasSub = allCategories.some(c => c.parentId === cat.id);
              return (
              <li 
                key={cat.id}
                className="relative"
                onMouseEnter={() => setActiveMenu(cat.id)}
              >
                <Link 
                  href={`/products?category=${cat.id}`} 
                  className={`flex items-center justify-between px-4 py-1.5 text-[13px] font-bold transition-all
                    ${activeMenu === cat.id ? 'bg-gradient-to-r from-rose-50 to-white text-rose-600 border-l-[3px] border-rose-500' : 'text-slate-700 hover:bg-slate-50 hover:text-rose-600 border-l-[3px] border-transparent'}
                  `}
                >
                  <span className="line-clamp-1">{cat.name}</span>
                  {hasSub && <ChevronRight size={16} className={`transition-transform ${activeMenu === cat.id ? 'text-rose-500 translate-x-1' : 'text-slate-300'}`} />}
                </Link>
              </li>
              );
            })}
          </ul>
        )}
        </div>

        {/* Mega Menu Overlay */}
        {activeMenu && !loading && subCats.length > 0 && (
          <div className="absolute top-0 left-[calc(100%-4px)] w-[800px] min-h-[450px] bg-white rounded-r-[12px] rounded-b-[12px] shadow-[10px_0_30px_rgba(0,0,0,0.08)] border border-slate-100 z-50 p-8 flex flex-col animate-[fadeIn_0.2s_ease-out]">
            <div className="border-b border-rose-100 pb-4 mb-6 flex justify-between items-end">
              <h3 className="font-black text-2xl text-slate-800 flex items-center gap-2.5 tracking-tight">
                <span className="w-1.5 h-6 bg-gradient-to-b from-rose-400 to-rose-600 rounded-full"></span>
                {displayCats.find(c => c.id === activeMenu)?.name}
              </h3>
              <Link href={`/products?category=${activeMenu}`} className="text-rose-600 text-[13px] font-bold flex items-center hover:text-rose-700 transition-colors bg-rose-50 hover:bg-rose-100 px-3.5 py-1.5 rounded-full">
                Xem tất cả <ChevronRight size={14} className="ml-0.5" />
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-x-10 gap-y-8 mb-8 flex-grow content-start">
              {subCats.map(level2 => {
                const level3Cats = allCategories.filter(c => c.parentId === level2.id);
                return (
                  <div key={level2.id} className="group">
                    <Link href={`/products?category=${level2.id}`} className="flex items-center justify-between mb-3 border-b border-transparent group-hover:border-rose-100 pb-1 transition-all">
                      <h4 className="font-extrabold text-[14px] text-slate-800 group-hover:text-rose-600 transition-colors">
                        {level2.name}
                      </h4>
                      <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                    {level3Cats.length > 0 && (
                      <ul className="space-y-1">
                        {level3Cats.map(level3 => (
                          <li key={level3.id}>
                            <Link 
                              href={`/products?category=${level3.id}`} 
                              className="text-[13px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 -mx-2.5 rounded-[6px] transition-colors block"
                            >
                              {level3.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Vertical Promo Banner */}
      {banners && banners.length > 0 ? (
        <div className="relative w-full">
          {banners.map(b => <BannerRenderer key={b.id || 'preview'} banner={b} />)}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-pink-100 to-orange-50 rounded-[10px] shadow-sm p-4 text-center cursor-pointer hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-primary mb-1 uppercase">Dành riêng hội viên</p>
          <h4 className="text-lg font-black text-slate-800 leading-tight mb-2">Nhận quà thả ga</h4>
          <p className="text-[10px] text-slate-500 mb-2">Tích lũy chi tiêu 3.000.000đ</p>
          <button className="bg-primary text-white text-xs font-bold py-1.5 px-4 rounded-full w-full hover:bg-primary/90 transition-colors">
            Đổi Ngay
          </button>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCategories } from '@/lib/api';
import { Category } from '@/types';

export default function SidebarMenuV2() {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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

  const parentCats = allCategories.filter(c => c.parentId === null || c.level === 0 || c.level === 1).slice(0, 12);
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
                  className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors
                    ${activeMenu === cat.id ? 'bg-primary/5 text-primary' : 'text-slate-700 hover:bg-slate-50 hover:text-primary'}
                  `}
                >
                  <span className="line-clamp-1">{cat.name}</span>
                  {hasSub && <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
                </Link>
              </li>
              );
            })}
          </ul>
        )}
        </div>

        {/* Mega Menu Overlay */}
        {activeMenu && !loading && subCats.length > 0 && (
          <div className="absolute top-0 left-full w-[700px] min-h-full bg-white rounded-[10px] shadow-lg border border-slate-100 z-40 p-8 flex flex-col">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h3 className="font-extrabold text-2xl text-slate-800">
                {displayCats.find(c => c.id === activeMenu)?.name}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-8 flex-grow">
              {subCats.map(level2 => {
                const level3Cats = allCategories.filter(c => c.parentId === level2.id);
                return (
                  <div key={level2.id}>
                    <Link href={`/products?category=${level2.id}`}>
                      <h4 className="font-bold text-[15px] mb-4 text-slate-800 hover:text-primary transition-colors">
                        {level2.name}
                      </h4>
                    </Link>
                    {level3Cats.length > 0 && (
                      <ul className="space-y-3 text-[14px] text-slate-600">
                        {level3Cats.map(level3 => (
                          <li key={level3.id}>
                            <Link href={`/products?category=${level3.id}`} className="hover:text-primary transition-colors block">
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
            
            <div className="border-t border-slate-100 pt-5 mt-auto">
              <Link href={`/products?category=${activeMenu}`} className="text-primary text-[15px] font-semibold flex items-center hover:underline w-fit">
                Xem tất cả <ChevronRight size={18} className="ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Vertical Promo Banner */}
      <div className="bg-gradient-to-br from-pink-100 to-orange-50 rounded-[10px] shadow-sm p-4 text-center cursor-pointer hover:shadow-md transition-shadow">
        <p className="text-xs font-bold text-primary mb-1 uppercase">Dành riêng hội viên</p>
        <h4 className="text-lg font-black text-slate-800 leading-tight mb-2">Nhận quà thả ga</h4>
        <p className="text-[10px] text-slate-500 mb-2">Tích lũy chi tiêu 3.000.000đ</p>
        <button className="bg-primary text-white text-xs font-bold py-1.5 px-4 rounded-full w-full hover:bg-primary/90 transition-colors">
          Đổi Ngay
        </button>
      </div>

    </div>
  );
}

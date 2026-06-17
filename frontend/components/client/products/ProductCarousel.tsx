'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/client/common/ProductCard';
import { Product } from '@/types';

interface ProductCarouselProps {
  products: Product[];
  itemsPerView?: number; // fallback, usually handled by css
  showRank?: boolean; // For "Top 10 Bán Chạy Nhất"
}

export default function ProductCarousel({ products, showRank = false }: ProductCarouselProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  // Drag to scroll states
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftBtn(scrollLeft > 0);
    // Tolerance of 1px for rounding issues
    setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    handleScroll(); // Initial check
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [products]);

  const slide = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    
    // Width of one card including gap (assuming ~200px per card on average)
    // To scroll exactly 3 cards, we find the first child's width + gap
    const firstChild = container.firstElementChild as HTMLElement;
    if (!firstChild) return;
    
    // gap is usually 16px (gap-4)
    const cardWidth = firstChild.offsetWidth + 16; 
    const scrollAmount = cardWidth * 3; // Scroll 3 cards at a time

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Drag functionality
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2; // Scroll-fast multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="relative group">
      {/* Left Button */}
      {showLeftBtn && (
        <button 
          onClick={() => slide('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-20 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:text-primary hover:scale-110 transition-all border border-slate-100 hidden md:flex"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Scroll Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className="flex overflow-x-auto gap-4 scrollbar-hide pb-4 pt-2 -mx-2 px-2 snap-x snap-mandatory select-none"
        style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
      >
        {products.map((p, index) => (
          <div 
            key={p.id} 
            className="w-[160px] min-w-[160px] sm:w-[180px] sm:min-w-[180px] lg:w-[calc(20%-12.8px)] lg:min-w-[calc(20%-12.8px)] snap-start relative flex-shrink-0"
          >
            {showRank && (
              <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center border-2 border-white shadow-sm z-10 text-sm">
                {index + 1}
              </span>
            )}
            <div className="pointer-events-none h-full">
               <ProductCard product={p} />
            </div>
            {/* Overlay to catch clicks during drag vs click */}
            <div 
              className="absolute inset-0 z-20 cursor-pointer" 
              onClick={(e) => {
                if (isDragging) {
                  e.preventDefault();
                  e.stopPropagation();
                } else {
                  // Navigate manually if not dragging
                  router.push(`/products/${p.id}`);
                }
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* Right Button */}
      {showRightBtn && (
        <button 
          onClick={() => slide('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-20 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:text-primary hover:scale-110 transition-all border border-slate-100 hidden md:flex"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}

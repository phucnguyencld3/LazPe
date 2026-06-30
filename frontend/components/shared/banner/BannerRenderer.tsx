'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Banner, BannerItem } from '@/types/banner';

interface BannerRendererProps {
  banner: Banner;
}

export function BannerRenderer({ banner }: BannerRendererProps) {
  const { type, id } = banner;
  const layoutConfig = banner.layoutConfig || { items: [] };
  const { containerStyle, animation, responsive } = layoutConfig;
  const isPreview = (banner as any).isPreview === true;
  const isDimmed = (banner as any).isDimmed === true;
  const rendererRef = React.useRef<HTMLDivElement>(null);
  
  let items = layoutConfig.items || [];

  if (items.length === 0) {
    if (!isPreview) return null;
    const count = type === 'grid' || type === 'double' ? 2 : type === 'multi_col' ? 3 : 1;
    items = Array(count).fill(null).map((_, i) => ({
      imageUrl: `https://placehold.co/800x400/f8fafc/94a3b8?text=Placeholder+${banner.position}+(${i+1})`,
      altText: 'Placeholder',
      order: i
    }));
  }

  useEffect(() => {
    if (isPreview && rendererRef.current) {
      setTimeout(() => {
        rendererRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isPreview, banner.position, type]);

  const PreviewWrapper = ({ children }: { children: React.ReactNode }) => {
    const handleSelectPosition = (e: React.MouseEvent) => {
      e.stopPropagation();
      window.parent.postMessage({ type: 'SELECT_BANNER_POSITION', position: banner.position }, '*');
    };

    if (isDimmed) {
      return (
        <div 
          className="opacity-40 grayscale-[20%] hover:opacity-80 transition-opacity duration-300 cursor-pointer relative group"
          onClick={handleSelectPosition}
        >
          <div className="absolute inset-0 bg-black/5 z-50 group-hover:bg-black/0 transition-colors rounded"></div>
          {children}
        </div>
      );
    }

    if (!isPreview) return <>{children}</>;
    
    // Banners with type floating should not be wrapped in the same way because they are absolute
    if (type === 'floating') return <>{children}</>;
    
    return (
      <div 
        ref={rendererRef} 
        className="outline outline-2 outline-primary outline-offset-2 rounded my-4 transition-all duration-300 cursor-pointer"
        onClick={handleSelectPosition}
      >
        <div className="absolute -top-7 left-0 bg-primary text-white text-xs px-3 py-1.5 rounded-t shadow z-50 font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">edit</span>
          Live Preview: {banner.position}
        </div>
        {children}
      </div>
    );
  };

  // Render wrapper style
  let wrapperStyle = `
    ${containerStyle || ''}
    ${animation || ''}
    ${responsive?.mobileContainerStyle ? `max-md:${responsive.mobileContainerStyle}` : ''}
    ${responsive?.desktopContainerStyle ? `md:${responsive.desktopContainerStyle}` : ''}
  `.trim();

  // Bypass visibility rules (e.g. max-md:hidden) for the banner currently being edited
  if (isPreview) {
    wrapperStyle = wrapperStyle.replace(/\b(max-md:)?hidden\b/g, '')
                               .replace(/\b(md:)?hidden\b/g, '')
                               .replace(/\bhidden\b/g, '');
  }

  // ----- Slideshow Template -----
  if (type === 'slideshow') {
    return (
      <PreviewWrapper>
        <BannerSlideshowRenderer banner={banner} wrapperStyle={wrapperStyle} isPreview={isPreview} items={items} />
      </PreviewWrapper>
    );
  }

  // ----- Single / Full Width / Stack Template -----
  if (type === 'sidebar' || type === 'single' || type === 'full_width' || type === 'stack') {
    return (
      <PreviewWrapper>
        <div className={`flex flex-col gap-4 ${wrapperStyle} ${type === 'full_width' ? 'w-full' : ''}`}>
          {items.map((item, idx) => (
            <BannerLink key={idx} item={item} isPreview={isPreview}>
              <img src={item.imageUrl} alt={item.altText || ''} className="w-full h-auto object-cover rounded" />
            </BannerLink>
          ))}
        </div>
      </PreviewWrapper>
    );
  }

  // ----- Grid / Double / Multi-col / Masonry Template -----
  if (type === 'grid' || type === 'double' || type === 'multi_col' || type === 'masonry') {
    const cols = type === 'double' ? 2 : type === 'multi_col' ? 3 : (layoutConfig.gridColumns || 2);
    const gap = layoutConfig.gridGap || 4;
    return (
      <PreviewWrapper>
        <div 
          className={`${wrapperStyle}`} 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: `${gap}px` 
          }}
        >
          {items.map((item, idx) => (
            <div key={idx} className="relative aspect-video">
              <BannerLink item={item} isPreview={isPreview}>
                <img src={item.imageUrl} alt={item.altText || ''} className="w-full h-full object-cover rounded" />
              </BannerLink>
            </div>
          ))}
        </div>
      </PreviewWrapper>
    );
  }

  // ----- Popup Template -----
  if (type === 'popup') {
    // Requires local state to handle open/close
    return <BannerPopupRenderer banner={banner} wrapperStyle={wrapperStyle} isPreview={isPreview} />;
  }

  // ----- Floating Promo Banner Template -----
  if (type === 'floating') {
    return <BannerFloatingRenderer banner={banner} wrapperStyle={wrapperStyle} isPreview={isPreview} />;
  }

  return null;
}

function BannerPopupRenderer({ banner, wrapperStyle, isPreview }: { banner: Banner, wrapperStyle: string, isPreview: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const layoutConfig = banner.layoutConfig || { items: [] };
  const items = layoutConfig.items || [];
  const item = items.length > 0 ? items[0] : null;

  useEffect(() => {
    // Luôn mở popup trong chế độ preview
    if (isPreview) {
      setIsOpen(true);
      return;
    }
    // Check session storage if closeable
    if (layoutConfig.showCloseButton !== false) {
      const closed = sessionStorage.getItem(`popup_closed_${banner.id}`);
      if (closed) return;
    }

    const delay = layoutConfig.popupDelay || 0;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [layoutConfig.popupDelay, banner, isPreview]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`relative bg-white rounded shadow-xl overflow-hidden max-w-md w-full ${wrapperStyle} ${isPreview ? 'ring-4 ring-blue-500 ring-offset-2' : ''}`}>
        {isPreview && (
          <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br z-50 shadow">
            Live Preview: Popup
          </div>
        )}
        {layoutConfig.showCloseButton !== false && (
          <button 
            onClick={() => {
              setIsOpen(false);
              sessionStorage.setItem(`popup_closed_${banner.id}`, 'true');
            }}
            className="absolute top-2 right-2 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center z-10 hover:bg-black/80"
          >
            &times;
          </button>
        )}
        <BannerLink item={item} isPreview={isPreview} onClick={() => setIsOpen(false)}>
          <img src={item.imageUrl} alt={item.altText || ''} className="w-full h-auto" />
        </BannerLink>
      </div>
    </div>
  );
}

export function BannerLink({ item, isPreview, onClick, children }: { item: BannerItem, isPreview: boolean, onClick?: () => void, children: React.ReactNode }) {
  const url = item.redirect?.enabled 
    ? item.redirect.resolved_url 
    : item.redirectUrl; // fallback backward compat
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick();
    if (isPreview && url) {
      e.preventDefault();
      // Simulate redirect in preview
      // alert(`Preview Redirect: ${url}`);
    }
  };

  if (isPreview) {
    return (
      <div onClick={handleClick} className="relative cursor-pointer group block w-full h-full">
        {children}
        {url && (
          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none z-40">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              ↗ Redirect: {url}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (url) {
    return (
      <Link href={url} onClick={handleClick} className="block w-full h-full">
        {children}
      </Link>
    );
  }

  return (
    <div onClick={handleClick} className="block w-full h-full">
      {children}
    </div>
  );
}

function BannerFloatingRenderer({ banner, wrapperStyle, isPreview }: { banner: Banner, wrapperStyle: string, isPreview: boolean }) {
  const [isOpen, setIsOpen] = useState(true);
  const [dragPos, setDragPos] = useState<{ x: number, y: number } | null>(null);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const dragRef = React.useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0, width: 0, height: 0 });

  const layoutConfig = banner.layoutConfig || { items: [] };
  const items = layoutConfig.items || [];
  const item = items.length > 0 ? items[0] : null;

  const fc = layoutConfig.floatingConfig || {};

  useEffect(() => {
    if (isPreview) {
      setIsOpen(true);
      return;
    }
    if (fc.closeable && fc.closeSession) {
      const closed = sessionStorage.getItem(`floating_closed_${banner.id}`);
      if (closed) setIsOpen(false);
    }
  }, [banner, isPreview, fc]);

  // Reset drag position if props change or window resizes
  useEffect(() => {
    setDragPos(null);
  }, [fc.offsetX, fc.offsetY, fc.anchor, fc.desktopPosition, fc.tabletPosition, fc.mobilePosition]);

  useEffect(() => {
    const handleResize = () => {
      setDragPos(null);
      const width = window.innerWidth;
      if (width <= 480) setDeviceMode('mobile');
      else if (width <= 1024) setDeviceMode('tablet');
      else setDeviceMode('desktop');
    };
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen || !item) return null;

  const getActivePosition = () => {
    let basePos;
    if (deviceMode === 'mobile' && fc.mobilePosition) {
      basePos = fc.mobilePosition;
    } else if (deviceMode === 'tablet' && fc.tabletPosition) {
      basePos = fc.tabletPosition;
    } else {
      // Backward compatibility fallback (Graceful Degradation)
      if (fc.anchor === 'custom' && !fc.desktopPosition) {
        return { isLegacy: true, offsetX: fc.offsetX, offsetY: fc.offsetY, anchor: 'custom' };
      }
      
      // Lấy desktopPosition làm cấu hình gốc (hoặc fallback mặc định)
      basePos = fc.desktopPosition || {
        anchor: fc.anchor ? fc.anchor : 'bottom-right',
        offsetX: fc.offsetX || 20,
        offsetY: fc.offsetY || 20
      };
    }
    
    if (basePos.anchor === 'custom') {
      let newOffsetX = basePos.offsetX;
      let newOffsetY = basePos.offsetY;
      
      // Logic for Anchor updates inside the renderer/form context can be handled here
      // Ensuring it stays as 'custom' and percentage based
      return { ...basePos, isLegacy: true, anchor: 'custom' };
    }

    // Nếu đang view ở Mobile/Tablet nhưng lại fallback dùng cấu hình Desktop, 
    // bắt buộc phải Clamp (giới hạn) pixel lại để không bị bắn ra khỏi màn hình.
    if (deviceMode !== 'desktop') {
      // Giả định viewport tối đa an toàn
      const safeWidth = deviceMode === 'mobile' ? 390 : 768;
      const safeHeight = deviceMode === 'mobile' ? 844 : 1024;
      
      // Chừa 100px để banner (thường rộng ~150px) không bị khuất hoàn toàn
      return {
        anchor: basePos.anchor,
        offsetX: Math.min(basePos.offsetX || 0, safeWidth - 100),
        offsetY: Math.min(basePos.offsetY || 0, safeHeight - 100)
      };
    }
    
    return basePos;
  };

  const activePos = getActivePosition();

  const style: React.CSSProperties = {
    ...(fc.zIndex ? { zIndex: fc.zIndex } : {}),
  };
  
  if (dragPos) {
    style.left = `${dragPos.x}px`;
    style.top = `${dragPos.y}px`;
    style.transform = 'translate(0px, 0px)';
  } else {
    const { anchor, offsetX = 0, offsetY = 0, isLegacy } = activePos as any;
    
    if (isLegacy || anchor === 'custom') {
      // Retain the exact percentage for old banners so they scale perfectly across all devices
      style.top = `${offsetY}%`;
      style.left = `${offsetX}%`;
    } else {
      // Use standard Anchor + Offset model with Mobile Safe Area awareness
      if (anchor.includes('top')) style.top = `calc(${offsetY}px + env(safe-area-inset-top, 0px))`;
      if (anchor.includes('bottom')) style.bottom = `calc(${offsetY}px + env(safe-area-inset-bottom, 0px))`;
      if (anchor.includes('left')) style.left = `calc(${offsetX}px + env(safe-area-inset-left, 0px))`;
      if (anchor.includes('right')) style.right = `calc(${offsetX}px + env(safe-area-inset-right, 0px))`;
      
      if (anchor === 'center') {
        style.top = '50%';
        style.left = '50%';
        style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
      }
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPreview) return;
    
    // Check if clicking close button
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') return;
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    
    const startLeft = dragPos ? dragPos.x : rect.left;
    const startTop = dragPos ? dragPos.y : rect.top;

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: startLeft,
      initialTop: startTop,
      width: rect.width,
      height: rect.height
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setDragPos({
        x: dragRef.current.initialLeft + dx,
        y: dragRef.current.initialTop + dy
      });
    };

    const handlePointerUp = (ev: PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      dragRef.current.isDragging = false;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      
      const finalX = Math.round(dragRef.current.initialLeft + dx);
      const finalY = Math.round(dragRef.current.initialTop + dy);
      
      setDragPos({ x: finalX, y: finalY });
      
      const rectWidth = dragRef.current.width || 200;
      const rectHeight = dragRef.current.height || 100;
      
      const W = window.innerWidth;
      const H = window.innerHeight;
      
      // Calculate distances to edges
      const distTop = finalY;
      const distBottom = H - (finalY + rectHeight);
      const distLeft = finalX;
      const distRight = W - (finalX + rectWidth);
      
      // Always use 'custom' (percentage based) when freely dragged by user
      const newAnchor = 'custom';
      let newOffsetX = (finalX / W) * 100;
      let newOffsetY = (finalY / H) * 100;
      // round to 2 decimals
      newOffsetX = Math.round(newOffsetX * 100) / 100;
      newOffsetY = Math.round(newOffsetY * 100) / 100;
      
      // Clamp to screen bounds
      newOffsetX = Math.max(0, Math.min(100, newOffsetX));
      newOffsetY = Math.max(0, Math.min(100, newOffsetY));
      
      const newPos = { anchor: newAnchor, offsetX: newOffsetX, offsetY: newOffsetY };
      
      window.parent.postMessage({ 
        type: 'UPDATE_FLOATING_DEVICE_OFFSET', 
        deviceMode,
        position: newPos
      }, '*');

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div 
        onPointerDown={isPreview ? handlePointerDown : undefined}
        className={`absolute ${isPreview ? 'ring-4 ring-rose-500 ring-offset-2 cursor-move' : ''} transition-all ${dragPos ? 'duration-0' : 'duration-300'} pointer-events-auto ${wrapperStyle}`}
        style={style}
      >
        {isPreview && (
          <div className="absolute -top-7 right-0 bg-rose-500 text-white text-xs px-2 py-1 rounded-t shadow z-50 whitespace-nowrap">
            Live Preview: Floating Promo (Drag to move)
          </div>
        )}
        
        {fc.closeable && (
          <button 
            onClick={() => {
              if (isPreview) return; // Do not close or store session in preview mode
              setIsOpen(false);
              if (fc.closeSession) {
                sessionStorage.setItem(`floating_closed_${banner.id}`, 'true');
              }
            }}
            className="absolute -top-3 -right-3 text-white bg-black/50 hover:bg-black/80 rounded-full w-6 h-6 flex items-center justify-center z-10 text-xs shadow-md"
          >
            &times;
          </button>
        )}

        <div className={`overflow-hidden rounded-lg ${fc.shadow ? fc.shadow : 'shadow-lg'} bg-transparent`}>
          <BannerLink item={item} isPreview={isPreview}>
            <img src={item.imageUrl} alt={item.altText || 'Floating Banner'} className="w-[35vw] max-w-[200px] min-w-[80px] h-auto" draggable={false} />
          </BannerLink>
        </div>
      </div>
    </div>
  );
}

function BannerSlideshowRenderer({ banner, wrapperStyle, isPreview, items }: { banner: Banner, wrapperStyle: string, isPreview: boolean, items: BannerItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000); // 5 seconds autoplay
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div className={`relative overflow-hidden group ${wrapperStyle}`}>
      {/* Slider Container */}
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, idx) => (
          <div key={idx} className="min-w-full shrink-0 relative aspect-[21/9]">
            <BannerLink item={item} isPreview={isPreview}>
              <img src={item.imageUrl} alt={item.altText || 'Banner Image'} className="w-full h-full object-cover" />
            </BannerLink>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % items.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
          >
            <span className="material-symbols-outlined text-2xl">chevron_right</span>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer shadow-sm ${
                  currentIndex === idx ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

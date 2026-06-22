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
        className="relative ring-4 ring-primary ring-offset-2 rounded my-4 z-40 transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-[1.01] cursor-pointer"
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
  const wrapperStyle = `
    ${containerStyle || ''}
    ${animation || ''}
    ${responsive?.mobileContainerStyle ? `max-md:${responsive.mobileContainerStyle}` : ''}
    ${responsive?.desktopContainerStyle ? `md:${responsive.desktopContainerStyle}` : ''}
  `.trim();

  // ----- Slideshow Template -----
  if (type === 'slideshow') {
    return (
      <PreviewWrapper>
        <div className={`relative overflow-hidden ${wrapperStyle}`}>
          <div className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide">
            {items.map((item, idx) => (
              <div key={idx} className="min-w-full shrink-0 snap-start relative aspect-[21/9]">
                <BannerLink item={item} isPreview={isPreview}>
                  <img src={item.imageUrl} alt={item.altText || 'Banner Image'} className="w-full h-full object-cover" />
                </BannerLink>
              </div>
            ))}
          </div>
        </div>
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
  const layoutConfig = banner.layoutConfig || { items: [] };
  const items = layoutConfig.items || [];
  const item = items.length > 0 ? items[0] : null;

  const fc = layoutConfig.floatingConfig || { anchor: 'bottom-right' };

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

  if (!isOpen || !item) return null;

  const anchorClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'custom': ''
  };

  const style: React.CSSProperties = {
    zIndex: fc.zIndex || 40,
    opacity: fc.shadow ? undefined : 1 // just a stub
  };

  if (fc.anchor === 'custom') {
    style.top = fc.offsetY !== undefined ? `${fc.offsetY}px` : 0;
    style.left = fc.offsetX !== undefined ? `${fc.offsetX}px` : 0;
  }

  return (
    <div 
      className={`absolute ${anchorClasses[fc.anchor] || ''} ${wrapperStyle} ${isPreview ? 'ring-4 ring-rose-500 ring-offset-2' : ''} transition-all duration-300 pointer-events-auto`}
      style={style}
    >
      {isPreview && (
        <div className="absolute -top-7 right-0 bg-rose-500 text-white text-xs px-2 py-1 rounded-t shadow z-50 whitespace-nowrap">
          Live Preview: Floating Promo
        </div>
      )}
      
      {fc.closeable && (
        <button 
          onClick={() => {
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
          <img src={item.imageUrl} alt={item.altText || 'Floating Banner'} className="w-full h-auto max-w-[200px]" />
        </BannerLink>
      </div>
    </div>
  );
}

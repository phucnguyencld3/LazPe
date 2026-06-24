'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Banner } from '@/types/banner';

interface BannerPreviewProps {
  formData: Partial<Banner>;
}

export function BannerPreview({ formData }: BannerPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Gửi dữ liệu qua iframe mỗi khi cấu hình thay đổi, có debounce 300ms để chống lag
  useEffect(() => {
    const handler = setTimeout(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'UPDATE_PREVIEW_BANNER',
            banner: formData
          },
          '*' // Cho phép chạy local
        );
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [formData]);

  // Lắng nghe yêu cầu từ iframe khi iframe đã sẵn sàng
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'REQUEST_PREVIEW_BANNER') {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: 'LIVE_PREVIEW_BANNER',
              banner: formData
            },
            '*'
          );
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [formData]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex-1 bg-white p-6 md:p-8 rounded-[8px] shadow-sm border border-slate-100 flex flex-col min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5 border-b border-slate-50 pb-3">
        <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">devices</span>
          Xem trước giao diện (Live Preview)
        </h2>
        
        {/* Device Toggle Buttons */}
        <div className="flex bg-white border border-slate-200 rounded-[8px] shadow-sm overflow-hidden self-start">
          <button 
            onClick={() => setPreviewMode('desktop')}
            className={`px-3.5 py-2 text-xs flex items-center gap-1 transition-all ${
              previewMode === 'desktop' 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-slate-600 hover:bg-slate-50 font-semibold'
            }`}
            title="Máy tính (Desktop)"
          >
            <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
            PC
          </button>
          <button 
            onClick={() => setPreviewMode('tablet')}
            className={`px-3.5 py-2 text-xs flex items-center gap-1 border-l border-slate-200 transition-all ${
              previewMode === 'tablet' 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-slate-600 hover:bg-slate-50 font-semibold'
            }`}
            title="Máy tính bảng (Tablet)"
          >
            <span className="material-symbols-outlined text-[16px]">tablet_mac</span>
            Tablet
          </button>
          <button 
            onClick={() => setPreviewMode('mobile')}
            className={`px-3.5 py-2 text-xs flex items-center gap-1 border-l border-slate-200 transition-all ${
              previewMode === 'mobile' 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-slate-600 hover:bg-slate-50 font-semibold'
            }`}
            title="Điện thoại (Mobile)"
          >
            <span className="material-symbols-outlined text-[16px]">smartphone</span>
            Mobile
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 border border-slate-200 rounded-[8px] shadow-inner overflow-hidden flex flex-col relative bg-slate-50 min-h-[600px] items-center justify-start py-8 px-4"
      >
        {(() => {
          const targetWidth = previewMode === 'desktop' ? 1440 : previewMode === 'tablet' ? 768 : 375;
          const availableWidth = containerWidth ? containerWidth - 32 : 1000;
          const scale = Math.min(1, availableWidth / targetWidth);

          return (
            <div 
              className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[8px] overflow-hidden relative"
              style={{ 
                width: `${targetWidth}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                height: `${100 / scale}%`,
                marginBottom: `-${(1 - scale) * 100}%`
              }}
            >
              <iframe 
                ref={iframeRef}
                src={(() => {
                  switch (formData.page) {
                    case 'products': return '/products';
                    case 'product_detail': return '/products/1';
                    case 'cart': return '/cart';
                    case 'checkout': return '/checkout';
                    case 'profile': return '/profile';
                    case 'combo': return '/bundles';
                    default: return '/';
                  }
                })()}
                className="w-full h-full border-none"
                title="Client Live Preview"
                onLoad={() => {
                  if (iframeRef.current && iframeRef.current.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(
                      {
                        type: 'LIVE_PREVIEW_BANNER',
                        banner: formData
                      },
                      '*'
                    );
                  }
                }}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}

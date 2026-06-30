'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Banner } from '@/types/banner';

interface BannerPreviewProps {
  formData: Partial<Banner>;
  previewMode: 'desktop' | 'laptop' | 'tablet' | 'mobile';
  setPreviewMode: (mode: 'desktop' | 'laptop' | 'tablet' | 'mobile') => void;
}

export function BannerPreview({ formData, previewMode, setPreviewMode }: BannerPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

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
      setContainerHeight(entries[0].contentRect.height);
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
            title="Desktop (1920x1080)"
          >
            <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
            PC
          </button>
          <button 
            onClick={() => setPreviewMode('laptop')}
            className={`px-3.5 py-2 text-xs flex items-center gap-1 border-l border-slate-200 transition-all ${
              previewMode === 'laptop' 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-slate-600 hover:bg-slate-50 font-semibold'
            }`}
            title="Laptop (1366x768)"
          >
            <span className="material-symbols-outlined text-[16px]">laptop_mac</span>
            Laptop
          </button>
          <button 
            onClick={() => setPreviewMode('tablet')}
            className={`px-3.5 py-2 text-xs flex items-center gap-1 border-l border-slate-200 transition-all ${
              previewMode === 'tablet' 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-slate-600 hover:bg-slate-50 font-semibold'
            }`}
            title="Tablet (768x1024)"
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
            title="Mobile (390x844)"
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
          const targetWidth = previewMode === 'desktop' ? 1920 : previewMode === 'laptop' ? 1366 : previewMode === 'tablet' ? 768 : 390;
          const targetHeight = previewMode === 'desktop' ? 1080 : previewMode === 'laptop' ? 768 : previewMode === 'tablet' ? 1024 : 844;
          
          // Calculate scale to fit both width and height within the container
          const availableWidth = containerWidth ? containerWidth - 32 : 1000;
          const availableHeight = containerHeight ? containerHeight - 64 : 600; // Account for padding
          
          const scaleW = availableWidth / targetWidth;
          const scaleH = availableHeight / targetHeight;
          const scale = Math.min(1, scaleW, scaleH);

          return (
            <div 
              style={{ 
                width: `${targetWidth * scale}px`, 
                height: `${targetHeight * scale}px`,
                position: 'relative'
              }}
              className="transition-all duration-300"
            >
              <div 
                className="bg-white shadow-md absolute top-0 left-0 overflow-hidden transition-all duration-300 origin-top-left"
                style={{ 
                  width: `${targetWidth}px`,
                  height: `${targetHeight}px`,
                  transform: `scale(${scale})`
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
            </div>
          );
        })()}
      </div>
    </div>
  );
}

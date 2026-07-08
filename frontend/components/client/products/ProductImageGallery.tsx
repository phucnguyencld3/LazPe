import React, { useState, useEffect, useRef } from "react";
import { Heart, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ProductImageGalleryProps {
  displayImage: string | undefined;
  productName: string;
  hasDiscount: boolean;
  displayPrice: number;
  displayDiscountPrice: number | undefined;
  imageUrls?: string[];
  isWishlisted?: boolean;
  setIsWishlisted?: (wishlisted: boolean) => void;
  compareAction?: React.ReactNode;
  alertAction?: React.ReactNode;
  subscriptionAction?: React.ReactNode;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  displayImage,
  productName,
  hasDiscount,
  displayPrice,
  displayDiscountPrice,
  imageUrls = [],
  isWishlisted = false,
  setIsWishlisted,
  compareAction,
  alertAction,
  subscriptionAction,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(displayImage);

  // Sync selected image if the displayImage prop changes (e.g. from variant selection)
  useEffect(() => {
    setSelectedImage(displayImage);
  }, [displayImage]);

  const currentImage = selectedImage || displayImage || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Sync modal image index when opened
  useEffect(() => {
    if (isModalOpen && currentImage && imageUrls) {
      const idx = imageUrls.indexOf(currentImage);
      if (idx !== -1) setModalImageIndex(idx);
    }
  }, [isModalOpen, currentImage, imageUrls]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0));
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailContainerRef.current) {
      const scrollAmount = thumbnailContainerRef.current.clientWidth * 0.8;
      thumbnailContainerRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: "smooth" 
      });
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className="relative aspect-square w-full rounded-[12px] bg-white overflow-hidden border border-slate-100 p-2 cursor-pointer group"
        onDoubleClick={() => setIsModalOpen(true)}
      >
        {currentImage ? (
          <>
            <img
              src={currentImage}
              alt={productName}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
            {/* Zoom Button & Hint */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
              className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white px-2.5 py-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 z-10"
              title="Phóng to ảnh"
            >
              <ZoomIn size={14} />
              <span className="text-[11px] font-medium whitespace-nowrap">
                Nhấn đúp hoặc click để phóng to
              </span>
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-slate-400 text-sm">Không có hình ảnh</span>
          </div>
        )}

        {hasDiscount && displayDiscountPrice !== undefined && (
          <div className="absolute top-4 left-4 bg-rose-500 text-white px-3 py-1 rounded-[4px] text-xs font-semibold shadow-sm z-10">
            Khuyến mãi -{Math.round(((displayPrice - displayDiscountPrice) / displayPrice) * 100)}%
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {imageUrls && imageUrls.length > 0 && (
        <div className="relative group/slider">
          <div 
            ref={thumbnailContainerRef}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory"
          >
            {imageUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(url)}
                style={{ width: "calc((100% - 2.5rem) / 6)" }}
                className={`aspect-square rounded-[8px] overflow-hidden border-2 shrink-0 transition-all bg-white snap-start ${
                  currentImage === url
                    ? "border-primary shadow-sm"
                    : "border-transparent hover:border-primary/50"
                }`}
              >
                <img src={url} className="w-full h-full object-cover" alt={`${productName} thumbnail ${idx + 1}`} />
              </button>
            ))}
          </div>

          {imageUrls.length > 6 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); scrollThumbnails('left'); }}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-primary hover:border-primary/30 opacity-0 group-hover/slider:opacity-100 transition-all z-10"
                title="Cuộn trái"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); scrollThumbnails('right'); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-primary hover:border-primary/30 opacity-0 group-hover/slider:opacity-100 transition-all z-10"
                title="Cuộn phải"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Action Buttons (Wishlist & Share) */}
      <div className="flex justify-start items-center gap-2 sm:gap-3 mt-4 w-full overflow-x-auto pb-1 hide-scrollbar">
        {/* Wishlist Toggle Button */}
        <button
          onClick={() => setIsWishlisted && setIsWishlisted(!isWishlisted)}
          className={`group flex items-center h-10 px-2.5 rounded-[8px] border transition-all duration-300 ease-out shrink-0 active:scale-90 ${
            isWishlisted
              ? "bg-rose-50 border-rose-200 text-rose-500"
              : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
          }`}
        >
          <Heart size={20} className={`shrink-0 transition-all ${isWishlisted ? "fill-rose-500" : ""}`} />
          <div className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out">
            <div className="overflow-hidden">
              <span className="whitespace-nowrap text-sm font-semibold pl-2 block opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                {isWishlisted ? "Bỏ yêu thích" : "Yêu thích"}
              </span>
            </div>
          </div>
        </button>

        {/* Compare Button */}
        {compareAction}

        {/* Alert Button */}
        {alertAction}

        {/* Share Button */}
        <button
          onClick={() => {
            const url = window.location.href;
            if (navigator.share) {
              navigator.share({
                title: productName,
                url: url,
              }).catch(console.error);
            } else {
              navigator.clipboard.writeText(url);
              const { toast } = require("@/lib/toast");
              toast.success("Đã sao chép đường dẫn sản phẩm!");
            }
          }}
          className="group flex items-center h-10 px-2.5 rounded-[8px] border bg-white border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 ease-out shrink-0 active:scale-90 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0 transition-all">share</span>
          <div className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out">
            <div className="overflow-hidden">
              <span className="whitespace-nowrap text-sm font-semibold pl-2 block opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                Chia sẻ
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Image Modal Gallery */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 lg:p-12 animate-in fade-in duration-200">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            {/* Left side: Main Image Area */}
            <div className="flex-1 bg-slate-50/50 relative flex items-center justify-center min-h-[400px] md:min-h-[600px] p-8 border-b md:border-b-0 md:border-r border-slate-100 group/modal">
              {imageUrls.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevImage} 
                    className="absolute left-4 z-10 p-3 bg-white/80 hover:bg-white text-slate-600 shadow-md hover:shadow-lg rounded-full backdrop-blur-sm opacity-0 group-hover/modal:opacity-100 transition-all -translate-x-4 group-hover/modal:translate-x-0"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={handleNextImage} 
                    className="absolute right-4 z-10 p-3 bg-white/80 hover:bg-white text-slate-600 shadow-md hover:shadow-lg rounded-full backdrop-blur-sm opacity-0 group-hover/modal:opacity-100 transition-all translate-x-4 group-hover/modal:translate-x-0"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              
              <img 
                src={imageUrls[modalImageIndex] || currentImage} 
                className="max-w-full max-h-[70vh] object-contain transition-opacity duration-300"
                alt={`${productName} zoomed`}
              />
            </div>

            {/* Right side: Thumbnails */}
            <div className="w-full md:w-[380px] p-6 flex flex-col bg-white overflow-y-auto custom-scrollbar">
              <h3 className="font-semibold text-[17px] text-slate-800 leading-snug mb-6 pr-8">
                {productName}
              </h3>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-3 pb-8">
                {imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setModalImageIndex(idx)}
                    className={`aspect-square rounded-[8px] overflow-hidden border-2 shrink-0 transition-all bg-white relative ${
                      modalImageIndex === idx
                        ? "border-primary shadow-sm ring-2 ring-primary/20 ring-offset-1"
                        : "border-slate-100 hover:border-primary/50"
                    }`}
                  >
                    <img 
                      src={url} 
                      className="w-full h-full object-cover" 
                      alt={`Thumbnail ${idx + 1}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

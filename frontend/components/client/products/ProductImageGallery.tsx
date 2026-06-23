import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";

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
}) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(displayImage);

  // Sync selected image if the displayImage prop changes (e.g. from variant selection)
  useEffect(() => {
    setSelectedImage(displayImage);
  }, [displayImage]);

  const currentImage = selectedImage || displayImage || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-[12px] bg-white overflow-hidden border border-slate-100 p-2">
        {currentImage ? (
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
          />
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
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {imageUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(url)}
              className={`w-16 h-16 rounded-[8px] overflow-hidden border-2 shrink-0 transition-all bg-white ${
                currentImage === url
                  ? "border-primary shadow-sm"
                  : "border-transparent hover:border-primary/50"
              }`}
            >
              <img src={url} className="w-full h-full object-cover" alt={`${productName} thumbnail ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons (Wishlist & Share) */}
      <div className="flex justify-start items-center gap-4 mt-4">
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
    </div>
  );
};

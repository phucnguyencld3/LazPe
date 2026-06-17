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
}) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(displayImage);

  // Sync selected image if the displayImage prop changes (e.g. from variant selection)
  useEffect(() => {
    setSelectedImage(displayImage);
  }, [displayImage]);

  const currentImage = selectedImage || displayImage || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
        {currentImage ? (
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-slate-400 text-sm">Không có hình ảnh</span>
          </div>
        )}

        {hasDiscount && displayDiscountPrice !== undefined && (
          <div className="absolute top-4 left-4 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm z-10">
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
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
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
          className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all shrink-0 active:scale-90 ${
            isWishlisted
              ? "bg-rose-50 border-rose-200 text-rose-500"
              : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm"
          }`}
          title="Thêm vào yêu thích"
        >
          <Heart size={20} className={isWishlisted ? "fill-rose-500" : ""} />
        </button>

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
          className="h-10 w-10 rounded-full flex items-center justify-center border bg-white border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shrink-0 active:scale-90 shadow-sm"
          title="Chia sẻ sản phẩm"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
        </button>
      </div>
    </div>
  );
};

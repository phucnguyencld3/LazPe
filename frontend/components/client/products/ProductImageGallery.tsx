import React from "react";

interface ProductImageGalleryProps {
  displayImage: string | undefined;
  productName: string;
  hasDiscount: boolean;
  displayPrice: number;
  displayDiscountPrice: number | undefined;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  displayImage,
  productName,
  hasDiscount,
  displayPrice,
  displayDiscountPrice,
}) => {
  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
        {displayImage ? (
          <img
            src={displayImage}
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
    </div>
  );
};

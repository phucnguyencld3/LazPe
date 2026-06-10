import React, { useMemo } from "react";
import { Star, Minus, Plus, ShoppingCart, Heart } from "lucide-react";
import { Product, Variant } from "@/types";
import CountdownTimer from "@/components/client/common/CountdownTimer";

interface ProductDetailInfoProps {
  product: Product;
  displayInStock: boolean;
  displayStock: number;
  displaySku: string;
  displayPrice: number;
  displayDiscountPrice: number | undefined;
  hasDiscount: boolean;
  selectedOptions: Record<string, string>;
  handleOptionSelect: (optionName: string, value: string) => void;
  isOptionValueOutOfStock: (optionName: string, value: string) => boolean;
  quantity: number;
  handleDecreaseQuantity: () => void;
  handleIncreaseQuantity: () => void;
  handleAddToCart: () => void;
  isWishlisted: boolean;
  setIsWishlisted: (wishlisted: boolean) => void;
  activeVariant?: Variant | null;
  activeFlashSaleItem?: any;
  flashSaleEndTime?: string;
  flashSaleStatus?: number;
}

export const ProductDetailInfo: React.FC<ProductDetailInfoProps> = ({
  product,
  displayInStock,
  displayStock,
  displaySku,
  displayPrice,
  displayDiscountPrice,
  hasDiscount,
  selectedOptions,
  handleOptionSelect,
  isOptionValueOutOfStock,
  quantity,
  handleDecreaseQuantity,
  handleIncreaseQuantity,
  handleAddToCart,
  isWishlisted,
  setIsWishlisted,
  activeVariant = null,
  activeFlashSaleItem = null,
  flashSaleEndTime = "",
  flashSaleStatus = 0,
}) => {
  const maxAllowedQuantity = useMemo(() => {
    let limit = displayStock;
    if (activeFlashSaleItem) {
      const remainingSaleQty = activeFlashSaleItem.totalQuantity - activeFlashSaleItem.soldQuantity;
      limit = Math.min(limit, remainingSaleQty);
      if (activeFlashSaleItem.maxQuantityPerUser > 0) {
        limit = Math.min(limit, activeFlashSaleItem.maxQuantityPerUser);
      }
    }
    return Math.max(0, limit);
  }, [displayStock, activeFlashSaleItem]);

  return (
    <div className="flex flex-col justify-between">
      <div>
        {/* Category & Stock Status */}
        <div className="flex justify-between items-center gap-4 mb-4">
          <span className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {product.categoryName || "Đồ chơi cao cấp"}
          </span>
          {displayInStock ? (
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Còn hàng ({displayStock} sản phẩm)
            </span>
          ) : (
            <span className="text-xs text-rose-500 font-semibold">Tạm hết hàng</span>
          )}
        </div>

        {/* Name */}
        <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          {product.name}
        </h1>
        
        {/* SKU Code */}
        <div className="text-xs text-slate-400 font-semibold mb-4">
          SKU: <span className="text-slate-600">{displaySku}</span>
        </div>

        {/* Star Ratings */}
        <div className="flex items-center gap-4 mb-6">
          {product.rating !== undefined && product.rating !== null && product.rating > 0 ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.round(product.rating!) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-600 font-bold">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              {product.ratingCount !== undefined && product.ratingCount !== null && (
                <span className="text-sm text-slate-400 border-l border-slate-200 pl-4">
                  {product.ratingCount} Đánh giá
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Chưa có đánh giá</span>
          )}
        </div>

        {/* Price Display / Flash Sale Widget */}
        {activeFlashSaleItem && flashSaleEndTime ? (
          <div className="rounded-2xl border border-rose-200 overflow-hidden mb-6 shadow-sm shadow-rose-500/5">
            {/* Flash Sale Header */}
            <div className="bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-1.5 font-black uppercase text-xs sm:text-sm tracking-wider">
                <span className="material-symbols-outlined text-yellow-300 animate-bounce">bolt</span>
                <span>FLASH SALE ĐANG DIỄN RA</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-rose-100">Kết thúc sau:</span>
                <CountdownTimer endTime={flashSaleEndTime} variant="light" size="sm" />
              </div>
            </div>

            {/* Flash Sale Price Detail */}
            <div className="bg-rose-50/20 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black text-rose-600">
                  ₫{activeFlashSaleItem.discountPrice.toLocaleString("vi-VN")}
                </span>
                <span className="text-sm text-slate-400 line-through font-semibold">
                  ₫{activeFlashSaleItem.originalPrice.toLocaleString("vi-VN")}
                </span>
                <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                  Tiết kiệm {Math.round(((activeFlashSaleItem.originalPrice - activeFlashSaleItem.discountPrice) / activeFlashSaleItem.originalPrice) * 100)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="relative w-full h-5 bg-rose-100 rounded-full overflow-hidden flex items-center justify-center border border-rose-200">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (activeFlashSaleItem.soldQuantity / activeFlashSaleItem.totalQuantity) * 100))}%` }}
                  ></div>
                  <span className="relative z-10 text-[9px] sm:text-[10px] font-black text-slate-800 uppercase tracking-wider">
                    {activeFlashSaleItem.soldQuantity >= activeFlashSaleItem.totalQuantity 
                      ? "Cháy hàng" 
                      : `Đã bán ${activeFlashSaleItem.soldQuantity} / ${activeFlashSaleItem.totalQuantity} sản phẩm`
                    }
                  </span>
                </div>
              </div>

              {/* Limits */}
              {activeFlashSaleItem.maxQuantityPerUser > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 bg-rose-50/50 p-2 rounded-xl border border-rose-100/50">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Mỗi khách hàng được mua tối đa {activeFlashSaleItem.maxQuantityPerUser} sản phẩm
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {(() => {
              const hasVariants = product.variantCount !== undefined && product.variantCount > 0;
              
              // If it's a variable product and no variant is currently resolved
              if (hasVariants && !activeVariant) {
                const minEff = product.minEffectivePrice ?? 0;
                const maxEff = product.maxEffectivePrice ?? 0;
                const minOrig = product.minPrice ?? 0;
                const maxOrig = product.maxPrice ?? 0;
                const hasRangeDiscount = product.minEffectivePrice !== undefined && product.minPrice !== undefined && product.minEffectivePrice < product.minPrice;

                if (hasRangeDiscount) {
                  const discountRangeText = minEff === maxEff
                    ? `₫${minEff.toLocaleString("vi-VN")}`
                    : `₫${minEff.toLocaleString("vi-VN")} - ₫${maxEff.toLocaleString("vi-VN")}`;
                  const origRangeText = minOrig === maxOrig
                    ? `₫${minOrig.toLocaleString("vi-VN")}`
                    : `₫${minOrig.toLocaleString("vi-VN")} - ₫${maxOrig.toLocaleString("vi-VN")}`;

                  return (
                    <>
                      <div>
                        <span className="text-xs text-slate-400 font-medium block mb-1">Giá bán lẻ</span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-2xl sm:text-3xl font-bold text-rose-600">
                            {discountRangeText}
                          </span>
                          <span className="text-sm text-slate-400 line-through">
                            {origRangeText}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 h-fit">
                        Có ưu đãi giảm giá
                      </div>
                    </>
                  );
                } else {
                  const priceRangeText = minOrig === maxOrig
                    ? `₫${minOrig.toLocaleString("vi-VN")}`
                    : `₫${minOrig.toLocaleString("vi-VN")} - ₫${maxOrig.toLocaleString("vi-VN")}`;

                  return (
                    <div>
                      <span className="text-xs text-slate-400 font-medium block mb-1">Giá bán lẻ</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                          {priceRangeText}
                        </span>
                      </div>
                    </div>
                  );
                }
              }

              // Default rendering (simple product OR active variant selected)
              return (
                <>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block mb-1">Giá bán lẻ</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-rose-600">
                        ₫{(displayDiscountPrice || displayPrice).toLocaleString("vi-VN")}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-slate-400 line-through">
                          ₫{displayPrice.toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                  {hasDiscount && displayDiscountPrice !== undefined && (
                    <div className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 h-fit">
                      Tiết kiệm ₫{(displayPrice - displayDiscountPrice).toLocaleString("vi-VN")}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Dynamic Variants Selectors (Text Only) */}
        {product.productOptions && product.productOptions.length > 0 && (
          <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
            {product.productOptions.map((option) => (
              <div key={option.productOptionID} className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  {option.name}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {option.productOptionValues.map((optVal) => {
                    const isSelected = selectedOptions[option.name] === optVal.value;
                    const isOutOfStock = isOptionValueOutOfStock(option.name, optVal.value);
                    return (
                      <button
                        key={optVal.productOptionValueID}
                        onClick={() => handleOptionSelect(option.name, optVal.value)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                          isOutOfStock
                            ? "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed line-through"
                            : isSelected
                            ? "bg-rose-50 border-primary text-primary font-bold shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {optVal.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Section (Quantity & Add to Cart) */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Quantity Counter */}
          <div className="flex items-center justify-between w-full sm:w-32 h-12 bg-slate-100 rounded-full px-4 border border-slate-200">
            <button
              onClick={handleDecreaseQuantity}
              disabled={quantity <= 1}
              className="text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="font-bold text-slate-800 text-sm">{quantity}</span>
            <button
              onClick={handleIncreaseQuantity}
              disabled={!displayInStock || quantity >= maxAllowedQuantity}
              className="text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!displayInStock || maxAllowedQuantity <= 0}
            className="w-full h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
          >
            <ShoppingCart size={18} />
            Thêm vào giỏ hàng
          </button>

          {/* Wishlist Toggle Button */}
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all shrink-0 active:scale-90 ${
              isWishlisted
                ? "bg-rose-50 border-rose-200 text-rose-500"
                : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Heart size={20} className={isWishlisted ? "fill-rose-500" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
};

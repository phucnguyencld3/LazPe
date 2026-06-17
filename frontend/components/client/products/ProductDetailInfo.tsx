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
  handleQuantityChange?: (val: string) => void;
  setQuantity?: (val: number) => void;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  isWishlisted: boolean;
  setIsWishlisted: (wishlisted: boolean) => void;
  activeVariant?: Variant | null;
  activeFlashSaleItem?: any;
  flashSaleEndTime?: string;
  flashSaleStatus?: number;
  selectedGiftId?: number | null;
  setSelectedGiftId?: (id: number | null) => void;
  isAddingToCart?: boolean;
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
  handleQuantityChange,
  setQuantity,
  handleAddToCart,
  handleBuyNow,
  isWishlisted,
  setIsWishlisted,
  activeVariant = null,
  activeFlashSaleItem = null,
  flashSaleEndTime = "",
  flashSaleStatus = 0,
  selectedGiftId = null,
  setSelectedGiftId = () => {},
  isAddingToCart = false,
}) => {
  const maxAllowedQuantity = useMemo(() => {
    let limit = displayStock;
    if (activeFlashSaleItem) {
      const remainingSaleQty = activeFlashSaleItem.totalQuantity - activeFlashSaleItem.soldQuantity;
      limit = Math.min(limit, remainingSaleQty);
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
        {/* Price Display / Flash Sale Widget */}
        {activeFlashSaleItem && flashSaleEndTime && (
          <div className={`rounded-[10px] border overflow-hidden mb-4 shadow-sm ${flashSaleStatus === 0 ? "border-blue-200 shadow-blue-500/5" : "border-rose-200 shadow-rose-500/5"}`}>
            <div className={`px-2 py-1 flex flex-wrap items-center justify-between gap-2 text-white ${flashSaleStatus === 0 ? "bg-gradient-to-r from-blue-600 to-indigo-500" : "bg-gradient-to-r from-rose-600 to-orange-500"}`}>
              <div className="flex items-center gap-1 font-black uppercase text-[10px] sm:text-xs tracking-wider">
                {flashSaleStatus === 0 ? (
                  <>
                    <span className="material-symbols-outlined text-[14px] text-yellow-300">event</span>
                    <span>SẮP DIỄN RA</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px] text-yellow-300 animate-bounce">bolt</span>
                    <span>FLASH SALE</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className={`font-semibold ${flashSaleStatus === 0 ? "text-blue-100" : "text-rose-100"}`}>
                  {flashSaleStatus === 0 ? "Bắt đầu sau:" : "Kết thúc sau:"}
                </span>
                <div className="scale-75 origin-right -my-2 [&_.text-slate-400]:!text-white/90">
                  <CountdownTimer endTime={flashSaleEndTime} variant="light" size="sm" />
                </div>
              </div>
            </div>

            <div className={`p-2 sm:p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${flashSaleStatus === 0 ? "bg-blue-50/20" : "bg-rose-50/20"}`}>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl sm:text-2xl font-black leading-none ${flashSaleStatus === 0 ? "text-blue-600" : "text-rose-600"}`}>
                  ₫{flashSaleStatus === 0 
                    ? activeFlashSaleItem.discountPrice.toLocaleString("vi-VN").replace(/^(\d)[^\d]*(\d)/, (m: string) => m.slice(0, -1) + "?") 
                    : activeFlashSaleItem.discountPrice.toLocaleString("vi-VN")}
                </span>
                {activeFlashSaleItem.discountType !== 2 && activeFlashSaleItem.discountPrice < activeFlashSaleItem.originalPrice && (
                  <span className="text-xs text-slate-400 line-through font-semibold">
                    ₫{activeFlashSaleItem.originalPrice.toLocaleString("vi-VN")}
                  </span>
                )}
                {activeFlashSaleItem.discountType === 2 ? (
                  <span className={`border text-[9px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 ${flashSaleStatus === 0 ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
                    <span className="material-symbols-outlined text-[10px]">redeem</span> Có quà
                  </span>
                ) : activeFlashSaleItem.originalPrice > 0 && activeFlashSaleItem.discountPrice < activeFlashSaleItem.originalPrice && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${flashSaleStatus === 0 ? "bg-blue-100 text-blue-600" : "bg-rose-100 text-rose-600"}`}>
                    Tiết kiệm {Math.round(((activeFlashSaleItem.originalPrice - activeFlashSaleItem.discountPrice) / activeFlashSaleItem.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-32">
                  <div className={`relative w-full h-3 rounded-full overflow-hidden flex items-center justify-center border ${flashSaleStatus === 0 ? "bg-slate-100 border-slate-200" : "bg-rose-100 border-rose-200"}`}>
                    <div 
                      className={`absolute left-0 top-0 h-full transition-all duration-500 ${flashSaleStatus === 0 ? "bg-slate-300" : "bg-gradient-to-r from-rose-500 to-orange-500"}`}
                      style={{ width: `${flashSaleStatus === 0 ? 0 : Math.min(100, Math.max(0, (activeFlashSaleItem.soldQuantity / activeFlashSaleItem.totalQuantity) * 100))}%` }}
                    ></div>
                    <span className={`relative z-10 text-[8px] font-black uppercase tracking-wider ${flashSaleStatus === 0 ? "text-slate-500" : "text-slate-800"}`}>
                      {flashSaleStatus === 0 
                        ? "Sắp mở bán"
                        : activeFlashSaleItem.soldQuantity >= activeFlashSaleItem.totalQuantity 
                          ? "Cháy hàng" 
                          : `Đã bán ${activeFlashSaleItem.soldQuantity}/${activeFlashSaleItem.totalQuantity}`
                      }
                    </span>
                  </div>
                </div>
                
                {activeFlashSaleItem.maxQuantityPerUser > 0 && (
                  <div className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${flashSaleStatus === 0 ? "text-blue-500 bg-blue-50/50 border-blue-100/50" : "text-rose-500 bg-rose-50/50 border-rose-100/50"}`}>
                    Tối đa {activeFlashSaleItem.maxQuantityPerUser}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Normal Price Display if not active flash sale */}
        {(!activeFlashSaleItem || flashSaleStatus === 0) && (
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

        {/* Gift Selection UI */}
        {activeFlashSaleItem?.discountType === 2 && activeFlashSaleItem?.giftVariantIds && activeFlashSaleItem.giftVariantIds.length > 0 && (
          <div className="space-y-3 mb-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Quà tặng / Ưu đãi:</span>
              </div>
              {quantity < activeFlashSaleItem.requiredQuantity && (
                <span className="text-[10px] text-rose-500 font-medium bg-rose-50 px-2 py-0.5 rounded-md">
                  Mua từ {activeFlashSaleItem.requiredQuantity} sp để nhận quà
                </span>
              )}
            </div>
            
            <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: 'none' }}>
              {activeFlashSaleItem.giftVariantIds.map((giftId: number, index: number) => {
                const giftName = activeFlashSaleItem.giftNames?.[index] || "Quà tặng bí mật";
                const giftImage = activeFlashSaleItem.giftImageUrls?.[index] || "/assets/img/products/default-product.jpg";
                const isSelected = selectedGiftId === giftId;
                const tooltipText = `• Tặng 1 sản phẩm kèm theo (tối đa 1 combo/KH)\n• ${giftName}\n• Số lượng: 1`;
                
                return (
                  <button
                    key={giftId}
                    disabled={quantity < activeFlashSaleItem.requiredQuantity}
                    onClick={() => setSelectedGiftId && setSelectedGiftId(giftId)}
                    title={tooltipText}
                    className={`relative min-w-[96px] w-[96px] snap-center shrink-0 flex flex-col p-2 rounded-[10px] border transition-all text-left ${
                      quantity < activeFlashSaleItem.requiredQuantity
                        ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                        : isSelected 
                          ? "border-rose-500 bg-rose-50/30 shadow-sm" 
                          : "border-slate-200 bg-white hover:border-rose-200"
                    }`}
                  >
                    {/* Image */}
                    <div className="w-full aspect-square relative rounded-md overflow-hidden bg-slate-50 mb-2 border border-slate-100">
                      <img src={giftImage} alt={giftName} className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    
                    {/* Free Badge */}
                    <div className="mb-1.5 flex justify-center w-full">
                      <span className="text-[9px] font-black text-[#00a5ff] bg-[#e8f6ff] border border-[#bce4ff] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 w-fit uppercase">
                        <span className="material-symbols-outlined text-[10px]">redeem</span> Free
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline justify-center gap-1 mb-2 w-full">
                      <span className="font-bold text-[11px] text-slate-900">0đ</span>
                      <span className="text-[9px] text-slate-400 line-through">155.000đ</span>
                    </div>

                    {/* Radio Button */}
                    <div className="flex items-center justify-center gap-1 mt-auto w-full">
                      {isSelected ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-[8px] font-bold">check</span>
                          </div>
                          <span className="text-[10px] font-medium text-rose-500 truncate">Được chọn</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"></div>
                          <span className="text-[10px] text-slate-500 truncate">Chọn</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Variants Selectors (Text Only) */}
        {product.productOptions && product.productOptions.length > 0 && !(product.productOptions.length === 1 && product.productOptions[0].productOptionValues.length === 1) && (
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
          <div className="flex items-center justify-between w-full sm:w-28 h-10 sm:h-11 bg-slate-50/80 rounded-full px-3 border border-slate-200 hover:border-slate-300 transition-colors">
            <button
              onClick={handleDecreaseQuantity}
              disabled={quantity <= 1}
              className="text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors p-1"
            >
              <Minus size={16} />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={quantity === 0 ? "" : quantity}
              onChange={(e) => handleQuantityChange && handleQuantityChange(e.target.value)}
              onBlur={() => {
                if (quantity === 0 && setQuantity) {
                  setQuantity(1);
                }
              }}
              className="font-bold text-slate-800 text-sm w-10 text-center bg-transparent border-none outline-none focus:ring-0 p-0"
            />
            <button
              onClick={handleIncreaseQuantity}
              disabled={!displayInStock || quantity >= maxAllowedQuantity}
              className="text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex w-full gap-2">
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!displayInStock || maxAllowedQuantity <= 0 || isAddingToCart}
              className="w-1/2 h-10 sm:h-11 rounded-full border border-primary text-primary font-bold flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 hover:bg-rose-50 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
            >
              {isAddingToCart ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShoppingCart size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="truncate">Thêm giỏ hàng</span>
                </>
              )}
            </button>

            {/* Buy Now Button */}
            <button
              onClick={handleBuyNow}
              disabled={!displayInStock || maxAllowedQuantity <= 0 || isAddingToCart}
              className="w-1/2 h-10 sm:h-11 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
            >
              <span className="truncate">Mua ngay</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, Bolt, AlertCircle } from "lucide-react";
import { CartInfo, CartDetailInfo } from "@/lib/api";
import { getCurrentFlashSale, FlashSaleResponseDto, FlashSaleItemResponseDto } from "@/lib/features/flash-sales/flashSaleApi";

interface CartItemListProps {
  cart: CartInfo;
  checkedDetails: Record<number, boolean>;
  isAllChecked: () => boolean;
  handleToggleAllChecks: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleToggleCheck: (detailId: number) => void;
  handleRemoveSelectedItems: () => void;
  handleClearAllCart: () => void;
  handleUpdateQuantity: (detail: CartDetailInfo, newQty: number) => void;
  handleRemoveItem: (cartDetailId: number) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  cart,
  checkedDetails,
  isAllChecked,
  handleToggleAllChecks,
  handleToggleCheck,
  handleRemoveSelectedItems,
  handleClearAllCart,
  handleUpdateQuantity,
  handleRemoveItem,
}) => {
  const [activeFlashSales, setActiveFlashSales] = useState<FlashSaleResponseDto[]>([]);

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const sales = await getCurrentFlashSale();
        const activeOnly = (sales || []).filter(sale => sale.isActive && sale.status === 1);
        setActiveFlashSales(activeOnly);
      } catch (err) {
        console.error("Cart flash sale fetch error:", err);
      }
    };
    fetchFlashSale();
  }, []);

  return (
    <div className="lg:col-span-8 space-y-md">
      {/* Bulk Actions Bar */}
      <div className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100">
        <label className="flex items-center gap-sm cursor-pointer group">
          <input
            type="checkbox"
            checked={isAllChecked()}
            onChange={handleToggleAllChecks}
            className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500/20 accent-rose-500 transition-all cursor-pointer"
          />
          <span className="font-bold text-slate-800 group-hover:text-rose-500 transition-colors text-sm">
            Chọn tất cả ({cart.cartDetails.length})
          </span>
        </label>
        <div className="flex gap-4">
          <button
            onClick={handleRemoveSelectedItems}
            className="flex items-center gap-1.5 text-slate-500 hover:text-rose-500 transition-colors font-bold text-xs"
          >
            <Trash2 size={14} />
            Xóa mục đã chọn
          </button>
          <button
            onClick={handleClearAllCart}
            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors font-bold text-xs border-l border-slate-200 pl-4"
          >
            Xóa sạch giỏ hàng
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-sm">
        {(() => {
          const nonGifts = cart.cartDetails.filter((d) => !d.isGift);
          const gifts = cart.cartDetails.filter((d) => d.isGift);
          let remainingGifts = [...gifts];

          return (
            <>
              {nonGifts.map((detail) => {
                const isChecked = !!checkedDetails[detail.cartDetailID];

                // Product or Bundle info resolution
                const isBundle = !!detail.bundleID;
                const name = isBundle ? detail.bundle?.name : detail.product?.name;
                const price = detail.unitPrice;
                const image = isBundle ? detail.bundle?.imageUrl : detail.variant?.imageUrl || detail.product?.imageUrl;
                let sizeText = "";
                if (detail.variant?.size && detail.variant.size.toLowerCase() !== "xem chi tiết" && detail.variant.size.toLowerCase() !== "default") {
                  sizeText = ` - Cỡ: ${detail.variant.size}`;
                }
                const subtext = isBundle
                  ? "Gói Combo sản phẩm"
                  : `Phân loại: ${detail.variant?.color || "Tiêu chuẩn"}${sizeText}`;

                // Flash Sale checking
                let flashSaleItem: FlashSaleItemResponseDto | undefined = undefined;
                for (const sale of activeFlashSales) {
                  const matchedItem = sale.flashSaleItems.find((item) => {
                    if (detail.bundleID && item.itemType === 3 && item.referenceId === detail.bundleID) return true;
                    if (detail.variantID && item.itemType === 2 && item.referenceId === detail.variantID) return true;
                    if (detail.product?.productID && item.itemType === 1 && item.referenceId === detail.product.productID) return true;
                    return false;
                  });
                  if (matchedItem) {
                    flashSaleItem = matchedItem;
                    break;
                  }
                }

                const maxAllowedQuantity = (() => {
                  let limit = 99;
                  if (flashSaleItem) {
                    const remainingSaleQty = flashSaleItem.totalQuantity - flashSaleItem.soldQuantity;
                    limit = remainingSaleQty;
                  }
                  return Math.max(1, limit);
                })();

                const isQtyExceeded = flashSaleItem && (
                  detail.quantity > (flashSaleItem.totalQuantity - flashSaleItem.soldQuantity)
                );

                let associatedGift = null;
                if (flashSaleItem && flashSaleItem.discountType === 2 && flashSaleItem.giftVariantIds && Array.isArray(flashSaleItem.giftVariantIds)) {
                  const giftIds = flashSaleItem.giftVariantIds;
                  const giftIndex = remainingGifts.findIndex(g => g.variantID && giftIds.includes(g.variantID));
                  if (giftIndex !== -1) {
                    associatedGift = remainingGifts[giftIndex];
                    remainingGifts.splice(giftIndex, 1);
                  }
                }

                return (
                  <div key={detail.cartDetailID} className="flex flex-col relative mb-4">
                    {/* Main Product */}
                    <div
                      className={`bg-white p-3 sm:p-4 rounded-xl shadow-sm flex flex-row gap-3 sm:gap-4 items-start sm:items-center group transition-all border relative z-10 ${isChecked
                        ? "border-rose-200 bg-rose-500/[0.02]"
                        : "border-slate-100 hover:border-slate-200"
                        }`}
                    >
                      <div className="flex items-center h-16 sm:h-20 shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCheck(detail.cartDetailID)}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500/20 accent-rose-500 transition-all cursor-pointer"
                        />
                      </div>

                      {/* Product Image */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shrink-0 relative">
                        {image ? (
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt="Ảnh sản phẩm"
                            src={image}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-[10px]">
                            Không có ảnh
                          </div>
                        )}
                      </div>

                      {/* Product Info & Actions Wrapper */}
                      <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 w-full">
                        {/* Info */}
                        <div className="flex-grow space-y-1 text-left min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-slate-800 hover:text-rose-500 transition-colors line-clamp-2 leading-snug">
                            {isBundle ? (
                              name
                            ) : (
                              <Link href={`/products/${detail.product?.productID || detail.variantID}`}>
                                {name}
                              </Link>
                            )}
                          </h3>

                          <div className="flex flex-wrap items-center justify-start gap-1.5">
                            <p className="text-on-surface-variant text-[10px] sm:text-xs font-semibold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded inline-block">
                              {subtext}
                            </p>
                            {flashSaleItem && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-white bg-gradient-to-r from-rose-600 to-orange-500 px-1.5 py-0.5 rounded shadow-sm">
                                <Bolt size={8} className="fill-white animate-pulse" /> FLASH SALE
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <p className="text-rose-500 font-extrabold text-sm sm:text-base">
                              ₫{price.toLocaleString("vi-VN")}
                            </p>
                            {isQtyExceeded && flashSaleItem && (
                              <div className="text-[9px] text-rose-500 font-bold flex items-center justify-start gap-1 bg-rose-50 border border-rose-100 rounded-md px-1.5 py-0.5 w-fit">
                                <AlertCircle size={10} />
                                Vượt số lượng FS!
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity & Delete Actions */}
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-start w-full sm:w-auto mt-1 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-slate-100">
                          <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200">
                            <button
                              onClick={() => handleUpdateQuantity(detail, detail.quantity - 1)}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-rose-500 transition-all active:scale-90"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="w-8 sm:w-10 text-center font-bold text-slate-800 text-xs sm:text-sm">
                              {detail.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(detail, detail.quantity + 1)}
                              disabled={flashSaleItem && detail.quantity >= maxAllowedQuantity}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-rose-500 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={10} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(detail.cartDetailID)}
                            className="material-symbols-outlined text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-full transition-all active:scale-90 text-[18px]"
                          >
                            delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Associated Gift */}
                    {associatedGift && (
                      <div className="ml-8 sm:ml-12 pl-3 border-l-2 border-emerald-200 relative -mt-3 pt-4 z-0">
                        <div className="bg-emerald-50/[0.4] p-2 sm:p-2.5 rounded-lg border border-emerald-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center group transition-all">
                          <div className="flex items-center w-full sm:w-auto gap-3">
                            <div className="w-6 h-6 flex items-center justify-center text-emerald-500 shrink-0 bg-emerald-100 rounded-full">
                              <span className="material-symbols-outlined text-[14px]">redeem</span>
                            </div>

                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-white border border-slate-100 shrink-0 relative">
                              {associatedGift.variant?.imageUrl || associatedGift.product?.imageUrl ? (
                                <img
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  alt="Ảnh quà tặng"
                                  src={associatedGift.variant?.imageUrl || associatedGift.product?.imageUrl}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-[8px]">
                                  Không ảnh
                                </div>
                              )}
                            </div>

                            <div className="flex-grow space-y-0.5 text-left">
                              <h4 className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1 leading-snug">
                                {associatedGift.product?.name || "Quà tặng miễn phí"}
                              </h4>

                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shadow-sm">
                                  QUÀ TẶNG
                                </span>
                                <span className="text-[9px] text-slate-500 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                  {associatedGift.variant?.color || "Tiêu chuẩn"}
                                  {associatedGift.variant?.size && associatedGift.variant.size.toLowerCase() !== "xem chi tiết" && associatedGift.variant.size.toLowerCase() !== "default" ? ` - Cỡ: ${associatedGift.variant.size}` : ""}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto shrink-0 gap-4 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-emerald-200">
                            <p className="text-emerald-600 font-extrabold text-xs sm:text-sm">Miễn phí</p>
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                              x{associatedGift.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Any remaining unassociated gifts */}
              {remainingGifts.map((gift) => {
                let sizeText = "";
                if (gift.variant?.size && gift.variant.size.toLowerCase() !== "xem chi tiết" && gift.variant.size.toLowerCase() !== "default") {
                  sizeText = ` - Cỡ: ${gift.variant.size}`;
                }
                const subtext = `Phân loại: ${gift.variant?.color || "Tiêu chuẩn"}${sizeText}`;
                const image = gift.variant?.imageUrl || gift.product?.imageUrl;
                const name = gift.product?.name || "Quà tặng";

                return (
                  <div
                    key={gift.cartDetailID}
                    className="bg-emerald-50/[0.3] p-3 sm:p-4 rounded-xl shadow-sm flex flex-row gap-3 sm:gap-4 items-start sm:items-center group transition-all border border-emerald-200 mb-4"
                  >
                    <div className="flex items-center h-16 sm:h-20 shrink-0">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-emerald-500 shrink-0">
                        <span className="material-symbols-outlined text-[16px] sm:text-[18px]">redeem</span>
                      </div>
                    </div>

                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-white border border-slate-100 shrink-0 relative">
                      {image ? (
                        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Ảnh sản phẩm" src={image} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-[10px]">Không ảnh</div>
                      )}
                    </div>

                    <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 w-full">
                      <div className="flex-grow space-y-1 text-left min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-slate-800 hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                          {name}
                        </h3>
                        <div className="flex flex-wrap items-center justify-start gap-1.5">
                          <p className="text-on-surface-variant text-[10px] sm:text-xs font-semibold bg-white border border-slate-100 px-1.5 py-0.5 rounded inline-block">
                            {subtext}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shadow-sm">
                            QUÀ TẶNG
                          </span>
                        </div>
                        <p className="text-emerald-600 font-extrabold text-sm sm:text-base">Miễn phí</p>
                      </div>

                      <div className="flex items-center shrink-0 w-full sm:w-auto mt-1 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-emerald-200 justify-end">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                          Số lượng: {gift.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>
    </div>
  );
};

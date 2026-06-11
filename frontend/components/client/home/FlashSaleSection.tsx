"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bolt, ChevronRight, Flame, Loader2 } from "lucide-react";
import { getCurrentFlashSale, FlashSaleResponseDto, FlashSaleStatus, FlashSaleItemResponseDto } from "@/lib/features/flash-sales/flashSaleApi";
import CountdownTimer from "@/components/client/common/CountdownTimer";

export const FlashSaleSection: React.FC = () => {
  const [flashSale, setFlashSale] = useState<FlashSaleResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSale = async () => {
    try {
      const data = await getCurrentFlashSale();
      setFlashSale(data);
    } catch (err) {
      console.error("Failed to load homepage flash sale:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSale();
    
    // Refresh page if a flash sale changes state
    const interval = setInterval(fetchSale, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-white">
        <Loader2 className="animate-spin text-rose-500" size={32} />
      </div>
    );
  }

  // If there's no active or upcoming sale, or no items, do not render the section
  if (!flashSale || !flashSale.isActive || !flashSale.flashSaleItems || flashSale.flashSaleItems.length === 0) {
    return null;
  }

  const isUpcoming = flashSale.status === FlashSaleStatus.Upcoming;
  const isActive = flashSale.status === FlashSaleStatus.Active;
  
  // Choose target countdown date based on status
  const targetTime = isUpcoming ? flashSale.startTime : flashSale.endTime;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-rose-50/50 via-white to-transparent overflow-hidden">
      <div className="mx-auto max-w-7xl">
        {/* Banner Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-[0_10px_35px_rgba(244,63,94,0.06)] mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Decorative background gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-orange-400/5 rounded-full blur-2xl -z-10"></div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Title & Badge */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Bolt className="fill-white animate-bounce" size={20} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                  Laz<span className="text-rose-500">Flash</span>
                  {isActive && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{flashSale.name}</p>
              </div>
            </div>

            {/* Status Label */}
            <div className="sm:ml-4 flex items-center">
              {isUpcoming ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                  Sắp mở bán
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider animate-pulse">
                  <Flame size={12} className="fill-rose-500" /> Đang diễn ra
                </span>
              )}
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">
              {isUpcoming ? "Bắt đầu sau:" : "Kết thúc sau:"}
            </span>
            <CountdownTimer 
              endTime={targetTime} 
              variant="rose"
              size="md"
              onExpire={fetchSale} 
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {flashSale.flashSaleItems.map((item) => {
            const hasStock = item.totalQuantity > item.soldQuantity;
            const discountPercent = Math.round(((item.originalPrice - item.discountPrice) / item.originalPrice) * 100);
            const progressPercent = Math.min(100, Math.max(0, (item.soldQuantity / item.totalQuantity) * 100));
            
            // Generate link to product detail page
            const targetId = item.productId || (item.itemType === 1 ? item.referenceId : null);
            const itemLink = targetId ? `/products/${targetId}` : `/products`;

            return (
              <div 
                key={item.id} 
                className="group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative"
              >
                {/* Image & Badges */}
                <div className="relative aspect-[4/5] bg-slate-50 overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.itemName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-medium">
                      No Image
                    </div>
                  )}

                  {/* Discount Badge */}
                  {discountPercent > 0 && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-600 to-orange-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black shadow-md shadow-rose-500/20 z-10">
                      -{discountPercent}%
                    </div>
                  )}

                  {/* Out of Stock Overlay */}
                  {!hasStock && isActive && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <span className="text-white font-extrabold text-sm uppercase tracking-wider bg-rose-600/90 px-3 py-1 rounded-full shadow-lg">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    {/* Item Name */}
                    <Link href={itemLink}>
                      <h3 
                        title={item.itemName}
                        className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 leading-snug group-hover:text-rose-500 transition-colors"
                      >
                        {item.itemName}
                      </h3>
                    </Link>
                    
                    {/* Sku Details if variant */}
                    {item.sku && (
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{item.sku}</p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {/* Prices */}
                    <div className="flex flex-wrap items-baseline gap-1.5 leading-none">
                      <span className="text-sm sm:text-base font-black text-rose-600">
                        ₫{item.discountPrice.toLocaleString("vi-VN")}
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                        ₫{item.originalPrice.toLocaleString("vi-VN")}
                      </span>
                    </div>

                    {/* Progress Bar (Always show if active) */}
                    {isActive && (
                      <div className="space-y-1">
                        <div className="relative w-full h-4 bg-rose-100 rounded-full overflow-hidden flex items-center justify-center">
                          {/* Progress Fill */}
                          <div 
                            className={`absolute left-0 top-0 h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-500`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                          {/* Progress Text */}
                          <span className="relative z-10 text-[9px] font-extrabold text-slate-800 uppercase tracking-wide">
                            {item.soldQuantity === 0 
                              ? "Vừa mở bán" 
                              : item.soldQuantity >= item.totalQuantity 
                              ? "Cháy hàng" 
                              : `Đã bán ${item.soldQuantity}`
                            }
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Button */}
                    <Link href={itemLink} className="block w-full">
                      {isUpcoming ? (
                        <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl active:scale-95 transition-all">
                          Xem chi tiết
                        </button>
                      ) : hasStock ? (
                        <button className="w-full py-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:brightness-110 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-rose-500/10">
                          Mua ngay
                        </button>
                      ) : (
                        <button disabled className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed">
                          Hết hàng
                        </button>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

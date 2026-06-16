"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bolt, ChevronRight, Flame, Loader2 } from "lucide-react";
import { getCurrentFlashSale, FlashSaleResponseDto, FlashSaleStatus, FlashSaleItemResponseDto } from "@/lib/features/flash-sales/flashSaleApi";
import CountdownTimer from "@/components/client/common/CountdownTimer";

export const FlashSaleSection: React.FC = () => {
  const [flashSales, setFlashSales] = useState<FlashSaleResponseDto[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSale = async () => {
    try {
      const data = await getCurrentFlashSale();
      setFlashSales(data || []);
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

  // Filter out disabled or empty sales
  const validSales = flashSales.filter(
    (fs) => fs.isActive && fs.flashSaleItems && fs.flashSaleItems.length > 0
  );

  if (validSales.length === 0) {
    return null;
  }

  // Ensure activeTabIndex is within bounds
  const currentSaleIndex = activeTabIndex < validSales.length ? activeTabIndex : 0;
  const currentSale = validSales[currentSaleIndex];

  const isUpcoming = currentSale.status === FlashSaleStatus.Upcoming;
  const isActive = currentSale.status === FlashSaleStatus.Active;
  
  // Choose target countdown date based on status
  const targetTime = isUpcoming ? currentSale.startTime : currentSale.endTime;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-rose-50/50 via-white to-transparent overflow-hidden">
      <div className="mx-auto max-w-7xl">
        {/* Campaign Tabs */}
        {validSales.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
            {validSales.map((sale, index) => {
              const isSaleActive = sale.status === FlashSaleStatus.Active;
              const isSelected = currentSaleIndex === index;
              return (
                <button
                  key={sale.id}
                  onClick={() => setActiveTabIndex(index)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shrink-0 border ${
                    isSelected
                      ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20"
                      : "bg-white text-slate-600 hover:text-slate-900 border-slate-200"
                  }`}
                >
                  <span>{sale.name}</span>
                  {isSaleActive ? (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      isSelected ? "bg-white/20 text-white" : "bg-rose-50 text-rose-500"
                    } animate-pulse`}>
                      Đang chạy
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      Sắp diễn ra
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-md">
              <Bolt className="fill-white animate-bounce" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                Laz<span className="text-rose-500">Flash</span>
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500 font-medium">{currentSale.name}</p>
                {isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 uppercase">
                    <Flame size={10} className="fill-rose-500" /> Đang diễn ra
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-xl">
            <span className="text-xs font-bold text-rose-600 uppercase">
              {isUpcoming ? "Bắt đầu sau:" : "Kết thúc sau:"}
            </span>
            <CountdownTimer 
              endTime={targetTime} 
              variant="rose"
              size="sm"
              onExpire={fetchSale} 
            />
          </div>
        </div>

        {/* Product Grid */}
        <div key={currentSale.id} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 transition-all duration-300 animate-[fadeIn_0.4s_ease-out]">
          {currentSale.flashSaleItems.map((item) => {
            const hasStock = item.totalQuantity > item.soldQuantity;
            const discountPercent = item.originalPrice > 0 ? Math.round(((item.originalPrice - item.discountPrice) / item.originalPrice) * 100) : 0;
            const progressPercent = Math.min(100, Math.max(0, (item.soldQuantity / item.totalQuantity) * 100));
            const isGift = item.discountType === 2; // DiscountType.FreeGift
            
            // Generate link to product detail page
            const targetId = item.productId || (item.itemType === 1 ? item.referenceId : null);
            const itemLink = targetId ? `/products/${targetId}` : `/products`;

            return (
              <div 
                key={item.id} 
                className="group flex flex-col bg-white rounded-xl border border-slate-100 hover:border-rose-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden relative"
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

                  {/* Discount/Gift Badge */}
                  {isGift ? (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black shadow-md z-10 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">redeem</span>
                      TẶNG QUÀ
                    </div>
                  ) : discountPercent > 0 && (
                    <div className="absolute top-2 left-2 bg-rose-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black shadow-md z-10">
                      -{discountPercent}%
                    </div>
                  )}

                  {/* Out of Stock Overlay */}
                  {!hasStock && isActive && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <span className="text-white font-extrabold text-sm uppercase bg-slate-800/90 px-4 py-1.5 rounded-full">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-2 border-t border-slate-50">
                  <div className="space-y-1">
                    {/* Item Name */}
                    <Link href={itemLink}>
                      <h3 
                        title={item.itemName}
                        className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-rose-500 transition-colors"
                      >
                        {item.itemName}
                      </h3>
                    </Link>
                  </div>

                  <div className="space-y-2 mt-1">
                    {/* Prices */}
                    <div className="flex flex-wrap items-baseline gap-1.5 leading-none">
                      <span className="text-sm sm:text-base font-black text-rose-600">
                        ₫{item.discountPrice.toLocaleString("vi-VN")}
                      </span>
                      {(!isGift && item.discountPrice < item.originalPrice) && (
                        <span className="text-[10px] text-slate-400 line-through font-semibold">
                          ₫{item.originalPrice.toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isActive && (
                      <div className="relative w-full h-3 bg-rose-100 rounded-full overflow-hidden flex items-center justify-center">
                        <div 
                          className="absolute left-0 top-0 h-full bg-rose-500"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                        <span className="relative z-10 text-[8px] font-extrabold text-white uppercase tracking-wide drop-shadow-md">
                          {item.soldQuantity === 0 
                            ? "Vừa mở bán" 
                            : item.soldQuantity >= item.totalQuantity 
                            ? "Đã bán hết" 
                            : `Đã bán ${item.soldQuantity}`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Button */}
                  <div className="mt-2">
                    <Link href={itemLink} className="block w-full">
                      {isUpcoming ? (
                        <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] sm:text-xs font-bold rounded-xl active:scale-95 transition-all">
                          Xem chi tiết
                        </button>
                      ) : hasStock ? (
                        <button className="w-full py-2 bg-gradient-to-r from-rose-500 to-orange-400 hover:brightness-110 text-white text-[11px] sm:text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md">
                          Mua ngay
                        </button>
                      ) : (
                        <button disabled className="w-full py-2 bg-slate-100 text-slate-400 text-[11px] sm:text-xs font-bold rounded-xl cursor-not-allowed">
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

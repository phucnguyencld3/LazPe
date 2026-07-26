'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Heart, Phone, Info, ShieldCheck, Pill, Gift, Video, FileText, RotateCcw, Flame, Sparkles, Tag, LayoutGrid, Package, Search, Ticket, Calendar } from 'lucide-react';
import ProductCard from '@/components/client/common/ProductCard';
import ProductCarousel from '@/components/client/products/ProductCarousel';
import { RecentlyViewedProducts } from '@/components/client/products/RecentlyViewedProducts';
import { getProducts, getCurrentFlashSales, getRecommendations, getBundlesAsProducts, getPublicVouchers, collectVoucher } from '@/lib/api';
import { Product, FlashSaleCampaign, Voucher } from '@/types';
import { toast } from 'sonner';

export default function HomePageV2() {
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [topWishlistProducts, setTopWishlistProducts] = useState<Product[]>([]);
  const [flashSaleCampaigns, setFlashSaleCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [publicVouchers, setPublicVouchers] = useState<Voucher[]>([]);



  // Pagination for Flash Sale Campaigns
  const [visibleCampaignsCount, setVisibleCampaignsCount] = useState(3);

  // Tabs State
  type TabKey = 'all' | 'foryou' | 'combo' | 'bestseller' | 'newest' | 'discount';
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [tabData, setTabData] = useState<Record<TabKey, { products: Product[], page: number, hasMore: boolean, displayedCount: number }>>({
    all: { products: [], page: 1, hasMore: true, displayedCount: 30 },
    foryou: { products: [], page: 1, hasMore: false, displayedCount: 10 },
    combo: { products: [], page: 1, hasMore: false, displayedCount: 30 },
    bestseller: { products: [], page: 1, hasMore: true, displayedCount: 30 },
    newest: { products: [], page: 1, hasMore: true, displayedCount: 30 },
    discount: { products: [], page: 1, hasMore: true, displayedCount: 30 },
  });
  const [loadingTab, setLoadingTab] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loadingFlash, setLoadingFlash] = useState(true);
  const [loadingBest, setLoadingBest] = useState(true);
  const [loadingForyou, setLoadingForyou] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      setLoadingFlash(true);
      setLoadingBest(true);
      setLoadingForyou(true);

      try {
        // Fetch Real Flash Sale Campaigns
        const campaigns = await getCurrentFlashSales();
        if (isMounted && campaigns) {
          // Sort by start time descending to show newest first
          const sortedCampaigns = [...campaigns].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
          setFlashSaleCampaigns(sortedCampaigns);
        }

        const vouchersList = await getPublicVouchers();
        if (isMounted && vouchersList) {
          setPublicVouchers(vouchersList.filter(v => !v.isCollected));
        }

        // Fetch Best Sellers & Top Wishlist
        const [bestSellerData, topWishlistData] = await Promise.all([
          getProducts(1, 10, "", undefined, "BestSeller", "desc"),
          getProducts(1, 10, "", undefined, "topwishlist", "desc")
        ]);
        if (isMounted) {
          if (bestSellerData?.items) setBestSellerProducts(bestSellerData.items);
          if (topWishlistData?.items) setTopWishlistProducts(topWishlistData.items);
        }

        let initialTab: TabKey = 'all';
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const tabParam = params.get('tab') as TabKey;
          const cachedTab = sessionStorage.getItem('lazpe_home_activeTab') as TabKey;
          
          if (tabParam && ['all', 'foryou', 'combo', 'bestseller', 'newest', 'discount'].includes(tabParam)) {
            initialTab = tabParam;
          } else if (cachedTab && ['all', 'foryou', 'combo', 'bestseller', 'newest', 'discount'].includes(cachedTab)) {
            initialTab = cachedTab;
          }
          setActiveTab(initialTab);
        }

        const cachedStr = typeof window !== 'undefined' ? sessionStorage.getItem('lazpe_home_tabData') : null;
        let usedCache = false;
        if (cachedStr) {
          try {
            const parsedCache = JSON.parse(cachedStr);
            if (isMounted && parsedCache && parsedCache['all']) {
              setTabData(parsedCache);
              usedCache = true;
            }
          } catch(e) {}
        }

        if (!usedCache) {
          let dataItems: Product[] = [];
        if (initialTab === 'foryou') {
          dataItems = await getRecommendations(10);
          if (!dataItems || dataItems.length === 0) {
            const fallbackData = await getProducts(1, 10, "", undefined, "CreatedAt", "asc");
            dataItems = fallbackData?.items || [];
          }
        } else if (initialTab === 'combo') {
          dataItems = await getBundlesAsProducts();
        } else {
          let sortBy = "CreatedAt", sortDir = "desc", hasDiscount = false;
          if (initialTab === 'bestseller') { sortBy = "BestSeller"; sortDir = "desc"; }
          if (initialTab === 'newest') { sortBy = "CreatedAt"; sortDir = "desc"; }
          if (initialTab === 'discount') { sortBy = "Price"; sortDir = "asc"; hasDiscount = true; }
          if (initialTab === 'all') { sortBy = "CreatedAt"; sortDir = "desc"; }

          const data = await getProducts(1, 30, "", undefined, sortBy, sortDir, hasDiscount);
          dataItems = data?.items || [];
        }

          if (isMounted && dataItems.length > 0) {
            setTabData(prev => ({
              ...prev,
              [initialTab]: {
                ...prev[initialTab],
                products: dataItems,
                hasMore: initialTab === 'foryou' || initialTab === 'combo' ? false : dataItems.length >= 30,
                displayedCount: initialTab === 'foryou' ? 10 : 30
              }
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching homepage data:", err);
      } finally {
        if (isMounted) {
          setLoadingFlash(false);
          setLoadingBest(false);
          setLoadingForyou(false);
        }
      }
    };

    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  // Save to sessionStorage when tabData or activeTab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lazpe_home_activeTab', activeTab);
      if (Object.values(tabData).some(tab => tab.products.length > 0)) {
        sessionStorage.setItem('lazpe_home_tabData', JSON.stringify(tabData));
      }
    }
  }, [tabData, activeTab]);

  const handleTabChange = async (tab: TabKey) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }

    if (tabData[tab].products.length === 0) {
      setLoadingTab(true);
      let dataItems: Product[] = [];

      if (tab === 'foryou') {
        dataItems = await getRecommendations(10);
        if (!dataItems || dataItems.length === 0) {
          const fallbackData = await getProducts(1, 10, "", undefined, "CreatedAt", "asc");
          dataItems = fallbackData?.items || [];
        }
      } else if (tab === 'combo') {
        dataItems = await getBundlesAsProducts();
      } else {
        let sortBy = "CreatedAt", sortDir = "desc", hasDiscount = false;
        if (tab === 'bestseller') { sortBy = "BestSeller"; sortDir = "desc"; }
        if (tab === 'newest') { sortBy = "CreatedAt"; sortDir = "desc"; }
        if (tab === 'discount') { sortBy = "Price"; sortDir = "asc"; hasDiscount = true; }
        if (tab === 'all') { sortBy = "CreatedAt"; sortDir = "desc"; }

        const data = await getProducts(1, 30, "", undefined, sortBy, sortDir, hasDiscount);
        dataItems = data?.items || [];
      }

      if (dataItems.length > 0) {
        setTabData(prev => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            products: dataItems,
            hasMore: tab === 'foryou' || tab === 'combo' ? false : dataItems.length >= 30,
            displayedCount: tab === 'foryou' ? 10 : 30
          }
        }));
      }
      setLoadingTab(false);
    }
  };

  const handleLoadMore = async () => {
    const currentTab = tabData[activeTab];
    if (loadingMore || !currentTab.hasMore) return;

    const nextDisplayedCount = currentTab.displayedCount + 15;

    if (nextDisplayedCount > currentTab.products.length) {
      setLoadingMore(true);
      const nextPage = currentTab.page + 1;
      let dataItems: Product[] = [];
      let newHasMore = false;

      if (activeTab === 'foryou' || activeTab === 'combo') {
        // Recommendation and Combo API don't support pagination currently, so we simulate end of list
        newHasMore = false;
      } else {
        let sortBy = "CreatedAt", sortDir = "desc", hasDiscount = false;
        if (activeTab === 'bestseller') { sortBy = "BestSeller"; sortDir = "desc"; }
        if (activeTab === 'newest') { sortBy = "CreatedAt"; sortDir = "desc"; }
        if (activeTab === 'discount') { sortBy = "Price"; sortDir = "asc"; hasDiscount = true; }
        if (activeTab === 'all') { sortBy = "CreatedAt"; sortDir = "desc"; }

        const data = await getProducts(nextPage, 30, "", undefined, sortBy, sortDir, hasDiscount);
        dataItems = data?.items || [];
        newHasMore = dataItems.length >= 30;
      }

      if (dataItems.length > 0) {
        setTabData(prev => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            products: [...prev[activeTab].products, ...dataItems],
            page: nextPage,
            hasMore: newHasMore,
            displayedCount: nextDisplayedCount
          }
        }));
      } else {
        setTabData(prev => ({
          ...prev,
          [activeTab]: { ...prev[activeTab], hasMore: false, displayedCount: currentTab.products.length }
        }));
      }
      setLoadingMore(false);
    } else {
      setTabData(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], displayedCount: nextDisplayedCount }
      }));
    }
  };

  return (
    <>
        {/* Ưu Đãi Mới */}
        {publicVouchers.length > 0 && (
          <HomeVoucherBlock 
            vouchers={publicVouchers} 
            onCollectSuccess={(id) => setPublicVouchers(prev => prev.filter(v => v.voucherID !== id))} 
          />
        )}
        {/* Các Chương Trình Flash Sale Thực Tế */}
        {loadingFlash ? (
          <div className="bg-white rounded-[10px] shadow-sm p-5 md:p-6 mb-2">
            <p className="text-slate-500 text-sm">Đang tải chương trình Flash Sale...</p>
          </div>
        ) : (flashSaleCampaigns.length > 0 || publicVouchers.length > 0) ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 items-stretch">
          {flashSaleCampaigns.slice(0, visibleCampaignsCount).map((campaign, index) => (
            <div key={campaign.campaignId || `campaign-${index}`} className={campaign.flashSaleItems.length <= 2 ? "col-span-1" : "col-span-1 lg:col-span-2"}>
              <FlashSaleCampaignBlock campaign={campaign} />
            </div>
          ))}
        </div>
        {visibleCampaignsCount < flashSaleCampaigns.length && (
          <div className="flex justify-center mb-6 -mt-4">
            <button
              onClick={() => setVisibleCampaignsCount(prev => prev + 3)}
              className="bg-white border-2 border-orange-500 text-orange-500 font-bold py-1.5 px-10 rounded-[8px] hover:bg-orange-50 transition-colors shadow-sm text-sm"
            >
              Xem thêm chương trình khác
            </button>
          </div>
        )}
      </>
        ) : null}

      {/* Sản phẩm Bán Chạy */}
      <div className="bg-white rounded-[10px] shadow-sm px-5 pt-5 pb-1 md:px-6 md:pt-6 md:pb-2 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-slate-800">🔥 Top 10 Bán Chạy Nhất</h3>
        </div>
        {loadingBest ? (
          <p className="text-slate-500 text-sm">Đang tải sản phẩm...</p>
        ) : bestSellerProducts.length > 0 ? (
          <ProductCarousel products={bestSellerProducts} />
        ) : (
          <p className="text-slate-500 text-sm">Chưa có sản phẩm nào.</p>
        )}
      </div>

      {/* Sản phẩm Được Yêu Thích Nhất */}
      <div className="bg-white rounded-[10px] shadow-sm px-5 pt-5 pb-1 md:px-6 md:pt-6 md:pb-2 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-slate-800">💖 Top Sản Phẩm Được Yêu Thích Nhất</h3>
        </div>
        {loadingBest ? (
          <p className="text-slate-500 text-sm">Đang tải sản phẩm...</p>
        ) : topWishlistProducts.length > 0 ? (
          <ProductCarousel products={topWishlistProducts} />
        ) : (
          <p className="text-slate-500 text-sm">Chưa có sản phẩm nào.</p>
        )}
      </div>



      {/* Tab Sản Phẩm */}
      <div className="bg-white rounded-[10px] shadow-sm mb-6">
        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-100 overflow-x-auto hide-scrollbar sticky top-16 bg-white z-40 rounded-t-[10px] shadow-sm px-2 sm:px-4">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 min-w-[100px] sm:min-w-[120px] py-2.5 px-2 flex flex-col items-center gap-1 border-b-[3px] transition-all duration-300 ${activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <LayoutGrid size={18} className={`transition-all duration-300 ${activeTab === 'all' ? 'text-primary scale-110' : 'text-slate-400'}`} />
            <span className="font-bold text-[13px] whitespace-nowrap tracking-wide">Tất Cả</span>
          </button>
          <button
            onClick={() => handleTabChange('foryou')}
            className={`flex-1 min-w-[100px] sm:min-w-[120px] py-2.5 px-2 flex flex-col items-center gap-1 border-b-[3px] transition-all duration-300 ${activeTab === 'foryou' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Heart size={18} className={`transition-all duration-300 ${activeTab === 'foryou' ? 'text-primary scale-110' : 'text-slate-400'}`} />
            <span className="font-bold text-[13px] whitespace-nowrap tracking-wide">Dành Cho Bạn</span>
          </button>
          <button
            onClick={() => handleTabChange('bestseller')}
            className={`flex-1 min-w-[100px] sm:min-w-[120px] py-2.5 px-2 flex flex-col items-center gap-1 border-b-[3px] transition-all duration-300 ${activeTab === 'bestseller' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Flame size={18} className={`transition-all duration-300 ${activeTab === 'bestseller' ? 'text-primary scale-110' : 'text-slate-400'}`} />
            <span className="font-bold text-[13px] whitespace-nowrap tracking-wide">Bán Chạy</span>
          </button>
          <button
            onClick={() => handleTabChange('newest')}
            className={`flex-1 min-w-[100px] sm:min-w-[120px] py-2.5 px-2 flex flex-col items-center gap-1 border-b-[3px] transition-all duration-300 ${activeTab === 'newest' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Sparkles size={18} className={`transition-all duration-300 ${activeTab === 'newest' ? 'text-primary scale-110' : 'text-slate-400'}`} />
            <span className="font-bold text-[13px] whitespace-nowrap tracking-wide">Mới Ra Mắt</span>
          </button>
          <button
            onClick={() => handleTabChange('discount')}
            className={`flex-1 min-w-[100px] sm:min-w-[120px] py-2.5 px-2 flex flex-col items-center gap-1 border-b-[3px] transition-all duration-300 ${activeTab === 'discount' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Tag size={18} className={`transition-all duration-300 ${activeTab === 'discount' ? 'text-primary scale-110' : 'text-slate-400'}`} />
            <span className="font-bold text-[13px] whitespace-nowrap tracking-wide">Ưu Đãi</span>
          </button>
          <button
            onClick={() => handleTabChange('combo')}
            className={`flex-1 min-w-[100px] sm:min-w-[120px] py-2.5 px-2 flex flex-col items-center gap-1 border-b-[3px] transition-all duration-300 ${activeTab === 'combo' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Package size={18} className={`transition-all duration-300 ${activeTab === 'combo' ? 'text-primary scale-110' : 'text-slate-400'}`} />
            <span className="font-bold text-[13px] whitespace-nowrap tracking-wide">Combo Tiết Kiệm</span>
          </button>
        </div>

        <div className="p-5 md:p-6 min-h-[400px]">
          {loadingTab ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
                {tabData[activeTab].products.slice(0, tabData[activeTab].displayedCount).map((p, index) => (
                  <ProductCard key={`${p.id}-${index}`} product={p} />
                ))}
              </div>

              {(tabData[activeTab].hasMore || tabData[activeTab].displayedCount < tabData[activeTab].products.length) ? (
                <div className="flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="border-2 border-primary text-primary font-bold py-2 px-12 rounded-[8px] hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Đang tải...' : 'Xem thêm'}
                  </button>
                </div>
              ) : tabData[activeTab].products.length === 0 ? (
                <p className="text-center text-slate-500 py-10">Chưa có sản phẩm nào.</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Sản phẩm đã xem */}
      <div className="mb-6">
        <RecentlyViewedProducts limit={10} />
      </div>
    </>
  );
}

// Sub-components
function FlashSaleCampaignBlock({ campaign }: { campaign: FlashSaleCampaign }) {
  const defaultDisplay = campaign.flashSaleItems.length <= 2 ? 2 : 4;
  const [displayedCount, setDisplayedCount] = useState(defaultDisplay);
  const [timeText, setTimeText] = useState("");

  const products: Product[] = campaign.flashSaleItems.map(item => ({
    id: item.productId || item.referenceId,
    name: item.itemName || "Sản phẩm Flash Sale",
    description: "",
    price: item.originalPrice,
    discountPrice: item.discountPrice,
    image: item.imageUrl,
    categoryId: 0,
    inStock: (item.totalQuantity - item.soldQuantity) > 0,
    quantity: item.totalQuantity - item.soldQuantity,
    limitExceeded: (item.maxQuantityPerUser || 0) > 0 && (item.userPurchasedQuantity || 0) >= (item.maxQuantityPerUser || 0),
  }));

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const startTime = new Date(campaign.startTime);
      const endTime = new Date(campaign.endTime);

      let targetTime: Date | null = null;
      let prefix = "";

      if (campaign.status === 0 || startTime > now) {
        targetTime = startTime;
        prefix = "Bắt đầu sau:";
      } else if (campaign.status === 1 || (startTime <= now && endTime >= now)) {
        targetTime = endTime;
        prefix = "Kết thúc sau:";
      } else {
        setTimeText("Đã kết thúc");
        return;
      }

      const diff = targetTime.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeText(prefix === "Bắt đầu sau:" ? "Đang diễn ra" : "Đã kết thúc");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days} ngày`);
      parts.push(`${hours.toString().padStart(2, '0')} giờ`);
      parts.push(`${minutes.toString().padStart(2, '0')} phút`);
      parts.push(`${seconds.toString().padStart(2, '0')} giây`);

      setTimeText(`${prefix} ${parts.join(" ")}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [campaign.startTime, campaign.endTime, campaign.status]);

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-[10px] shadow-sm pt-3 px-3 md:pt-4 md:px-4 pb-1 border border-rose-100 relative overflow-hidden h-full flex flex-col">
      {/* Nền trang trí */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-100/50 to-orange-100/50 rounded-bl-[60px] -z-10 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 border-b border-rose-50 pb-2">
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <span className="text-orange-500 animate-pulse text-base">⚡</span> {campaign.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeText.includes('Đã kết thúc') ? 'bg-slate-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${timeText.includes('Đã kết thúc') ? 'bg-slate-500' : 'bg-rose-500'}`}></span>
            </span>
            <p className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-orange-500">
              {timeText}
            </p>
          </div>
        </div>
      </div>
      <div className={`grid gap-2 md:gap-3 mb-0 flex-grow ${products.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
        {products.slice(0, displayedCount).map((p, index) => (
          <div key={`${p.id}-${index}`} className="scale-95 origin-top mb-[-5%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {displayedCount < products.length && (
        <div className="flex justify-center mt-2 mb-2">
          <button
            onClick={() => setDisplayedCount(prev => prev + (products.length <= 2 ? 2 : 4))}
            className="border border-rose-500 text-rose-500 font-bold py-1 px-6 rounded-[8px] hover:bg-rose-50 transition-colors shadow-sm text-xs"
          >
            Xem thêm
          </button>
        </div>
      )}
    </div>
  );
}

function UtilityIcon({ icon, color, label, badge, href }: any) {
  const content = (
    <>
      <div className={`relative w-14 h-14 rounded-full ${color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
        {icon}
        {badge && (
          <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/3 bg-yellow-400 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-semibold text-center text-slate-700 leading-tight w-full break-words">
        {label}
      </span>
    </>
  );

  if (href) {
    if (href.startsWith('tel:')) {
      return (
        <a href={href} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[64px] w-[72px] lg:w-[88px] shrink-0 md:shrink hover:opacity-90">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[64px] w-[72px] lg:w-[88px] shrink-0 md:shrink hover:opacity-90">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group min-w-[64px] w-[72px] lg:w-[88px] shrink-0 md:shrink hover:opacity-90">
      {content}
    </div>
  );
}


function BrandPromoCard({ brand, desc, color }: any) {
  return (
    <div className="border border-slate-100 rounded-[10px] p-4 hover:shadow-md transition-all cursor-pointer bg-white text-center flex flex-col items-center">
      <div className="w-20 h-20 mb-3 bg-slate-50 rounded-full flex items-center justify-center">
        <span className={`font-black text-xl italic tracking-tighter ${color}`}>{brand}</span>
      </div>
      <div className="border border-slate-200 rounded-full py-1 px-4 mb-2 shadow-sm bg-white">
        <span className={`font-black italic text-lg ${color}`}>{brand}</span>
      </div>
      <p className="text-sm font-bold text-slate-700 leading-tight">
        <span className="text-orange-500 mr-1">🔥</span>
        {desc}
      </p>
    </div>
  );
}

function HomeVoucherBlock({ vouchers, onCollectSuccess }: { vouchers: Voucher[], onCollectSuccess: (id: number) => void }) {
  const displayVouchers = vouchers.slice(0, 3);

  const handleCollect = async (id: number) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      toast.error('Vui lòng đăng nhập để lưu voucher!');
      return;
    }
    const res = await collectVoucher(id);
    if (res.success) {
      toast.success(res.message);
      onCollectSuccess(id);
    } else {
      toast.error(res.message);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="bg-white rounded-[10px] shadow-sm p-5 md:p-6 mb-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
          <Gift className="text-orange-500 animate-bounce" size={24} /> Ưu Đãi Mới Cho Bạn
        </h3>
        <Link href="/vouchers" className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1">
          Xem tất cả <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayVouchers.map(voucher => (
          <div key={voucher.voucherID} className="relative flex bg-white rounded-[10px] shadow-sm border border-slate-200 overflow-hidden group hover:border-orange-300 hover:shadow-md transition-all">
            <div className="w-[100px] shrink-0 bg-gradient-to-br from-orange-500 to-rose-500 text-white p-2 flex flex-col justify-center items-center text-center border-r-2 border-dashed border-slate-100 relative">
              <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-50 rounded-full border-r border-slate-200"></div>
              <Ticket size={24} className="mb-1 opacity-90" />
              <div className="font-black text-lg tracking-tight leading-none mb-1 break-all">
                {voucher.discountType === 1 ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue).replace('₫', 'đ')}
              </div>
              <div className="text-[10px] text-orange-100 font-bold uppercase tracking-wide">
                {voucher.voucherType === 1 ? 'Giảm SP' : 'Freeship'}
              </div>
            </div>

            <div className="flex-1 p-3 flex flex-col justify-between relative bg-white">
              <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-50 rounded-full border-l border-slate-200"></div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm line-clamp-1 pr-2 leading-tight">{voucher.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Đơn từ {formatCurrency(voucher.minOrderValue)}</p>
                <p className="text-[11px] text-slate-400 mt-1">HSD: {formatDate(voucher.endDate)}</p>
              </div>
              
              <div className="mt-2 flex justify-between items-end gap-2 pr-2">
                <div className="flex-1 max-w-[80px]">
                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (voucher.usedQuantity / voucher.totalQuantity) * 100)}%` }} />
                   </div>
                   <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">Đã dùng {Math.round((voucher.usedQuantity / voucher.totalQuantity) * 100)}%</p>
                </div>
                <button 
                  onClick={() => handleCollect(voucher.voucherID)}
                  disabled={voucher.isCollected}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    voucher.isCollected ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {voucher.isCollected ? 'Đã lưu' : 'Lưu Ngay'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


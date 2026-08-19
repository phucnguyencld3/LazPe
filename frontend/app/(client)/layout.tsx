"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import HeaderV2 from "@/components/client/layout/HeaderV2";
import { Footer } from "@/components/client/layout/Footer";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import { CompareProvider } from "@/context/CompareContext";
import { CompareFloatingBar } from "@/components/client/compare/CompareFloatingBar";
import CustomerChatWidget from "@/components/client/CustomerChatWidget";
import ScrollToTopButton from "@/components/client/layout/ScrollToTopButton";
import { useBanners } from "@/hooks/useBanners";
import { BannerRenderer } from "@/components/shared/banner/BannerRenderer";
import { AffiliateRefTracker } from "@/components/client/AffiliateRefTracker";

function GlobalPromoBanner() {
  const { banners } = useBanners("promo");
  if (!banners || banners.length === 0) return null;
  return (
    <div className="w-full z-50 relative">
      {banners.map(b => <BannerRenderer key={b.id || 'preview'} banner={b} />)}
    </div>
  );
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const isAuthPage = [
    '/login', 
    '/register', 
    '/forgot-password', 
    '/reset-password',
    '/verify-otp'
  ].includes(pathname);

  // Sync route changes to Admin Live Preview
  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'ROUTE_CHANGE', pathname }, '*');
    }
  }, [pathname]);

  return (
    <WishlistProvider>
      <CartProvider>
        <CompareProvider>
          <Suspense fallback={null}>
            <AffiliateRefTracker />
          </Suspense>
          <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            {!isAuthPage && <GlobalPromoBanner />}
            <HeaderV2 />
            <main className={`flex-grow ${isAuthPage ? "w-full flex flex-col h-screen overflow-hidden" : "w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-[110px] sm:mt-20 mb-12"}`}>
              {children}
            </main>
            {!isAuthPage && <CustomerChatWidget />}
            {!isAuthPage && <ScrollToTopButton />}
            {!isAuthPage && <Footer />}
            {!isAuthPage && <CompareFloatingBar />}
          </div>
        </CompareProvider>
      </CartProvider>
    </WishlistProvider>
  );
}

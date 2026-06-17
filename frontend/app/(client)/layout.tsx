"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import HeaderV2 from "@/components/client/layout/HeaderV2";
import { Footer } from "@/components/client/layout/Footer";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import CustomerChatWidget from "@/components/client/CustomerChatWidget";
import ScrollToTopButton from "@/components/client/layout/ScrollToTopButton";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <WishlistProvider>
      <CartProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <HeaderV2 />
          <main className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-[110px] sm:mt-20 mb-12">
            {children}
          </main>
          <CustomerChatWidget />
          <ScrollToTopButton />
          <Footer />
        </div>
      </CartProvider>

    </WishlistProvider>
  );
}

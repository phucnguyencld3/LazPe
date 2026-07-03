"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "@/components/client/layout/Header";
import { Footer } from "@/components/client/layout/Footer";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import CustomerChatWidget from "@/components/client/CustomerChatWidget";
import { getValidToken } from "@/lib/utils/auth";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <WishlistProvider>
      <CartProvider>
        <div className="min-h-screen bg-white text-slate-900 client-scaled-layout">
          <Header />
          <main className="pt-20 w-full">{children}</main>
          <CustomerChatWidget />
          <Footer />
        </div>
      </CartProvider>
    </WishlistProvider>
  );
}
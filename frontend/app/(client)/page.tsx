"use client";

import { useEffect, useState } from "react";
import { Product, Voucher } from "@/types";
import { getProducts, getPublicVouchers, collectVoucher } from "@/lib/api";
import { toast } from "@/lib/toast";

import { HeroSection } from "@/components/client/home/HeroSection";
import { VoucherSection } from "@/components/client/home/VoucherSection";
import { ProductSection } from "@/components/client/home/ProductSection";
import { CTASection } from "@/components/client/home/CTASection";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    setIsLoggedIn(!!token);

    const fetchData = async () => {
      // Fetch products (fetch 10 to display 2 full rows of 5 cards on desktop)
      setLoadingProducts(true);
      const productsData = await getProducts(1, 10);
      if (productsData) {
        setProducts(productsData.items || []);
      }
      setLoadingProducts(false);

      // Fetch vouchers
      setLoadingVouchers(true);
      const vouchersData = await getPublicVouchers();
      if (vouchersData) {
        setVouchers(vouchersData);
      }
      setLoadingVouchers(false);
    };

    fetchData();
  }, []);

  const handleCollectVoucher = async (voucherId: number) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để lưu voucher!");
      window.location.href = "/login";
      return;
    }

    const result = await collectVoucher(voucherId);
    if (result.success) {
      toast.success("Lưu voucher thành công!");
      setVouchers((prev) =>
        prev.map((v) => (v.voucherID === voucherId ? { ...v, isCollected: true } : v))
      );
    } else {
      toast.error(result.message || "Lưu voucher thất bại!");
    }
  };

  return (
    <>
      <HeroSection />

      <VoucherSection
        vouchers={vouchers}
        loadingVouchers={loadingVouchers}
        handleCollectVoucher={handleCollectVoucher}
      />

      <ProductSection
        products={products}
        loadingProducts={loadingProducts}
      />

      <CTASection isLoggedIn={isLoggedIn} />
    </>
  );
}
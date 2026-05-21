"use client";

import { useEffect, useState } from "react";
import { Product, Voucher } from "@/types";
import { getProducts, getPublicVouchers, collectVoucher } from "@/lib/api";
import ProductCard from "@/app/components/ProductCard";
import { ChevronRight, Loader } from "lucide-react";
import Link from "next/link";

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
      alert("Vui lòng đăng nhập để lưu voucher!");
      window.location.href = "/login";
      return;
    }

    const result = await collectVoucher(voucherId);
    if (result.success) {
      alert("Lưu voucher thành công!");
      setVouchers((prev) =>
        prev.map((v) => (v.voucherID === voucherId ? { ...v, isCollected: true } : v))
      );
    } else {
      alert(result.message || "Lưu voucher thất bại!");
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 via-rose-50 to-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
              Chào mừng đến LazPe
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
              Những khoảnh khắc <br />
              <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                đầy yêu thương
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Khám phá bộ sưu tập độc đáo được tuyển chọn đặc biệt cho những em bé yêu quý của bạn
          </p>
          <div className="pt-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-rose-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-rose-700 transition-colors"
            >
              Khám phá sản phẩm
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Vouchers Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl space-y-12">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Ưu đãi LazPe dành cho bạn</h2>
            <p className="text-slate-600">Lưu ngay các mã giảm giá hấp dẫn nhất để mua sắm tiết kiệm hơn</p>
          </div>

          {loadingVouchers ? (
            <div className="flex justify-center py-12">
              <Loader className="animate-spin text-rose-600" size={32} />
            </div>
          ) : vouchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vouchers.map((voucher) => (
                <div 
                  key={voucher.voucherID} 
                  className="bg-gradient-to-br from-rose-50/70 to-pink-50/70 rounded-2xl p-5 border border-rose-100/80 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Decorative circles on sides */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-white border border-rose-100/80 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white border border-rose-100/80 -translate-y-1/2"></div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {voucher.discountType === 1 ? "Mã Phần Trăm" : "Mã Giảm Tiền"}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Mã: {voucher.code}</span>
                    </div>
                    
                    <h3 className="font-bold text-slate-950 text-xl tracking-tight">
                      {voucher.discountType === 1 
                        ? `Giảm ${voucher.discountValue}%` 
                        : `Giảm ${voucher.discountValue.toLocaleString("vi-VN")}₫`}
                    </h3>
                    
                    <p className="text-sm font-medium text-slate-700">
                      {voucher.name}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-rose-200/80 my-4"></div>

                  <div className="space-y-4">
                    <div className="space-y-1 text-xs text-slate-500">
                      <p>Đơn tối thiểu: <span className="font-semibold text-slate-700">₫{voucher.minOrderValue.toLocaleString("vi-VN")}</span></p>
                      {voucher.discountType === 1 && voucher.maxDiscount > 0 && (
                        <p>Giảm tối đa: <span className="font-semibold text-slate-700">₫{voucher.maxDiscount.toLocaleString("vi-VN")}</span></p>
                      )}
                      <p>Hạn sử dụng: <span className="font-semibold text-slate-700">{new Date(voucher.endDate).toLocaleDateString("vi-VN")}</span></p>
                    </div>

                    <button
                      onClick={() => handleCollectVoucher(voucher.voucherID)}
                      disabled={voucher.isCollected}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 duration-200 flex items-center justify-center ${
                        voucher.isCollected
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow"
                      }`}
                    >
                      {voucher.isCollected ? "Đã lưu" : "Lưu mã"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-600 py-8">Hiện không có mã giảm giá nào</p>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">Sản phẩm nổi bật</h2>
              <p className="text-slate-600">Những sản phẩm được yêu thích nhất tháng này</p>
            </div>
            <Link
              href="/products"
              className="hidden md:flex items-center gap-2 text-rose-600 font-semibold hover:text-rose-700 transition-colors"
            >
              Xem tất cả
              <ChevronRight size={20} />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <Loader className="animate-spin text-rose-600" size={32} />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-600 py-8">Không có sản phẩm nào</p>
          )}

          <div className="text-center md:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-rose-600 font-semibold hover:text-rose-700 transition-colors"
            >
              Xem tất cả sản phẩm
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          {isLoggedIn ? (
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-12 text-white text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Cảm ơn bạn đã đồng hành cùng LazPe!</h2>
              <p className="text-white/90 text-lg max-w-[600px] mx-auto">
                Chúc bạn có những trải nghiệm mua sắm tuyệt vời nhất. Nhấn vào bên dưới để tiếp tục khám phá hàng loạt sản phẩm mới vừa lên kệ.
              </p>
              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-white text-rose-600 px-8 py-3.5 rounded-full font-bold hover:bg-slate-50 transition-colors shadow active:scale-95 duration-200"
                >
                  Tiếp tục mua sắm
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-12 text-white text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Đăng ký nhận thông tin ưu đãi</h2>
              <p className="text-white/90 text-lg">
                Nhận các mã giảm giá độc quyền và cập nhật sản phẩm mới đầu tiên
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white"
                />
                <button className="px-8 py-3 bg-white text-rose-600 font-semibold rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap">
                  Đăng ký
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Product, Category } from "@/types";
import { getProducts, getCategories } from "@/lib/api";
import ProductCard from "@/app/components/ProductCard";
import CategoryCard from "@/app/components/CategoryCard";
import { ChevronRight, Loader } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch products
      setLoadingProducts(true);
      const productsData = await getProducts(1, 8);
      if (productsData) {
        setProducts(productsData.items || []);
      }
      setLoadingProducts(false);

      // Fetch categories
      setLoadingCategories(true);
      const categoriesData = await getCategories();
      if (categoriesData) {
        setCategories(categoriesData);
      }
      setLoadingCategories(false);
    };

    fetchData();
  }, []);

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

      {/* Categories Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl space-y-12">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Danh mục sản phẩm</h2>
            <p className="text-slate-600">Tìm kiếm theo loại sản phẩm yêu thích</p>
          </div>

          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <Loader className="animate-spin text-rose-600" size={32} />
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, idx) => (
                <CategoryCard key={category.id} category={category} index={idx} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-600 py-8">Không có danh mục nào</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </section>
    </>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPublicBundleDetail, BundleResponse } from "@/lib/features/combo/comboApi";
import { getBundlesAsProducts, getRecommendations } from "@/lib/api";
import { Product } from "@/types";
import ProductCarousel from "@/components/client/products/ProductCarousel";
import { useCart } from "@/context/CartContext";
import { ArrowLeft, ShoppingCart, Minus, Plus, Sparkles, Package } from "lucide-react";
import { toast } from "@/lib/toast";

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bundleId = Number(params?.id);
  const [bundle, setBundle] = useState<BundleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [similarBundles, setSimilarBundles] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!bundleId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getPublicBundleDetail(bundleId);
        if (data) {
          setBundle(data);
          
          // Fetch additional data in parallel
          const [bundlesRes, recommendedRes] = await Promise.all([
            getBundlesAsProducts(),
            getRecommendations(15)
          ]);
          
          // Filter out the current bundle
          setSimilarBundles(bundlesRes.filter(b => b.id !== bundleId).slice(0, 10));
          setRecommendedProducts(recommendedRes.slice(0, 15));
        } else {
          setError("Không tìm thấy thông tin Combo.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Lỗi khi tải thông tin Combo.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bundleId]);

  const handleDecreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncreaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleQuantityChange = (val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) setQuantity(num);
    else if (val === "") setQuantity(0);
  };

  const handleAddToCart = async () => {
    const finalQuantity = quantity === 0 ? 1 : quantity;
    const hasToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!hasToken) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      router.push("/login");
      return;
    }

    try {
      setIsAddingToCart(true);
      const res = await addToCart({ bundleID: bundleId, quantity: finalQuantity });
      if (res.success) {
        toast.success(`Đã thêm ${finalQuantity} Combo vào giỏ hàng!`);
        if (quantity === 0) setQuantity(1);
      } else {
        toast.error(res.message || "Không thể thêm Combo vào giỏ hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối mạng");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const finalQuantity = quantity === 0 ? 1 : quantity;
    const hasToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!hasToken) {
      toast.error("Vui lòng đăng nhập để tiếp tục!");
      router.push("/login");
      return;
    }

    try {
      setIsAddingToCart(true);
      const res = await addToCart({ bundleID: bundleId, quantity: finalQuantity });
      if (res.success) {
        router.push("/cart");
      } else {
        toast.error(res.message || "Lỗi khi thêm vào giỏ hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối mạng");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Đang tải chi tiết Combo...</p>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-20 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-[28rem] w-full">
          <p className="text-red-500 font-bold text-lg mb-4">{error || "Combo không tồn tại."}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold shadow hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-4 sm:py-6 px-0 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white sm:rounded-[16px] sm:border border-slate-100 sm:shadow-sm overflow-hidden mb-3 sm:mb-3">
          <div className="px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:pt-4 pb-0">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors bg-white px-3 py-1.5 rounded-[8px] border border-slate-200 shadow-sm hover:shadow active:scale-95"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[42%_1fr] gap-6 lg:gap-10 p-4 sm:p-6 lg:p-8 pt-2 sm:pt-3 lg:pt-3">
            
            {/* Left: Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-[12px] bg-slate-100 overflow-hidden border border-slate-100">
                {bundle.imageUrl ? (
                  <img
                    src={bundle.imageUrl}
                    alt={bundle.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <span className="text-slate-400 text-sm">Không có hình ảnh</span>
                  </div>
                )}
                {bundle.discountPercent > 0 && (
                  <div className="absolute top-4 left-4 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10">
                    -{bundle.discountPercent}%
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col">
              <div className="mb-2 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-rose-100 text-rose-600 rounded text-xs font-bold uppercase tracking-wider">
                  Combo Tiết Kiệm
                </span>
                {bundle.stock !== undefined && (
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold ${bundle.stock > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {bundle.stock > 0 ? `Còn ${bundle.stock} Combo` : "Hết hàng"}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                {bundle.name}
              </h1>

              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1">Giá combo</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-rose-600">
                      ₫{bundle.price.toLocaleString("vi-VN")}
                    </span>
                    {bundle.originalPrice > bundle.price && (
                      <span className="text-sm text-slate-400 line-through">
                        ₫{bundle.originalPrice.toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>
                {bundle.originalPrice > bundle.price && (
                  <div className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 h-fit">
                    Tiết kiệm {bundle.discountPercent}%
                  </div>
                )}
              </div>

              {/* Description */}
              {bundle.description && (
                <div className="text-slate-600 text-sm mb-6 whitespace-pre-wrap leading-relaxed">
                  {bundle.description}
                </div>
              )}

              {/* Bundle Items */}
              {bundle.items && bundle.items.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
                    <span>Sản phẩm trong Combo</span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{bundle.items.length} mục</span>
                  </h3>
                  <div className="space-y-3">
                    {bundle.items.map((item) => (
                      <div key={item.bundleItemID} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart size={16} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate" title={item.productName}>{item.productName}</p>
                          {item.variantName && item.variantName !== "Default" && (
                            <p className="text-xs text-slate-500 truncate mt-0.5" title={item.variantName}>Phân loại: {item.variantName}</p>
                          )}
                        </div>
                        <div className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          x{item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4 pt-6 border-t border-slate-100 mt-auto">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Quantity */}
                  <div className="flex items-center justify-between w-full sm:w-28 h-10 sm:h-11 bg-slate-50/80 rounded-[6px] px-3 border border-slate-200 hover:border-slate-300 transition-colors">
                    <button
                      onClick={handleDecreaseQuantity}
                      disabled={quantity <= 1 || (bundle.stock !== undefined && bundle.stock === 0)}
                      className="text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors p-1"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={quantity === 0 ? "" : quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      onBlur={() => { if (quantity === 0) setQuantity(1); }}
                      disabled={bundle.stock !== undefined && bundle.stock === 0}
                      className="font-bold text-slate-800 text-sm w-10 text-center bg-transparent border-none outline-none focus:ring-0 p-0 disabled:opacity-50"
                    />
                    <button
                      onClick={handleIncreaseQuantity}
                      disabled={(bundle.stock !== undefined && quantity >= bundle.stock) || (bundle.stock !== undefined && bundle.stock === 0)}
                      className="text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors p-1"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Add to cart / Buy now */}
                  <div className="flex w-full gap-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || (bundle.stock !== undefined && bundle.stock === 0)}
                      className="w-1/2 h-10 sm:h-11 rounded-[8px] border border-primary text-primary font-bold flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 hover:bg-rose-50 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isAddingToCart ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <ShoppingCart size={16} className="sm:w-[18px] sm:h-[18px]" />
                          <span className="truncate">Thêm giỏ hàng</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={isAddingToCart || (bundle.stock !== undefined && bundle.stock === 0)}
                      className="w-1/2 h-10 sm:h-11 rounded-[8px] bg-primary text-white font-bold flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                    >
                      <span className="truncate">Mua ngay</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Similar Bundles Section */}
        {similarBundles.length > 0 && (
          <section className="mt-3">
            <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Combo tương tự
            </h2>
            <ProductCarousel products={similarBundles} />
          </section>
        )}

        {/* Recommended Products Section */}
        {recommendedProducts.length > 0 && (
          <section className="mt-3 pt-3 border-t border-slate-100">
            <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              Sản phẩm dành cho bạn
            </h2>
            <ProductCarousel products={recommendedProducts} />
          </section>
        )}
      </div>
    </div>
  );
}

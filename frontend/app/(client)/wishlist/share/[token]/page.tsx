"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Heart, Gift, ShoppingCart, ArrowRight, Loader2, Info, Check } from "lucide-react";
import { getPublicWishlist, addToCart } from "@/lib/api";
import { toast } from "@/lib/toast";

export default function PublicWishlistPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchPublicWishlist = async () => {
      setLoading(true);
      try {
        const res = await getPublicWishlist(token);
        if (res && res.success) {
          setOwnerName(res.ownerName);
          setOwnerId(res.ownerId);
          setWishlistItems(res.data);
        } else {
          setError(res?.message || "Danh sách yêu thích không tồn tại hoặc đã bị đóng chia sẻ.");
        }
      } catch (err) {
        console.error(err);
        setError("Lỗi kết nối đến hệ thống. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicWishlist();
  }, [token]);

  const handleBuyGift = async (product: any) => {
    const userToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!userToken) {
      toast.error("Vui lòng đăng nhập tài khoản của bạn để mua tặng quà!");
      router.push(`/login?redirect=/wishlist/share/${token}`);
      return;
    }

    setAddingItemId(product.id);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api"}/Product/${product.id}`);
      const productDetail = await response.json();
      
      let variantID: number | undefined;
      if (productDetail && productDetail.variants && productDetail.variants.length > 0) {
        const availableVariant = productDetail.variants.find((v: any) => v.stock > 0) || productDetail.variants[0];
        variantID = availableVariant.variantID;
      }

      if (!variantID) {
        toast.error("Sản phẩm hiện tại đã hết hàng hoặc không có sẵn biến thể!");
        return;
      }

      const res = await addToCart(userToken, {
        variantID,
        quantity: 1,
        fromWishlistUserId: ownerId
      });

      if (res.success) {
        toast.success(`Đã thêm "${product.name}" vào giỏ hàng của bạn dưới dạng quà tặng cho ${ownerName}!`);
        window.dispatchEvent(new Event("cart_updated"));
      } else {
        toast.error(res.message || "Không thể thêm vào giỏ hàng.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi thêm quà tặng vào giỏ hàng.");
    } finally {
      setAddingItemId(null);
    }
  };

  const getPriorityColor = (pr: string) => {
    switch (pr) {
      case "High":
        return "bg-rose-50 border-rose-200 text-rose-600 animate-pulse";
      case "Low":
        return "bg-slate-50 border-slate-200 text-slate-600";
      default:
        return "bg-amber-50 border-amber-200 text-amber-600";
    }
  };

  const getPriorityLabel = (pr: string) => {
    switch (pr) {
      case "High":
        return "Ưu tiên: Cao";
      case "Low":
        return "Ưu tiên: Thấp";
      default:
        return "Ưu tiên: Trung bình";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-200 border-t-rose-500 mb-4"></div>
        <p className="text-slate-500 font-semibold text-sm">Đang tải danh sách quà tặng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 border border-rose-100 mb-4 shadow-sm">
          <Info size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Đường dẫn không hợp lệ</h2>
        <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">{error}</p>
        <Link href="/" className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-all shadow-sm">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] pb-16">
      {/* Visual greeting banner */}
      <section className="bg-gradient-to-br from-[#ffd9de]/40 via-white to-[#fafbfc] border-b border-slate-100 py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffccd3_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-rose-200 bg-white shadow-md mb-4 text-rose-500">
            <Gift className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-3">
            Danh Sách Quà Tặng
          </h1>
          <p className="text-lg md:text-xl font-bold text-rose-600 mb-2">
            Ý tưởng quà tặng của {ownerName}
          </p>
          <p className="max-w-xl mx-auto text-sm text-slate-500 leading-relaxed">
            Chọn một món quà từ danh sách yêu thích của {ownerName} để mua tặng làm quà nhân ngày đặc biệt. Tiến trình sẽ được cập nhật tự động khi bạn mua thành công!
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm max-w-2xl mx-auto">
            <Heart size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">Danh sách trống</h3>
            <p className="text-slate-500 text-sm">Hiện tại chủ danh sách chưa thêm sản phẩm nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((product) => {
              const needed = product.quantityNeeded || 1;
              const purchased = product.quantityPurchased || 0;
              const progress = Math.min(100, Math.round((purchased / needed) * 100));
              const isFulfilled = purchased >= needed;

              return (
                <div key={product.id} className="group bg-white border border-slate-100/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative">
                  
                  {/* Registry priority tag */}
                  {product.priority && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm ${getPriorityColor(product.priority)}`}>
                        {getPriorityLabel(product.priority)}
                      </span>
                    </div>
                  )}

                  {/* Fulfill badge overlay */}
                  {isFulfilled && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-sm border border-emerald-200">
                        <Check size={24} className="stroke-[3]" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Đã hoàn thành!</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Món quà này đã được mua tặng đủ số lượng.</p>
                    </div>
                  )}

                  <div className="p-3 flex-1 flex flex-col">
                    {/* Image */}
                    <div className="w-full aspect-square relative bg-slate-50 rounded-lg overflow-hidden mb-3">
                      <img
                        src={product.image || "/assets/img/products/default-product.jpg"}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Name */}
                    <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 min-h-[40px] mb-1">
                      {product.name}
                    </h3>
                    
                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-sm font-extrabold text-rose-500">
                        {product.discountPrice 
                          ? `${product.discountPrice.toLocaleString('vi-VN')}đ` 
                          : `${product.price.toLocaleString('vi-VN')}đ`}
                      </span>
                      {product.discountPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {product.price.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>

                    {/* Registry details section */}
                    <div className="mt-auto border-t border-slate-50 pt-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center text-xs text-slate-500 font-bold mb-1.5">
                        <span>Đã được mua tặng:</span>
                        <span className="text-rose-600 font-extrabold">{purchased} / {needed}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2 border border-slate-200/50">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {product.note ? (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2 min-h-[32px] mb-3 leading-relaxed border-l-2 border-rose-300 pl-2">
                          "{product.note}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic line-clamp-2 min-h-[32px] mb-3 leading-relaxed pl-1">
                          Chưa có ghi chú cụ thể.
                        </p>
                      )}

                      {/* Buy Action */}
                      <button
                        onClick={() => handleBuyGift(product)}
                        disabled={addingItemId === product.id}
                        className="w-full flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-450 text-white font-bold text-xs py-2 rounded-md transition-colors shadow-sm"
                      >
                        {addingItemId === product.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Đang xử lý...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={14} /> Mua tặng món này
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Cart Notice */}
        <div className="mt-12 bg-white rounded-xl p-5 border border-slate-100 shadow-md max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Bạn đã chọn xong các món quà tặng?</h4>
            <p className="text-xs text-slate-500 mt-1">Đến giỏ hàng để hoàn tất thanh toán và gửi tặng món quà đến {ownerName}.</p>
          </div>
          <Link
            href="/cart"
            className="flex items-center gap-1 bg-slate-855 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Đến giỏ hàng <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

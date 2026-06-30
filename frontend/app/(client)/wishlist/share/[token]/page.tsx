"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Heart, Gift, Info, Plus } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { getPublicWishlist, syncWishlistApi } from "@/lib/api";
import { toast } from "@/lib/toast";

export default function PublicWishlistPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { wishlist, addToWishlist } = useWishlist();

  const [ownerName, setOwnerName] = useState("");
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchPublicWishlist = async () => {
      setLoading(true);
      try {
        const res = await getPublicWishlist(token);
        if (res && res.success) {
          setOwnerName(res.ownerName);
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

  const handleAddSingleToMyWishlist = (product: any) => {
    const isAlreadyMine = wishlist.some((item) => item.id === product.id);
    if (isAlreadyMine) {
      toast.info("Sản phẩm này đã có trong danh sách yêu thích của bạn");
      return;
    }
    addToWishlist({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.image,
      inStock: product.inStock,
      categoryId: product.categoryId,
      categoryName: product.categoryName
    });
  };

  const handleAddAllToMyWishlist = async () => {
    const userToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!userToken) {
      toast.error("Vui lòng đăng nhập để đồng bộ danh sách");
      router.push(`/login?redirect=/wishlist/share/${token}`);
      return;
    }

    const myProductIds = wishlist.map((item) => item.id);
    const productIdsToAdd = wishlistItems
      .map((item) => item.id)
      .filter((id) => !myProductIds.includes(id));

    if (productIdsToAdd.length === 0) {
      toast.info("Tất cả sản phẩm đã có sẵn trong danh sách yêu thích của bạn");
      return;
    }

    try {
      const allProductIds = [...myProductIds, ...productIdsToAdd];
      const res = await syncWishlistApi(userToken, allProductIds);
      if (res && res.success) {
        toast.success(`Đã thêm thành công ${productIdsToAdd.length} sản phẩm vào danh sách yêu thích của bạn!`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error("Có lỗi xảy ra khi đồng bộ danh sách.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-200 border-t-rose-500 mb-4"></div>
        <p className="text-slate-500 font-semibold text-sm">Đang tải danh sách sản phẩm...</p>
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
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-3">
            Sản Phẩm Yêu Thích
          </h1>
          <p className="text-lg md:text-xl font-bold text-rose-600 mb-2">
            Danh sách yêu thích của {ownerName}
          </p>
          <p className="w-full max-w-[600px] mx-auto text-sm text-slate-500 leading-relaxed">
            Xem những sản phẩm yêu thích được chia sẻ bởi {ownerName}. Bạn có thể thêm những sản phẩm này vào danh sách yêu thích của riêng bạn!
          </p>
          
          {wishlistItems.length > 0 && (
            <button
              onClick={handleAddAllToMyWishlist}
              className="mt-6 inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-6 py-3 rounded-lg transition-colors shadow-md"
            >
              <Plus size={16} /> Thêm tất cả vào Yêu thích của tôi
            </button>
          )}
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
              return (
                <div key={product.id} className="group bg-white border border-slate-100/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative">
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

                    {/* Actions */}
                    <div className="mt-auto pt-3 border-t border-slate-50 flex flex-col gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="w-full text-center bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded-md transition-colors shadow-sm"
                      >
                        Xem chi tiết sản phẩm
                      </Link>

                      {!wishlist.some((item) => item.id === product.id) && (
                        <button
                          onClick={() => handleAddSingleToMyWishlist(product)}
                          className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs py-2 rounded-md border border-slate-200 transition-colors shadow-sm"
                        >
                          <Plus size={14} /> Thêm vào Yêu thích của tôi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

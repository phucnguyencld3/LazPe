"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, Copy, Check, Lock, Globe, Trash2, Search, Plus } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { getWishlistShareSettings, toggleWishlistShare, getPublicWishlist, syncWishlistApi, getWishlist } from "@/lib/api";
import { toast } from "@/lib/toast";

export default function WishlistPage() {
  const { wishlist, loading, addToWishlist, removeFromWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Friend's Wishlist State
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [friendWishlist, setFriendWishlist] = useState<any[] | null>(null);
  const [friendOwnerName, setFriendOwnerName] = useState("");
  const [isLoadingFriend, setIsLoadingFriend] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch sharing settings
    const fetchShareSettings = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        const settings = await getWishlistShareSettings(token);
        if (settings) {
          setIsPublic(settings.isWishlistPublic);
          setShareToken(settings.wishlistShareToken);
        }
      }
    };
    fetchShareSettings();
  }, []);

  const handleToggleShare = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để thực hiện");
      return;
    }

    setIsUpdatingSettings(true);
    const newStatus = !isPublic;
    try {
      const res = await toggleWishlistShare(token, newStatus);
      if (res && res.success) {
        setIsPublic(res.isWishlistPublic);
        setShareToken(res.wishlistShareToken);
        toast.success(res.message);
      } else {
        toast.error("Không thể cập nhật cấu hình chia sẻ");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleCopyCode = () => {
    if (!shareToken) return;
    navigator.clipboard.writeText(shareToken).then(() => {
      setCopied(true);
      toast.success("Đã sao chép mã chia sẻ!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Fetch Friend's Wishlist
  const handleFetchFriendWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) {
      toast.error("Vui lòng nhập mã chia sẻ");
      return;
    }

    setIsLoadingFriend(true);
    try {
      const res = await getPublicWishlist(friendCodeInput.trim());
      if (res && res.success) {
        setFriendOwnerName(res.ownerName);
        setFriendWishlist(res.data);
        toast.success(`Đã tìm thấy danh sách của ${res.ownerName}!`);
      } else {
        toast.error(res?.message || "Không tìm thấy danh sách với mã này");
        setFriendWishlist(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi kết nối đến hệ thống");
    } finally {
      setIsLoadingFriend(false);
    }
  };

  // Add Single Product from Friend to My Wishlist
  const handleAddSingleToMyWishlist = (product: any) => {
    const isAlreadyMine = wishlist.some((item) => item.id === product.id);
    if (isAlreadyMine) {
      toast.info("Sản phẩm này đã có trong danh sách yêu thích của bạn");
      return;
    }
    // Map friend product to Product type
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

  // Add All Products from Friend to My Wishlist
  const handleAddAllToMyWishlist = async () => {
    if (!friendWishlist || friendWishlist.length === 0) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đồng bộ danh sách");
      return;
    }

    // Lọc ra các sản phẩm chưa có trong danh sách yêu thích của tôi
    const myProductIds = wishlist.map((item) => item.id);
    const productIdsToAdd = friendWishlist
      .map((item) => item.id)
      .filter((id) => !myProductIds.includes(id));

    if (productIdsToAdd.length === 0) {
      toast.info("Tất cả sản phẩm đã có sẵn trong danh sách yêu thích của bạn");
      return;
    }

    try {
      // Gộp danh sách hiện tại của tôi và các sản phẩm mới
      const allProductIds = [...myProductIds, ...productIdsToAdd];
      const res = await syncWishlistApi(token, allProductIds);
      if (res && res.success) {
        toast.success(`Đã thêm thành công ${productIdsToAdd.length} sản phẩm vào danh sách yêu thích của bạn!`);
        // Refresh wishlist context
        const dbWishlist = await getWishlist(token);
        if (dbWishlist) {
          window.location.reload();
        }
      } else {
        toast.error("Có lỗi xảy ra khi đồng bộ danh sách.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    }
  };

  if (!mounted || loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <section className="bg-gradient-to-br from-[#ffd9de]/30 via-white to-white border-b border-slate-100 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1 className="font-headline-lg text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 flex items-center justify-center gap-3">
              <Heart className="text-rose-500 fill-rose-500" size={36} />
              Sản phẩm yêu thích
            </h1>
            <p className="max-w-2xl mx-auto font-body-lg text-base md:text-lg text-slate-600 leading-relaxed">
              Lưu giữ những sản phẩm bạn yêu thích để dễ dàng mua sắm bất cứ lúc nào.
            </p>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-rose-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-rose-500 transition-colors">
        <ChevronLeft size={16} /> Quay lại trang chủ
      </Link>
      
      {/* Configuration & Sharing Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Wishlist General Header */}
        <div className="bg-white rounded-[10px] shadow-sm border border-slate-100 p-6 flex flex-col justify-between md:col-span-1">
          <div>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-rose-100 bg-rose-50/50 mb-3 text-rose-500">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-1">Danh Sách Của Tôi</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Quản lý các sản phẩm bạn yêu thích và bật chia sẻ mã để bạn bè có thể xem và lưu sản phẩm.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <span className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
              Tổng số: <strong className="text-rose-600">{wishlist.length}</strong> sản phẩm
            </span>
          </div>
        </div>

        {/* Share Control Panel */}
        <div className="bg-white rounded-[10px] shadow-sm border border-slate-100 p-6 flex flex-col justify-between md:col-span-1">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                </div>
                <h3 className="text-sm font-bold text-slate-800">Chia sẻ danh sách</h3>
              </div>
              <button
                onClick={handleToggleShare}
                disabled={isUpdatingSettings}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                  isPublic ? 'bg-rose-500' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isPublic ? "Bất cứ ai có mã chia sẻ đều có thể xem danh sách sản phẩm yêu thích của bạn." : "Danh sách ở chế độ riêng tư, chỉ một mình bạn xem được."}
            </p>
          </div>

          {isPublic && shareToken && (
            <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col gap-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã chia sẻ của bạn</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-100 px-3 py-2 rounded-md overflow-hidden">
                  <p className="text-sm font-extrabold text-slate-700 font-mono tracking-wide truncate select-all">{shareToken}</p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="shrink-0 flex items-center gap-1.5 bg-white hover:bg-slate-100 text-rose-500 hover:text-rose-600 font-bold text-xs px-3 py-2 rounded-md border border-slate-200 transition-colors shadow-sm"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Đã chép" : "Sao chép mã"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Friend Code Input Panel */}
        <div className="bg-white rounded-[10px] shadow-sm border border-slate-100 p-6 flex flex-col justify-between md:col-span-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search size={18} className="text-rose-500" />
              <h3 className="text-sm font-bold text-slate-800">Xem danh sách của bạn bè</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhập mã chia sẻ của bạn bè để xem danh sách sản phẩm yêu thích của họ và lưu lại những sản phẩm bạn thích.
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-50">
            <form onSubmit={handleFetchFriendWishlist} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nhập mã chia sẻ..."
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono tracking-wider transition-all"
              />
              <button
                type="submit"
                disabled={isLoadingFriend}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-md transition-colors shadow-sm shrink-0"
              >
                {isLoadingFriend ? "Đang tìm..." : "Xem"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Friend's Wishlist Section */}
      {friendWishlist && (
        <div className="bg-white rounded-[10px] border border-rose-100 shadow-md p-6 mb-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-rose-50 pb-4 mb-6 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-full bg-rose-50 text-rose-500">
                <Heart className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">Sản phẩm yêu thích của {friendOwnerName}</h3>
                <p className="text-xs text-slate-500">Mã chia sẻ: <strong className="font-mono text-rose-600">{friendCodeInput.trim()}</strong></p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleAddAllToMyWishlist}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Plus size={14} /> Thêm tất cả vào Yêu thích của tôi
              </button>
              <button
                onClick={() => setFriendWishlist(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition-colors"
              >
                Đóng xem
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {friendWishlist.map((product) => {
              return (
                <div key={product.id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative">
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="w-full aspect-square relative bg-slate-50 rounded-lg overflow-hidden mb-3">
                      <img
                        src={product.image || "/assets/img/products/default-product.jpg"}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 min-h-[40px] mb-1">
                      {product.name}
                    </h3>
                    
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

                    <div className="mt-auto pt-3 border-t border-slate-50 flex flex-col gap-1.5">
                      <Link
                        href={`/products/${product.id}`}
                        className="w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs py-2 rounded-md border border-slate-200 transition-colors shadow-sm"
                      >
                        Xem chi tiết sản phẩm
                      </Link>

                      {!wishlist.some((item) => item.id === product.id) && (
                        <button
                          onClick={() => handleAddSingleToMyWishlist(product)}
                          className="w-full flex items-center justify-center gap-1 bg-white hover:bg-slate-100 text-rose-600 font-bold text-xs py-2 rounded-md border border-rose-200 transition-colors shadow-sm"
                        >
                          <Plus size={14} /> Thêm vào Yêu thích
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Owner's Wishlist Items */}
      <div className="bg-white rounded-[10px] shadow-sm p-6">
        <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          Danh sách yêu thích của tôi
        </h3>

        {wishlist.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Heart size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">Chưa có sản phẩm yêu thích nào</h3>
            <p className="text-slate-500 text-sm">Bạn chưa lưu sản phẩm nào. Hãy khám phá cửa hàng và thả tim nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => {
              return (
                <div key={product.id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative">
                  
                  {/* Delete heart action */}
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100 hover:scale-105 transition-all"
                    title="Xóa khỏi danh sách"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="p-3 flex-1 flex flex-col">
                    <div className="w-full aspect-square relative bg-slate-50 rounded-lg overflow-hidden mb-3">
                      <img
                        src={product.image || "/assets/img/products/default-product.jpg"}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 min-h-[40px] mb-1">
                      {product.name}
                    </h3>
                    
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

                    <div className="mt-auto pt-3 border-t border-slate-50 flex flex-col">
                      <Link
                        href={`/products/${product.id}`}
                        className="w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs py-2 rounded-md border border-slate-200 transition-colors shadow-sm"
                      >
                        Xem chi tiết sản phẩm
                      </Link>
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

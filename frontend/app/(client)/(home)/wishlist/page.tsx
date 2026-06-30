"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, Share2, Copy, Check, Edit2, Lock, Globe, Trash2 } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { getWishlistShareSettings, toggleWishlistShare, updateWishlistItemRegistry } from "@/lib/api";
import { toast } from "@/lib/toast";

export default function WishlistPage() {
  const { wishlist, loading, removeFromWishlist, updateWishlistItemRegistryState } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [quantityNeeded, setQuantityNeeded] = useState(1);
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [isSavingRegistry, setIsSavingRegistry] = useState(false);

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

  const handleCopyLink = () => {
    if (!shareToken) return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/wishlist/share/${shareToken}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("Đã sao chép link chia sẻ!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Open Edit Registry Modal
  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setQuantityNeeded(product.quantityNeeded || 1);
    setNote(product.note || "");
    setPriority(product.priority || "Medium");
  };

  // Close Edit Registry Modal
  const closeEditModal = () => {
    setEditingProduct(null);
  };

  // Save Registry Settings
  const handleSaveRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    setIsSavingRegistry(true);
    try {
      const res = await updateWishlistItemRegistry(token, editingProduct.id, {
        quantityNeeded,
        note: note || null,
        priority
      });

      if (res.success) {
        // Update context state
        updateWishlistItemRegistryState(editingProduct.id, {
          quantityNeeded,
          note: note || null,
          priority
        });
        toast.success("Đã cập nhật thông tin Registry thành công!");
        closeEditModal();
      } else {
        toast.error(res.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối mạng");
    } finally {
      setIsSavingRegistry(false);
    }
  };

  const getPriorityColor = (pr: string) => {
    switch (pr) {
      case "High":
        return "bg-rose-50 border-rose-200 text-rose-600";
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

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicShareUrl = shareToken ? `${origin}/wishlist/share/${shareToken}` : "";

  return (
    <div className="w-full pb-12">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-rose-500 transition-colors">
        <ChevronLeft size={16} /> Quay lại trang chủ
      </Link>
      
      {/* Header */}
      <div className="bg-white rounded-[10px] shadow-sm border border-slate-100 overflow-hidden relative mb-6">
        <div className="bg-rose-50/50 py-5 px-6 md:py-6 md:px-8 border-b border-rose-100/50 relative flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-rose-200 bg-white shadow-sm mb-3 text-rose-500">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-1">Sản Phẩm Yêu Thích</h2>
          <p className="text-sm text-slate-500 max-w-[600px] mx-auto">
            Lưu giữ và biến danh sách của bạn thành một Gift Registry công khai để bạn bè dễ dàng mua quà tặng bạn.
          </p>
        </div>

        {/* Wishlist Sharing Control Panel */}
        <div className="p-5 md:p-6 bg-slate-50/60 border-t border-slate-100 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {isPublic ? <Globe size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  Chia sẻ danh sách công khai
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    isPublic ? 'bg-emerald-100/70 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {isPublic ? "Công khai" : "Riêng tư"}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cho phép mọi người xem danh sách và mua tặng trực tiếp cho bạn.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleShare}
              disabled={isUpdatingSettings}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isPublic ? 'bg-rose-500' : 'bg-slate-300'
              } ${isUpdatingSettings ? 'opacity-65 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Share URL Output */}
          {isPublic && shareToken && (
            <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2 overflow-hidden px-1">
                <Share2 size={16} className="text-rose-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 truncate select-all">
                  {publicShareUrl}
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className="shrink-0 flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-3 py-1.5 rounded-md text-xs border border-rose-200/50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} /> Đã chép
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Sao chép link
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Count */}
        <div className="p-3 bg-white flex justify-center border-t border-slate-100">
          <span className="text-xs text-slate-500 font-semibold bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
            Danh sách gồm <strong className="text-rose-600 font-bold">{wishlist.length}</strong> sản phẩm
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[10px] shadow-sm p-5 md:p-6 min-h-[400px]">
        {wishlist.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Heart size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">Chưa có sản phẩm yêu thích nào</h3>
            <p className="text-slate-500 text-sm">Bạn chưa lưu sản phẩm nào. Hãy khám phá cửa hàng và thả tim cho những sản phẩm bạn yêu thích nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => {
              const needed = product.quantityNeeded || 1;
              const purchased = product.quantityPurchased || 0;
              const progress = Math.min(100, Math.round((purchased / needed) * 100));

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

                  {/* Registry priority tag */}
                  {product.priority && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm ${getPriorityColor(product.priority)}`}>
                        {getPriorityLabel(product.priority)}
                      </span>
                    </div>
                  )}

                  {/* Standard Product Info & Card Rendering */}
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

                    {/* Registry details section */}
                    <div className="mt-auto border-t border-slate-50 pt-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center text-xs text-slate-500 font-bold mb-1.5">
                        <span>Đã mua:</span>
                        <span className="text-rose-600 font-extrabold">{purchased} / {needed}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2 border border-slate-200/50">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {product.note ? (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2 min-h-[32px] mb-2 leading-relaxed border-l-2 border-rose-300 pl-2">
                          "{product.note}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic line-clamp-2 min-h-[32px] mb-2 leading-relaxed pl-1">
                          Chưa có ghi chú...
                        </p>
                      )}

                      <button
                        onClick={() => openEditModal(product)}
                        className="w-full mt-1 flex items-center justify-center gap-1 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold text-xs py-1.5 rounded-md border border-slate-200 transition-colors shadow-sm"
                      >
                        <Edit2 size={12} /> Cấu hình Registry
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Registry Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-rose-50/50 border-b border-rose-100/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="text-rose-500 fill-rose-500" size={20} />
                <h3 className="font-extrabold text-slate-800 text-lg">Cấu hình quà tặng</h3>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-white hover:bg-slate-100 p-1.5 rounded-full border border-slate-200/50 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveRegistry} className="p-6 flex flex-col gap-4">
              <div className="flex gap-3 pb-3 border-b border-slate-100">
                <img
                  src={editingProduct.image || "/assets/img/products/default-product.jpg"}
                  alt={editingProduct.name}
                  className="w-14 h-14 object-cover rounded-md border border-slate-100"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{editingProduct.name}</h4>
                  <p className="text-xs text-rose-500 font-bold mt-1">
                    {editingProduct.discountPrice 
                      ? `${editingProduct.discountPrice.toLocaleString('vi-VN')}đ` 
                      : `${editingProduct.price.toLocaleString('vi-VN')}đ`}
                  </p>
                </div>
              </div>

              {/* Quantity Needed */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Số lượng cần tặng
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantityNeeded}
                  onChange={(e) => setQuantityNeeded(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold transition-all"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mức độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold transition-all cursor-pointer"
                >
                  <option value="High">Cao (High)</option>
                  <option value="Medium">Trung bình (Medium)</option>
                  <option value="Low">Thấp (Low)</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú cho người mua tặng
                </label>
                <textarea
                  placeholder="Ví dụ: Món này màu hồng cho bé gái nha..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={150}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
                <span className="text-[10px] text-slate-400 float-right mt-1">
                  Tối đa 150 ký tự
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2 rounded-lg border border-slate-200 text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingRegistry}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-65"
                >
                  {isSavingRegistry ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

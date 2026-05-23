"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader, Trash2, ShoppingBag, Plus, Minus, Tag, Check, X, AlertCircle } from "lucide-react";
import {
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyVoucherToCart,
  removeVoucherFromCart,
  getPublicVouchers,
  getProducts,
  CartInfo,
  CartDetailInfo
} from "@/lib/api";
import { Product, Voucher } from "@/types";
import ProductCard from "@/app/components/ProductCard";

const FREE_SHIPPING_THRESHOLD = 300000;
const SHIPPING_FEE = 30000;

export default function CartPage() {
  const router = useRouter();

  // States
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartInfo | null>(null);
  const [checkedDetails, setCheckedDetails] = useState<Record<number, boolean>>({});
  
  // Voucher States
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Recommendations State
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // General alert
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);

  const showAlert = (type: "success" | "error", text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Load cart data and recommended products on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!savedToken) {
      router.push("/login");
      return;
    }
    setToken(savedToken);
    loadCartData(savedToken);
    loadRecommendations();
  }, []);

  const loadCartData = async (authToken: string) => {
    setLoading(true);
    try {
      const cartData = await getCart(authToken);
      if (cartData) {
        setCart(cartData);
        // Check all items by default
        const checks: Record<number, boolean> = {};
        cartData.cartDetails.forEach((cd) => {
          checks[cd.cartDetailID] = true;
        });
        setCheckedDetails(checks);
        
        if (cartData.voucher) {
          setVoucherCodeInput(cartData.voucher.code);
        } else {
          setVoucherCodeInput("");
        }
      } else {
        setCart(null);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    setLoadingRecs(true);
    try {
      // Fetch top 4 products for recommendation
      const prodRes = await getProducts(1, 4);
      if (prodRes && prodRes.items) {
        setRecommendations(prodRes.items);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const loadVouchersList = async () => {
    setLoadingVouchers(true);
    try {
      const voucherData = await getPublicVouchers();
      if (voucherData) {
        setVouchers(voucherData);
      }
    } catch (error) {
      console.error("Error loading vouchers:", error);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleOpenVoucherModal = () => {
    setVoucherModalOpen(true);
    loadVouchersList();
  };

  const handleUpdateQuantity = async (detail: CartDetailInfo, newQty: number) => {
    if (!token) return;
    if (newQty < 1) {
      // Prompt for removal if quantity goes to 0
      handleRemoveItem(detail.cartDetailID);
      return;
    }

    try {
      const res = await updateCartItem(token, {
        cartDetailID: detail.cartDetailID,
        quantity: newQty,
      });

      if (res.success && res.data) {
        setCart(res.data);
        showAlert("success", res.message || "Đã cập nhật số lượng sản phẩm");
      } else {
        showAlert("error", res.message || "Không thể cập nhật số lượng");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Lỗi kết nối");
    }
  };

  const handleRemoveItem = async (cartDetailId: number) => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) return;

    try {
      const res = await removeFromCart(token, cartDetailId);
      if (res.success && res.data) {
        setCart(res.data);
        showAlert("success", res.message || "Đã xóa sản phẩm khỏi giỏ hàng");
        
        // Remove item from checked state
        setCheckedDetails((prev) => {
          const next = { ...prev };
          delete next[cartDetailId];
          return next;
        });
      } else {
        showAlert("error", res.message || "Không thể xóa sản phẩm");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Lỗi kết nối");
    }
  };

  const handleClearAllCart = async () => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?")) return;

    try {
      const res = await clearCart(token);
      if (res.success) {
        setCart(null);
        setCheckedDetails({});
        showAlert("success", "Đã xóa sạch giỏ hàng!");
      } else {
        showAlert("error", res.message || "Không thể xóa giỏ hàng");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Lỗi kết nối");
    }
  };

  const handleRemoveSelectedItems = async () => {
    if (!token || !cart) return;
    const selectedIds = Object.keys(checkedDetails).filter((key) => checkedDetails[Number(key)]);
    if (selectedIds.length === 0) {
      showAlert("error", "Vui lòng chọn ít nhất một sản phẩm để xóa");
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn?`)) return;

    try {
      setLoading(true);
      // Remove one by one
      for (const id of selectedIds) {
        await removeFromCart(token, Number(id));
      }
      showAlert("success", "Đã xóa các sản phẩm đã chọn");
      loadCartData(token);
    } catch (error) {
      console.error(error);
      showAlert("error", "Có lỗi xảy ra khi xóa hàng loạt");
      loadCartData(token);
    }
  };

  const handleApplyVoucherCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !voucherCodeInput) return;

    setApplyingCode(true);
    try {
      const res = await applyVoucherToCart(token, voucherCodeInput);
      if (res.success && res.data) {
        setCart(res.data);
        showAlert("success", res.message || "Áp dụng mã giảm giá thành công!");
      } else {
        showAlert("error", res.message || "Mã giảm giá không hợp lệ hoặc không đủ điều kiện");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Lỗi kết nối");
    } finally {
      setApplyingCode(false);
    }
  };

  const handleApplyVoucherFromModal = async (code: string) => {
    if (!token) return;
    setVoucherModalOpen(false);
    setVoucherCodeInput(code);

    try {
      const res = await applyVoucherToCart(token, code);
      if (res.success && res.data) {
        setCart(res.data);
        showAlert("success", res.message || "Áp dụng mã giảm giá thành công!");
      } else {
        showAlert("error", res.message || "Áp dụng voucher thất bại");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Lỗi kết nối");
    }
  };

  const handleRemoveVoucher = async () => {
    if (!token) return;

    try {
      const res = await removeVoucherFromCart(token);
      if (res.success && res.data) {
        setCart(res.data);
        setVoucherCodeInput("");
        showAlert("success", "Đã hủy áp dụng mã giảm giá");
      } else {
        showAlert("error", res.message || "Không thể hủy mã giảm giá");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Lỗi kết nối");
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.cartDetails.length === 0) return;
    
    // Check if at least one item is selected
    const selectedCount = Object.values(checkedDetails).filter(Boolean).length;
    if (selectedCount === 0) {
      showAlert("error", "Vui lòng chọn ít nhất một sản phẩm để đặt hàng!");
      return;
    }

    // Direct to checkout
    alert("Chuyển hướng đến trang thanh toán đơn hàng...");
    router.push("/checkout");
  };

  // Checkbox helpers
  const handleToggleCheck = (detailId: number) => {
    setCheckedDetails((prev) => ({
      ...prev,
      [detailId]: !prev[detailId],
    }));
  };

  const handleToggleAllChecks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    const checks: Record<number, boolean> = {};
    if (cart) {
      cart.cartDetails.forEach((cd) => {
        checks[cd.cartDetailID] = isChecked;
      });
    }
    setCheckedDetails(checks);
  };

  const isAllChecked = () => {
    if (!cart || cart.cartDetails.length === 0) return false;
    return cart.cartDetails.every((cd) => checkedDetails[cd.cartDetailID]);
  };

  // Subtotal & totals calculated for visual checking only
  const getSelectedCalculations = () => {
    if (!cart) return { subTotal: 0, discount: 0, shipping: 0, total: 0, selectedCount: 0 };
    
    let subTotal = 0;
    let selectedCount = 0;

    cart.cartDetails.forEach((cd) => {
      if (checkedDetails[cd.cartDetailID]) {
        subTotal += cd.totalPrice;
        selectedCount += cd.quantity;
      }
    });

    const hasFreeShipping = subTotal >= FREE_SHIPPING_THRESHOLD;
    const shipping = subTotal > 0 && !hasFreeShipping ? SHIPPING_FEE : 0;
    
    // Calculate voucher discount (prorated or complete)
    let discount = 0;
    if (cart.voucher && subTotal >= cart.voucher.minOrderValue) {
      if (cart.voucher.isPercentage) {
        discount = (subTotal * cart.voucher.discountPercent) / 100;
        if (cart.voucher.maxDiscount > 0 && discount > cart.voucher.maxDiscount) {
          discount = cart.voucher.maxDiscount;
        }
      } else {
        discount = cart.voucher.discountAmount;
      }
    }

    const total = Math.max(0, subTotal + shipping - discount);

    return { subTotal, discount, shipping, total, selectedCount };
  };

  const { subTotal, discount, shipping, total, selectedCount } = getSelectedCalculations();

  // Shipping progress bar parameters
  const freeShippingProgress = Math.min(100, Math.round((subTotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subTotal;

  if (loading && !cart) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[calc(100vh-200px)] py-20 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-primary" size={40} />
          <p className="text-on-surface-variant font-label-md">Đang tải giỏ hàng của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pb-24 relative">
      {/* Toast Alert */}
      {alertMsg && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-3.5 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
          alertMsg.type === "success" 
            ? "bg-secondary-container/95 border-secondary text-on-secondary-container" 
            : "bg-error-container/95 border-error text-on-error-container"
        }`}>
          <div className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-lg">
              {alertMsg.type === "success" ? "check_circle" : "error"}
            </span>
            {alertMsg.text}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        {/* Cart Header & Progress */}
        <div className="flex flex-col items-center mb-12">
          <h1 className="font-headline-lg text-4xl font-bold text-primary mb-6 tracking-tight">Giỏ hàng của bạn</h1>
          
          {/* Checkout Steps */}
          <div className="flex items-center gap-sm">
            <div className="flex items-center gap-xs">
              <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">1</span>
              <span className="font-quicksand font-bold text-primary text-sm">Giỏ hàng</span>
            </div>
            <div className="w-12 h-[2px] bg-outline-variant"></div>
            <div className="flex items-center gap-xs">
              <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">2</span>
              <span className="font-quicksand font-medium text-slate-500 text-sm">Thanh toán</span>
            </div>
            <div className="w-12 h-[2px] bg-outline-variant"></div>
            <div className="flex items-center gap-xs">
              <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">3</span>
              <span className="font-quicksand font-medium text-slate-500 text-sm">Hoàn tất</span>
            </div>
          </div>
        </div>

        {cart && cart.cartDetails.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            
            {/* Left Side: Product List */}
            <div className="lg:col-span-8 space-y-md">
              
              {/* Bulk Actions Bar */}
              <div className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100">
                <label className="flex items-center gap-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isAllChecked()}
                    onChange={handleToggleAllChecks}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary transition-all cursor-pointer"
                  />
                  <span className="font-quicksand font-bold text-slate-800 group-hover:text-primary transition-colors text-sm">
                    Chọn tất cả ({cart.cartDetails.length})
                  </span>
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={handleRemoveSelectedItems}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-error transition-colors font-bold text-xs"
                  >
                    <Trash2 size={14} />
                    Xóa mục đã chọn
                  </button>
                  <button
                    onClick={handleClearAllCart}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-error transition-colors font-bold text-xs border-l border-slate-200 pl-4"
                  >
                    Xóa sạch giỏ hàng
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-sm">
                {cart.cartDetails.map((detail) => {
                  const isChecked = !!checkedDetails[detail.cartDetailID];
                  
                  // Product or Bundle info resolution
                  const isBundle = !!detail.bundleID;
                  const name = isBundle ? detail.bundle?.name : detail.product?.name;
                  const price = detail.unitPrice;
                  const image = isBundle ? detail.bundle?.imageUrl : detail.variant?.imageUrl || detail.product?.imageUrl;
                  const subtext = isBundle 
                    ? "Gói Combo sản phẩm" 
                    : `Phân loại: ${detail.variant?.color || "Tiêu chuẩn"}${detail.variant?.size ? ` - Cỡ: ${detail.variant.size}` : ""}`;

                  return (
                    <div
                      key={detail.cartDetailID}
                      className={`bg-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-md items-center group transition-all border ${
                        isChecked 
                          ? "border-primary-container bg-primary-container/2" 
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCheck(detail.cartDetailID)}
                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary shrink-0 transition-all cursor-pointer"
                      />
                      
                      {/* Product Image */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0 relative">
                        {image ? (
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt="Ảnh sản phẩm"
                            src={image}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                            Không có ảnh
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-grow space-y-1 text-center sm:text-left">
                        <h3 className="font-quicksand font-bold text-lg text-slate-800 hover:text-primary transition-colors">
                          {isBundle ? (
                            name
                          ) : (
                            <Link href={`/products/${detail.product?.productID || detail.variant?.variantID}`}>
                              {name}
                            </Link>
                          )}
                        </h3>
                        <p className="text-on-surface-variant text-xs font-semibold bg-slate-50 px-2 py-0.5 rounded inline-block">
                          {subtext}
                        </p>
                        <p className="text-primary font-bold text-base pt-1">
                          ₫{price.toLocaleString("vi-VN")}
                        </p>
                      </div>

                      {/* Quantity & Delete Actions */}
                      <div className="flex items-center gap-md shrink-0 w-full sm:w-auto justify-between sm:justify-start pt-4 sm:pt-0 border-t sm:border-t-0 border-dashed border-slate-100 mt-3 sm:mt-0">
                        <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
                          <button
                            onClick={() => handleUpdateQuantity(detail, detail.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-primary transition-all active:scale-90"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-10 text-center font-bold text-slate-800 text-sm">
                            {detail.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(detail, detail.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-primary transition-all active:scale-90"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(detail.cartDetailID)}
                          className="material-symbols-outlined text-slate-400 hover:text-error p-2 hover:bg-red-50 rounded-full transition-all active:scale-90"
                        >
                          delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right Side: Order Summary */}
            <aside className="lg:col-span-4 space-y-md">
              
              {/* Free Shipping Progress */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span className="text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">local_shipping</span> Miễn phí vận chuyển
                  </span>
                  <span className="text-secondary">{freeShippingProgress}%</span>
                </div>
                
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  ></div>
                </div>

                <p className="text-xs text-slate-500 font-semibold pt-1">
                  {subTotal >= FREE_SHIPPING_THRESHOLD ? (
                    <span className="text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span> Đơn hàng đủ điều kiện Freeship!
                    </span>
                  ) : (
                    `Mua thêm ₫${remainingForFreeShipping.toLocaleString("vi-VN")} để được miễn phí giao hàng!`
                  )}
                </p>
              </div>

              {/* Voucher Section */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                <h4 className="font-quicksand font-bold text-slate-800 text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-base">confirmation_number</span> Voucher ưu đãi
                </h4>
                
                <form onSubmit={handleApplyVoucherCode} className="flex gap-2">
                  <div className="relative flex-grow">
                    <input
                      required
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value)}
                      disabled={!!cart.voucher}
                      className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-primary-container text-xs text-slate-800 disabled:opacity-75 focus:outline-none"
                      placeholder="Nhập mã giảm giá..."
                      type="text"
                    />
                  </div>
                  {cart.voucher ? (
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="bg-red-50 hover:bg-red-100 text-error px-4 py-2 rounded-full font-bold text-xs border border-red-200 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <X size={12} /> Hủy
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={applyingCode || !voucherCodeInput}
                      className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-md shadow-primary/10 transition-all disabled:opacity-60 active:scale-95 whitespace-nowrap"
                    >
                      {applyingCode ? "Áp dụng..." : "Áp dụng"}
                    </button>
                  )}
                </form>

                {!cart.voucher && (
                  <button
                    onClick={handleOpenVoucherModal}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-primary border border-dashed border-primary/30 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <Tag size={12} /> Xem danh sách mã giảm giá
                  </button>
                )}
              </div>

              {/* Summary Card */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100 space-y-5">
                <h3 className="font-quicksand font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">
                  Tóm tắt đơn hàng
                </h3>
                
                <div className="space-y-3 text-sm font-medium text-slate-500">
                  <div className="flex justify-between">
                    <span>Tổng tiền hàng ({selectedCount} sản phẩm)</span>
                    <span className="text-slate-800">₫{subTotal.toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span className="text-slate-800">
                      {shipping > 0 ? `₫${shipping.toLocaleString("vi-VN")}` : "Miễn phí"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giảm giá Voucher</span>
                    <span className="text-error">-₫{discount.toLocaleString("vi-VN")}</span>
                  </div>
                  
                  {cart.voucher && (
                    <div className="p-3 bg-secondary-container/10 border border-secondary/20 rounded-xl flex items-center justify-between text-xs text-on-secondary-container">
                      <span className="font-bold flex items-center gap-1">
                        <Check size={12} /> Đã áp dụng: {cart.voucher.code}
                      </span>
                      <span>Giảm ₫{discount.toLocaleString("vi-VN")}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-quicksand font-bold text-slate-800 text-base">Tổng thanh toán</span>
                    <span className="text-primary font-bold text-2xl tracking-tight">
                      ₫{total.toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={selectedCount === 0}
                  className="w-full bg-primary hover:bg-primary/95 text-white py-4 rounded-xl font-headline-md font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 uppercase tracking-wider disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
                >
                  Tiến hành thanh toán
                </button>
                <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  (Giá đã bao gồm thuế giá trị gia tăng VAT)
                </p>
              </div>

            </aside>

          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 space-y-6 max-w-2xl mx-auto my-12">
            <div className="w-20 h-20 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mx-auto shadow-inner">
              <ShoppingBag size={36} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-primary">Giỏ hàng của bạn đang trống</h2>
              <p className="text-on-surface-variant max-w-sm mx-auto text-sm">
                Hãy lựa chọn các mặt hàng đồ chơi, quần áo an toàn, chất lượng hàng đầu của LazPe dành cho bé yêu của bạn!
              </p>
            </div>
            <div className="pt-4">
              <Link
                href="/products"
                className="bg-primary hover:bg-primary/95 text-white px-8 py-3.5 rounded-full font-bold shadow-md shadow-primary/10 transition-all inline-block hover:scale-105 active:scale-95"
              >
                Khám phá sản phẩm ngay
              </Link>
            </div>
          </div>
        )}

        {/* Recommended Products Section */}
        {recommendations.length > 0 && (
          <section className="mt-20 border-t border-slate-100 pt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-headline-md text-2xl font-bold text-primary">Sản phẩm có thể bạn thích</h2>
                <p className="text-sm text-on-surface-variant mt-1">Những sản phẩm được ba mẹ mua sắm nhiều nhất</p>
              </div>
              <Link 
                href="/products" 
                className="text-primary hover:underline font-bold text-sm flex items-center gap-1"
              >
                Xem tất cả sản phẩm
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {loadingRecs ? (
              <div className="flex justify-center py-10">
                <Loader className="animate-spin text-primary" size={24} />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                {recommendations.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* VOUCHER SELECTION MODAL */}
      {voucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[500px] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 flex justify-between items-center border-b border-slate-100 bg-slate-50">
              <h3 className="font-quicksand font-bold text-lg text-slate-800 flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-base">confirmation_number</span> Chọn Voucher ưu đãi
              </h3>
              <button 
                onClick={() => setVoucherModalOpen(false)}
                className="hover:bg-slate-200 p-1.5 rounded-full text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {loadingVouchers ? (
                <div className="flex justify-center py-10">
                  <Loader className="animate-spin text-primary" size={24} />
                </div>
              ) : vouchers.length > 0 ? (
                vouchers.map((voucher) => {
                  const isEligible = subTotal >= voucher.minOrderValue;
                  const discountText = voucher.discountType === 1 
                    ? `Giảm ${voucher.discountValue}%` 
                    : `Giảm ₫${voucher.discountValue.toLocaleString("vi-VN")}`;

                  return (
                    <div 
                      key={voucher.voucherID}
                      className={`flex gap-4 p-4 border rounded-xl items-center relative overflow-hidden transition-all ${
                        isEligible 
                          ? "border-primary-container bg-primary-container/2" 
                          : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      {/* Left Coupon Notch Column */}
                      <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl font-bold">
                          {voucher.discountType === 1 ? "percent" : "local_shipping"}
                        </span>
                      </div>
                      
                      {/* Details */}
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{discountText}</h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{voucher.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          Đơn tối thiểu: ₫{voucher.minOrderValue.toLocaleString("vi-VN")} | HSD: {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 pl-2">
                        {isEligible ? (
                          <button
                            onClick={() => handleApplyVoucherFromModal(voucher.code)}
                            className="bg-primary hover:bg-primary/95 text-white py-1.5 px-4 rounded-full font-bold text-xs shadow-md shadow-primary/5 active:scale-95 transition-all"
                          >
                            Áp dụng
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-200/50 px-2.5 py-1.5 rounded-full flex items-center gap-0.5">
                            <AlertCircle size={10} /> Chưa đủ ĐK
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-slate-400 py-6 text-sm font-medium">Hiện không có mã giảm giá nào khả dụng.</p>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setVoucherModalOpen(false)}
                className="py-2.5 px-6 border border-slate-200 rounded-full font-bold text-slate-600 hover:bg-white text-xs transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader, Trash2, ShoppingBag, Plus, Minus, Tag, Check, X, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  getPublicVouchers,
  getProducts,
  CartInfo,
  CartDetailInfo
} from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { Product, Voucher } from "@/types";
import ProductCard from "@/components/client/common/ProductCard";
import { CartHeader } from "@/components/client/cart/CartHeader";
import { CartItemList } from "@/components/client/cart/CartItemList";
import { CartSummary } from "@/components/client/cart/CartSummary";
import { VoucherModal } from "@/components/client/cart/VoucherModal";
import { EmptyCart } from "@/components/client/cart/EmptyCart";

const FREE_SHIPPING_THRESHOLD = 300000;
const SHIPPING_FEE = 30000;

export default function CartPage() {
  const router = useRouter();

  // States
  const [token, setToken] = useState<string | null>(null);
  const {
    cart,
    loading,
    refreshCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyVoucher,
    removeVoucher
  } = useCart();
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
  const [applyingCode, setApplyingCode] = useState(false);

  const showAlert = (type: "success" | "error", text: string) => {
    if (type === "success") {
      toast.success(text);
    } else {
      toast.error(text);
    }
  };

  // Load cart data and recommended products on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!savedToken) {
      router.push("/login");
      return;
    }
    setToken(savedToken);
    refreshCart();
    loadRecommendations();
  }, []);

  // Initialize checked items and voucher input when cart loads
  useEffect(() => {
    if (cart) {
      if (Object.keys(checkedDetails).length === 0 && cart.cartDetails.length > 0) {
        const checks: Record<number, boolean> = {};
        cart.cartDetails.forEach((cd) => {
          checks[cd.cartDetailID] = true;
        });
        setCheckedDetails(checks);
      }
      
      if (cart.voucher) {
        setVoucherCodeInput(cart.voucher.code);
      } else {
        setVoucherCodeInput("");
      }
    } else {
      setCheckedDetails({});
      setVoucherCodeInput("");
    }
  }, [cart]);

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
      const res = await updateCartItem({
        cartDetailID: detail.cartDetailID,
        quantity: newQty,
      });

      if (res.success) {
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
      const res = await removeFromCart(cartDetailId);
      if (res.success) {
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
      const res = await clearCart();
      if (res.success) {
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
      for (const id of selectedIds) {
        await removeFromCart(Number(id));
      }
      showAlert("success", "Đã xóa các sản phẩm đã chọn");
      setCheckedDetails((prev) => {
        const next = { ...prev };
        selectedIds.forEach((id) => delete next[Number(id)]);
        return next;
      });
    } catch (error) {
      console.error(error);
      showAlert("error", "Có lỗi xảy ra khi xóa hàng loạt");
    }
  };

  const handleApplyVoucherCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !voucherCodeInput) return;

    setApplyingCode(true);
    try {
      const res = await applyVoucher(voucherCodeInput);
      if (res.success) {
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
      const res = await applyVoucher(code);
      if (res.success) {
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
      const res = await removeVoucher();
      if (res.success) {
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
    const selectedIds = Object.keys(checkedDetails)
      .map(Number)
      .filter((id) => checkedDetails[id] && cart.cartDetails.some((cd) => cd.cartDetailID === id));

    if (selectedIds.length === 0) {
      showAlert("error", "Vui lòng chọn ít nhất một sản phẩm để đặt hàng!");
      return;
    }

    // Save to localStorage
    localStorage.setItem("selectedCartDetailIds", JSON.stringify(selectedIds));

    // Direct to checkout
    toast.success("Chuyển hướng đến trang thanh toán đơn hàng...");
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
      <div className="flex-grow flex items-center justify-center min-h-[calc(100vh-200px)] py-20 bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-rose-500" size={40} />
          <p className="text-slate-600 font-medium animate-pulse">Đang tải giỏ hàng của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 text-slate-800 font-sans min-h-screen pb-24 relative selection:bg-rose-100 selection:text-rose-900">
      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        {/* Cart Header & Progress */}
        <CartHeader />

        {cart && cart.cartDetails.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* Left Side: Product List */}
            <CartItemList
              cart={cart}
              checkedDetails={checkedDetails}
              isAllChecked={isAllChecked}
              handleToggleAllChecks={handleToggleAllChecks}
              handleToggleCheck={handleToggleCheck}
              handleRemoveSelectedItems={handleRemoveSelectedItems}
              handleClearAllCart={handleClearAllCart}
              handleUpdateQuantity={handleUpdateQuantity}
              handleRemoveItem={handleRemoveItem}
            />

            {/* Right Side: Order Summary */}
            <CartSummary
              cart={cart}
              subTotal={subTotal}
              discount={discount}
              shipping={shipping}
              total={total}
              selectedCount={selectedCount}
              freeShippingProgress={freeShippingProgress}
              remainingForFreeShipping={remainingForFreeShipping}
              voucherCodeInput={voucherCodeInput}
              setVoucherCodeInput={setVoucherCodeInput}
              applyingCode={applyingCode}
              handleApplyVoucherCode={handleApplyVoucherCode}
              handleRemoveVoucher={handleRemoveVoucher}
              handleOpenVoucherModal={handleOpenVoucherModal}
              handleCheckout={handleCheckout}
            />
          </div>
        ) : (
          <EmptyCart />
        )}

        {/* Recommended Products Section */}
        {recommendations.length > 0 && (
          <section className="mt-20 border-t border-slate-100 pt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Sản phẩm có thể bạn thích</h2>
                <p className="text-sm text-slate-500 mt-1">Những sản phẩm được ba mẹ mua sắm nhiều nhất</p>
              </div>
              <Link 
                href="/products" 
                className="text-rose-500 hover:text-rose-600 font-bold text-sm flex items-center gap-1 transition-colors"
              >
                Xem tất cả sản phẩm
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {loadingRecs ? (
              <div className="flex justify-center py-10">
                <Loader className="animate-spin text-rose-500" size={24} />
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
      <VoucherModal
        voucherModalOpen={voucherModalOpen}
        setVoucherModalOpen={setVoucherModalOpen}
        loadingVouchers={loadingVouchers}
        vouchers={vouchers}
        subTotal={subTotal}
        handleApplyVoucherFromModal={handleApplyVoucherFromModal}
      />
    </div>
  );
}
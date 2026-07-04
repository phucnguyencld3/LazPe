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
  CartDetailInfo,
  getCheckoutAvailableVouchers,
} from "@/lib/api";
import { getCurrentFlashSale } from "@/lib/features/flash-sales/flashSaleApi";
import { useCart } from "@/context/CartContext";
import { Product, Voucher } from "@/types";
import ProductCard from "@/components/client/common/ProductCard";
import { CartHeader } from "@/components/client/cart/CartHeader";
import { CartItemList } from "@/components/client/cart/CartItemList";
import { CartSummary } from "@/components/client/cart/CartSummary";
import { VoucherModal } from "@/components/client/cart/VoucherModal";
import { EmptyCart } from "@/components/client/cart/EmptyCart";


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
    autoApplyVouchers,
    removeVoucher
  } = useCart();
  const [checkedDetails, setCheckedDetails] = useState<Record<number, boolean>>({});
  
  // Voucher States
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Recommendations State
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // General alert
  const [applyingCode, setApplyingCode] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

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
        // Sắp xếp đưa các sản phẩm hết hàng (inStock = false) xuống cuối
        const sortedRecs = [...prodRes.items].sort((a, b) => {
          if (a.inStock && !b.inStock) return -1;
          if (!a.inStock && b.inStock) return 1;
          return 0;
        });
        setRecommendations(sortedRecs);
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
      const voucherData = token 
        ? await getCheckoutAvailableVouchers(token)
        : await getPublicVouchers();
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

  const handleRemoveItem = (cartDetailId: number) => {
    if (!token) return;
    setConfirmModal({
      isOpen: true,
      title: "Xóa sản phẩm",
      message: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
      onConfirm: async () => {
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
      }
    });
  };

  const handleClearAllCart = () => {
    if (!token) return;
    setConfirmModal({
      isOpen: true,
      title: "Xóa sạch giỏ hàng",
      message: "Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?",
      onConfirm: async () => {
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
      }
    });
  };

  const handleRemoveSelectedItems = () => {
    if (!token || !cart) return;
    const selectedIds = Object.keys(checkedDetails).filter((key) => checkedDetails[Number(key)]);
    if (selectedIds.length === 0) {
      showAlert("error", "Vui lòng chọn ít nhất một sản phẩm để xóa");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Xóa sản phẩm đã chọn",
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn khỏi giỏ hàng?`,
      onConfirm: async () => {
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
          showAlert("error", "Lỗi kết nối");
        }
      }
    });
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

  const handleAutoApplyVouchers = async () => {
    if (!token) return;
    setApplyingCode(true);
    try {
      const res = await autoApplyVouchers();
      if (res.success) {
        showAlert("success", res.message || "Áp dụng mã giảm giá tốt nhất thành công!");
      } else {
        showAlert("error", res.message || "Không tìm thấy mã giảm giá phù hợp");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Lỗi kết nối");
    } finally {
      setApplyingCode(false);
    }
  };

  const handleRemoveVoucher = async (type?: number) => {
    if (!token) return;

    try {
      const res = await removeVoucher(type);
      if (res.success) {
        if (!type || (!res.data?.voucher && !res.data?.shippingVoucher)) {
          setVoucherCodeInput("");
        }
        showAlert("success", res.message || "Đã hủy áp dụng mã giảm giá");
      } else {
        showAlert("error", res.message || "Không thể hủy mã giảm giá");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Lỗi kết nối");
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.cartDetails.length === 0) return;

    // Chặn tài khoản admin/nhân viên hoặc tài khoản có bất kỳ quyền nào mua hàng
    const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedUserJson) {
      try {
        const parsedUser = JSON.parse(savedUserJson);
        const roles = parsedUser?.roles || [];
        const permissions = parsedUser?.permissions || [];
        const isStaffOrAdmin = !!(parsedUser?.isAdmin || roles.includes("Admin") || roles.includes("Staff") || permissions.length > 0);
        
        if (isStaffOrAdmin) {
          showAlert("error", "Tài khoản quản trị viên hoặc nhân viên không được phép thực hiện chức năng mua hàng!");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Check if at least one item is selected
    const selectedIds = Object.keys(checkedDetails)
      .map(Number)
      .filter((id) => checkedDetails[id] && cart.cartDetails.some((cd) => cd.cartDetailID === id));

    // Lấy thông tin flash sale để đảm bảo quà tặng được đưa vào checkout
    try {
      const sales = await getCurrentFlashSale();
      const activeFlashSales = (sales || []).filter(sale => sale.isActive && sale.status === 1);
      
      const gifts = cart.cartDetails.filter((d) => d.isGift && !selectedIds.includes(d.cartDetailID));
      let remainingGifts = [...gifts];
      const selectedNonGifts = cart.cartDetails.filter(d => !d.isGift && selectedIds.includes(d.cartDetailID));

      selectedNonGifts.forEach(detail => {
        for (const sale of activeFlashSales) {
          const matchedItem = sale.flashSaleItems.find((item) => {
            if (detail.bundleID && item.itemType === 3 && item.referenceId === detail.bundleID) return true;
            if (detail.variantID && item.itemType === 2 && item.referenceId === detail.variantID) return true;
            if (detail.product?.productID && item.itemType === 1 && item.referenceId === detail.product.productID) return true;
            return false;
          });

          if (matchedItem && matchedItem.discountType === 2 && matchedItem.giftVariantIds && Array.isArray(matchedItem.giftVariantIds)) {
            const giftIds = matchedItem.giftVariantIds;
            const giftIndex = remainingGifts.findIndex(g => g.variantID && giftIds.includes(g.variantID));
            if (giftIndex !== -1) {
              const associatedGift = remainingGifts[giftIndex];
              selectedIds.push(associatedGift.cartDetailID); // Ép thêm quà tặng vào selectedIds
              remainingGifts.splice(giftIndex, 1);
              break;
            }
          }
        }
      });
    } catch (e) {
      console.error("Lỗi khi fetch flash sale để map quà tặng ở checkout:", e);
    }

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
  const handleToggleCheck = (detailId: number, associatedGiftId?: number) => {
    setCheckedDetails((prev) => {
      const newState = !prev[detailId];
      const next = {
        ...prev,
        [detailId]: newState,
      };
      if (associatedGiftId !== undefined) {
        next[associatedGiftId] = newState;
      }
      return next;
    });
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
    if (!cart) return { subTotal: 0, discount: 0, shipping: 0, shippingDiscount: 0, total: 0, selectedCount: 0 };
    
    let subTotal = 0;
    let selectedCount = 0;

    cart.cartDetails.forEach((cd) => {
      if (checkedDetails[cd.cartDetailID]) {
        subTotal += cd.totalPrice;
        if (!cd.isGift) {
          selectedCount += 1;
        }
      }
    });

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
      if (discount > subTotal) {
        discount = subTotal;
      }
    }

    let shipping = 0;
    if (subTotal > 0) {
      shipping = 25000;
    }
    
    // Calculate shipping voucher discount
    let shippingDiscount = 0;
    if (cart.shippingVoucher && subTotal >= cart.shippingVoucher.minOrderValue) {
      if (cart.shippingVoucher.isFreeShipping) {
        shippingDiscount = shipping;
      } else {
        if (cart.shippingVoucher.isPercentage) {
          shippingDiscount = (shipping * cart.shippingVoucher.discountPercent) / 100;
        } else {
          shippingDiscount = cart.shippingVoucher.discountAmount;
        }
        if (cart.shippingVoucher.maxShippingDiscount && cart.shippingVoucher.maxShippingDiscount > 0) {
          shippingDiscount = Math.min(shippingDiscount, cart.shippingVoucher.maxShippingDiscount);
        }
        if (shippingDiscount > shipping) {
          shippingDiscount = shipping;
        }
      }
    }

    const total = Math.max(0, subTotal + shipping - discount - shippingDiscount);

    return { subTotal, discount, shipping, shippingDiscount, total, selectedCount };
  };

  const { subTotal, discount, shipping, shippingDiscount, total, selectedCount } = getSelectedCalculations();

  if (loading && !cart) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[calc(100vh-200px)] py-20 bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-slate-900" size={40} />
          <p className="text-slate-600 font-medium animate-pulse">Đang tải giỏ hàng của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 text-slate-800 font-sans min-h-screen pb-24 relative selection:bg-primary/10 selection:text-rose-900">
      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop pt-6 pb-12">
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
              shippingDiscount={shippingDiscount}
              total={total}
              selectedCount={selectedCount}
              voucherCodeInput={voucherCodeInput}
              setVoucherCodeInput={setVoucherCodeInput}
              applyingCode={applyingCode}
              handleApplyVoucherCode={handleApplyVoucherCode}
              handleAutoApplyVouchers={handleAutoApplyVouchers}
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
                className="text-slate-900 hover:text-slate-900 font-bold text-sm flex items-center gap-1 transition-colors"
              >
                Xem tất cả sản phẩm
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {loadingRecs ? (
              <div className="flex justify-center py-10">
                <Loader className="animate-spin text-slate-900" size={24} />
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
        cart={cart}
        handleRemoveVoucher={handleRemoveVoucher}
      />

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-w-[400px] w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-slate-900 shrink-0">
                <span className="material-symbols-outlined text-slate-900 text-lg">delete</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">{confirmModal.title}</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
              {confirmModal.message}
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-5 py-2.5 bg-primary/90 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1 shadow-sm cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
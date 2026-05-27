"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import {
  getCart,
  getUserAddresses,
  createInvoiceFromCart,
  AddressItem,
  CartInfo,
  CartDetailInfo,
  normalizeName
} from "@/lib/api";

import { CheckoutHeader } from "@/components/client/checkout/CheckoutHeader";
import { ShippingAddressSection } from "@/components/client/checkout/ShippingAddressSection";
import { PaymentMethodSection } from "@/components/client/checkout/PaymentMethodSection";
import { OrderNoteSection } from "@/components/client/checkout/OrderNoteSection";
import { OrderSummarySidebar } from "@/components/client/checkout/OrderSummarySidebar";
import { AddressModal } from "@/components/client/checkout/AddressModal";

export default function CheckoutPage() {
  const router = useRouter();

  // Auth states
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [cart, setCart] = useState<CartInfo | null>(null);
  const [selectedItems, setSelectedItems] = useState<CartDetailInfo[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null);
  
  // Note state
  const [note, setNote] = useState("");

  // Payment states (null = COD, 2 = Bank Transfer, 3 = VNPay)
  const [payMethod, setPayMethod] = useState<number | null>(null);

  // Address Modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Pricing states
  const [subTotal, setSubTotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Check auth and init
  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!savedToken || !savedUserJson) {
      toast.error("Vui lòng đăng nhập để thanh toán!");
      router.push("/login?redirect=/checkout");
      return;
    }

    setToken(savedToken);
    try {
      const parsedUser = JSON.parse(savedUserJson);
      const uid = parsedUser.id || parsedUser.userId;
      if (!uid) {
        toast.error("Không tìm thấy thông tin tài khoản!");
        router.push("/login");
        return;
      }
      setUserId(uid);
      initializeData(uid, savedToken);
    } catch (e) {
      console.error(e);
      router.push("/login");
    }
  }, []);

  // Recalculate fees when items or cart change
  useEffect(() => {
    if (selectedItems.length === 0) return;

    // Calculate subtotal
    const sum = selectedItems.reduce((acc, item) => acc + item.totalPrice, 0);
    setSubTotal(sum);

    // Calculate shipping fee
    let ship = 20000;
    if (sum >= 300000) {
      ship = 0;
    } else if (sum >= 100000) {
      ship = 15000;
    }
    setShippingFee(ship);

    // Calculate voucher discount
    let discount = 0;
    if (cart?.voucher) {
      const v = cart.voucher;
      if (sum >= (v.minOrderValue || 0)) {
        if (v.isPercentage) {
          discount = (sum * v.discountPercent) / 100;
          if (v.maxDiscount && v.maxDiscount > 0 && discount > v.maxDiscount) {
            discount = v.maxDiscount;
          }
        } else {
          discount = v.discountAmount;
        }

        if (discount > sum) {
          discount = sum;
        }
      }
    }
    setDiscountAmount(discount);
    setTotalPrice(sum + ship - discount);
  }, [selectedItems, cart]);

  const initializeData = async (uid: string, authToken: string) => {
    setLoading(true);
    try {
      // 1. Fetch Cart
      const cartData = await getCart(authToken);
      if (!cartData || cartData.cartDetails.length === 0) {
        toast.error("Giỏ hàng của bạn đang trống!");
        router.push("/cart");
        return;
      }
      setCart(cartData);

      // Get selected item IDs from localStorage
      const selectedIdsRaw = localStorage.getItem("selectedCartDetailIds");
      if (!selectedIdsRaw) {
        toast.error("Vui lòng chọn sản phẩm cần mua từ giỏ hàng!");
        router.push("/cart");
        return;
      }

      const selectedIds: number[] = JSON.parse(selectedIdsRaw);
      const items = cartData.cartDetails.filter((cd) => selectedIds.includes(cd.cartDetailID));
      
      if (items.length === 0) {
        toast.error("Không tìm thấy các sản phẩm đã chọn!");
        router.push("/cart");
        return;
      }
      setSelectedItems(items);

      // 2. Fetch User Addresses
      await refreshAddresses(uid, authToken);
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Không thể tải thông tin thanh toán. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const refreshAddresses = async (uid?: string, authToken?: string) => {
    const currentUid = uid || userId;
    const currentToken = authToken || token;
    if (!currentUid || !currentToken) return;

    const addressList = await getUserAddresses(currentUid, currentToken);
    if (addressList && addressList.length > 0) {
      setAddresses(addressList);
      
      // If we don't have a selected address, or the selected address is no longer in the list
      if (!selectedAddress || !addressList.find(a => a.addressID === selectedAddress.addressID)) {
        const defaultAddr = addressList.find((a) => a.isDefault) || addressList[0];
        setSelectedAddress(defaultAddr);
      } else {
        // Update selected address with latest data
        const updatedSelected = addressList.find(a => a.addressID === selectedAddress.addressID);
        if (updatedSelected) {
            setSelectedAddress(updatedSelected);
        }
      }
    } else {
      setAddresses([]);
      setSelectedAddress(null);
    }
  };

  const handleOpenNewAddressForm = () => {
    // This function can be passed down to open the modal and trigger new form logic
  };

  // Submit order handler
  const handlePlaceOrder = async () => {
    if (!token || !cart || selectedItems.length === 0) return;

    if (!selectedAddress) {
      toast.error("Vui lòng chọn hoặc thêm địa chỉ nhận hàng!");
      return;
    }

    setSubmitting(true);
    const selectedIds = selectedItems.map((item) => item.cartDetailID);

    try {
      const res = await createInvoiceFromCart(
        token,
        cart.cartID,
        payMethod,
        selectedAddress.addressID,
        selectedIds
      );

      if (res.success && res.data) {
        const invoiceId = res.data.invoiceID ?? res.data.id;
        toast.success("Tạo đơn hàng thành công!");
        
        // Clear selected item IDs from localStorage
        localStorage.removeItem("selectedCartDetailIds");

        // Redirect VNPay if mobile payment
        if (payMethod === 3 && res.paymentUrl) {
          toast.success("Đang chuyển hướng sang cổng thanh toán VNPay...");
          window.location.href = res.paymentUrl;
        } else {
          // COD or Bank Transfer redirect
          router.push(`/Invoice?payment=success&invoiceId=${invoiceId}`);
        }
      } else {
        toast.error(res.message || "Đặt hàng thất bại. Vui lòng kiểm tra lại số lượng tồn kho!");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast.error("Lỗi hệ thống khi đặt hàng. Vui lòng thử lại sau!");
    } finally {
      setSubmitting(false);
    }
  };

  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <Loader className="animate-spin h-10 w-10 text-rose-500 mx-auto" />
          <p className="text-slate-600 font-medium animate-pulse">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans selection:bg-rose-100 selection:text-rose-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        <CheckoutHeader />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Checkout Forms */}
          <div className="lg:col-span-8 space-y-6">
            <ShippingAddressSection
              selectedAddress={selectedAddress}
              setAddressModalOpen={setAddressModalOpen}
              handleOpenNewAddressForm={handleOpenNewAddressForm}
            />

            <PaymentMethodSection
              payMethod={payMethod}
              setPayMethod={setPayMethod}
            />

            <OrderNoteSection note={note} setNote={setNote} />
          </div>

          {/* Right Column: Order Summary */}
          <OrderSummarySidebar
            cart={cart}
            selectedItems={selectedItems}
            subTotal={subTotal}
            shippingFee={shippingFee}
            discountAmount={discountAmount}
            totalPrice={totalPrice}
            submitting={submitting}
            handlePlaceOrder={handlePlaceOrder}
            formatVND={formatVND}
          />
        </div>

      </div>

      {/* Address Selection Modal */}
      {userId && token && (
        <AddressModal
          userId={userId}
          token={token}
          addressModalOpen={addressModalOpen}
          setAddressModalOpen={setAddressModalOpen}
          addresses={addresses}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
          refreshAddresses={() => refreshAddresses(userId, token)}
          normalizeName={normalizeName}
        />
      )}
    </div>
  );
}

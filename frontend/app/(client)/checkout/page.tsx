"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  getCart,
  getUserAddresses,
  createInvoiceFromCart,
  getLoyaltyProfile,
  getLoyaltyPolicySummary,
  validateLoyaltyRedemption,
  AddressItem,
  CartInfo,
  CartDetailInfo,
  LoyaltyPolicySummaryResponse,
  normalizeName
} from "@/lib/api";
import { getCurrentFlashSale } from "@/lib/features/flash-sales/flashSaleApi";

import { CheckoutHeader } from "@/components/client/checkout/CheckoutHeader";
import { ShippingAddressSection } from "@/components/client/checkout/ShippingAddressSection";
import { PaymentMethodSection } from "@/components/client/checkout/PaymentMethodSection";
import { OrderNoteSection } from "@/components/client/checkout/OrderNoteSection";
import { OrderSummarySidebar } from "@/components/client/checkout/OrderSummarySidebar";
import { AddressModal } from "@/components/client/checkout/AddressModal";
import { VoucherModal } from "@/components/client/cart/VoucherModal";
import { getPublicVouchers, applyVoucherToCart, removeVoucherFromCart} from "@/lib/api";
import { Voucher } from "@/types";

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

  // Voucher Modal state
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Pricing states
  const [subTotal, setSubTotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingDiscountAmount, setShippingDiscountAmount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Loyalty states
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);
  const [isPointsApplied, setIsPointsApplied] = useState<boolean>(false);
  const [loyaltyMessage, setLoyaltyMessage] = useState<string>("");
  const [loyaltyError, setLoyaltyError] = useState<string>("");
  const [isApplyingPoints, setIsApplyingPoints] = useState<boolean>(false);
  const [loyaltyPolicySummary, setLoyaltyPolicySummary] = useState<LoyaltyPolicySummaryResponse | null>(null);
  const [estimatedEarnPoints, setEstimatedEarnPoints] = useState<number>(0);

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

      // Chặn Admin/Nhân viên hoặc tài khoản có quyền thực hiện mua hàng
      const roles = parsedUser?.roles || [];
      const permissions = parsedUser?.permissions || [];
      const isStaffOrAdmin = !!(parsedUser?.isAdmin || roles.includes("Admin") || roles.includes("Staff") || permissions.length > 0);

      if (isStaffOrAdmin) {
        toast.error("Tài khoản quản trị viên hoặc nhân viên không được phép thực hiện mua hàng!");
        router.replace("/");
        return;
      }

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

    // Capping loyalty discount if it exceeds net subtotal (sum - discount)
    let currentLoyaltyDiscount = loyaltyDiscount;
    if (loyaltyDiscount > 0 && loyaltyDiscount > (sum - discount)) {
      currentLoyaltyDiscount = 0;
      setLoyaltyDiscount(0);
      setPointsToUse(0);
      setIsPointsApplied(false);
      setLoyaltyMessage("");
      setLoyaltyError("Cấu trúc giá thay đổi, điểm tích lũy được gỡ bỏ.");
    }

    // Calculate shipping fee
    let ship = 25000;
    setShippingFee(ship);

    // Calculate shipping voucher discount
    let shipDiscount = 0;
    if (cart?.shippingVoucher) {
      const sv = cart.shippingVoucher;
      if (sum >= (sv.minOrderValue || 0)) {
        if (sv.isFreeShipping) {
          shipDiscount = ship;
        } else {
          if (sv.isPercentage) {
            shipDiscount = (ship * sv.discountPercent) / 100;
          } else {
            shipDiscount = sv.discountAmount;
          }
          if (sv.maxShippingDiscount && sv.maxShippingDiscount > 0) {
            shipDiscount = Math.min(shipDiscount, sv.maxShippingDiscount);
          }
          shipDiscount = Math.min(shipDiscount, ship);
        }
      }
    }
    setShippingDiscountAmount(shipDiscount);

    setTotalPrice(sum + ship - discount - currentLoyaltyDiscount - shipDiscount);
  }, [selectedItems, cart, loyaltyDiscount]);

  useEffect(() => {
    const policy = loyaltyPolicySummary?.earnPolicy;
    if (!policy || policy.vndAmount <= 0 || policy.pointsEarned <= 0) {
      setEstimatedEarnPoints(0);
      return;
    }

    const netSubtotal = Math.max(subTotal - discountAmount - loyaltyDiscount, 0);
    const basePoints = Math.floor(netSubtotal / policy.vndAmount) * policy.pointsEarned;
    const multiplied = Math.floor(basePoints * (policy.multiplier || 1));
    setEstimatedEarnPoints(Math.max(0, multiplied));
  }, [subTotal, discountAmount, loyaltyDiscount, loyaltyPolicySummary]);

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
      const selectedNonGifts = cartData.cartDetails.filter((cd) => !cd.isGift && selectedIds.includes(cd.cartDetailID));
      let items = [...selectedNonGifts];
      const allGiftsInCart = cartData.cartDetails.filter(cd => cd.isGift);

      try {
        const sales = await getCurrentFlashSale();
        const activeFlashSales = (sales || []).filter(sale => sale.isActive && sale.status === 1);
        let remainingGifts = [...allGiftsInCart];

        selectedNonGifts.forEach(detail => {
          for (const sale of activeFlashSales) {
            const matchedItem = sale.flashSaleItems.find((item) => {
              if (item.itemType === 1 && detail.variantID && item.referenceId === detail.product?.productID) return true;
              if (item.itemType === 2 && detail.variantID && item.referenceId === detail.variantID) return true;
              if (item.itemType === 3 && detail.bundleID && item.referenceId === detail.bundleID) return true;
              return false;
            });

            if (matchedItem && matchedItem.discountType === 2 && matchedItem.giftVariantIds && Array.isArray(matchedItem.giftVariantIds)) {
              const giftIds = matchedItem.giftVariantIds;
              const giftIndex = remainingGifts.findIndex(g => g.variantID && giftIds.includes(g.variantID));
              if (giftIndex !== -1) {
                items.push(remainingGifts[giftIndex]);
                remainingGifts.splice(giftIndex, 1);
                break;
              }
            }
          }
        });
        
        remainingGifts.forEach(g => {
          if (selectedIds.includes(g.cartDetailID) && !items.some(i => i.cartDetailID === g.cartDetailID)) {
             items.push(g);
          }
        });

      } catch (e) {
        console.error("Lỗi khi load flash sale ở checkout:", e);
        const explicitGifts = allGiftsInCart.filter(g => selectedIds.includes(g.cartDetailID) && !items.some(i => i.cartDetailID === g.cartDetailID));
        items = [...items, ...explicitGifts];
      }
      
      if (items.length === 0) {
        toast.error("Không tìm thấy các sản phẩm đã chọn!");
        router.push("/cart");
        return;
      }
      setSelectedItems(items);

      // 2. Fetch User Addresses
      await refreshAddresses(uid, authToken);

      // 3. Fetch Loyalty Profile
      try {
        const loyaltyProfile = await getLoyaltyProfile(authToken);
        if (loyaltyProfile) {
          setAvailablePoints(loyaltyProfile.availablePoints);
        }
        const policySummary = await getLoyaltyPolicySummary(authToken);
        if (policySummary) {
          setLoyaltyPolicySummary(policySummary);
        }
      } catch (e) {
        console.error("Error fetching loyalty profile:", e);
      }
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Không thể tải thông tin thanh toán. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Handle Apply Points
  const handleApplyPoints = async (pointsInput: number) => {
    console.log("handleApplyPoints called with:", pointsInput, "token:", token ? "exists" : "null");
    toast.info(`Đang xác thực ${pointsInput.toLocaleString("vi-VN")} điểm...`);

    if (!token) {
      toast.error("Vui lòng đăng nhập lại để sử dụng điểm!");
      return;
    }

    if (pointsInput < 0) {
      setLoyaltyError("Số điểm sử dụng phải lớn hơn hoặc bằng 0");
      setLoyaltyDiscount(0);
      setIsPointsApplied(false);
      setPointsToUse(0);
      return;
    }

    if (pointsInput === 0) {
      setLoyaltyDiscount(0);
      setIsPointsApplied(false);
      setPointsToUse(0);
      setLoyaltyMessage("");
      setLoyaltyError("");
      return;
    }

    if (pointsInput > availablePoints) {
      setLoyaltyError(`Số điểm sử dụng vượt quá số dư khả dụng (${availablePoints} điểm)`);
      setLoyaltyDiscount(0);
      setIsPointsApplied(false);
      setPointsToUse(0);
      return;
    }

    const maxAllowedPoints = subTotal - discountAmount;
    if (pointsInput > maxAllowedPoints) {
      setLoyaltyError(`Số điểm sử dụng vượt quá giá trị đơn hàng sau giảm giá (${formatVND(maxAllowedPoints)})`);
      setLoyaltyDiscount(0);
      setIsPointsApplied(false);
      setPointsToUse(0);
      return;
    }

    setIsApplyingPoints(true);
    setLoyaltyError("");
    setLoyaltyMessage("");
    try {
      const res = await validateLoyaltyRedemption(token, pointsInput, subTotal - discountAmount);
      if (res.success && res.isApplied) {
        setLoyaltyDiscount(res.discountAmount);
        setPointsToUse(res.pointsUsed);
        setIsPointsApplied(true);
        setLoyaltyMessage(`Áp dụng đổi ${res.pointsUsed.toLocaleString("vi-VN")} điểm thành công (-${formatVND(res.discountAmount)})`);
      } else {
        setLoyaltyError(res.message || "Điểm quy đổi không hợp lệ.");
        setLoyaltyDiscount(0);
        setIsPointsApplied(false);
        setPointsToUse(0);
      }
    } catch (error) {
      console.error("Redemption error:", error);
      setLoyaltyError("Có lỗi xảy ra khi xác thực điểm tích lũy.");
      setLoyaltyDiscount(0);
      setIsPointsApplied(false);
      setPointsToUse(0);
    } finally {
      setIsApplyingPoints(false);
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

  const handleApplyVoucherFromModal = async (code: string) => {
    if (!token) return;
    try {
      const res = await applyVoucherToCart(token, code);
      if (res.success && res.data) {
        setCart(res.data);
        toast.success(res.message || "Áp dụng mã giảm giá thành công!");
      } else {
        toast.error(res.message || "Áp dụng voucher thất bại");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    }
  };

  const handleRemoveVoucher = async (type?: number) => {
    if (!token) return;
    try {
      const res = await removeVoucherFromCart(token, type);
      if (res.success && res.data) {
        setCart(res.data);
        toast.success(res.message || "Đã hủy áp dụng mã giảm giá");
      } else {
        toast.error(res.message || "Không thể hủy mã giảm giá");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
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
        selectedIds,
        pointsToUse
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
            shippingDiscountAmount={shippingDiscountAmount}
            totalPrice={totalPrice}
            submitting={submitting}
            handlePlaceOrder={handlePlaceOrder}
            formatVND={formatVND}
            availablePoints={availablePoints}
            pointsToUse={pointsToUse}
            loyaltyDiscount={loyaltyDiscount}
            isPointsApplied={isPointsApplied}
            loyaltyMessage={loyaltyMessage}
            loyaltyError={loyaltyError}
            isApplyingPoints={isApplyingPoints}
            handleApplyPoints={handleApplyPoints}
            earnPolicy={loyaltyPolicySummary?.earnPolicy || null}
            redeemPolicy={loyaltyPolicySummary?.redeemPolicy || null}
            estimatedEarnPoints={estimatedEarnPoints}
            handleOpenVoucherModal={handleOpenVoucherModal}
            handleRemoveVoucher={handleRemoveVoucher}
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

      {/* Voucher Selection Modal */}
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
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Loader, 
  MapPin, 
  CreditCard, 
  Wallet, 
  Coins, 
  FileText, 
  Plus, 
  ArrowLeft, 
  ShieldCheck, 
  Check, 
  X,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Pencil
} from "lucide-react";
import { toast } from "sonner";
import {
  getCart,
  getUserAddresses,
  getProvinces,
  getDistricts,
  getWards,
  createAddress,
  updateAddress,
  createInvoiceFromCart,
  AddressItem,
  CartInfo,
  CartDetailInfo,
  normalizeName
} from "@/lib/api";

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

  // Payment states
  // null = COD, 2 = Chuyển khoản ngân hàng (DebitCard), 3 = Ví điện tử VNPay (MobilePayment)
  const [payMethod, setPayMethod] = useState<number | null>(null);

  // Address Modal states
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);
  const [loadingGeoData, setLoadingGeoData] = useState(false);

  const [addressForm, setAddressForm] = useState({
    recipientName: "",
    phoneNumber: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: "",
    wardCode: "",
    wardName: "",
    detailAddress: "",
    isDefault: false
  });

  // Calculate pricing client-side (to match backend logic)
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
    // >= 300,000đ -> 0đ
    // >= 100,000đ -> 15,000đ
    // < 100,000đ -> 20,000đ
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
      // Check minimum order value
      if (sum >= (v.minOrderValue || 0)) {
        if (v.isPercentage) {
          // Percentage discount
          discount = (sum * v.discountPercent) / 100;
          if (v.maxDiscount && v.maxDiscount > 0 && discount > v.maxDiscount) {
            discount = v.maxDiscount;
          }
        } else {
          // Fixed amount
          discount = v.discountAmount;
        }

        // Limit discount to subtotal
        if (discount > sum) {
          discount = sum;
        }
      }
    }
    setDiscountAmount(discount);

    // Calculate total price
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
      const addressList = await getUserAddresses(uid, authToken);
      if (addressList && addressList.length > 0) {
        setAddresses(addressList);
        // Find default address or choose first
        const defaultAddr = addressList.find((a) => a.isDefault) || addressList[0];
        setSelectedAddress(defaultAddr);
      }
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Không thể tải thông tin thanh toán. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Geographic changes
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    
    setAddressForm((prev) => ({
      ...prev,
      provinceCode: code,
      provinceName: name,
      districtCode: "",
      districtName: "",
      wardCode: "",
      wardName: "",
    }));
    setDistricts([]);
    setWards([]);

    if (!code) return;

    try {
      setLoadingGeoData(true);
      const data = await getDistricts(code);
      if (data) {
        const dists = data.districts || [];
        setDistricts(dists);
        if (dists.length === 1) {
          const singleDist = dists[0];
          setAddressForm((prev) => ({
            ...prev,
            districtCode: singleDist.code,
            districtName: singleDist.name,
          }));
          
          // Fetch wards immediately
          const wardData = await getWards(singleDist.code);
          if (wardData) {
            setWards(wardData.wards || []);
          }
        }
      }
    } catch (err) {
      console.error("Error loading districts:", err);
    } finally {
      setLoadingGeoData(false);
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setAddressForm((prev) => ({
      ...prev,
      districtCode: code,
      districtName: name,
      wardCode: "",
      wardName: "",
    }));
    setWards([]);

    if (!code) return;

    try {
      setLoadingGeoData(true);
      const data = await getWards(code);
      if (data) {
        setWards(data.wards || []);
      }
    } catch (err) {
      console.error("Error loading wards:", err);
    } finally {
      setLoadingGeoData(false);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setAddressForm((prev) => ({
      ...prev,
      wardCode: code,
      wardName: name,
    }));
  };

  const handleOpenNewAddressForm = async () => {
    setShowNewAddressForm(true);
    setAddressFormError(null);
    setEditingAddress(null);
    setAddressForm({
      recipientName: "",
      phoneNumber: "",
      provinceCode: "",
      provinceName: "",
      districtCode: "",
      districtName: "",
      wardCode: "",
      wardName: "",
      detailAddress: "",
      isDefault: false
    });
    setDistricts([]);
    setWards([]);
    
    try {
      setLoadingGeoData(true);
      const provList = await getProvinces();
      if (provList) {
        setProvinces(provList);
      }
    } catch (err) {
      console.error("Error loading provinces:", err);
    } finally {
      setLoadingGeoData(false);
    }
  };

  const normalizeName = (name: string): string => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/^(tinh|thanh pho|tp\.|tp|quan|huyen|thixa|thi xa|phuong|xa|thi tran|dist\.|dist)\s+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleOpenEditAddressForm = async (address: AddressItem) => {
    setEditingAddress(address);
    setAddressFormError(null);
    setShowNewAddressForm(true);
    setLoadingGeoData(true);

    try {
      // Load provinces
      const provList = await getProvinces();
      if (provList) {
        setProvinces(provList);
      }

      // Find province code by code or name
      let matchedProvince = null;
      if (address.provinceCode) {
        matchedProvince = provList?.find((p) => String(p.code) === String(address.provinceCode));
      }
      if (!matchedProvince && address.province) {
        matchedProvince = provList?.find((p) => normalizeName(p.name) === normalizeName(address.province));
      }
      const provCode = matchedProvince ? String(matchedProvince.code) : (address.provinceCode ? String(address.provinceCode) : "");
      const provName = matchedProvince?.name || address.province || "";

      let distList: any[] = [];
      let matchedDistrict: any = null;
      if (provCode) {
        const distData = await getDistricts(provCode);
        distList = distData?.districts || [];
        setDistricts(distList);
        
        if (distList.length === 1) {
          matchedDistrict = distList[0];
        } else {
          if (address.districtCode) {
            matchedDistrict = distList.find((d) => String(d.code) === String(address.districtCode));
          }
          if (!matchedDistrict && address.district) {
            matchedDistrict = distList.find((d) => normalizeName(d.name) === normalizeName(address.district));
          }
        }
      }
      const distCode = matchedDistrict ? String(matchedDistrict.code) : (address.districtCode ? String(address.districtCode) : "");
      const distName = matchedDistrict?.name || address.district || "";

      let wardList: any[] = [];
      let matchedWard: any = null;
      const wardFetchCode = distCode || provCode;
      if (wardFetchCode) {
        const wardData = await getWards(wardFetchCode);
        wardList = wardData?.wards || [];
        setWards(wardList);
        
        if (address.wardCode) {
          matchedWard = wardList.find((w: any) => String(w.code) === String(address.wardCode));
        }
        if (!matchedWard && address.ward) {
          matchedWard = wardList.find((w: any) => normalizeName(w.name) === normalizeName(address.ward));
        }
      }
      const wardCode = matchedWard ? String(matchedWard.code) : (address.wardCode ? String(address.wardCode) : "");
      const wardName = matchedWard?.name || address.ward || "";

      setAddressForm({
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        provinceCode: provCode,
        provinceName: provName,
        districtCode: distCode,
        districtName: distName,
        wardCode: wardCode,
        wardName: wardName,
        detailAddress: address.detailAddress,
        isDefault: address.isDefault
      });
    } catch (err) {
      console.error("Error setting edit address form:", err);
      toast.error("Không thể tải thông tin khu vực địa lý!");
    } finally {
      setLoadingGeoData(false);
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !userId) return;

    if (!addressForm.recipientName || !addressForm.phoneNumber || !addressForm.detailAddress) {
      setAddressFormError("Vui lòng điền đầy đủ các trường thông tin bắt buộc!");
      return;
    }
    if (!addressForm.provinceCode || !addressForm.districtCode || !addressForm.wardCode) {
      setAddressFormError("Vui lòng chọn Tỉnh/Thành, Quận/Huyện và Phường/Xã!");
      return;
    }

    setAddressFormError(null);
    const payload = {
      userId: userId,
      recipientName: addressForm.recipientName,
      phoneNumber: addressForm.phoneNumber,
      provinceCode: addressForm.provinceCode,
      provinceName: addressForm.provinceName,
      districtCode: addressForm.districtCode,
      districtName: addressForm.districtName,
      wardCode: addressForm.wardCode,
      wardName: addressForm.wardName,
      detailAddress: addressForm.detailAddress,
      isDefault: addressForm.isDefault,
    };

    try {
      setLoadingGeoData(true);
      let result;
      if (editingAddress) {
        result = await updateAddress(editingAddress.addressID, token, payload);
      } else {
        result = await createAddress(token, payload);
      }

      if (result.success) {
        toast.success(editingAddress ? "Cập nhật địa chỉ thành công!" : "Thêm địa chỉ mới thành công!");
        setShowNewAddressForm(false);
        setEditingAddress(null);
        // Refresh address list
        const addressList = await getUserAddresses(userId, token);
        if (addressList) {
          setAddresses(addressList);
          // Set as selected address if default or if it's the newly saved address
          const newlySaved = addressList.find(
            (a) => a.detailAddress === payload.detailAddress && a.phoneNumber === payload.phoneNumber
          ) || addressList[addressList.length - 1];
          setSelectedAddress(newlySaved);
        }
      } else {
        setAddressFormError(result.message || "Có lỗi xảy ra khi lưu thông tin địa chỉ");
      }
    } catch (err) {
      console.error(err);
      setAddressFormError("Lỗi kết nối đến server");
    } finally {
      setLoadingGeoData(false);
    }
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

  // Format currency VNĐ
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
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Navigation Breadcrumbs / Stepper */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-slate-500 hover:text-rose-500 font-semibold transition-colors group mb-4 sm:mb-0"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại giỏ hàng</span>
          </Link>

          {/* Stepper */}
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs mr-2">1</span>
              <span>Giỏ hàng</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <div className="flex items-center text-rose-500 font-semibold">
              <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs mr-2 shadow-sm">2</span>
              <span>Thanh toán</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <div className="flex items-center text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs mr-2">3</span>
              <span>Hoàn thành</span>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Checkout Forms */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Shipping Address Section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Địa chỉ giao hàng</h2>
                </div>
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="flex items-center gap-1 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Thay đổi địa chỉ
                </button>
              </div>

              {/* Selected Address Card */}
              {selectedAddress ? (
                <div className="border border-rose-100 bg-rose-50/20 rounded-xl p-4 relative overflow-hidden transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-800">{selectedAddress.recipientName}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-600 font-medium">{selectedAddress.phoneNumber}</span>
                        {selectedAddress.isDefault && (
                          <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Mặc Định
                          </span>
                        )}
                      </div>
                      
                      <p className="text-slate-600 text-sm flex items-start">
                        <MapPin className="h-4 w-4 text-rose-400 mr-2 flex-shrink-0 mt-0.5" />
                        <span>
                          {selectedAddress.detailAddress}, {selectedAddress.ward}, {selectedAddress.district === selectedAddress.province ? selectedAddress.province : `${selectedAddress.district}, ${selectedAddress.province}`}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => setAddressModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 hover:border-rose-300 text-rose-500 hover:bg-rose-50 rounded-full text-xs font-bold transition-all bouncy-hover shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Đổi địa chỉ</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
                  <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm mb-4">Bạn chưa chọn hoặc chưa có địa chỉ giao hàng nào.</p>
                  <button
                    onClick={() => {
                      setAddressModalOpen(true);
                      handleOpenNewAddressForm();
                    }}
                    className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all bouncy-hover"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm địa chỉ mới
                  </button>
                </div>
              )}
            </section>

            {/* 2. Payment Method Section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h2 className="text-lg font-bold text-slate-800">Phương thức thanh toán</h2>
              </div>

              {/* Grid method selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Method 1: COD */}
                <div
                  onClick={() => setPayMethod(null)}
                  className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bouncy-hover ${
                    payMethod === null
                      ? "border-rose-500 bg-rose-500/[0.03] shadow-sm"
                      : "border-slate-200 hover:border-rose-200"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    payMethod === null ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
                  }`}>
                    <Coins className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 mb-1">Thanh toán khi nhận hàng</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">COD - Tiền mặt</p>
                </div>

                {/* Method 2: Bank Transfer */}
                <div
                  onClick={() => setPayMethod(2)}
                  className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bouncy-hover ${
                    payMethod === 2
                      ? "border-rose-500 bg-rose-500/[0.03] shadow-sm"
                      : "border-slate-200 hover:border-rose-200"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    payMethod === 2 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
                  }`}>
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 mb-1">Chuyển khoản</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Thẻ ngân hàng</p>
                </div>

                {/* Method 3: E-wallet VNPay */}
                <div
                  onClick={() => setPayMethod(3)}
                  className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bouncy-hover ${
                    payMethod === 3
                      ? "border-rose-500 bg-rose-500/[0.03] shadow-sm"
                      : "border-slate-200 hover:border-rose-200"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    payMethod === 3 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
                  }`}>
                    <Wallet className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 mb-1">Cổng thanh toán VNPay</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Ví điện tử / QR Code</p>
                </div>

              </div>

              {/* Sub-text depending on method */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                {payMethod === null && (
                  <p>Bạn sẽ thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận được đơn hàng.</p>
                )}
                {payMethod === 2 && (
                  <div>
                    <p className="mb-2 font-semibold text-slate-700">Thông tin chuyển khoản ngân hàng:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Ngân hàng: <span className="font-bold text-slate-800">MB Bank (Ngân hàng Quân Đội)</span></li>
                      <li>Số tài khoản: <span className="font-bold text-slate-800">0387244889</span></li>
                      <li>Chủ tài khoản: <span className="font-bold text-slate-800">NGUYEN HOANG PHUC</span></li>
                      <li>Nội dung chuyển khoản: <span className="font-semibold text-rose-600">Thanh toan don hang LazPe [SĐT của bạn]</span></li>
                    </ul>
                  </div>
                )}
                {payMethod === 3 && (
                  <p>Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán bảo mật VNPay để thực hiện giao dịch bằng thẻ ATM, thẻ quốc tế hoặc quét mã QR.</p>
                )}
              </div>
            </section>

            {/* 3. Order Notes Section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h2 className="text-lg font-bold text-slate-800">Ghi chú đơn hàng <span className="text-xs text-slate-400 font-normal">(tùy chọn)</span></h2>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  VÍ DỤ: Giao giờ hành chính, gọi trước khi giao, hoặc đặt ở hòm thư...
                </p>
                <div className="relative">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 500))}
                    className="w-full h-28 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 p-4 font-sans text-sm bg-slate-50/50 resize-none transition-all outline-none"
                    placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt của bạn..."
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-bold">
                    {note.length}/500 ký tự
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              
              {/* Heading */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-800 mb-4">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <h2 className="text-lg font-bold">Đơn hàng của bạn</h2>
                </div>

                {/* List of checked items */}
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                  {selectedItems.map((item) => {
                    const isBundle = !!item.bundleID;
                    const name = isBundle ? item.bundle?.name : item.product?.name;
                    const image = isBundle ? item.bundle?.imageUrl : item.variant?.imageUrl || item.product?.imageUrl;
                    
                    const variantText = isBundle
                      ? "Gói Combo"
                      : [item.variant?.color, item.variant?.size].filter(Boolean).join(" - ");

                    return (
                      <div key={item.cartDetailID} className="flex gap-3 items-center">
                        {/* Product Image */}
                        <div className="relative w-16 h-16 bg-slate-50 rounded-xl p-1 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            alt={name || "Sản phẩm"}
                            className="w-full h-full object-contain"
                            src={image || "/images/placeholder.jpg"}
                          />
                          <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                            x{item.quantity}
                          </span>
                        </div>

                        {/* Product Info */}
                        <div className="flex-grow min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate" title={name || ""}>
                            {name}
                          </h4>
                          
                          {/* Hiển thị phân loại thay vì biến thể */}
                          {variantText && (
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              Phân loại: {variantText}
                            </p>
                          )}
                          
                          <div className="text-rose-500 text-xs font-extrabold mt-1">
                            {formatVND(item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Voucher apply indicator */}
              {cart?.voucher && (
                <div className="mx-6 mt-6 p-3 rounded-xl border border-dashed border-rose-200 bg-rose-500/[0.02] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="text-xs font-bold text-slate-800">
                      Đã áp dụng mã: <span className="text-rose-600 font-extrabold">{cart.voucher.code}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {cart.voucher.name}
                    </div>
                  </div>
                </div>
              )}

              {/* Price Calculations */}
              <div className="p-6 space-y-4">
                <div className="space-y-2.5 text-sm">
                  
                  {/* Subtotal */}
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tạm tính ({selectedItems.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm):</span>
                    <span className="font-semibold text-slate-800">{formatVND(subTotal)}</span>
                  </div>

                  {/* Shipping Fee */}
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Phí vận chuyển:</span>
                    <span className={`font-semibold ${shippingFee === 0 ? "text-emerald-500 font-bold" : "text-slate-800"}`}>
                      {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
                    </span>
                  </div>

                  {/* Shipping free progress banner if not free */}
                  {shippingFee > 0 && (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-500">
                      💡 Mua thêm <span className="font-bold text-rose-500">{formatVND(300000 - subTotal)}</span> để được <span className="font-bold text-emerald-500">Miễn phí vận chuyển</span>!
                    </div>
                  )}

                  {/* Voucher Discount */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-rose-500">
                      <span>Giảm giá từ Voucher:</span>
                      <span className="font-bold">- {formatVND(discountAmount)}</span>
                    </div>
                  )}

                  {/* Separator */}
                  <div className="h-px bg-slate-100 my-2" />

                  {/* Total Payment */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-bold text-slate-800">Tổng thanh toán:</span>
                    <span className="text-xl font-extrabold text-rose-500">{formatVND(totalPrice)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-xl py-3.5 font-bold text-sm shadow-md hover:shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 bouncy-hover transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader className="animate-spin h-5 w-5" />
                        <span>ĐANG ĐẶT HÀNG...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-5 w-5" />
                        <span>ĐẶT HÀNG NGAY</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span>Thông tin thanh toán được bảo mật an toàn</span>
                  </p>
                </div>
              </div>

            </div>
          </aside>
        </div>

      </div>

      {/* Address Selection Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => {
              setAddressModalOpen(false);
              setShowNewAddressForm(false);
            }}
          />

          {/* Modal Box */}
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 w-[calc(100%-2rem)] sm:w-[500px] min-w-[300px] shrink-0 max-h-[85vh] flex flex-col overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-800" id="modal-title">
                {showNewAddressForm ? (editingAddress ? "Chỉnh sửa địa chỉ giao hàng" : "Thêm địa chỉ giao hàng mới") : "Địa chỉ giao hàng của tôi"}
              </h3>
              <button
                type="button"
                className="bg-white hover:bg-slate-100 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200"
                onClick={() => {
                  setAddressModalOpen(false);
                  setShowNewAddressForm(false);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-grow">
              
              {/* Form Add New Address */}
              {showNewAddressForm ? (
                <form onSubmit={handleSaveNewAddress} className="space-y-4">
                  {addressFormError && (
                    <div className="p-3 rounded-lg bg-rose-50 text-xs font-semibold text-rose-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>{addressFormError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                        Tên người nhận <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.recipientName}
                        onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    
                    {/* Phone */}
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={addressForm.phoneNumber}
                        onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                        placeholder="0987654321"
                      />
                    </div>
                  </div>

                  {/* Geolocation Selects */}
                  <div className="space-y-3">
                    {/* Province */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                        Tỉnh / Thành phố <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={addressForm.provinceCode}
                        onChange={handleProvinceChange}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 bg-white outline-none"
                      >
                        <option value="">Chọn Tỉnh / Thành phố</option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* District */}
                    {districts.length > 1 && (
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                          Quận / Huyện <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={addressForm.districtCode}
                          onChange={handleDistrictChange}
                          disabled={!addressForm.provinceCode}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 bg-white outline-none disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">Chọn Quận / Huyện</option>
                          {districts.map((d) => (
                            <option key={d.code} value={d.code}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Ward */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                        Phường / Xã <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={addressForm.wardCode}
                        onChange={handleWardChange}
                        disabled={!addressForm.districtCode}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 bg-white outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">Chọn Phường / Xã</option>
                        {wards.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Detail Address */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Địa chỉ chi tiết (Số nhà, tên đường...) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.detailAddress}
                      onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                      placeholder="Số 12, Ngõ 34 Đường ABC"
                    />
                  </div>

                  {/* Is Default Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded text-rose-500 focus:ring-rose-500"
                    />
                    <label htmlFor="isDefault" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                      Đặt làm địa chỉ mặc định
                    </label>
                  </div>

                  {/* Submit Form Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loadingGeoData}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                    >
                      {loadingGeoData && <Loader className="animate-spin h-4 w-4" />}
                      <span>Lưu địa chỉ</span>
                    </button>
                  </div>
                </form>
              ) : (
                
                // Address list selection
                <div className="space-y-4">
                  
                  {/* Add Address button at top */}
                  <button
                    onClick={handleOpenNewAddressForm}
                    className="w-full border-2 border-dashed border-rose-300 rounded-xl p-3 flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-500/[0.02] transition-colors font-bold text-sm bouncy-hover"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Thêm địa chỉ giao hàng mới</span>
                  </button>

                  {/* List Items */}
                  {addresses.length === 0 ? (
                    <p className="text-center text-slate-400 py-6 text-sm">Bạn chưa cấu hình địa chỉ nào.</p>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-1">
                      {addresses.map((addr) => (
                        <div
                          key={addr.addressID}
                          onClick={() => {
                            setSelectedAddress(addr);
                            setAddressModalOpen(false);
                          }}
                          className={`border rounded-xl p-4 cursor-pointer transition-all ${
                            selectedAddress?.addressID === addr.addressID
                              ? "border-rose-500 bg-rose-500/[0.01]"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1 flex-grow">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">{addr.recipientName}</span>
                                <span className="text-slate-300 text-xs">|</span>
                                <span className="text-slate-600 text-xs font-semibold">{addr.phoneNumber}</span>
                                {addr.isDefault && (
                                  <span className="bg-rose-100 text-rose-600 text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                                    Mặc Định
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-500 text-xs leading-relaxed">
                                {addr.detailAddress}, {addr.ward}, {addr.district === addr.province ? addr.province : `${addr.district}, ${addr.province}`}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2.5 shrink-0">
                              {/* Nút sửa địa chỉ */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation(); // Ngăn chọn địa chỉ khi click nút sửa
                                  handleOpenEditAddressForm(addr);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                title="Sửa địa chỉ"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              {/* Selected Radio Indicator */}
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedAddress?.addressID === addr.addressID
                                  ? "border-rose-500 bg-rose-500 text-white"
                                  : "border-slate-300"
                              }`}>
                                {selectedAddress?.addressID === addr.addressID && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

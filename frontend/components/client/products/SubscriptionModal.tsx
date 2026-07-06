"use client";

import React, { useState, useEffect } from "react";
import { Product, Variant } from "@/types";
import { X, CheckCircle2, Truck, CreditCard, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  variant: Variant | null | undefined;
  quantity: number;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  product,
  variant,
  quantity,
}) => {
  const router = useRouter();
  const [frequencyType, setFrequencyType] = useState<1 | 2 | 3>(1); // 1: Days, 2: Weeks, 3: Months
  const [frequencyValue, setFrequencyValue] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("");
  const [addressId, setAddressId] = useState<number | "">("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default start date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow.toISOString().split("T")[0]);
      
      // Load addresses
      fetchAddresses();
    }
  }, [isOpen]);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!token || !userStr) return;
      
      const user = JSON.parse(userStr);
      const uid = user.id || user.userId;
      if (!uid) return;

      setLoading(true);
      const { getUserProfile, getUserAddresses } = await import("@/lib/api");
      
      // Fetch profile first to get the correct database userId (in case uid from token is a provider ID)
      const profile = await getUserProfile(uid, token);
      const targetUserId = profile?.userId || uid;

      const data = await getUserAddresses(targetUserId, token);
      
      if (data) {
        setAddresses(data);
        const defaultAddr = data.find((a: any) => a.isDefault);
        if (defaultAddr) setAddressId(defaultAddr.addressID);
        else if (data.length > 0) setAddressId(data[0].addressID);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentPrice = variant ? (variant.finalPrice ?? variant.unitPrice) : (product.discountPrice ?? product.price);
  const subscribedPrice = currentPrice;
  const priceAfterDiscount = currentPrice * 0.95;
  const shippingFee = 30000;
  const totalAmount = (priceAfterDiscount * quantity) + shippingFee;

  const handleSubmit = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đăng ký mua định kỳ.");
      router.push("/login");
      return;
    }

    if (!addressId) {
      toast.error("Vui lòng chọn địa chỉ giao hàng.");
      return;
    }

    try {
      setSubmitting(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      
      const payload = {
        productID: product.id,
        variantID: variant?.variantID,
        quantity: quantity,
        frequencyType,
        frequencyValue,
        startDate,
        shippingAddressId: Number(addressId),
        subscribedPrice
      };

      const res = await fetch(`${API_BASE_URL}/Subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Đăng ký mua định kỳ thành công!");
        window.dispatchEvent(new CustomEvent("subscription_success"));
        onClose();
        // Option: redirect to profile/subscriptions
        // router.push("/profile?tab=subscriptions");
      } else {
        toast.error(data.message || "Có lỗi xảy ra khi đăng ký.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90vw] md:w-[850px] max-w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">autorenew</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Đăng ký Mua Định Kỳ</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - 2 Columns */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Column - Product & Options */}
          <div className="w-full md:w-[55%] p-6 overflow-y-auto custom-scrollbar border-r border-slate-100">
            {/* Product Summary */}
            <div className="flex gap-4 p-4 bg-slate-50 rounded-xl mb-6 border border-slate-100">
              <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-white">
                <img src={variant?.imageUrl || product.image || product.imageUrls?.[0]} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 line-clamp-2 text-sm">{product.name}</h4>
                {variant && (
                  <p className="text-xs text-slate-500 mt-1">Phân loại: {variant.variantName}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-slate-800">₫{subscribedPrice.toLocaleString("vi-VN")}</span>
                  <span className="text-xs text-slate-400">x {quantity}</span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Frequency Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Chu kỳ giao hàng</label>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    min="1" 
                    value={frequencyValue}
                    onChange={(e) => setFrequencyValue(Number(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold"
                  />
                  <select 
                    value={frequencyType}
                    onChange={(e) => setFrequencyType(Number(e.target.value) as 1|2|3)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  >
                    <option value={1}>Ngày / lần</option>
                    <option value={2}>Tuần / lần</option>
                    <option value={3}>Tháng / lần</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ngày bắt đầu đơn đầu tiên</label>
                <input 
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Địa chỉ nhận hàng</label>
                {loading ? (
                  <div className="h-10 bg-slate-100 animate-pulse rounded-lg"></div>
                ) : addresses.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg text-sm text-orange-600 font-medium">
                    Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ trong <a href="/profile?tab=addresses" className="underline font-bold text-orange-700">Hồ sơ cá nhân</a>.
                  </div>
                ) : (
                  <select 
                    value={addressId}
                    onChange={(e) => setAddressId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  >
                    <option value="" disabled>-- Chọn địa chỉ --</option>
                    {addresses.map(addr => {
                      const fullAddress = [addr.detailAddress, addr.ward, addr.district, addr.province].filter(Boolean).join(", ");
                      return (
                        <option key={addr.addressID} value={addr.addressID}>
                          {addr.recipientName} - {addr.phoneNumber} ({fullAddress})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Benefits & Payment */}
          <div className="w-full md:w-[45%] bg-slate-50 flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="font-bold text-slate-800 mb-4">Lợi ích dành cho bạn</h4>
              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="w-7 h-7 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">sell</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Giảm thêm 5%</p>
                    <p className="text-slate-600 text-[11px] leading-tight mt-0.5">Cho mọi đơn hàng định kỳ.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <CreditCard size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Thanh toán tự động</p>
                    <p className="text-slate-600 text-[11px] leading-tight mt-0.5">Trừ tiền qua Ví LazPe & Xu.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Truck size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Giao hàng đồng giá</p>
                    <p className="text-slate-600 text-[11px] leading-tight mt-0.5">Phí vận chuyển luôn là 30.000₫.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer (Payment Preview) */}
            <div className="p-6 border-t border-slate-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
              <div className="space-y-3 mb-5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính (sau giảm 5%):</span>
                  <span className="font-semibold text-slate-800">₫{(priceAfterDiscount * quantity).toLocaleString("vi-VN")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold text-slate-800">₫{shippingFee.toLocaleString("vi-VN")}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="font-bold text-slate-800">Ước tính mỗi kỳ:</span>
                  <span className="text-xl font-black text-emerald-600">₫{totalAmount.toLocaleString("vi-VN")}</span>
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={submitting || !addressId}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <CreditCard size={20} />
                    Xác nhận Đăng ký
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-4 leading-tight">
                Bằng việc xác nhận, bạn đồng ý với Điều khoản mua định kỳ của LazPe. Hệ thống sẽ thanh toán tự động qua Ví LazPe khi đến hạn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

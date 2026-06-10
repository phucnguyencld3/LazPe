import React, { useState } from "react";
import { Loader, X, AlertCircle, Check } from "lucide-react";
import { Voucher } from "@/types";
import { CartInfo } from "@/lib/api";

interface VoucherModalProps {
  voucherModalOpen: boolean;
  setVoucherModalOpen: (open: boolean) => void;
  loadingVouchers: boolean;
  vouchers: Voucher[];
  subTotal: number;
  handleApplyVoucherFromModal: (code: string) => void;
  cart: CartInfo | null;
  handleRemoveVoucher: (type?: number) => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  voucherModalOpen,
  setVoucherModalOpen,
  loadingVouchers,
  vouchers,
  subTotal,
  handleApplyVoucherFromModal,
  cart,
  handleRemoveVoucher,
}) => {
  const [activeTab, setActiveTab] = useState<"product" | "shipping">("product");

  if (!voucherModalOpen) return null;

  const filteredVouchers = vouchers.filter((v) => {
    if (activeTab === "product") {
      return v.voucherType !== 2; // Voucher đơn hàng (product discount)
    } else {
      return v.voucherType === 2; // Voucher vận chuyển (shipping discount)
    }
  });

  const isVoucherApplied = (voucher: Voucher) => {
    if (!cart) return false;
    if (voucher.voucherType === 2) {
      return cart.shippingVoucher?.voucherID === voucher.voucherID;
    } else {
      return cart.voucher?.voucherID === voucher.voucherID;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-1">
            <span className="material-symbols-outlined text-rose-500 text-base">confirmation_number</span> Chọn Voucher ưu đãi
          </h3>
          <button
            onClick={() => setVoucherModalOpen(false)}
            className="hover:bg-slate-200 p-1.5 rounded-full text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-5">
          <button
            onClick={() => setActiveTab("product")}
            className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${activeTab === "product"
              ? "border-rose-500 text-rose-500 font-extrabold"
              : "border-transparent text-slate-500 hover:text-rose-500"
              }`}
          >
            Voucher đơn hàng
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${activeTab === "shipping"
              ? "border-sky-500 text-sky-500 font-extrabold"
              : "border-transparent text-slate-500 hover:text-sky-500"
              }`}
          >
            Voucher vận chuyển
          </button>
        </div>

        {/* Voucher List Content */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {loadingVouchers ? (
            <div className="flex justify-center py-10">
              <Loader className="animate-spin text-rose-500" size={24} />
            </div>
          ) : filteredVouchers.length > 0 ? (
            filteredVouchers.map((voucher) => {
              const isEligible = subTotal >= voucher.minOrderValue;
              const isApplied = isVoucherApplied(voucher);

              const discountText = voucher.voucherType === 2
                ? (voucher.isFreeShipping
                  ? "Miễn phí vận chuyển"
                  : `Giảm phí ship ${voucher.discountType === 1 ? `${voucher.discountValue}%` : `₫${voucher.discountValue.toLocaleString("vi-VN")}`}`)
                : (voucher.discountType === 1
                  ? `Giảm ${voucher.discountValue}%`
                  : `Giảm ₫${voucher.discountValue.toLocaleString("vi-VN")}`);

              const maxDiscountText = voucher.voucherType === 2
                ? (voucher.maxShippingDiscount && voucher.maxShippingDiscount > 0 ? ` | Giảm tối đa: ₫${voucher.maxShippingDiscount.toLocaleString("vi-VN")}` : "")
                : (voucher.maxDiscount > 0 ? ` | Giảm tối đa: ₫${voucher.maxDiscount.toLocaleString("vi-VN")}` : "");

              return (
                <div
                  key={voucher.voucherID}
                  className={`flex gap-4 p-4 border rounded-xl items-center relative overflow-hidden transition-all ${isApplied
                    ? (voucher.voucherType === 2
                      ? "border-sky-300 bg-sky-50"
                      : "border-rose-300 bg-rose-50")
                    : isEligible
                      ? (voucher.voucherType === 2
                        ? "border-sky-100 bg-sky-500/[0.02]"
                        : "border-rose-100 bg-rose-500/[0.02]")
                      : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                    }`}
                >
                  {/* Left Coupon Notch Column */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${voucher.voucherType === 2
                    ? "bg-sky-50 text-sky-500 font-bold"
                    : "bg-rose-50 text-rose-500 font-bold"
                    }`}>
                    <span className="material-symbols-outlined text-2xl font-bold">
                      {voucher.voucherType === 2
                        ? "local_shipping"
                        : (voucher.discountType === 1 ? "percent" : "local_mall")}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <h4 className={`font-bold text-sm truncate ${voucher.voucherType === 2 ? "text-sky-600" : "text-rose-500"}`}>{discountText}</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{voucher.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Đơn tối thiểu: ₫{voucher.minOrderValue.toLocaleString("vi-VN")}{maxDiscountText} | HSD: {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 pl-2">
                    {isApplied ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Check size={10} /> Đang dùng
                        </span>
                        <button
                          onClick={() => handleRemoveVoucher(voucher.voucherType === 2 ? 2 : 1)}
                          className="py-1 px-3 border border-slate-200 hover:bg-slate-100/80 text-slate-500 rounded-full font-bold text-[10px] active:scale-95 transition-all shadow-sm"
                        >
                          Hủy dùng
                        </button>
                      </div>
                    ) : isEligible ? (
                      <button
                        onClick={() => handleApplyVoucherFromModal(voucher.code)}
                        className={`py-1.5 px-4 rounded-full font-bold text-xs shadow-md active:scale-95 transition-all ${voucher.voucherType === 2
                          ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/5"
                          : "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/5"
                          }`}
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

        {/* Footer */}
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
  );
};

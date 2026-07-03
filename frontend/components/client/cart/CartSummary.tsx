import React from "react";
import { X, Tag, Check } from "lucide-react";
import { CartInfo } from "@/lib/api";

interface CartSummaryProps {
  cart: CartInfo;
  subTotal: number;
  discount: number;
  shipping: number;
  shippingDiscount?: number;
  total: number;
  selectedCount: number;
  voucherCodeInput: string;
  setVoucherCodeInput: (val: string) => void;
  applyingCode: boolean;
  handleApplyVoucherCode: (e: React.FormEvent) => void;
  handleAutoApplyVouchers?: () => void;
  handleRemoveVoucher: (type?: number) => void;
  handleOpenVoucherModal: () => void;
  handleCheckout: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  subTotal,
  discount,
  shipping,
  shippingDiscount = 0,
  total,
  selectedCount,
  voucherCodeInput,
  setVoucherCodeInput,
  applyingCode,
  handleApplyVoucherCode,
  handleAutoApplyVouchers,
  handleRemoveVoucher,
  handleOpenVoucherModal,
  handleCheckout,
}) => {
  const hasAppliedVouchers = !!cart.voucher || !!cart.shippingVoucher;
  const isInputMatchingApplied = voucherCodeInput === "" || 
    (cart.voucher && voucherCodeInput === cart.voucher.code) || 
    (cart.shippingVoucher && voucherCodeInput === cart.shippingVoucher.code);

  const showChangeButton = hasAppliedVouchers && isInputMatchingApplied;

  return (
    <aside className="lg:col-span-4 space-y-md">

      {/* Voucher Section */}
      <div className="bg-white p-5 rounded-[12px] shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-rose-500 text-base">confirmation_number</span> Voucher ưu đãi
          </h4>
          {handleAutoApplyVouchers && (
            <button
              onClick={handleAutoApplyVouchers}
              disabled={applyingCode}
              className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              ✨ Tự động áp mã
            </button>
          )}
        </div>
        
        <form onSubmit={handleApplyVoucherCode} className="flex gap-2">
          <div className="relative flex-grow">
            <input
              required
              value={voucherCodeInput}
              onChange={(e) => setVoucherCodeInput(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] focus:ring-2 focus:ring-rose-200 focus:border-rose-400 text-xs text-slate-800 focus:outline-none"
              placeholder="Nhập mã giảm giá..."
              type="text"
            />
          </div>
          {showChangeButton ? (
            <button
              type="button"
              onClick={handleOpenVoucherModal}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-[8px] font-bold text-xs transition-all active:scale-95 whitespace-nowrap border border-slate-200 cursor-pointer"
            >
              Thay đổi
            </button>
          ) : (
            <button
              type="submit"
              disabled={applyingCode || !voucherCodeInput}
              className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-[8px] font-bold text-xs shadow-md shadow-rose-500/10 transition-all disabled:opacity-60 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {applyingCode ? "Áp dụng..." : "Áp dụng"}
            </button>
          )}
        </form>

        {/* Applied Voucher Chips inside the Voucher Section */}
        {hasAppliedVouchers && (
          <div className="space-y-2.5 pt-1">
            {cart.voucher && (
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-[8px] flex items-center justify-between text-xs text-rose-600">
                <span className="font-bold flex items-center gap-1 min-w-0 truncate">
                  <Check size={12} className="shrink-0" /> Đã áp dụng: {cart.voucher.code}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span>-₫{discount.toLocaleString("vi-VN")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveVoucher(1);
                      if (voucherCodeInput === cart.voucher?.code) {
                        setVoucherCodeInput("");
                      }
                    }}
                    className="hover:bg-rose-100 p-0.5 rounded-[4px] text-rose-500 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            )}

            {cart.shippingVoucher && (
              <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-[8px] flex items-center justify-between text-xs text-sky-600">
                <span className="font-bold flex items-center gap-1 min-w-0 truncate">
                  <Check size={12} className="shrink-0" /> Freeship: {cart.shippingVoucher.code}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span>-₫{shippingDiscount.toLocaleString("vi-VN")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveVoucher(2);
                      if (voucherCodeInput === cart.shippingVoucher?.code) {
                        setVoucherCodeInput("");
                      }
                    }}
                    className="hover:bg-sky-100 p-0.5 rounded-[4px] text-sky-500 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {(!cart.voucher || !cart.shippingVoucher) && (
          <button
            onClick={handleOpenVoucherModal}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-rose-500 border border-dashed border-rose-200 rounded-[8px] font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <Tag size={12} /> Xem danh sách mã giảm giá
          </button>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-white p-6 rounded-[12px] shadow-sm border border-slate-100 space-y-5">
        <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">
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
            <span className="text-rose-500 font-bold">-₫{discount.toLocaleString("vi-VN")}</span>
          </div>

          {shippingDiscount > 0 && (
            <div className="flex justify-between">
              <span>Giảm phí vận chuyển</span>
              <span className="text-sky-600 font-bold">-₫{shippingDiscount.toLocaleString("vi-VN")}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="font-bold text-slate-800 text-base">Tổng thanh toán</span>
            <span className="text-rose-500 font-extrabold text-2xl tracking-tight">
              ₫{total.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={selectedCount === 0}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-[8px] font-bold text-base shadow-lg shadow-rose-500/10 hover:scale-[1.02] active:scale-95 transition-all duration-200 uppercase tracking-wider disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
        >
          Tiến hành thanh toán
        </button>
        <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          (Giá đã bao gồm thuế giá trị gia tăng VAT)
        </p>
      </div>
    </aside>
  );
};

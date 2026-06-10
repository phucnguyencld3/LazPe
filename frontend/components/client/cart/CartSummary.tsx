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
  handleRemoveVoucher,
  handleOpenVoucherModal,
  handleCheckout,
}) => {
  return (
    <aside className="lg:col-span-4 space-y-md">

      {/* Voucher Section */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-rose-500 text-base">confirmation_number</span> Voucher ưu đãi
        </h4>
        
        <form onSubmit={handleApplyVoucherCode} className="flex gap-2">
          <div className="relative flex-grow">
            <input
              required
              value={voucherCodeInput}
              onChange={(e) => setVoucherCodeInput(e.target.value)}
              disabled={!!cart.voucher && !!cart.shippingVoucher}
              className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-rose-200 focus:border-rose-400 text-xs text-slate-800 disabled:opacity-75 focus:outline-none"
              placeholder="Nhập mã giảm giá..."
              type="text"
            />
          </div>
          <button
            type="submit"
            disabled={applyingCode || !voucherCodeInput || (!!cart.voucher && !!cart.shippingVoucher)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-md shadow-rose-500/10 transition-all disabled:opacity-60 active:scale-95 whitespace-nowrap"
          >
            {applyingCode ? "Áp dụng..." : "Áp dụng"}
          </button>
        </form>

        {(!cart.voucher || !cart.shippingVoucher) && (
          <button
            onClick={handleOpenVoucherModal}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-rose-500 border border-dashed border-rose-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1"
          >
            <Tag size={12} /> Xem danh sách mã giảm giá
          </button>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
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
          
          {cart.voucher && (
            <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between text-xs text-rose-600">
              <span className="font-bold flex items-center gap-1 min-w-0 truncate">
                <Check size={12} className="shrink-0" /> Đã áp dụng: {cart.voucher.code}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span>-₫{discount.toLocaleString("vi-VN")}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveVoucher(1)}
                  className="hover:bg-rose-100 p-0.5 rounded-full text-rose-500 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          )}

          {cart.shippingVoucher && (
            <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-xl flex items-center justify-between text-xs text-sky-600">
              <span className="font-bold flex items-center gap-1 min-w-0 truncate">
                <Check size={12} className="shrink-0" /> Freeship: {cart.shippingVoucher.code}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span>-₫{shippingDiscount.toLocaleString("vi-VN")}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveVoucher(2)}
                  className="hover:bg-sky-100 p-0.5 rounded-full text-sky-500 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
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
          className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-rose-500/10 hover:scale-[1.02] active:scale-95 transition-all duration-200 uppercase tracking-wider disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
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

import React from "react";
import { X, Tag, Check } from "lucide-react";
import { CartInfo } from "@/lib/api";

const FREE_SHIPPING_THRESHOLD = 300000;

interface CartSummaryProps {
  cart: CartInfo;
  subTotal: number;
  discount: number;
  shipping: number;
  total: number;
  selectedCount: number;
  freeShippingProgress: number;
  remainingForFreeShipping: number;
  voucherCodeInput: string;
  setVoucherCodeInput: (val: string) => void;
  applyingCode: boolean;
  handleApplyVoucherCode: (e: React.FormEvent) => void;
  handleRemoveVoucher: () => void;
  handleOpenVoucherModal: () => void;
  handleCheckout: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  subTotal,
  discount,
  shipping,
  total,
  selectedCount,
  freeShippingProgress,
  remainingForFreeShipping,
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
  );
};

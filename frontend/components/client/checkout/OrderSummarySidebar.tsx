import React from "react";
import { FileText, Sparkles, ShieldCheck, Loader } from "lucide-react";
import { CartInfo, CartDetailInfo } from "@/lib/api";

interface OrderSummarySidebarProps {
  cart: CartInfo | null;
  selectedItems: CartDetailInfo[];
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  submitting: boolean;
  handlePlaceOrder: () => void;
  formatVND: (val: number) => string;
}

export const OrderSummarySidebar: React.FC<OrderSummarySidebarProps> = ({
  cart,
  selectedItems,
  subTotal,
  shippingFee,
  discountAmount,
  totalPrice,
  submitting,
  handlePlaceOrder,
  formatVND,
}) => {
  return (
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
  );
};

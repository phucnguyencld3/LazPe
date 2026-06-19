import React, { useState, useEffect } from "react";
import { FileText, Sparkles, ShieldCheck, Loader } from "lucide-react";
import { CartInfo, CartDetailInfo, LoyaltyEarnPolicySummary, LoyaltyRedeemPolicySummary } from "@/lib/api";

interface OrderSummarySidebarProps {
  cart: CartInfo | null;
  selectedItems: CartDetailInfo[];
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  shippingDiscountAmount: number;
  totalPrice: number;
  submitting: boolean;
  handlePlaceOrder: () => void;
  formatVND: (val: number) => string;
  // Loyalty props
  availablePoints: number;
  pointsToUse: number;
  loyaltyDiscount: number;
  isPointsApplied: boolean;
  loyaltyMessage: string;
  loyaltyError: string;
  isApplyingPoints: boolean;
  handleApplyPoints: (points: number) => Promise<void>;
  earnPolicy: LoyaltyEarnPolicySummary | null;
  redeemPolicy: LoyaltyRedeemPolicySummary | null;
  estimatedEarnPoints: number;
}

export const OrderSummarySidebar: React.FC<OrderSummarySidebarProps> = ({
  cart,
  selectedItems,
  subTotal,
  shippingFee,
  discountAmount,
  shippingDiscountAmount,
  totalPrice,
  submitting,
  handlePlaceOrder,
  formatVND,
  availablePoints,
  pointsToUse,
  loyaltyDiscount,
  isPointsApplied,
  loyaltyMessage,
  loyaltyError,
  isApplyingPoints,
  handleApplyPoints,
  earnPolicy,
  redeemPolicy,
  estimatedEarnPoints,
}) => {
  const [inputPoints, setInputPoints] = useState<number>(pointsToUse);

  useEffect(() => {
    setInputPoints(pointsToUse);
  }, [pointsToUse]);

  const earnPolicyText = earnPolicy
    ? `${formatVND(earnPolicy.vndAmount)} = ${earnPolicy.pointsEarned.toLocaleString("vi-VN")} điểm${earnPolicy.multiplier !== 1 ? ` (x${earnPolicy.multiplier})` : ""}`
    : null;

  const redeemPolicyText = redeemPolicy
    ? `${redeemPolicy.pointsToRedeem.toLocaleString("vi-VN")} điểm = ${formatVND(redeemPolicy.discountVnd)} (${redeemPolicy.tierName})`
    : null;

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
                <div key={item.cartDetailID} className={`flex gap-3 items-center ${item.isGift ? "opacity-90" : ""}`}>
                  {/* Product Image */}
                  <div className={`relative w-16 h-16 rounded-xl p-1 border flex-shrink-0 flex items-center justify-center ${item.isGift ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
                    <img
                      alt={name || "Sản phẩm"}
                      className="w-full h-full object-cover rounded-lg"
                      src={image || "/images/placeholder.jpg"}
                    />
                    <span className={`absolute -top-2 -right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[6px] border-2 border-white shadow-sm ${item.isGift ? "bg-emerald-500" : "bg-rose-500"}`}>
                      x{item.quantity}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate" title={name || ""}>
                      {name}
                    </h4>
                    
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.isGift && (
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">QUÀ TẶNG</span>
                      )}
                      {variantText && !item.isGift && (
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Phân loại: {variantText}
                        </p>
                      )}
                      {variantText && item.isGift && (
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          {variantText}
                        </p>
                      )}
                    </div>
                    
                    <div className={`text-xs font-extrabold mt-1 ${item.isGift ? "text-emerald-500" : "text-rose-500"}`}>
                      {item.isGift ? "Miễn phí" : formatVND(item.unitPrice)}
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

        {cart?.shippingVoucher && (
          <div className="mx-6 mt-4 p-3 rounded-xl border border-dashed border-sky-200 bg-sky-500/[0.02] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-base font-bold">local_shipping</span>
            </div>
            <div className="min-w-0 flex-grow">
              <div className="text-xs font-bold text-slate-800">
                Đã áp dụng mã ship: <span className="text-sky-600 font-extrabold">{cart.shippingVoucher.code}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {cart.shippingVoucher.name}
              </div>
            </div>
          </div>
        )}

        {/* Loyalty Points Widget */}
        <div className="mx-6 mt-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className="material-symbols-outlined text-rose-500 text-base font-bold">military_tech</span>
              <span>Dùng điểm tích lũy</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">
              Có sẵn: <span className="text-rose-500 font-extrabold">{availablePoints.toLocaleString("vi-VN")}</span>
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-grow">
              <input
                type="number"
                placeholder="Nhập số điểm..."
                value={inputPoints === 0 ? "" : inputPoints}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setInputPoints(val);
                }}
                disabled={isApplyingPoints || submitting}
                className="w-full bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-rose-400 disabled:bg-slate-100 transition-colors placeholder:text-slate-400 placeholder:font-normal [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {availablePoints > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const maxPoints = Math.min(availablePoints, subTotal - discountAmount);
                    setInputPoints(maxPoints);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:underline active:scale-95 transition-all"
                  disabled={isApplyingPoints || submitting}
                >
                  Tối đa
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleApplyPoints(inputPoints)}
              disabled={isApplyingPoints || submitting}
              className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[70px] active:scale-95"
            >
              {isApplyingPoints ? (
                <Loader className="animate-spin h-3.5 w-3.5 text-white" />
              ) : (
                "Áp dụng"
              )}
            </button>
          </div>

          {loyaltyMessage && (
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>✓</span> {loyaltyMessage}
            </p>
          )}
          {loyaltyError && (
            <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
              <span>⚠</span> {loyaltyError}
            </p>
          )}
        </div>

        {(earnPolicyText || redeemPolicyText) && (
          <div className="mx-6 mt-4 p-4 rounded-xl border border-slate-100 bg-white space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="material-symbols-outlined text-rose-500 text-base font-bold">workspace_premium</span>
              <span>Cơ chế Loyalty hiện tại</span>
            </div>
            {earnPolicyText && (
              <div className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Tích điểm:</span> {earnPolicyText}
                {earnPolicy?.isCampaign && earnPolicy.name ? (
                  <span className="text-rose-500 font-semibold"> · {earnPolicy.name}</span>
                ) : null}
              </div>
            )}
            {redeemPolicyText && (
              <div className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Đổi điểm:</span> {redeemPolicyText}
              </div>
            )}
            <div className="text-[11px] text-slate-700 font-semibold">
              Đơn hàng này tích được: <span className="text-rose-500 font-extrabold">{estimatedEarnPoints.toLocaleString("vi-VN")}</span> điểm
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
              <span className={`font-semibold ${(shippingFee - shippingDiscountAmount) === 0 ? "text-emerald-500 font-bold" : "text-slate-800"}`}>
                {(shippingFee - shippingDiscountAmount) === 0 ? "Miễn phí" : formatVND(shippingFee)}
              </span>
            </div>

            {/* Shipping Discount */}
            {shippingDiscountAmount > 0 && (
              <div className="flex justify-between items-center text-sky-600">
                <span>Giảm phí vận chuyển:</span>
                <span className="font-bold">- {formatVND(shippingDiscountAmount)}</span>
              </div>
            )}



            {/* Voucher Discount */}
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-rose-500">
                <span>Giảm giá từ Voucher:</span>
                <span className="font-bold">- {formatVND(discountAmount)}</span>
              </div>
            )}

            {/* Loyalty Points Discount */}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between items-center text-rose-500">
                <span>Giảm từ điểm tích lũy:</span>
                <span className="font-bold">- {formatVND(loyaltyDiscount)}</span>
              </div>
            )}

            {/* Estimated Earned Points */}
            {(earnPolicyText || redeemPolicyText) && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Điểm tích lũy dự kiến:</span>
                <span className="font-semibold text-slate-800">+ {estimatedEarnPoints.toLocaleString("vi-VN")} điểm</span>
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

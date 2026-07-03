import React, { useState, useEffect } from "react";
import { FileText, Sparkles, ShieldCheck, Loader, ChevronDown, ChevronUp } from "lucide-react";
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
  handleOpenVoucherModal: () => void;
  handleAutoApplyVouchers?: () => void;
  handleRemoveVoucher: (type?: number) => Promise<void> | void;
  useWallet: boolean;
  setUseWallet: (val: boolean) => void;
  useCoins: boolean;
  setUseCoins: (val: boolean) => void;
  walletBalance: number;
  coinsBalance: number;
  walletDiscount: number;
  coinsDiscount: number;
  isWalletLocked?: boolean;
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
  handleOpenVoucherModal,
  handleAutoApplyVouchers,
  handleRemoveVoucher,
  useWallet,
  setUseWallet,
  useCoins,
  setUseCoins,
  walletBalance,
  coinsBalance,
  walletDiscount,
  coinsDiscount,
  isWalletLocked = false,
}) => {
  const [inputPoints, setInputPoints] = useState<number>(pointsToUse);
  const [isWalletExpanded, setIsWalletExpanded] = useState<boolean>(false);

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
      <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Heading */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 mb-4">
            <FileText className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-bold">Đơn hàng của bạn</h2>
          </div>

          {/* List of checked items */}
          <div className="max-h-[300px] overflow-y-auto pr-3 pt-2 pb-2 space-y-4 scrollbar-thin -mt-2">
            {selectedItems.map((item) => {
              const isBundle = !!item.bundleID;
              const name = isBundle ? item.bundle?.name : item.product?.name;
              const image = isBundle ? item.bundle?.imageUrl : item.variant?.imageUrl || item.product?.imageUrl;
              
              let variantText = isBundle
                ? "Gói Combo"
                : [item.variant?.color, item.variant?.size].filter(Boolean).join(" - ");
              
              if (variantText) {
                variantText = variantText.replace(/\s*-\s*Xem chi ti[eế]t/gi, "").replace(/\s*Xem chi ti[eế]t/gi, "").trim();
              }

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

        {/* Vouchers Section */}
        <div className="px-6 py-4 space-y-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className="material-symbols-outlined text-rose-500 text-base font-bold">local_activity</span>
              <span>Mã giảm giá LazPe</span>
            </div>
            <div className="flex gap-3 items-center">
              {handleAutoApplyVouchers && (
                <button
                  type="button"
                  onClick={handleAutoApplyVouchers}
                  disabled={submitting}
                  className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  ✨ Tự động áp mã
                </button>
              )}
              <button 
                type="button"
                onClick={handleOpenVoucherModal}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 active:scale-95 transition-all flex items-center cursor-pointer"
              >
                Chọn mã <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          {(cart?.voucher || cart?.shippingVoucher) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {cart?.voucher && (
                <div className="py-1 px-2 rounded-[4px] border border-dashed border-rose-200 bg-rose-50 flex items-center gap-1.5 w-fit">
                  <Sparkles className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="text-[11px] font-extrabold text-rose-600">{cart.voucher.code}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveVoucher(1)}
                    className="text-slate-400 hover:text-rose-500 transition-colors flex items-center"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}
              {cart?.shippingVoucher && (
                <div className="py-1 px-2 rounded-[4px] border border-dashed border-sky-200 bg-sky-50 flex items-center gap-1.5 w-fit">
                  <span className="material-symbols-outlined text-[14px] font-bold text-sky-500 shrink-0">local_shipping</span>
                  <span className="text-[11px] font-extrabold text-sky-600">{cart.shippingVoucher.code}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveVoucher(2)}
                    className="text-slate-400 hover:text-sky-500 transition-colors flex items-center"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loyalty Points Widget */}
        {availablePoints >= 1000 && (
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-6 flex justify-center items-center shrink-0">
                  <span className="material-symbols-outlined text-rose-500 text-[22px] font-bold">military_tech</span>
                </div>
                <span>Dùng điểm tích lũy</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                Có sẵn: <span className="text-rose-500 font-extrabold">{availablePoints.toLocaleString("vi-VN")}</span>
              </span>
            </div>

            <div className="flex items-center bg-white rounded-[6px] border border-slate-200 p-1 focus-within:border-rose-400 focus-within:ring-1 focus-within:ring-rose-400/20 transition-all">
              <input
                type="number"
                placeholder="Tối thiểu 1.000đ"
                value={inputPoints === 0 ? "" : inputPoints}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setInputPoints(val);
                }}
                disabled={isApplyingPoints || submitting}
                className="flex-grow w-full bg-transparent text-slate-800 text-xs font-semibold px-2 outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {availablePoints > 0 && inputPoints !== Math.min(availablePoints, subTotal - discountAmount) && (
                <button
                  type="button"
                  onClick={() => {
                    const maxPoints = Math.min(availablePoints, subTotal - discountAmount);
                    setInputPoints(maxPoints);
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 px-2 transition-colors whitespace-nowrap"
                  disabled={isApplyingPoints || submitting}
                >
                  Tối đa
                </button>
              )}
              <button
                type="button"
                onClick={() => handleApplyPoints(inputPoints)}
                disabled={isApplyingPoints || submitting || (inputPoints > 0 && inputPoints < 1000)}
                className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-1.5 rounded-[4px] transition-colors flex items-center justify-center shrink-0 active:scale-95"
              >
                {isApplyingPoints ? (
                  <Loader className="animate-spin h-3.5 w-3.5 text-white" />
                ) : (
                  "Áp dụng"
                )}
              </button>
            </div>
            
            {inputPoints > 0 && inputPoints < 1000 && (
              <p className="text-[10px] text-rose-500 font-semibold px-1 mt-1">Mức áp dụng tối thiểu là 1.000 điểm</p>
            )}

            {loyaltyError && (
              <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                <span>⚠</span> {loyaltyError}
              </p>
            )}
          </div>
        )}
        {/* LazPe Wallet & Coins Toggle Section */}
        <div className="border-t border-slate-100">
          <button
            onClick={() => setIsWalletExpanded(!isWalletExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 flex justify-center items-center shrink-0">
                <span className="material-symbols-outlined text-teal-600 text-[22px] font-bold">account_balance_wallet</span>
              </div>
              <span className="text-sm font-bold text-slate-800">Ví LazPe & Coins</span>
            </div>
            <div className="flex items-center gap-2">
              {!isWalletExpanded && (useCoins || useWallet) && (
                <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-bold">
                  Đang dùng
                </span>
              )}
              {isWalletExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${isWalletExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-slate-50/50 pb-2">
              {/* Coins Section */}
              <div className="px-6 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <div className="w-6 flex justify-center items-center shrink-0">
                      <span className="material-symbols-outlined text-orange-500 text-[22px] font-bold">monetization_on</span>
                    </div>
                    <span>Sử dụng LazPe Coins</span>
                  </div>
                  <span className="text-orange-500 font-extrabold text-xs">{formatVND(coinsBalance)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 flex justify-center items-center shrink-0">
                    <input
                      type="checkbox"
                      id="useCoins"
                      checked={useCoins}
                      onChange={(e) => setUseCoins(e.target.checked)}
                      disabled={coinsBalance <= 0 || submitting}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <label htmlFor="useCoins" className={`text-xs ${coinsBalance <= 0 ? 'text-slate-400' : 'text-slate-600 cursor-pointer'}`}>
                    Dùng LazPe Coins để thanh toán
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 border-t border-slate-200 border-dashed"></div>

              {/* Wallet Section */}
              <div className="px-6 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <div className="w-6 flex justify-center items-center shrink-0">
                      <span className="material-symbols-outlined text-emerald-500 text-[22px] font-bold">account_balance_wallet</span>
                    </div>
                    <span>Sử dụng Số dư Ví LazPe</span>
                  </div>
                  <span className="text-emerald-500 font-extrabold text-xs">{formatVND(walletBalance)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 flex justify-center items-center shrink-0">
                    <input
                      type="checkbox"
                      id="useWallet"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      disabled={walletBalance <= 0 || submitting || isWalletLocked}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="useWallet" className={`text-xs ${walletBalance <= 0 || isWalletLocked ? 'text-slate-400' : 'text-slate-600 cursor-pointer'}`}>
                      Dùng số dư Ví để thanh toán
                    </label>
                    {isWalletLocked && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-0.5">
                        (Ví đang bị khóa 15 phút. Vui lòng mở khóa trong phần quản lý Ví)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

            {/* Coins Discount */}
            {coinsDiscount > 0 && (
              <div className="flex justify-between items-center text-orange-500">
                <span>Sử dụng LazPe Coins:</span>
                <span className="font-bold">- {formatVND(coinsDiscount)}</span>
              </div>
            )}

            {/* Wallet Discount */}
            {walletDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-500">
                <span>Sử dụng Số dư Ví:</span>
                <span className="font-bold">- {formatVND(walletDiscount)}</span>
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
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-[8px] py-3.5 font-bold text-sm shadow-md hover:shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 bouncy-hover transition-all"
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

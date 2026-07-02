import React from "react";
import { OrderInfo, formatCurrency } from "@/lib/features/orders/orderApi";

interface OrderCostSummaryProps {
  order: OrderInfo;
}

export const OrderCostSummary: React.FC<OrderCostSummaryProps> = ({ order }) => {
  return (
    <div className="bg-white p-4 rounded-[12px] shadow-sm border border-slate-100">
      <h2 className="text-base font-bold text-slate-800 mb-4">Tóm tắt chi phí</h2>
      <div className="space-y-3 text-slate-600 font-medium text-sm">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span>{formatCurrency(order.subTotal)}</span>
        </div>
        {(order.voucherDiscountAmount || 0) > 0 && (
          <div className="flex justify-between text-rose-500">
            <span>Voucher giảm giá</span>
            <span>-{formatCurrency(order.voucherDiscountAmount!)}</span>
          </div>
        )}
        {(order.pointsDiscountAmount || 0) > 0 && (
          <div className="flex justify-between text-amber-500">
            <span>Điểm tích lũy</span>
            <span>-{formatCurrency(order.pointsDiscountAmount!)}</span>
          </div>
        )}
        {(order.coinsDiscountAmount || 0) > 0 && (
          <div className="flex justify-between text-orange-500">
            <span>LazPe Coins</span>
            <span>-{formatCurrency(order.coinsDiscountAmount!)}</span>
          </div>
        )}
        {(order.walletDiscountAmount || 0) > 0 && (
          <div className="flex justify-between text-teal-600">
            <span>Trừ Ví LazPe</span>
            <span>-{formatCurrency(order.walletDiscountAmount!)}</span>
          </div>
        )}
        {(order.discountAmount > 0 && !(order.voucherDiscountAmount || 0) && !(order.pointsDiscountAmount || 0) && !(order.coinsDiscountAmount || 0) && !(order.walletDiscountAmount || 0)) && (
          <div className="flex justify-between text-emerald-600">
            <span>Giảm giá</span>
            <span>-{formatCurrency(order.discountAmount)}</span>
          </div>
        )}
        {order.shippingDiscountAmount && order.shippingDiscountAmount > 0 ? (
          <div className="flex justify-between text-sky-600">
            <span>Giảm phí vận chuyển</span>
            <span>-{formatCurrency(order.shippingDiscountAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Phí vận chuyển</span>
          <span>{formatCurrency(order.shippingFee)}</span>
        </div>
        <div className="border-t border-slate-200 mt-2 pt-4 flex justify-between items-center">
          <span className="text-base font-bold text-slate-800">Tổng cộng</span>
          <span className="text-xl font-bold text-rose-500 tracking-tight">{formatCurrency(order.totalPrice + order.shippingFee - (order.shippingDiscountAmount || 0))}</span>
        </div>
      </div>
    </div>
  );
};

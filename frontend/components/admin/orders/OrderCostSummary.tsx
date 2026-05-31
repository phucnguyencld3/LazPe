import React from "react";
import { OrderInfo, formatCurrency } from "@/lib/features/orders/orderApi";

interface OrderCostSummaryProps {
  order: OrderInfo;
}

export const OrderCostSummary: React.FC<OrderCostSummaryProps> = ({ order }) => {
  return (
    <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Tóm tắt chi phí</h2>
      <div className="space-y-4 text-slate-600 font-medium">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span>{formatCurrency(order.subTotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>{order.hasVoucher ? `Giảm giá (Voucher ${order.voucherCode})` : "Giảm giá (Điểm tích lũy)"}</span>
            <span>-{formatCurrency(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Phí vận chuyển</span>
          <span>{formatCurrency(order.shippingFee)}</span>
        </div>
        <div className="border-t border-slate-200 mt-4 pt-6 flex justify-between items-center">
          <span className="text-xl font-bold text-slate-800">Tổng cộng</span>
          <span className="text-3xl font-bold text-rose-500 tracking-tight">{formatCurrency(order.totalPrice + order.shippingFee)}</span>
        </div>
      </div>
    </div>
  );
};

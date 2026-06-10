import React from "react";
import { OrderInfo, formatCurrency } from "@/lib/features/orders/orderApi";
import { Card } from "@/components/admin/ui/Card";

interface OrderCostSummaryProps {
  order: OrderInfo;
}

export const OrderCostSummary: React.FC<OrderCostSummaryProps> = ({ order }) => {
  return (
    <Card className="font-outfit p-8">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-6">Tóm tắt chi phí</h2>
      <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span className="text-gray-800 dark:text-white/95">{formatCurrency(order.subTotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-success-600 dark:text-success-400">
            <span>{order.hasVoucher ? `Giảm giá (Voucher ${order.voucherCode})` : "Giảm giá (Điểm tích lũy)"}</span>
            <span>-{formatCurrency(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Phí vận chuyển</span>
          <span className="text-gray-800 dark:text-white/95">{formatCurrency(order.shippingFee)}</span>
        </div>
        <div className="border-t border-gray-100 dark:border-white/[0.05] mt-4 pt-6 flex justify-between items-center">
          <span className="text-base font-bold text-gray-800 dark:text-white/90">Tổng cộng</span>
          <span className="text-2xl font-bold text-brand-500 tracking-tight">{formatCurrency(order.totalPrice + order.shippingFee)}</span>
        </div>
      </div>
    </Card>
  );
};

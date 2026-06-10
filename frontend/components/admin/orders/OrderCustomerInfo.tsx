import React from "react";
import { OrderInfo } from "@/lib/features/orders/orderApi";
import { Card } from "@/components/admin/ui/Card";

interface OrderCustomerInfoProps {
  order: OrderInfo;
}

export const OrderCustomerInfo: React.FC<OrderCustomerInfoProps> = ({ order }) => {
  const customerName = order.userFullName || order.userName || "Ẩn danh";

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColors = (name: string) => {
    const chars = name ? name.trim().toUpperCase() : "AD";
    const code = chars.charCodeAt(0) || 0;
    switch (code % 3) {
      case 0:
        return "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400";
      case 1:
        return "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400";
      case 2:
      default:
        return "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400";
    }
  };

  return (
    <Card className="font-outfit p-8 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        {order.userAvatar && order.userAvatar.trim() !== "" ? (
          <img
            src={order.userAvatar}
            alt={customerName}
            className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-100 dark:border-white/5"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarColors(
              customerName
            )}`}
          >
            {getInitials(customerName)}
          </div>
        )}
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Thông tin khách hàng</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">HỌ VÀ TÊN</p>
            <p className="text-base font-bold text-gray-800 dark:text-white/90">{order.userFullName || order.userName}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">SỐ ĐIỆN THOẠI</p>
            <p className="text-base font-bold text-gray-800 dark:text-white/90">{order.userPhone || 'Không có'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">EMAIL</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{order.userEmail || 'Không có'}</p>
          </div>
        </div>
        <div className="bg-brand-50/50 dark:bg-brand-500/5 p-6 rounded-[2rem] border border-brand-50 dark:border-brand-500/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-brand-500 text-lg">local_shipping</span>
            <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest">ĐỊA CHỈ NHẬN HÀNG</p>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold leading-relaxed text-sm">
            {order.shippingAddress || 'Chưa cập nhật địa chỉ'}
          </p>
        </div>
      </div>
    </Card>
  );
};

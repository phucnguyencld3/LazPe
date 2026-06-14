import React from "react";
import { Pagination } from "../shared/Pagination";
import { formatCurrency, formatDateTime, getStatusLabel } from "@/lib/features/orders/orderApi";
import { useRouter } from "next/navigation";

interface OrderTableProps {
  orders: any[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  loading,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const router = useRouter();

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
        return "bg-primary-fixed text-on-primary-fixed";
      case 1:
        return "bg-secondary-fixed text-on-secondary-fixed";
      case 2:
      default:
        return "bg-primary-fixed-dim text-on-primary-fixed-variant";
    }
  };

  const getMockupStatusBadgeClass = (statusCode: number) => {
    switch (statusCode) {
      case 0: // Pending (Chờ xác nhận)
        return "text-amber-600";
      case 1: // Confirmed (Đã xác nhận)
        return "text-blue-600";
      case 2: // Shipping (Đang giao)
        return "text-purple-600";
      case 3: // Completed (Hoàn tất)
        return "text-emerald-600";
      case 4: // Cancel waiting
        return "text-rose-600";
      case 5: // Cancelled (Đã hủy)
      default:
        return "text-slate-500";
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
              <th className="px-6 py-4 text-center w-[80px]">STT</th>
              <th className="px-6 py-4">Mã đơn hàng</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Ngày đặt</th>
              <th className="px-6 py-4 text-right">Tổng tiền</th>
              <th className="px-6 py-4">Thanh toán</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="text-slate-400 mt-4 font-semibold text-xs">Đang tải dữ liệu...</p>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20">
                  <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">search_off</span>
                  <p className="text-slate-400 font-semibold text-xs">Không tìm thấy đơn hàng nào.</p>
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const customerName = order.userFullName || order.userName || "Ẩn danh";
                return (
                  <tr key={order.invoiceID} className="hover:bg-slate-100/70 transition-all duration-200 group">
                    <td className="px-6 py-5 text-center text-xs font-semibold text-slate-400">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-primary">#{order.invoiceID.toString().padStart(6, "0")}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {order.userAvatar && order.userAvatar.trim() !== "" ? (
                          <img
                            src={order.userAvatar}
                            alt={customerName}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColors(
                              customerName
                            )}`}
                          >
                            {getInitials(customerName)}
                          </div>
                        )}
                        <div>
                          <p className="text-label-md font-bold text-on-surface">{customerName}</p>
                          <p className="text-[12px] text-on-surface-variant">{order.userPhone || "Không có sđt"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-on-surface-variant text-sm font-medium">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-on-surface">
                      {formatCurrency(order.totalPrice + order.shippingFee - (order.shippingDiscountAmount || 0))}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">
                          {order.payMethodCode === 0 ? "payments" : "credit_card"}
                        </span>
                        {order.payMethod || "COD"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`text-sm font-bold ${getMockupStatusBadgeClass(
                          order.statusCode
                        )}`}
                      >
                        {getStatusLabel(order.statusCode)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.invoiceID}`)}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary-container/20 transition-all cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button
                          onClick={() => router.push(`/admin/orders/${order.invoiceID}`)}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-secondary-container/20 transition-all cursor-pointer"
                          title="Chỉnh sửa đơn"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  );
};


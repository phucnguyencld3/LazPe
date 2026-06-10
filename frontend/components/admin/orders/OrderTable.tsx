import React from "react";
import { Pagination } from "../shared/Pagination";
import { formatCurrency, formatDateTime, getStatusLabel } from "@/lib/features/orders/orderApi";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";
import Badge from "@/components/admin/ui/Badge";

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
        return "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400";
      case 1:
        return "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400";
      case 2:
      default:
        return "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400";
    }
  };

  const getBadgeColor = (statusCode: number) => {
    switch (statusCode) {
      case 0: // Pending (Chờ xác nhận)
        return "warning";
      case 1: // Confirmed (Đang xử lý)
        return "info";
      case 2: // Shipping (Đang giao)
        return "primary";
      case 3: // Received (Đã nhận)
      case 4: // Completed (Hoàn thành)
        return "success";
      case 5: // Cancelled (Đã hủy)
      default:
        return "error";
    }
  };

  return (
    <div className="font-outfit space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>Mã đơn hàng</TableCell>
            <TableCell isHeader>Khách hàng</TableCell>
            <TableCell isHeader>Ngày đặt</TableCell>
            <TableCell isHeader className="text-right">Tổng tiền</TableCell>
            <TableCell isHeader>Thanh toán</TableCell>
            <TableCell isHeader>Trạng thái</TableCell>
            <TableCell isHeader className="text-center">Hành động</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-4 font-medium">Đang tải dữ liệu...</p>
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-20">
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-5xl mb-2">search_off</span>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy đơn hàng nào.</p>
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => {
              const customerName = order.userFullName || order.userName || "Ẩn danh";
              return (
                <TableRow key={order.invoiceID} className="cursor-pointer" onClick={() => router.push(`/admin/orders/${order.invoiceID}`)}>
                  <TableCell className="py-4">
                    <span className="font-bold text-brand-500 hover:underline">#{order.invoiceID.toString().padStart(6, "0")}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      {order.userAvatar && order.userAvatar.trim() !== "" ? (
                        <img
                          src={order.userAvatar}
                          alt={customerName}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${getAvatarColors(
                            customerName
                          )}`}
                        >
                          {getInitials(customerName)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white/95">{customerName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.userPhone || "Không có sđt"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="py-4 text-right font-bold text-gray-800 dark:text-white/95">
                    {formatCurrency(order.totalPrice + order.shippingFee)}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">
                        {order.payMethodCode === 0 ? "payments" : "credit_card"}
                      </span>
                      <span>{order.payMethod || "COD"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge color={getBadgeColor(order.statusCode)} variant="light" size="sm">
                      {getStatusLabel(order.statusCode)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.invoiceID}`)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        title="Xem chi tiết"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button
                        onClick={() => router.push(`/admin/orders/${order.invoiceID}`)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                        title="Chỉnh sửa đơn"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

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


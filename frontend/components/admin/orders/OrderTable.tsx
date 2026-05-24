import React from "react";
import { Pagination } from "../shared/Pagination";
import { formatCurrency, formatDateTime, getStatusBadgeColor, getStatusLabel } from "@/lib/features/orders/orderApi";
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

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white text-left text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4 border-b border-slate-100">Mã đơn hàng</th>
              <th className="px-6 py-4 border-b border-slate-100">Khách hàng</th>
              <th className="px-6 py-4 border-b border-slate-100">Ngày đặt</th>
              <th className="px-6 py-4 border-b border-slate-100">Tổng tiền</th>
              <th className="px-6 py-4 border-b border-slate-100">Thanh toán</th>
              <th className="px-6 py-4 border-b border-slate-100">Trạng thái</th>
              <th className="px-6 py-4 border-b border-slate-100 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="text-slate-500 mt-4 font-medium">Đang tải dữ liệu...</p>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-20">
                  <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">search_off</span>
                  <p className="text-slate-500 font-medium">Không tìm thấy đơn hàng nào.</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.invoiceID} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-6 py-5 font-bold text-indigo-600">
                    #{order.invoiceID.toString().padStart(6, '0')}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100">
                        {order.userFullName ? order.userFullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{order.userFullName || order.userName || 'Ẩn danh'}</span>
                        <span className="text-xs text-slate-400">{order.userPhone || 'Không có sđt'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-500 text-sm font-medium">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-800 text-sm">
                    {formatCurrency(order.totalPrice)}
                  </td>
                  <td className="px-6 py-5">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="material-symbols-outlined text-[16px]">
                        {order.payMethodCode === 0 ? 'payments' : 'credit_card'}
                      </span>
                      {order.payMethod}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${getStatusBadgeColor(order.statusCode)}`}>
                      {getStatusLabel(order.statusCode)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => router.push(`/admin/orders/${order.invoiceID}`)}
                      className="w-9 h-9 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center justify-center"
                      title="Xem chi tiết"
                    >
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </button>
                  </td>
                </tr>
              ))
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
    </>
  );
};

import React from "react";
import { OrderInfo, formatCurrency } from "@/lib/features/orders/orderApi";

interface OrderProductListProps {
  order: OrderInfo;
}

export const OrderProductList: React.FC<OrderProductListProps> = ({ order }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-10 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-800">Danh sách sản phẩm</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-10 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Sản phẩm
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Đơn giá
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Số lượng
              </th>
              <th className="px-10 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Tổng cộng
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {order.invoiceDetails?.map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100">
                      {item.imageUrl && item.imageUrl.trim() !== "" ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName || "Sản phẩm"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-400 text-3xl">inventory_2</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.productName || `Mã Sản phẩm: ${item.variantID || item.bundleID}`}</p>
                      {item.variantName && (
                        <p className="text-xs text-secondary font-semibold mt-0.5">{item.variantName}</p>
                      )}
                      <p className="text-xs text-slate-400 font-medium mt-1">ID Chi tiết: {item.invoiceDetailID}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 font-semibold text-slate-600">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-6 py-6 text-center font-bold text-slate-800">
                  {item.quantity}
                </td>
                <td className="px-10 py-6 text-right font-bold text-slate-800 text-lg">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

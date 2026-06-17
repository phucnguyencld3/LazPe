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
            {order.invoiceDetails?.map((item: any, idx: number) => {
              const isGift = item.unitPrice === 0;
              return (
              <tr key={idx} className={`transition-colors ${isGift ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50/50'}`}>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border ${isGift ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-100 border-slate-100'}`}>
                      {item.imageUrl && item.imageUrl.trim() !== "" ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName || "Sản phẩm"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className={`material-symbols-outlined text-3xl ${isGift ? 'text-emerald-400' : 'text-slate-400'}`}>inventory_2</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${isGift ? 'text-emerald-800' : 'text-slate-800'}`}>{item.productName || `Mã Sản phẩm: ${item.variantID || item.bundleID}`}</p>
                        {isGift && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-sm tracking-wide">
                            QUÀ TẶNG
                          </span>
                        )}
                      </div>
                      {item.variantName && (
                        <p className={`text-xs font-semibold mt-1 ${isGift ? 'text-emerald-600' : 'text-secondary'}`}>{item.variantName}</p>
                      )}
                      <p className="text-xs text-slate-400 font-medium mt-1">ID Chi tiết: {item.invoiceDetailID}</p>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-6 font-semibold ${isGift ? 'text-emerald-500' : 'text-slate-600'}`}>
                  {isGift ? '0 đ' : formatCurrency(item.unitPrice)}
                </td>
                <td className="px-6 py-6 text-center font-bold text-slate-800">
                  {item.quantity}
                </td>
                <td className={`px-10 py-6 text-right font-bold text-lg ${isGift ? 'text-emerald-500' : 'text-slate-800'}`}>
                  {isGift ? 'Miễn phí' : formatCurrency(item.unitPrice * item.quantity)}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React from "react";
import { OrderInfo, formatCurrency } from "@/lib/features/orders/orderApi";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";
import { Card } from "@/components/admin/ui/Card";

interface OrderProductListProps {
  order: OrderInfo;
}

export const OrderProductList: React.FC<OrderProductListProps> = ({ order }) => {
  return (
    <Card className="font-outfit !p-0 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-white/[0.05]">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Danh sách sản phẩm</h3>
      </div>
      <Table className="!rounded-none border-0 shadow-none bg-transparent dark:bg-transparent">
        <TableHeader>
          <TableRow>
            <TableCell isHeader className="pl-6">Sản phẩm</TableCell>
            <TableCell isHeader>Đơn giá</TableCell>
            <TableCell isHeader className="text-center">Số lượng</TableCell>
            <TableCell isHeader className="text-right pr-6">Tổng cộng</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.invoiceDetails?.map((item: any, idx: number) => (
            <TableRow key={idx}>
              <TableCell className="pl-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/[0.02] overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 dark:border-white/5">
                    {item.imageUrl && item.imageUrl.trim() !== "" ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName || "Sản phẩm"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-2xl">inventory_2</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-white/90 text-sm">{item.productName || `Mã sản phẩm: ${item.variantID || item.bundleID}`}</p>
                    {item.variantName && (
                      <p className="text-xs text-brand-500 font-semibold mt-0.5">{item.variantName}</p>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">ID Chi tiết: {item.invoiceDetailID}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">
                {formatCurrency(item.unitPrice)}
              </TableCell>
              <TableCell className="py-4 text-center font-bold text-gray-800 dark:text-white/90 text-sm">
                {item.quantity}
              </TableCell>
              <TableCell className="py-4 text-right font-bold text-gray-800 dark:text-white/90 text-base pr-6">
                {formatCurrency(item.unitPrice * item.quantity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

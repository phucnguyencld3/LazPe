import React from "react";
import Image from "next/image";
import Barcode from "react-barcode";
import { OrderInfo, formatCurrency } from "@/lib/features/orders/orderApi";

interface OrderPrintTicketProps {
  order: OrderInfo;
}

export default function OrderPrintTicket({ order }: OrderPrintTicketProps) {
  // Tiền thu hộ: Nếu là COD thì hiển thị, nếu không (chuyển khoản) thì bằng 0.
  const isCOD = !order.payMethodCode || order.payMethod?.toLowerCase().includes("cod");
  const codAmount = isCOD ? (order.totalPrice + (order.shippingFee || 0) - (order.shippingDiscountAmount || 0)) : 0;
  
  // Fake tracking number logic
  const trackingNumber = `LZP${order.invoiceID.toString().padStart(8, '0')}VN`;

  return (
    <div className="bg-white text-black p-8 max-w-3xl mx-auto font-sans print:max-w-none print:w-[98%] print:mx-auto print:p-1 print:text-[11px] break-inside-avoid">
      <div className="border-2 border-black rounded-sm p-0 flex flex-col relative overflow-hidden">
        
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-black border-dashed p-4 print:p-2">
          <div className="flex items-center gap-4 print:gap-2">
            <div className="w-24 h-12 relative mix-blend-multiply print:w-20 print:h-10">
              <Image 
                src="/logo/Logo_2.png" 
                alt="LazPe Logo" 
                fill
                className="object-contain object-left" 
                priority
              />
            </div>
            <div className="text-sm font-bold print:text-xs">
              LazPe Express
              <p className="text-xs font-normal italic print:text-[10px]">Giao hàng siêu tốc</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <Barcode 
              value={trackingNumber} 
              width={1.5} 
              height={40} 
              displayValue={true} 
              fontSize={12} 
              margin={0}
              background="transparent"
            />
            <div className="text-xs mt-1 font-bold print:text-[10px]">
              Mã đơn hàng: #{order.invoiceID}
            </div>
          </div>
        </div>

        {/* Sort Code */}
        <div className="text-center py-2 font-black text-3xl tracking-widest border-b-2 border-black border-dashed bg-slate-50 print:bg-transparent print:text-2xl print:py-1">
          LZP-HCM-01
        </div>

        {/* Addresses Section */}
        <div className="grid grid-cols-2 divide-x-2 divide-dashed divide-black border-b-2 border-black border-dashed">
          <div className="p-4 flex flex-col gap-1 print:p-2 print:gap-0">
            <span className="text-xs font-bold text-gray-500 uppercase print:text-[10px]">Từ</span>
            <span className="font-bold">Cửa hàng LazPe</span>
            <span className="text-sm print:text-xs">Quận 1, TP. Hồ Chí Minh</span>
            <span className="text-sm print:text-xs">0901234567</span>
          </div>
          <div className="p-4 flex flex-col gap-1 print:p-2 print:gap-0">
            <span className="text-xs font-bold text-gray-500 uppercase print:text-[10px]">Đến</span>
            <span className="font-bold">{order.userFullName || order.userName}</span>
            <span className="text-sm print:text-xs">{order.shippingAddress || "Khách hàng mua tại quầy"}</span>
            <span className="text-sm print:text-xs">{order.userPhone || "Không có SĐT"}</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-4 border-b-2 border-black border-dashed print:p-2">
          <p className="text-sm font-bold mb-2 print:text-xs print:mb-1">
            Nội dung hàng (Tổng SL sản phẩm: {order.itemCount}):
          </p>
          <ul className="text-sm space-y-1 font-medium print:text-xs print:space-y-0">
            {order.invoiceDetails?.map((item: any, idx: number) => (
              <li key={idx}>
                {idx + 1}. {item.productName}
                {item.variantName && ` - ${item.variantName}`}
                , SL: {item.quantity}
              </li>
            )) || (
              <li>Đơn hàng không có chi tiết sản phẩm.</li>
            )}
          </ul>
        </div>

        {/* Footer info: COD, Notes, Signature */}
        <div className="p-4 grid grid-cols-2 gap-4 print:p-2 print:gap-2">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-sm print:text-xs">Tiền thu Người nhận:</p>
              <p className="text-3xl font-black mt-1 print:text-2xl print:mt-0">
                {codAmount > 0 ? `${formatCurrency(codAmount)}` : "0 VND"}
              </p>
            </div>
            
            <div className="mt-6 print:mt-2">
              <p className="text-sm mb-1 print:text-xs print:mb-0">Chỉ dẫn giao hàng:</p>
              <ul className="text-sm space-y-1 font-medium print:text-[10px] print:space-y-0 print:leading-tight">
                <li>- Không đồng kiểm;</li>
                <li>- Chuyển hoàn sau 3 lần phát;</li>
                <li>- Lưu kho tối đa 5 ngày.</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4 print:gap-2">
            <div className="border border-black w-full h-32 flex flex-col items-center justify-start p-2 print:h-24 print:p-1">
              <span className="font-bold print:text-xs">Chữ ký người nhận</span>
              <span className="text-[10px] text-center mt-1 print:text-[8px]">
                Xác nhận hàng nguyên vẹn, không móp/méo, bể/vỡ
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

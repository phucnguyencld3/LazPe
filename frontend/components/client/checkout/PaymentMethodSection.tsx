import React from "react";
import { Coins, CreditCard, Wallet } from "lucide-react";

interface PaymentMethodSectionProps {
  payMethod: number | null;
  setPayMethod: (method: number | null) => void;
}

export const PaymentMethodSection: React.FC<PaymentMethodSectionProps> = ({
  payMethod,
  setPayMethod,
}) => {
  return (
    <section className="p-6 transition-all duration-300 hover:bg-slate-50/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-[8px] bg-primary/5 text-slate-900 flex items-center justify-center font-bold text-sm">
          2
        </div>
        <h2 className="text-lg font-bold text-slate-800">Phương thức thanh toán</h2>
      </div>

      {/* List method selection */}
      <div className="grid grid-cols-1 gap-3">
        
        {/* Method 1: COD */}
        <div
          onClick={() => setPayMethod(null)}
          className={`border rounded-[8px] p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
            payMethod === null
              ? "border-primary bg-primary/5"
              : "border-slate-200 hover:border-primary/20"
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            payMethod === null ? "bg-white text-slate-900 shadow-sm" : "bg-slate-100 text-slate-500"
          }`}>
            <Coins className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-800">Thanh toán khi nhận hàng</h3>
            <p className="text-xs text-slate-500 mt-0.5">Thanh toán bằng tiền mặt khi nhận hàng (COD)</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            payMethod === null ? "border-primary" : "border-slate-300"
          }`}>
            {payMethod === null && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
        </div>

        {/* Method 3: E-wallet VNPay */}
        <div
          onClick={() => setPayMethod(3)}
          className={`border rounded-[8px] p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
            payMethod === 3
              ? "border-primary bg-primary/5"
              : "border-slate-200 hover:border-primary/20"
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            payMethod === 3 ? "bg-white text-slate-900 shadow-sm" : "bg-slate-100 text-slate-500"
          }`}>
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-800">Thanh toán qua VNPay</h3>
            <p className="text-xs text-slate-500 mt-0.5">Thẻ ATM, thẻ tín dụng, ví điện tử hoặc quét mã QR</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            payMethod === 3 ? "border-primary" : "border-slate-300"
          }`}>
            {payMethod === 3 && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
        </div>

        {/* Method 5: E-wallet ZaloPay */}
        <div
          onClick={() => setPayMethod(5)}
          className={`border rounded-[8px] p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
            payMethod === 5
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-200 hover:border-blue-500/20"
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            payMethod === 5 ? "bg-white text-blue-600 shadow-sm" : "bg-slate-100 text-slate-500"
          }`}>
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              Thanh toán qua ZaloPay
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Khuyên dùng</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Ví ZaloPay, Thẻ ATM/Visa/MasterCard hoặc quét mã QR ZaloPay</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            payMethod === 5 ? "border-blue-500" : "border-slate-300"
          }`}>
            {payMethod === 5 && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
          </div>
        </div>

      </div>

      {/* Sub-text depending on method */}
      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
        {payMethod === null && (
          <p>Bạn sẽ thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận được đơn hàng.</p>
        )}

        {payMethod === 3 && (
          <p>Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán bảo mật VNPay để thực hiện giao dịch bằng thẻ ATM, thẻ quốc tế hoặc quét mã QR.</p>
        )}

        {payMethod === 5 && (
          <p>Hệ thống sẽ chuyển hướng bạn đến ứng dụng hoặc cổng thanh toán bảo mật ZaloPay để hoàn tất thanh toán.</p>
        )}
      </div>
    </section>
  );
};

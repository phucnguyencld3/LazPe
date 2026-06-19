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
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-[8px] bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
          2
        </div>
        <h2 className="text-lg font-bold text-slate-800">Phương thức thanh toán</h2>
      </div>

      {/* Grid method selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Method 1: COD */}
        <div
          onClick={() => setPayMethod(null)}
          className={`border-2 rounded-[8px] p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bouncy-hover ${
            payMethod === null
              ? "border-rose-500 bg-rose-500/[0.03]"
              : "border-slate-200 hover:border-rose-200"
          }`}
        >
          <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center mb-2 transition-colors ${
            payMethod === null ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
          }`}>
            <Coins className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 mb-1">Thanh toán khi nhận hàng</h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">COD - Tiền mặt</p>
        </div>

        {/* Method 2: Bank Transfer */}
        <div
          onClick={() => setPayMethod(2)}
          className={`border-2 rounded-[8px] p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bouncy-hover ${
            payMethod === 2
              ? "border-rose-500 bg-rose-500/[0.03]"
              : "border-slate-200 hover:border-rose-200"
          }`}
        >
          <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center mb-2 transition-colors ${
            payMethod === 2 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
          }`}>
            <CreditCard className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 mb-1">Chuyển khoản</h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Thẻ ngân hàng</p>
        </div>

        {/* Method 3: E-wallet VNPay */}
        <div
          onClick={() => setPayMethod(3)}
          className={`border-2 rounded-[8px] p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bouncy-hover ${
            payMethod === 3
              ? "border-rose-500 bg-rose-500/[0.03]"
              : "border-slate-200 hover:border-rose-200"
          }`}
        >
          <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center mb-2 transition-colors ${
            payMethod === 3 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
          }`}>
            <Wallet className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 mb-1">Cổng thanh toán VNPay</h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Ví điện tử / QR Code</p>
        </div>

      </div>

      {/* Sub-text depending on method */}
      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
        {payMethod === null && (
          <p>Bạn sẽ thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận được đơn hàng.</p>
        )}
        {payMethod === 2 && (
          <div>
            <p className="mb-2 font-semibold text-slate-700">Thông tin chuyển khoản ngân hàng:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Ngân hàng: <span className="font-bold text-slate-800">MB Bank (Ngân hàng Quân Đội)</span></li>
              <li>Số tài khoản: <span className="font-bold text-slate-800">0387244889</span></li>
              <li>Chủ tài khoản: <span className="font-bold text-slate-800">NGUYEN HOANG PHUC</span></li>
              <li>Nội dung chuyển khoản: <span className="font-semibold text-rose-600">Thanh toan don hang LazPe [SĐT của bạn]</span></li>
            </ul>
          </div>
        )}
        {payMethod === 3 && (
          <p>Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán bảo mật VNPay để thực hiện giao dịch bằng thẻ ATM, thẻ quốc tế hoặc quét mã QR.</p>
        )}
      </div>
    </section>
  );
};

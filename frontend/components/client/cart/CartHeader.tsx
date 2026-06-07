import React from "react";
import { ChevronRight } from "lucide-react";

export const CartHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-center mb-12">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-6 tracking-tight">Giỏ hàng của bạn</h1>
      
      {/* Checkout Steps */}
      <div className="flex items-center space-x-3 text-sm">
        <div className="flex items-center text-rose-500 font-semibold">
          <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs mr-2 shadow-sm">1</span>
          <span>Giỏ hàng</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <div className="flex items-center text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs mr-2">2</span>
          <span>Thanh toán</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <div className="flex items-center text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs mr-2">3</span>
          <span>Hoàn tất</span>
        </div>
      </div>
    </div>
  );
};

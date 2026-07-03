import React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

export const CheckoutHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-slate-200">
      <Link
        href="/cart"
        className="flex items-center gap-2 text-slate-500 hover:text-rose-500 font-semibold transition-colors group mb-4 sm:mb-0"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span>Quay lại giỏ hàng</span>
      </Link>

      {/* Stepper */}
      <div className="flex items-center space-x-3 text-sm">
        <div className="flex items-center text-slate-400">
          <span className="w-6 h-6 rounded-[8px] bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs mr-2">1</span>
          <span>Giỏ hàng</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <div className="flex items-center text-rose-500 font-semibold">
          <span className="w-6 h-6 rounded-[8px] bg-rose-500 text-white flex items-center justify-center font-bold text-xs mr-2 shadow-sm">2</span>
          <span>Thanh toán</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <div className="flex items-center text-slate-400">
          <span className="w-6 h-6 rounded-[8px] bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs mr-2">3</span>
          <span>Hoàn thành</span>
        </div>
      </div>
    </div>
  );
};

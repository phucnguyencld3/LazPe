import React from "react";

export const CartHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-center mb-12">
      <h1 className="font-headline-lg text-4xl font-bold text-primary mb-6 tracking-tight">Giỏ hàng của bạn</h1>
      
      {/* Checkout Steps */}
      <div className="flex items-center gap-sm">
        <div className="flex items-center gap-xs">
          <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">1</span>
          <span className="font-quicksand font-bold text-primary text-sm">Giỏ hàng</span>
        </div>
        <div className="w-12 h-[2px] bg-outline-variant"></div>
        <div className="flex items-center gap-xs">
          <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">2</span>
          <span className="font-quicksand font-medium text-slate-500 text-sm">Thanh toán</span>
        </div>
        <div className="w-12 h-[2px] bg-outline-variant"></div>
        <div className="flex items-center gap-xs">
          <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">3</span>
          <span className="font-quicksand font-medium text-slate-500 text-sm">Hoàn tất</span>
        </div>
      </div>
    </div>
  );
};

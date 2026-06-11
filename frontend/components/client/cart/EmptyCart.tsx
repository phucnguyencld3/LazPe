import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const EmptyCart: React.FC = () => {
  return (
    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 space-y-6 max-w-2xl mx-auto my-12">
      <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
        <ShoppingBag size={36} />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-800">Giỏ hàng của bạn đang trống</h2>
        <p className="text-slate-500 max-w-[24rem] mx-auto text-sm font-medium">
          Hãy lựa chọn các mặt hàng đồ chơi, quần áo an toàn, chất lượng hàng đầu của LazPe dành cho bé yêu của bạn!
        </p>
      </div>
      <div className="pt-4">
        <Link
          href="/products"
          className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3.5 rounded-full font-bold shadow-md shadow-rose-500/10 transition-all inline-block hover:scale-105 active:scale-95"
        >
          Khám phá sản phẩm ngay
        </Link>
      </div>
    </div>
  );
};

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-rose-50 to-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
            Chào mừng đến LazPe
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
            Những khoảnh khắc <br />
            <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              đầy yêu thương
            </span>
          </h1>
        </div>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Khám phá bộ sưu tập độc đáo được tuyển chọn đặc biệt cho những em bé yêu quý của bạn
        </p>
        <div className="pt-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-rose-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-rose-700 transition-colors"
          >
            Khám phá sản phẩm
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
};

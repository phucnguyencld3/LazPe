import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface CTASectionProps {
  isLoggedIn: boolean;
}

export const CTASection: React.FC<CTASectionProps> = ({ isLoggedIn }) => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-7xl">
        {isLoggedIn ? (
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-12 text-white text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Cảm ơn bạn đã đồng hành cùng LazPe!</h2>
            <p className="text-white/90 text-lg max-w-[600px] mx-auto">
              Chúc bạn có những trải nghiệm mua sắm tuyệt vời nhất. Nhấn vào bên dưới để tiếp tục khám phá hàng loạt sản phẩm mới vừa lên kệ.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-white text-rose-600 px-8 py-3.5 rounded-full font-bold hover:bg-slate-50 transition-colors shadow active:scale-95 duration-200"
              >
                Tiếp tục mua sắm
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-12 text-white text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Đăng ký nhận thông tin ưu đãi</h2>
            <p className="text-white/90 text-lg">
              Nhận các mã giảm giá độc quyền và cập nhật sản phẩm mới đầu tiên
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-[28rem] mx-auto">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white"
              />
              <button className="px-8 py-3 bg-white text-rose-600 font-semibold rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap">
                Đăng ký
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

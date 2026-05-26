import React from "react";
import { Loader } from "lucide-react";
import { Voucher } from "@/types";

interface VoucherSectionProps {
  vouchers: Voucher[];
  loadingVouchers: boolean;
  handleCollectVoucher: (voucherId: number) => void;
}

export const VoucherSection: React.FC<VoucherSectionProps> = ({
  vouchers,
  loadingVouchers,
  handleCollectVoucher,
}) => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-7xl space-y-12">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 mb-2">Ưu đãi LazPe dành cho bạn</h2>
          <p className="text-slate-600">Lưu ngay các mã giảm giá hấp dẫn nhất để mua sắm tiết kiệm hơn</p>
        </div>

        {loadingVouchers ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-rose-600" size={32} />
          </div>
        ) : vouchers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vouchers.map((voucher) => (
              <div 
                key={voucher.voucherID} 
                className="bg-gradient-to-br from-rose-50/70 to-pink-50/70 rounded-2xl p-5 border border-rose-100/80 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Decorative circles on sides */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-white border border-rose-100/80 -translate-y-1/2"></div>
                <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white border border-rose-100/80 -translate-y-1/2"></div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {voucher.discountType === 1 ? "Mã Phần Trăm" : "Mã Giảm Tiền"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Mã: {voucher.code}</span>
                  </div>
                  
                  <h3 className="font-bold text-slate-950 text-xl tracking-tight">
                    {voucher.discountType === 1 
                      ? `Giảm ${voucher.discountValue}%` 
                      : `Giảm ${voucher.discountValue.toLocaleString("vi-VN")}₫`}
                  </h3>
                  
                  <p className="text-sm font-medium text-slate-700">
                    {voucher.name}
                  </p>
                </div>

                <div className="border-t border-dashed border-rose-200/80 my-4"></div>

                <div className="space-y-4">
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>Đơn tối thiểu: <span className="font-semibold text-slate-700">₫{voucher.minOrderValue.toLocaleString("vi-VN")}</span></p>
                    {voucher.discountType === 1 && voucher.maxDiscount > 0 && (
                      <p>Giảm tối đa: <span className="font-semibold text-slate-700">₫{voucher.maxDiscount.toLocaleString("vi-VN")}</span></p>
                    )}
                    <p>Hạn sử dụng: <span className="font-semibold text-slate-700">{new Date(voucher.endDate).toLocaleDateString("vi-VN")}</span></p>
                  </div>

                  <button
                    onClick={() => handleCollectVoucher(voucher.voucherID)}
                    disabled={voucher.isCollected}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 duration-200 flex items-center justify-center ${
                      voucher.isCollected
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow"
                    }`}
                  >
                    {voucher.isCollected ? "Đã lưu" : "Lưu mã"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-600 py-8">Hiện không có mã giảm giá nào</p>
        )}
      </div>
    </section>
  );
};

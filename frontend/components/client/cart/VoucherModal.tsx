import React from "react";
import { Loader, X, AlertCircle } from "lucide-react";
import { Voucher } from "@/types";

interface VoucherModalProps {
  voucherModalOpen: boolean;
  setVoucherModalOpen: (open: boolean) => void;
  loadingVouchers: boolean;
  vouchers: Voucher[];
  subTotal: number;
  handleApplyVoucherFromModal: (code: string) => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  voucherModalOpen,
  setVoucherModalOpen,
  loadingVouchers,
  vouchers,
  subTotal,
  handleApplyVoucherFromModal,
}) => {
  if (!voucherModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 flex justify-between items-center border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-1">
            <span className="material-symbols-outlined text-rose-500 text-base">confirmation_number</span> Chọn Voucher ưu đãi
          </h3>
          <button 
            onClick={() => setVoucherModalOpen(false)}
            className="hover:bg-slate-200 p-1.5 rounded-full text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {loadingVouchers ? (
            <div className="flex justify-center py-10">
              <Loader className="animate-spin text-rose-500" size={24} />
            </div>
          ) : vouchers.length > 0 ? (
            vouchers.map((voucher) => {
              const isEligible = subTotal >= voucher.minOrderValue;
              const discountText = voucher.discountType === 1 
                ? `Giảm ${voucher.discountValue}%` 
                : `Giảm ₫${voucher.discountValue.toLocaleString("vi-VN")}`;

              return (
                <div 
                  key={voucher.voucherID}
                  className={`flex gap-4 p-4 border rounded-xl items-center relative overflow-hidden transition-all ${
                    isEligible 
                      ? "border-rose-100 bg-rose-500/[0.02]" 
                      : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {/* Left Coupon Notch Column */}
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl font-bold">
                      {voucher.discountType === 1 ? "percent" : "local_shipping"}
                    </span>
                  </div>
                  
                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{discountText}</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{voucher.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Đơn tối thiểu: ₫{voucher.minOrderValue.toLocaleString("vi-VN")} | HSD: {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 pl-2">
                    {isEligible ? (
                      <button
                        onClick={() => handleApplyVoucherFromModal(voucher.code)}
                        className="bg-rose-500 hover:bg-rose-600 text-white py-1.5 px-4 rounded-full font-bold text-xs shadow-md shadow-rose-500/5 active:scale-95 transition-all"
                      >
                        Áp dụng
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-200/50 px-2.5 py-1.5 rounded-full flex items-center gap-0.5">
                        <AlertCircle size={10} /> Chưa đủ ĐK
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-slate-400 py-6 text-sm font-medium">Hiện không có mã giảm giá nào khả dụng.</p>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={() => setVoucherModalOpen(false)}
            className="py-2.5 px-6 border border-slate-200 rounded-full font-bold text-slate-600 hover:bg-white text-xs transition-all active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

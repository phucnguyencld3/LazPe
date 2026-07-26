import React, { useState, useEffect } from "react";
import { getLoyaltyRedeemVouchers, redeemLoyaltyVoucher } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, Ticket, Gift, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

interface RedeemVoucherSectionProps {
  token: string;
  onRedeemSuccess?: () => void;
}

export function RedeemVoucherSection({ token, onRedeemSuccess }: RedeemVoucherSectionProps) {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, [token]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await getLoyaltyRedeemVouchers(token);
      if (res && res.success) {
        setVouchers(res.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách voucher đổi điểm", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (redemptionId: number) => {
    setRedeemingId(redemptionId);
    try {
      const res = await redeemLoyaltyVoucher(redemptionId, token);
      if (res && res.success) {
        toast.success("Đổi voucher thành công! Voucher đã được thêm vào ví của bạn.");
        fetchVouchers();
        if (onRedeemSuccess) {
          onRedeemSuccess();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể đổi voucher lúc này.");
    } finally {
      setRedeemingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Ticket className="h-5 w-5 text-rose-500" />
        <h3 className="font-bold text-slate-800 text-[14px]">Đổi Voucher bằng điểm</h3>
      </div>
      
      {vouchers.length === 0 ? (
        <div className="text-center p-8 text-slate-500 text-sm">
          Hiện tại không có voucher nào để đổi. Vui lòng quay lại sau!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((item) => (
            <div
              key={item.redemptionId}
              className="flex border border-slate-200 rounded-[8px] overflow-hidden relative group transition-all duration-200 bg-white hover:border-primary/40 hover:shadow-sm"
            >
              {/* Left Wing (Coupon Head) */}
              <div className="w-[100px] flex flex-col items-center justify-center relative flex-shrink-0 bg-gradient-to-b from-[#ff6a00] to-[#ff3333] text-white p-2">
                <Ticket className="h-6 w-6 mb-1 opacity-90" />
                <span className="text-[16px] font-black leading-none text-center">
                  {item.discountAmount > 0 ? item.discountAmount.toLocaleString("vi-VN") : item.discountPercentage + "%"}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-90 text-center">
                  GIẢM SP
                </span>

                {/* Left circle cutout */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-r border-slate-200"></div>
                {/* Right dashed border on the orange block */}
                <div className="absolute top-0 right-0 bottom-0 border-r-2 border-dashed border-white opacity-30"></div>
              </div>

              {/* Right Wing (Coupon Body) */}
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0 relative">
                {/* Right circle cutout */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#f8fafc] rounded-full border-l border-slate-200"></div>

                <div className="pr-2">
                  <h4 className="font-bold text-slate-800 text-[14px] line-clamp-1" title={item.voucherName}>
                    {item.voucherName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cần dùng: <strong className="text-rose-500">{item.pointCost.toLocaleString("vi-VN")} điểm</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hạng yêu cầu: {item.tierID ? `ID ${item.tierID}` : "Mọi hạng"}
                  </p>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span>Đã đổi {item.redeemedThisPeriod}/{item.limitPerUserPerPeriod || "∞"}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-[#ff6a00] h-full" 
                      style={{ width: `${item.limitPerUserPerPeriod ? Math.min(100, (item.redeemedThisPeriod / item.limitPerUserPerPeriod) * 100) : 0}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleRedeem(item.redemptionId)}
                      disabled={redeemingId === item.redemptionId || !item.canRedeem}
                      className={`px-5 py-1.5 rounded-[4px] text-[11px] font-bold transition-colors shrink-0 ${
                        !item.canRedeem 
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                          : 'bg-[#ff6a00] text-white hover:bg-[#e65c00] shadow-sm'
                      }`}
                    >
                      {redeemingId === item.redemptionId ? (
                        <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                      ) : item.limitPerUserPerPeriod && item.redeemedThisPeriod >= item.limitPerUserPerPeriod ? (
                        "Hết lượt"
                      ) : !item.canRedeem ? (
                        "Chưa đạt"
                      ) : (
                        "Lưu Ngay"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

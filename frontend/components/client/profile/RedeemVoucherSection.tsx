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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow relative">
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-3 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[14px] line-clamp-1">{item.voucher.code}</h4>
                    <p className="text-[11px] opacity-90 mt-0.5 font-medium line-clamp-1">{item.voucher.description}</p>
                  </div>
                  <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm whitespace-nowrap">
                    {item.voucher.discountType === "Fixed" 
                      ? `Giảm ${formatCurrency(item.voucher.discountValue)}` 
                      : `Giảm ${item.voucher.discountValue}%`}
                  </div>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-slate-500 font-medium">Cần dùng:</span>
                    <span className="font-bold text-rose-600 text-[14px]">{item.pointCost.toLocaleString("vi-VN")} điểm</span>
                  </div>
                  
                  {item.tier && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Hạng yêu cầu:</span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{item.tier.tierName}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Giới hạn:</span>
                    <span className="font-semibold text-slate-700">
                      {item.limitPerUserPerPeriod ? `${item.limitPerUserPerPeriod} lần/chu kỳ` : "Không giới hạn"}
                    </span>
                  </div>
                  
                  {item.resetCycle !== "None" && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Chu kỳ reset:</span>
                      <span className="font-semibold text-slate-700">
                        {item.resetCycle === "Monthly" ? "Hàng tháng" : item.resetCycle}
                      </span>
                    </div>
                  )}
                  
                  {item.limitPerUserPerPeriod > 0 && (
                    <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Đã đổi trong chu kỳ:</span>
                        <span className="font-bold text-indigo-600">
                          {item.userRedeemedCount} / {item.limitPerUserPerPeriod}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleRedeem(item.id)}
                  disabled={redeemingId === item.id || !item.canRedeem}
                  className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                    !item.canRedeem 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                  }`}
                >
                  {redeemingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : !item.canRedeem ? (
                    "Chưa đủ điều kiện"
                  ) : (
                    <>
                      <Gift className="h-4 w-4" />
                      Đổi ngay
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

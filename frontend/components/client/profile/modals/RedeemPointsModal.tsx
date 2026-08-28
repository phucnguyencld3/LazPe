"use client";

import React, { useState } from "react";
import { redeemAffiliatePoints } from "@/lib/api";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  currentPoints: number;
  remainingRedeemCount: number;
  hasPaymentPin: boolean;
  onSuccess: () => void;
}

export function RedeemPointsModal({
  isOpen,
  onClose,
  token,
  currentPoints,
  remainingRedeemCount,
  hasPaymentPin,
  onSuccess,
}: Props) {
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(Math.min(currentPoints, 10000));
  const [paymentPin, setPaymentPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePresetSelect = (amount: number) => {
    setPointsToRedeem(Math.min(amount, currentPoints));
    setErrorMsg(null);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (pointsToRedeem < 1000) {
      setErrorMsg("Số xu rút tối thiểu là 1.000 xu");
      return;
    }

    if (pointsToRedeem > 9999999) {
      setErrorMsg("Hạn mức tối đa cho 1 lần rút là 9.999.999 xu");
      return;
    }

    if (pointsToRedeem > currentPoints) {
      setErrorMsg(`Số xu trong tài khoản không đủ (${currentPoints.toLocaleString("vi-VN")} xu)`);
      return;
    }

    if (remainingRedeemCount <= 0) {
      setErrorMsg("Bạn đã dùng hết 3 lượt rút xu thủ công trong tháng này. Số xu còn dư sẽ tự động chuyển vào Ví LazPe vào đêm cuối tháng.");
      return;
    }

    if (!paymentPin || paymentPin.length !== 6 || !/^\d{6}$/.test(paymentPin)) {
      setErrorMsg("Vui lòng nhập chính xác mã PIN Ví thanh toán (đúng 6 chữ số)");
      return;
    }

    setLoading(true);
    try {
      const res = await redeemAffiliatePoints(token, pointsToRedeem, paymentPin);
      if (res.success) {
        toast.success(res.message || `Đã quy đổi thành công ${pointsToRedeem.toLocaleString("vi-VN")} xu vào Ví LazPe!`);
        onSuccess();
        onClose();
        setPaymentPin("");
      } else {
        setErrorMsg(res.message || "Rút xu thất bại");
        if (res.requiresPinSetup) {
          toast.error("Vui lòng thiết lập Mã PIN Ví trước khi rút xu");
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Có lỗi xảy ra trong quá trình xử lý rút xu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white rounded-[16px] max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Rút Xu Tiếp Thị về Ví LazPe</h3>
              <p className="text-xs text-slate-500">Tỷ lệ quy đổi: <strong>1 Xu = 1 VNĐ tiền trong Ví</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`font-bold px-2.5 py-1 rounded-[5px] text-xs ${
              remainingRedeemCount > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              Rút {remainingRedeemCount}/3 lần tháng này
            </span>
          </div>
        </div>

        {/* Auto-Sweep Reminder (1 Row) */}
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-[5px] border border-amber-200/70">
          <span className="material-symbols-outlined text-amber-600 text-base shrink-0">schedule</span>
          <span>
            <strong>Tự động quy đổi:</strong> Toàn bộ số xu dư còn lại sẽ được hệ thống <strong>tự động quét chuyển 100% vào Ví LazPe</strong> vào đêm ngày cuối tháng!
          </span>
        </div>

        <form onSubmit={handleRedeem} className="space-y-4">
          {/* 2 Horizontal Columns Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Current Points & Selection */}
            <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-[10px] border border-slate-100">
              <div className="bg-white p-2.5 rounded-[5px] border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Xu hiện có:</span>
                <span className="text-sm font-extrabold text-amber-600">
                  {currentPoints.toLocaleString("vi-VN")} xu
                </span>
              </div>

              {/* Points Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Số xu cần rút:</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1000}
                    max={9999999}
                    value={pointsToRedeem || ""}
                    onChange={(e) => {
                      setPointsToRedeem(Number(e.target.value));
                      setErrorMsg(null);
                    }}
                    placeholder="VD: 20000"
                    className="w-full pl-3 pr-12 py-2 text-sm border border-slate-300 rounded-[5px] focus:outline-none focus:border-primary font-bold text-slate-800 bg-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">XU</span>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">Chọn nhanh:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[10000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetSelect(amt)}
                      className={`py-1 px-1.5 rounded-[5px] border text-[11px] font-semibold transition-all ${
                        pointsToRedeem === amt
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-primary"
                      }`}
                    >
                      {(amt / 1000).toFixed(0)}k xu
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(currentPoints)}
                    className={`py-1 px-1.5 rounded-[5px] border text-[11px] font-semibold transition-all ${
                      pointsToRedeem === currentPoints && currentPoints > 0
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:border-primary"
                    }`}
                  >
                    Tất cả
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Preview & PIN Verification */}
            <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-[10px] border border-slate-100 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Live Preview */}
                <div className="p-2.5 bg-emerald-50 rounded-[5px] border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Nhận vào Ví LazPe:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    +{pointsToRedeem > 0 ? pointsToRedeem.toLocaleString("vi-VN") : 0} VNĐ
                  </span>
                </div>

                {/* PIN Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-base">lock</span>
                      Mã PIN Ví (6 chữ số):
                    </label>
                    {!hasPaymentPin && (
                      <span className="text-[11px] font-bold text-red-600">Chưa tạo PIN</span>
                    )}
                  </div>

                  {!hasPaymentPin ? (
                    <div className="p-2 bg-red-50 rounded-[5px] border border-red-200 text-[11px] text-red-700">
                      Vui lòng cài đặt Mã PIN Ví 6 chữ số trong phần Cài đặt Tài khoản trước khi rút.
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        maxLength={6}
                        value={paymentPin}
                        onChange={(e) => {
                          setPaymentPin(e.target.value.replace(/\D/g, ""));
                          setErrorMsg(null);
                        }}
                        placeholder="Nhập 6 chữ số PIN ví"
                        className="w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-[5px] focus:outline-none focus:border-primary tracking-widest font-mono text-center font-bold text-slate-800 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showPin ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-2 bg-red-50 text-red-700 text-[11px] rounded-[5px] border border-red-200 font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-red-500 shrink-0">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-1/4 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-[5px] hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading || remainingRedeemCount <= 0 || !hasPaymentPin || pointsToRedeem < 1000}
              className={`flex-1 py-2.5 text-xs font-bold rounded-[5px] text-white flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                loading || remainingRedeemCount <= 0 || !hasPaymentPin || pointsToRedeem < 1000
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 shadow-primary/20"
              }`}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Đang xử lý rút xu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>Xác nhận Rút về Ví LazPe</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

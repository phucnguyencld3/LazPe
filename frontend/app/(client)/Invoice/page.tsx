"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  ArrowRight, 
  FileText, 
  Calendar, 
  MapPin, 
  CreditCard,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Loader,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { getInvoiceDetail } from "@/lib/api";

function InvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters
  const paymentStatus = searchParams.get("payment"); // "success" or "failed"
  const invoiceIdStr = searchParams.get("invoiceId");
  const txnNo = searchParams.get("txnNo");
  const errorCode = searchParams.get("code");

  // State
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    setToken(savedToken);

    if (invoiceIdStr && savedToken) {
      if (invoiceIdStr === "0") {
        // Honeypot / Shadow Ban case: Fake invoice details so spammer sees success without backend errors
        // Tạo một số ngẫu nhiên trông giống hóa đơn thật để lừa mắt kẻ gian
        const randomSubTotal = Math.floor(Math.random() * 5 + 2) * 50000; // 100k - 300k
        const randomShipping = 30000;
        
        setInvoice({
          invoiceID: 0,
          invoiceCode: "INV" + new Date().getTime().toString().slice(-8),
          createdAt: new Date().toISOString(),
          subTotal: randomSubTotal,
          shippingFee: randomShipping,
          discountAmount: 0,
          voucherDiscountAmount: 0,
          pointsDiscountAmount: 0,
          coinsDiscountAmount: 0,
          walletDiscountAmount: 0,
          shippingDiscountAmount: 0,
          totalPrice: randomSubTotal,
          finalAmount: randomSubTotal + randomShipping,
          payMethod: "COD",
          shippingAddress: "Địa chỉ nhận hàng tiêu chuẩn",
          invoiceDetails: []
        });
        setLoading(false);
      } else {
        fetchInvoiceDetails(parseInt(invoiceIdStr), savedToken);
      }
    } else {
      setLoading(false);
    }
  }, [invoiceIdStr]);

  const fetchInvoiceDetails = async (id: number, authToken: string) => {
    setLoading(true);
    try {
      const data = await getInvoiceDetail(authToken, id);
      if (data) {
        setInvoice(data);
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getErrorDescription = (code: string | null) => {
    if (!code) return "Thanh toán không thành công hoặc đã bị hủy.";
    switch (code) {
      case "24":
        return "Giao dịch không thành công do bạn đã hủy yêu cầu thanh toán.";
      case "09":
        return "Thẻ/Tài khoản của bạn chưa đăng ký dịch vụ Internet Banking.";
      case "11":
        return "Giao dịch không thành công do đã hết hạn chờ thanh toán.";
      case "12":
        return "Thẻ/Tài khoản của bạn bị khóa hoặc bị lỗi.";
      case "51":
        return "Tài khoản của bạn không đủ số dư để thực hiện giao dịch.";
      default:
        return `Đã xảy ra lỗi trong quá trình thanh toán (Mã lỗi: ${code}).`;
    }
  };

  // Format currency
  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-55 flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <Loader className="animate-spin h-10 w-10 text-rose-500 mx-auto" />
          <p className="text-slate-600 font-medium animate-pulse">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus === "success";

  return (
    <div className="min-h-screen bg-slate-50 pb-10 pt-4 md:pt-10 font-sans selection:bg-rose-100 selection:text-rose-900 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Navigation back link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-500 font-bold transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Về trang chủ</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          
          {/* Left Column: Status & Actions */}
          <div className="w-full md:w-5/12 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
            <div className="absolute inset-0 top-0 h-32 bg-gradient-to-b from-rose-50 to-transparent pointer-events-none" />
            
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center relative z-10">
              {isSuccess ? (
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 mb-5 shadow-sm border border-emerald-100/50">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-75" />
                  <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
                </div>
              ) : (
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 text-rose-500 mb-5 shadow-sm border border-rose-100/50">
                  <div className="absolute inset-0 rounded-full bg-rose-400/10 animate-ping opacity-50" />
                  <XCircle className="h-10 w-10 stroke-[2.5]" />
                </div>
              )}

              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {isSuccess ? "Đặt Hàng Thành Công!" : "Thanh Toán Thất Bại"}
              </h1>
              
              <p className="mt-3 text-slate-500 text-[13px] leading-relaxed w-full max-w-[320px] mx-auto">
                {isSuccess 
                  ? `Cảm ơn bạn đã mua sắm tại LazPe. Đơn hàng đã được tiếp nhận và đang chờ xử lý.` 
                  : getErrorDescription(errorCode)
                }
              </p>

              {isSuccess && txnNo && (
                <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" />
                  <span>Mã GD VNPay: #{txnNo}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-3">
              <Link
                href={`/profile?tab=orders${invoiceIdStr || invoice?.invoiceID ? `&id=${invoiceIdStr || invoice?.invoiceID}` : ""}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 active:scale-[0.98] transition-all"
              >
                <span>Xem đơn hàng</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 transition-all active:scale-[0.98]"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Tiếp tục mua sắm</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Details */}
          <div className="w-full md:w-7/12 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            
            {/* Header Info */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã Đơn Hàng</div>
                <div className="text-base font-extrabold text-slate-800">
                  #{invoice?.invoiceCode || "..."}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời Gian Đặt</div>
                <div className="text-xs font-bold text-slate-700">
                  {invoice?.createdAt ? formatDate(invoice.createdAt) : "..."}
                </div>
              </div>
            </div>

            {invoice ? (
              <div className="p-6 flex-1 flex flex-col space-y-5">
                
                {/* Products List (Scrollable if too many) */}
                <div className="flex-1 min-h-[120px] max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-3">
                    {invoice.invoiceDetails?.map((item: any) => (
                      <div key={item.invoiceDetailID} className="flex gap-3 items-center py-1">
                        <div className={`relative w-12 h-12 rounded-lg p-1 border flex-shrink-0 ${item.unitPrice === 0 ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100"}`}>
                          <img
                            alt={item.productName}
                            className="w-full h-full object-contain"
                            src={item.imageUrl || "/images/placeholder.jpg"}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
                            }}
                          />
                          <span className={`absolute -top-1.5 -right-1.5 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${item.unitPrice === 0 ? "bg-emerald-500" : "bg-slate-700"}`}>
                            x{item.quantity}
                          </span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-[13px] font-bold text-slate-800 truncate" title={item.productName}>
                            {item.productName}
                          </h4>
                          {item.variantName && (
                            <div className="text-[9px] text-slate-500 font-medium mt-0.5">
                              Phân loại: {item.variantName}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-[13px] font-bold ${item.unitPrice === 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {item.unitPrice === 0 ? "QUÀ TẶNG" : formatVND(item.totalPrice)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery & Payment (Compact Row) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Địa chỉ giao hàng
                    </div>
                    <div className="text-[11px] text-slate-700 font-medium line-clamp-2" title={invoice.shippingAddress}>
                      {invoice.shippingAddress}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> Thanh toán
                    </div>
                    <div className="text-[11px] text-slate-700 font-bold">
                      {invoice.payMethod || "COD"}
                    </div>
                    <div className={`mt-0.5 text-[9px] font-bold ${isSuccess ? "text-emerald-600" : "text-rose-600"}`}>
                      {isSuccess ? "Thành công" : "Thất bại"}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tạm tính</span>
                    <span className="font-bold text-slate-800">{formatVND(invoice.subTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Phí vận chuyển</span>
                    <span className={`font-bold ${invoice.shippingFee === 0 ? "text-emerald-500" : "text-slate-800"}`}>
                      {invoice.shippingFee === 0 ? "Miễn phí" : formatVND(invoice.shippingFee)}
                    </span>
                  </div>
                  {invoice.voucherDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-rose-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">confirmation_number</span> Voucher giảm giá
                      </span>
                      <span className="font-bold">- {formatVND(invoice.voucherDiscountAmount)}</span>
                    </div>
                  )}
                  {invoice.pointsDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-amber-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">military_tech</span> Điểm tích lũy
                      </span>
                      <span className="font-bold">- {formatVND(invoice.pointsDiscountAmount)}</span>
                    </div>
                  )}
                  {invoice.coinsDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-orange-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">monetization_on</span> LazPe Coins
                      </span>
                      <span className="font-bold">- {formatVND(invoice.coinsDiscountAmount)}</span>
                    </div>
                  )}
                  {invoice.walletDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-teal-600">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">account_balance_wallet</span> Trừ Ví LazPe
                      </span>
                      <span className="font-bold">- {formatVND(invoice.walletDiscountAmount)}</span>
                    </div>
                  )}
                  {(invoice.discountAmount > 0 && !invoice.voucherDiscountAmount && !invoice.pointsDiscountAmount && !invoice.coinsDiscountAmount && !invoice.walletDiscountAmount) && (
                    <div className="flex justify-between items-center text-rose-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">confirmation_number</span> Giảm giá
                      </span>
                      <span className="font-bold">- {formatVND(invoice.discountAmount)}</span>
                    </div>
                  )}
                  {invoice.shippingDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-sky-600 font-bold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">local_shipping</span> Giảm phí vận chuyển
                      </span>
                      <span>- {formatVND(invoice.shippingDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-slate-200 my-1" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-slate-800 text-sm">Tổng thanh toán</span>
                    <span className="text-lg font-extrabold text-rose-500">
                      {formatVND(invoice.finalAmount || (invoice.totalPrice + invoice.shippingFee - (invoice.shippingDiscountAmount || 0)))}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-400 text-sm">
                Không tìm thấy thông tin chi tiết đơn hàng trực tuyến.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader className="animate-spin h-10 w-10 text-rose-500 mb-4" />
        <p className="text-slate-600 font-medium">Đang tải trang kết quả...</p>
      </div>
    }>
      <InvoiceContent />
    </Suspense>
  );
}

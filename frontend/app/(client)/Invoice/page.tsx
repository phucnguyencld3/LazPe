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
      fetchInvoiceDetails(parseInt(invoiceIdStr), savedToken);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50/20 pb-20 pt-8 font-sans selection:bg-rose-100 selection:text-rose-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Navigation back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-rose-500 font-semibold transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Về trang chủ</span>
          </Link>
        </div>

        {/* 1. Status Hero Banner */}
        <div className="text-center mb-10 relative">
          <div className="absolute inset-0 -top-12 flex justify-center opacity-30 pointer-events-none">
            <div className={`w-40 h-40 rounded-full filter blur-3xl ${isSuccess ? "bg-emerald-300" : "bg-rose-300"}`} />
          </div>

          {isSuccess ? (
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-50 text-emerald-500 mb-6 shadow-md border border-emerald-100/50 animate-bounce duration-1000">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-75" />
              <CheckCircle2 className="h-14 w-14 stroke-[2.2] relative z-10" />
            </div>
          ) : (
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-rose-50 text-rose-500 mb-6 shadow-md border border-rose-100/50 animate-pulse">
              <div className="absolute inset-0 rounded-full bg-rose-400/10 animate-ping opacity-50" />
              <XCircle className="h-14 w-14 stroke-[2.2] relative z-10" />
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-850 tracking-tight">
            {isSuccess ? "Đặt Hàng Thành Công!" : "Thanh Toán Thất Bại"}
          </h1>
          
          <p className="mt-3 text-slate-500 text-sm max-w-[450px] w-full mx-auto leading-relaxed">
            {isSuccess 
              ? `Cảm ơn bạn đã mua sắm tại LazPe. Đơn hàng của bạn đã được tiếp nhận và đang chờ xử lý.` 
              : getErrorDescription(errorCode)
            }
          </p>

          {/* Transaction reference (VNPay only) */}
          {isSuccess && txnNo && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-100 text-emerald-700 rounded-full text-xs font-bold shadow-sm uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Mã giao dịch VNPay: #{txnNo}</span>
            </div>
          )}
        </div>

        {/* 2. Main Order Detail Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100/50 border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-100/80">
          
          {/* Header Info Banner */}
          <div className="p-6 sm:px-8 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã đơn hàng</div>
              <div className="text-xl font-extrabold text-slate-800 tracking-tight">
                #{invoiceIdStr || invoice?.invoiceID}
              </div>
            </div>
            {invoice?.createdAt && (
              <div className="space-y-1 sm:text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời gian đặt</div>
                <div className="text-sm font-bold text-slate-700">{formatDate(invoice.createdAt)}</div>
              </div>
            )}
          </div>

          {/* Detail List */}
          {invoice ? (
            <div className="p-6 sm:p-8 space-y-8">
              
              {/* Products List */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Sản phẩm đã đặt</span>
                </h3>
                
                <div className="divide-y divide-slate-100 border-y border-slate-150/40 py-2">
                  {invoice.invoiceDetails?.map((item: any) => {
                    return (
                      <div key={item.invoiceDetailID} className="flex gap-4 py-4 items-center">
                        
                        {/* Image */}
                        <div className="relative w-16 h-16 bg-slate-50 rounded-xl p-1.5 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            alt={item.productName}
                            className="w-full h-full object-contain"
                            src={item.imageUrl || "/images/placeholder.jpg"}
                          />
                          <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border-2 border-white">
                            x{item.quantity}
                          </span>
                        </div>
                        
                        {/* Name & Variant */}
                        <div className="flex-grow min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate" title={item.productName}>
                            {item.productName}
                          </h4>
                          
                          {/* Hiển thị phân loại thay vì biến thể */}
                          {item.variantName && (
                            <p className="text-[10px] text-slate-400 font-bold mt-1 bg-slate-50 inline-block px-2 py-0.5 rounded-md border border-slate-100">
                              Phân loại: {item.variantName}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-extrabold text-rose-500">
                            {formatVND(item.totalPrice)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {formatVND(item.unitPrice)} / cái
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery & Payment cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Delivery Address Card */}
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-rose-400" />
                    <span>Địa chỉ giao hàng</span>
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {invoice.shippingAddress}
                  </p>
                </div>

                {/* Payment Card */}
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-rose-400" />
                    <span>Hình thức thanh toán</span>
                  </h4>
                  
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="font-semibold">
                      Phương thức: <span className="font-bold text-slate-800">{invoice.payMethod || "Thanh toán khi nhận hàng (COD)"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      Trạng thái: 
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isSuccess 
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                      }`}>
                        {isSuccess ? "Thành công" : "Thanh toán thất bại"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Calculations Bill Card */}
              <div className="border border-rose-100/50 bg-rose-500/[0.01] rounded-2xl p-6 space-y-3.5 text-sm">
                
                {/* Item subtotal */}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tạm tính:</span>
                  <span className="font-bold text-slate-800">{formatVND(invoice.subTotal)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className={`font-bold ${invoice.shippingFee === 0 ? "text-emerald-500" : "text-slate-800"}`}>
                    {invoice.shippingFee === 0 ? "Miễn phí" : formatVND(invoice.shippingFee)}
                  </span>
                </div>

                {/* Voucher discount */}
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-rose-500">
                    <span>Voucher giảm giá:</span>
                    <span className="font-extrabold">- {formatVND(invoice.discountAmount)}</span>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-rose-100/30 my-2" />

                {/* Total amount */}
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-slate-800 text-base">Tổng thanh toán:</span>
                  <span className="text-xl font-extrabold text-rose-500">
                    {formatVND(invoice.totalPrice + invoice.shippingFee)}
                  </span>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm">
              Không tìm thấy thông tin chi tiết đơn hàng trực tuyến.
            </div>
          )}

        </div>

        {/* 3. Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-4 border border-slate-200 hover:border-rose-200 rounded-xl text-sm font-bold text-slate-600 hover:text-rose-500 bg-white transition-all duration-200 shadow-sm bouncy-hover"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Tiếp tục mua sắm</span>
          </Link>
          
          <Link
            href={`/profile?tab=orders${invoiceIdStr || invoice?.invoiceID ? `&id=${invoiceIdStr || invoice?.invoiceID}` : ""}`}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <span>Xem đơn hàng của tôi</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
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

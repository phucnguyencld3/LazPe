"use client";

import React, { useState, useRef, useEffect } from "react";
import { OrderInfo, fetchOrderDetails, formatCurrency, formatDateTime } from "@/lib/features/orders/orderApi";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/features/orders/orderApi";
import { toast } from "@/lib/toast";

export default function AdminTrackingPage() {
  const [barcode, setBarcode] = useState("");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<any>(null);

  // Auto focus input on load
  useEffect(() => {
    if (inputRef.current && !isScanningCamera) {
      inputRef.current.focus();
    }
  }, [isScanningCamera]);

  // Handle camera scanner
  useEffect(() => {
    if (isScanningCamera) {
      let html5QrCode: any;

      import("html5-qrcode").then(({ Html5Qrcode }) => {
        if (!document.getElementById("reader")) return;
        
        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" }, // Ưu tiên camera sau
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0
          },
          (decodedText: string) => {
            // Thành công
            setBarcode(decodedText);
            setIsScanningCamera(false);
            
            if (scannerRef.current) {
              scannerRef.current.stop().catch((e: any) => console.error(e));
            }
            
            setTimeout(() => {
              executeSearch(decodedText);
            }, 100);
          },
          (errorMessage: string) => {
            // Đang quét, bỏ qua lỗi
          }
        ).catch((err: any) => {
          console.error("Không thể khởi động camera", err);
          toast.error("Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập.");
          setIsScanningCamera(false);
        });
      }).catch(err => {
        console.error("Failed to load html5-qrcode", err);
        toast.error("Không thể tải thư viện quét mã vạch.");
        setIsScanningCamera(false);
      });
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
        }).catch((e: any) => console.error(e));
      }
    };
  }, [isScanningCamera]);

  const executeSearch = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) {
      toast.error("Vui lòng nhập hoặc quét mã vạch.");
      return;
    }

    setLoading(true);
    setOrder(null);

    try {
      let invoiceIdStr = codeToSearch.trim();
      
      // Nếu là mã vạch được sinh bằng logic cũ (LZP...VN), cắt bỏ tiền tố/hậu tố để lấy ID
      if (invoiceIdStr.toUpperCase().startsWith("LZP") && invoiceIdStr.toUpperCase().endsWith("VN")) {
        invoiceIdStr = invoiceIdStr.substring(3, invoiceIdStr.length - 2);
      }
      
      if (!invoiceIdStr) {
        toast.error("Mã vạch không hợp lệ.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      if (!token) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang.");
        setLoading(false);
        return;
      }

      const data = await fetchOrderDetails(token, invoiceIdStr);
      if (data && data.invoiceID) {
        setOrder(data);
        toast.success("Tra cứu thành công!");
      } else {
        toast.error("Không tìm thấy đơn hàng tương ứng.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải thông tin đơn hàng. Vui lòng kiểm tra lại mã.");
    } finally {
      setLoading(false);
      setBarcode(""); // Xóa input để quét mã tiếp theo
      if (inputRef.current && !isScanningCamera) {
        inputRef.current.focus();
      }
    }
  };

  // Handle barcode scanning or manual submit
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(barcode);
  };

  const isCOD = !order?.payMethodCode || order?.payMethod?.toLowerCase().includes("cod");
  const codAmount = order ? (isCOD ? (order.totalPrice + (order.shippingFee || 0) - (order.shippingDiscountAmount || 0)) : 0) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <style>{`
        #reader {
          width: 100% !important;
          border: none !important;
          border-radius: 12px;
          overflow: hidden;
        }
        #reader video {
          object-fit: cover;
          width: 100% !important;
          height: 100% !important;
          min-height: 300px;
        }
      `}</style>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: TÌM KIẾM & QUÉT MÃ */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">barcode_scanner</span>
                Tra cứu Nhanh
              </h1>
              <button
                type="button"
                onClick={() => setIsScanningCamera(!isScanningCamera)}
                className={`px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                  isScanningCamera 
                    ? "bg-rose-100 text-rose-600 hover:bg-rose-200" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                {isScanningCamera ? "Đóng" : "Camera"}
              </button>
            </div>
            
            {isScanningCamera ? (
              <div className="mb-6 p-4 border-2 border-dashed border-primary/50 rounded-2xl bg-slate-50">
                <div id="reader" className="w-full overflow-hidden rounded-xl bg-slate-900 min-h-[300px] flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 z-0">
                    <span className="material-symbols-outlined animate-spin text-3xl mr-2">sync</span>
                    Đang khởi động camera...
                  </div>
                </div>
                <p className="text-center text-xs text-slate-500 mt-4">
                  Đưa mã vạch vào khung hình. Yêu cầu cấp quyền Camera.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <form onSubmit={handleSearch} className="flex flex-col gap-4">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      qr_code_scanner
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Nhập mã đơn hàng..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-primary focus:bg-white text-base font-semibold transition-all"
                      disabled={loading}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin">sync</span>
                    ) : (
                      <span className="material-symbols-outlined">search</span>
                    )}
                    Bắt đầu Tra cứu
                  </button>
                </form>
                <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 flex gap-3 mt-2">
                  <span className="material-symbols-outlined shrink-0 text-amber-500">lightbulb</span>
                  <p className="text-xs leading-relaxed">
                    <strong>Mẹo:</strong> Cắm súng quét mã vạch vào máy, click chuột vào ô nhập và dùng súng quét mã vạch trên phiếu giao hàng để tự động điền.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ ĐƠN HÀNG */}
        <div className="lg:col-span-7">
          {loading && (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-slate-500 font-medium">Đang tải thông tin đơn hàng...</p>
            </div>
          )}

          {!loading && !order && (
            <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-400 w-full">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">receipt_long</span>
              <p className="text-lg font-medium text-slate-500 text-center">Chưa có thông tin hiển thị</p>
              <p className="text-sm mt-2 text-center" style={{ maxWidth: '400px' }}>
                Quét mã vạch hoặc nhập mã đơn hàng ở ô bên trái để xem chi tiết thông tin thanh toán và giao hàng.
              </p>
            </div>
          )}

          {order && !loading && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 mb-1">Đơn hàng #{order.invoiceCode || order.invoiceID}</h2>
                  <p className="text-sm text-slate-500">Đặt lúc: {formatDateTime(order.createdAt)}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${getStatusBadgeColor(order.statusCode)}`}>
                  {getStatusLabel(order.statusCode)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Thông tin Khách hàng</h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 h-full">
                    <p className="font-bold text-slate-800 text-lg">{order.userFullName || order.userName}</p>
                    <p className="text-slate-600 mt-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">call</span>
                      {order.userPhone || "Không có SĐT"}
                    </p>
                    <p className="text-sm text-slate-600 mt-2 flex items-start gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">location_on</span>
                      <span className="leading-relaxed">{order.shippingAddress || "Khách hàng mua tại quầy"}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Thông tin Thanh toán</h3>
                  <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex flex-col justify-center h-full">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-slate-600">Phương thức:</span>
                      <span className="font-bold text-slate-800 px-3 py-1 bg-white rounded-lg border border-slate-200">{order.payMethod || "COD"}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-auto">
                      <span className="text-sm font-bold text-rose-600 uppercase">Tiền thu người nhận (COD)</span>
                      <span className="text-3xl font-black text-rose-600 tracking-tight">{codAmount > 0 ? formatCurrency(codAmount) : "0 đ"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Danh sách Sản phẩm ({order.itemCount})</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {order.invoiceDetails?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-white hover:shadow-md transition-all group cursor-default">
                      <div className="flex items-center gap-4">
                        <img 
                          src={item.imageUrl || "/images/placeholder.jpg"} 
                          alt={item.productName} 
                          className="w-16 h-16 object-cover rounded-xl border border-slate-100 bg-slate-50"
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm max-w-[250px] sm:max-w-[300px] line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={item.productName}>
                            {item.productName}
                          </h4>
                          {item.variantName && (
                            <p className="text-xs text-slate-500 font-medium mt-1">Loại: {item.variantName}</p>
                          )}
                          <p className="text-xs font-bold text-primary mt-1 px-2 py-0.5 bg-primary/10 rounded-md inline-block">SL: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="font-bold text-slate-800 text-right">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

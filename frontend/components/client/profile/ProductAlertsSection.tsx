"use client";

import React, { useState, useEffect } from "react";
import { getMyAlerts, unsubscribeAlert, ProductAlertDto } from "@/lib/api/product-alert";
import { toast } from "sonner";
import { Loader, BellOff, TrendingDown, PackageCheck, ExternalLink, Package } from "lucide-react";
import Link from "next/link";

interface ProductAlertsSectionProps {
  token: string | null;
}

export function ProductAlertsSection({ token }: ProductAlertsSectionProps) {
  const [alerts, setAlerts] = useState<ProductAlertDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  useEffect(() => {
    if (token) {
      loadAlerts();
    }
  }, [token]);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await getMyAlerts();
    if (data) {
      setAlerts(data);
    }
    setLoading(false);
  };

  const handleUnsubscribeClick = (id: number) => {
    requestConfirm(
      "Hủy đăng ký thông báo?",
      "Bạn có chắc muốn hủy đăng ký nhận thông báo cho sản phẩm này?",
      () => executeUnsubscribe(id)
    );
  };

  const executeUnsubscribe = async (id: number) => {
    const res = await unsubscribeAlert(id);
    if (res.success) {
      toast.success(res.message);
      setAlerts(alerts.filter(a => a.id !== id));
    } else {
      toast.error(res.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải danh sách đăng ký thông báo...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <BellOff className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa đăng ký thông báo nào</h3>
        <p className="text-slate-500 mb-6 w-full max-w-[400px]">
          Bạn chưa đăng ký nhận thông báo giảm giá hay có hàng cho bất kỳ sản phẩm nào.
        </p>
        <Link href="/" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors mt-2 block">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const trackingAlerts = alerts.filter(a => !a.isConditionMet);
  const metAlerts = alerts.filter(a => a.isConditionMet);

  const renderAlertCard = (alert: ProductAlertDto) => (
    <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-xl hover:border-primary/30 transition-colors bg-white">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-100 relative">
        {/* Fallback Icon Background */}
        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
          <Package className="w-6 h-6" />
        </div>
        {/* Foreground Image */}
        {alert.productImage && (
          <img 
            src={alert.productImage} 
            alt={alert.productName}
            className="w-full h-full object-cover mix-blend-multiply relative z-10 bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {alert.alertType === 0 ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-bold uppercase">
              <TrendingDown className="w-3 h-3" />
              Giảm giá
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase">
              <PackageCheck className="w-3 h-3" />
              Có hàng
            </span>
          )}
          {alert.targetPrice && alert.alertType === 0 && (
            <span className="text-xs font-semibold text-slate-500">
              Giá mong đợi: <span className="text-rose-500">₫{alert.targetPrice.toLocaleString("vi-VN")}</span>
            </span>
          )}
        </div>

        <Link href={`/products/${alert.productId}`} className="hover:text-primary transition-colors">
          <h3 className="text-sm font-bold text-slate-800 line-clamp-1 leading-snug">
            {alert.productName}
          </h3>
        </Link>
        
        {alert.variantName && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{alert.variantName}</p>
        )}

        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-4">
          <span>Ngày đăng ký: {new Date(alert.createdAt).toLocaleDateString("vi-VN")}</span>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 mt-3 sm:mt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
        <Link 
          href={`/products/${alert.productId}`}
          className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary text-xs font-semibold rounded-[6px] flex items-center justify-center gap-1.5 transition-colors h-8"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Xem SP
        </Link>
        
        <button 
          onClick={() => handleUnsubscribeClick(alert.id)}
          className="w-full sm:w-auto px-4 py-2 bg-transparent text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-[6px] flex items-center justify-center gap-1.5 transition-colors h-8"
        >
          <BellOff className="w-3.5 h-3.5" />
          Hủy nhận
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_alert</span>
            Thông báo giá & hàng
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Quản lý các sản phẩm bạn đang theo dõi</p>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {metAlerts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Đã có chương trình khuyến mãi / Đã có hàng
            </h3>
            <div className="grid gap-3">
              {metAlerts.map(renderAlertCard)}
            </div>
          </div>
        )}

        {trackingAlerts.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              Đang theo dõi
            </h3>
            <div className="grid gap-3">
              {trackingAlerts.map(renderAlertCard)}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
          />
          <div className="bg-white rounded-[10px] p-6 shadow-xl border border-slate-100 max-w-[380px] w-full relative z-10 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6 font-semibold">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-600 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-md shadow-rose-500/10 active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

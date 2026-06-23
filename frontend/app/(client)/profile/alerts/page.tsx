"use client";

import React, { useEffect, useState } from "react";
import { getMyAlerts, unsubscribeAlert, ProductAlertDto } from "@/lib/api/product-alert";
import { ArrowLeft, Bell, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MyAlertsPage() {
  const [alerts, setAlerts] = useState<ProductAlertDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    const data = await getMyAlerts();
    if (data) {
      setAlerts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUnsubscribe = async (id: number) => {
    const res = await unsubscribeAlert(id);
    if (res.success) {
      toast.success(res.message);
      fetchAlerts();
    } else {
      toast.error(res.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/profile" className="p-2 hover:bg-slate-200 rounded-full transition-colors bg-white shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Sản phẩm đang theo dõi
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Đang tải danh sách...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có thông báo nào</h3>
              <p className="text-slate-500 mb-6 max-w-sm">Bạn chưa đăng ký theo dõi giá hoặc tình trạng kho cho sản phẩm nào.</p>
              <Link href="/products" className="bg-primary text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary/90 transition-colors">
                Khám phá sản phẩm
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-slate-50 transition-colors">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    <img 
                      src={alert.productImage || "/assets/img/products/default-product.jpg"} 
                      alt={alert.productName} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link href={`/products/${alert.productId}`} className="font-bold text-slate-800 hover:text-primary transition-colors line-clamp-2 text-sm sm:text-base">
                        {alert.productName}
                      </Link>
                    </div>
                    {alert.variantName && (
                      <p className="text-xs text-slate-500 mb-2 font-medium">Phân loại: {alert.variantName}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md ${
                        alert.alertType === 0 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {alert.alertType === 0 ? "Theo dõi Giảm giá" : "Nhận thông báo Có hàng"}
                      </span>
                      {alert.targetPrice && (
                        <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          Mức giá: &le; {new Intl.NumberFormat("vi-VN").format(alert.targetPrice)}đ
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Đăng ký ngày: {formatDate(alert.createdAt)}
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0 mt-2 sm:mt-0">
                    <Link 
                      href={`/products/${alert.productId}`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Xem SP
                    </Link>
                    <button 
                      onClick={() => handleUnsubscribe(alert.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hủy theo dõi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

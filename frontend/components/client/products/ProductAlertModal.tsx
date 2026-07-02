"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { subscribeAlert } from "@/lib/api/product-alert";
import { toast } from "sonner";
import { Bell, TrendingDown, PackageCheck, X } from "lucide-react";

interface ProductAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  variantId?: number;
  variantName?: string;
  isOutOfStock: boolean;
  currentPrice: number;
}

export function ProductAlertModal({
  isOpen,
  onClose,
  productId,
  productName,
  variantId,
  variantName,
  isOutOfStock,
  currentPrice
}: ProductAlertModalProps) {
  const [loading, setLoading] = useState(false);
  const [alertType, setAlertType] = useState<number>(isOutOfStock ? 1 : 0);
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async () => {
    setLoading(true);
    
    let price: number | undefined = undefined;
    if (alertType === 0 && targetPrice) {
      price = parseInt(targetPrice.replace(/\D/g, ""));
      if (isNaN(price)) price = undefined;
    }

    const res = await subscribeAlert({
      productId,
      variantId,
      alertType,
      targetPrice: price
    });

    if (res.success) {
      toast.success(res.message);
      onClose();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const formattedCurrentPrice = new Intl.NumberFormat("vi-VN").format(currentPrice);

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '450px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', right: '16px', top: '16px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <X className="w-5 h-5 text-slate-500 hover:text-slate-800" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 mb-2">
            <Bell className="w-5 h-5 text-primary" />
            Nhận thông báo sản phẩm
          </h2>
          <p className="text-sm text-slate-500">
            Đăng ký để LazPe báo cho bạn ngay khi có cập nhật về: <strong className="text-slate-700">{productName}</strong> {variantName ? `(${variantName})` : ""}
          </p>
        </div>

        <div className="grid gap-4 py-2 mb-6">
          <div className="flex gap-4">
            <button
              className={`flex-1 flex flex-col items-center p-3 border rounded-xl transition-all ${
                alertType === 0 ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setAlertType(0)}
            >
              <TrendingDown className={`w-6 h-6 mb-2 ${alertType === 0 ? "text-primary" : "text-slate-400"}`} />
              <span className={`text-sm font-medium ${alertType === 0 ? "text-primary" : "text-slate-600"}`}>Giảm giá</span>
            </button>
            {isOutOfStock && (
              <button
                className={`flex-1 flex flex-col items-center p-3 border rounded-xl transition-all ${
                  alertType === 1 ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setAlertType(1)}
              >
                <PackageCheck className={`w-6 h-6 mb-2 ${alertType === 1 ? "text-primary" : "text-slate-400"}`} />
                <span className={`text-sm font-medium ${alertType === 1 ? "text-primary" : "text-slate-600"}`}>Có hàng</span>
              </button>
            )}
          </div>

          {alertType === 0 && (
            <div className="space-y-2 mt-2">
              <label className="text-sm font-medium text-slate-700">Mức giá mong muốn (Tùy chọn)</label>
              <p className="text-xs text-slate-500 mb-2">Hiện tại: {formattedCurrentPrice}đ. Để trống nếu muốn nhận thông báo ở mọi đợt giảm giá.</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ví dụ: 500,000"
                  value={targetPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val) {
                      setTargetPrice(new Intl.NumberFormat("vi-VN").format(Number(val)));
                    } else {
                      setTargetPrice("");
                    }
                  }}
                  style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">đ</span>
              </div>
            </div>
          )}

          {alertType === 1 && (
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium border border-amber-100 flex items-start gap-3">
              <PackageCheck className="w-5 h-5 shrink-0 text-amber-600" />
              Chúng tôi sẽ gửi thông báo ngay khi sản phẩm này được nhập thêm hàng!
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button 
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f43f5e', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Bell className="w-4 h-4" />}
            Đăng ký nhận
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

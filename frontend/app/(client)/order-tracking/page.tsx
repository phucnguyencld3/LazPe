'use client';

import React, { useState } from 'react';
import { Search, Package, MapPin, Truck, CheckCircle, Clock, XCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

export default function OrderTrackingPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setError('Vui lòng nhập mã đơn hàng hoặc mã vận đơn.');
      return;
    }

    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const res = await fetch(`${API_BASE_URL}/Invoice/public-tracking/${encodeURIComponent(trackingCode.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Không tìm thấy đơn hàng nào với mã này.');
      } else {
        setOrderData(data);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tra cứu đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (statusCode: number) => {
    switch (statusCode) {
      case 0: return <Clock className="text-amber-500" size={16} />; // Pending
      case 1: return <CheckCircle className="text-blue-500" size={16} />; // Confirmed
      case 2: return <Truck className="text-indigo-500" size={16} />; // Shipped
      case 3: return <Package className="text-emerald-500" size={16} />; // Completed
      case 4: 
      case 5: return <XCircle className="text-rose-500" size={16} />; // Cancelled
      default: return <Package className="text-slate-400" size={16} />;
    }
  };

  const getStatusColor = (statusCode: number) => {
    switch (statusCode) {
      case 0: return 'bg-amber-100 text-amber-700 border-amber-200';
      case 1: return 'bg-blue-100 text-blue-700 border-blue-200';
      case 2: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 3: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 4: 
      case 5: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 pt-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-6 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Quay lại trang chủ
        </Link>
        
        <div className={`grid gap-6 md:gap-8 items-start ${orderData ? 'lg:grid-cols-12' : 'max-w-3xl mx-auto'}`}>
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${orderData ? 'lg:col-span-5 xl:col-span-4' : ''}`}>
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 md:p-8 text-center border-b border-primary/10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mb-3">
                <Search className="text-primary w-6 h-6" />
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-1.5">Tra Cứu Đơn Hàng</h1>
              <p className="text-sm text-slate-500">Nhập mã đơn hàng hoặc mã vận đơn để theo dõi hành trình của bạn</p>
            </div>
            
            <div className="p-5 md:p-8">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Package className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm font-medium"
                    placeholder="VD: 10024 hoặc GHN-123456789"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tìm...
                    </>
                  ) : (
                    'Tra Cứu'
                  )}
                </button>
              </form>
              
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start text-rose-700">
                  <XCircle className="h-5 w-5 text-rose-500 mr-2 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>

        {orderData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 lg:col-span-7 xl:col-span-8">
            {/* Header thông tin chung */}
            <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/50">
              <div>
                <p className="text-xs text-slate-500 mb-1">Mã đơn hàng</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">#{orderData.invoiceID}</h2>
                  {orderData.invoiceCode && (
                     <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">{orderData.invoiceCode}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                 {orderData.trackingCode && (
                    <div className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                      <Truck size={12} />
                      <span className="font-semibold">Vận đơn: {orderData.trackingCode}</span>
                    </div>
                 )}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${getStatusColor(orderData.statusCode)}`}>
                  {getStatusIcon(orderData.statusCode)}
                  {orderData.status}
                </div>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="p-4 md:p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Package size={16} className="text-slate-400" /> Sản phẩm đã đặt
              </h3>
              
              <div className="space-y-3">
                {orderData.items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-2.5 p-2.5 rounded-[10px] border border-slate-100 bg-white shadow-sm">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-md overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="text-slate-300 w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1 text-xs md:text-[13px]">{item.productName}</h4>
                        {item.variantName && (
                          <p className="text-[10px] text-slate-500 mt-0.5">Phân loại: {item.variantName}</p>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[11px] font-medium text-slate-500">SL: x{item.quantity}</span>
                        <span className="text-xs font-bold text-primary">{formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng quan thanh toán */}
            <div className="bg-slate-50 p-4 md:p-5 border-t border-slate-100">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500">Ngày đặt hàng:</span>
                  <span className="text-xs font-medium text-slate-700">{formatDate(orderData.createdAt)}</span>
               </div>
               <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 mt-2.5">
                  <span className="text-sm font-bold text-slate-800">Tổng tiền thanh toán:</span>
                  <span className="text-lg font-extrabold text-rose-500">{formatCurrency(orderData.totalPrice)}</span>
               </div>
            </div>
            
            <div className="p-4 bg-blue-50 border-t border-blue-100 text-center">
              <p className="text-xs text-blue-600 font-medium flex items-center justify-center gap-1.5">
                <MapPin size={14} /> Thông tin cá nhân và địa chỉ giao hàng được bảo mật.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

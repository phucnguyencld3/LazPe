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
    <div className="w-full">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-primary transition-colors">
          <ChevronLeft size={16} /> Quay lại trang chủ
        </Link>
        <div className={`grid gap-4 md:gap-6 items-start ${orderData ? 'lg:grid-cols-12' : 'w-full'}`}>
          
          {/* Cột Tra Cứu */}
          <div className={`bg-white rounded-[10px] shadow-sm border border-slate-100 overflow-hidden ${orderData ? 'lg:col-span-5 xl:col-span-4' : ''}`}>
            <div className="bg-orange-50/50 py-4 px-6 md:py-5 md:px-8 border-b border-orange-100/50 relative flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-orange-200 bg-white shadow-sm mb-2 text-orange-500">
                <Search className="w-4 h-4" />
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-1">Tra Cứu Đơn Hàng</h1>
              <p className="text-[13px] text-slate-500">Nhập mã đơn hàng hoặc vận đơn để theo dõi</p>
            </div>
            
            <div className="p-5 md:p-6">
              <form onSubmit={handleSearch} className="flex flex-col gap-3">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Package className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-[8px] text-[13px] bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium uppercase"
                    placeholder="VD: 10024 HOẶC GHN-12345"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-[13px] font-bold rounded-[8px] shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tìm...
                    </>
                  ) : (
                    'Tra Cứu Ngay'
                  )}
                </button>
              </form>
              
              {error && (
                <div className="mt-4 p-3 rounded-[8px] bg-rose-50 border border-rose-100 flex items-start text-rose-700">
                  <XCircle className="h-4 w-4 text-rose-500 mr-2 mt-0.5 shrink-0" />
                  <p className="text-[13px] font-medium leading-relaxed">{error}</p>
                </div>
              )}
            </div>
          </div>

        {orderData && (
          <div className="bg-white rounded-[10px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 lg:col-span-7 xl:col-span-8">
            {/* Header thông tin chung */}
            <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white">
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Mã đơn hàng</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-800">#{orderData.invoiceID}</h2>
                  {orderData.invoiceCode && (
                     <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-[4px] border border-slate-200">{orderData.invoiceCode}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                 {orderData.trackingCode && (
                    <div className="flex items-center gap-1.5 text-[11px] bg-indigo-50/50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100 font-medium">
                      <Truck size={12} />
                      <span>Vận đơn: <span className="font-bold">{orderData.trackingCode}</span></span>
                    </div>
                 )}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${getStatusColor(orderData.statusCode)}`}>
                  {getStatusIcon(orderData.statusCode)}
                  {orderData.status}
                </div>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="p-4 md:p-5">
              <h3 className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <Package size={14} className="text-slate-400" /> Sản phẩm đã đặt
              </h3>
              
              <div className="space-y-2">
                {orderData.items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-3 p-3 rounded-[8px] border border-slate-100 hover:border-slate-200 transition-colors bg-white">
                    <div className="w-14 h-14 bg-slate-50 rounded-[6px] overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="text-slate-300 w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-grow flex flex-col justify-center">
                      <div>
                        <h4 className="font-bold text-slate-700 line-clamp-1 text-[13px]">{item.productName}</h4>
                        {item.variantName && (
                          <p className="text-[11px] text-slate-500 mt-0.5">Phân loại: {item.variantName}</p>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-[4px]">x{item.quantity}</span>
                        <span className="text-[13px] font-bold text-slate-800">{formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng quan thanh toán */}
            <div className="bg-slate-50/80 p-4 md:p-5 border-t border-slate-100">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] font-medium text-slate-500">Ngày đặt hàng</span>
                  <span className="text-[13px] font-bold text-slate-700">{formatDate(orderData.createdAt)}</span>
               </div>
               <div className="flex justify-between items-center pt-3 border-t border-slate-200 border-dashed mt-3">
                  <span className="text-[13px] font-bold text-slate-800 uppercase">Tổng thanh toán</span>
                  <span className="text-lg font-black text-rose-500">{formatCurrency(orderData.totalPrice)}</span>
               </div>
            </div>
            
            <div className="py-2.5 bg-blue-50/50 border-t border-blue-100 text-center">
              <p className="text-[11px] text-blue-600 font-semibold flex items-center justify-center gap-1.5">
                <MapPin size={12} /> Thông tin cá nhân & địa chỉ được bảo mật.
              </p>
            </div>
          </div>
        )}
        </div>
    </div>
  );
}

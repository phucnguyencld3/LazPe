'use client';

import React, { useState, useEffect } from 'react';
import { getPublicVouchers, getWalletVouchers, collectVoucher, activateExclusiveVoucher, UserWalletVoucher } from '@/lib/api';
import { Voucher } from '@/types';
import { toast } from 'sonner';
import { Ticket, Gift, Sparkles, Clock, CheckCircle } from 'lucide-react';

export default function VoucherHubPage() {
  const [activeTab, setActiveTab] = useState<'public' | 'wallet'>('public');
  const [publicVouchers, setPublicVouchers] = useState<Voucher[]>([]);
  const [walletVouchers, setWalletVouchers] = useState<UserWalletVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingCode, setActivatingCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    setToken(storedToken);
    fetchData(storedToken);
  }, []);

  const fetchData = async (currentToken: string) => {
    setLoading(true);
    try {
      const [publicRes, walletRes] = await Promise.all([
        getPublicVouchers(),
        currentToken ? getWalletVouchers(currentToken) : Promise.resolve([])
      ]);
      setPublicVouchers(publicRes || []);
      setWalletVouchers(walletRes || []);
    } catch (error) {
      console.error("Lỗi khi tải voucher:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (voucherId: number) => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để lưu voucher!');
      return;
    }
    const res = await collectVoucher(voucherId);
    if (res.success) {
      toast.success(res.message);
      fetchData(token);
    } else {
      toast.error(res.message);
    }
  };

  const handleActivateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }
    if (!activatingCode.trim()) {
      toast.warning('Vui lòng nhập mã voucher!');
      return;
    }
    setIsActivating(true);
    const res = await activateExclusiveVoucher(token, activatingCode);
    if (res.success) {
      toast.success(res.message);
      setActivatingCode('');
      fetchData(token);
      setActiveTab('wallet');
    } else {
      toast.error(res.message);
    }
    setIsActivating(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderPublicVoucher = (voucher: Voucher) => {
    return (
      <div key={voucher.voucherID} className="relative flex bg-white rounded-[10px] shadow-sm border border-slate-200 overflow-hidden group hover:border-orange-300 hover:shadow-md transition-all">
        {/* Left Side - Discount Info */}
        <div className="w-[110px] shrink-0 bg-gradient-to-br from-orange-500 to-rose-500 text-white p-2 flex flex-col justify-center items-center text-center border-r-2 border-dashed border-slate-100 relative">
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-50 rounded-full border-r border-slate-200"></div>
          <Ticket size={24} className="mb-1 opacity-90" />
          <div className="font-black text-lg tracking-tight leading-none mb-1 break-all">
            {voucher.discountType === 1 ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue).replace('₫', 'đ')}
          </div>
          <div className="text-[10px] text-orange-100 font-bold uppercase tracking-wide">
            {voucher.voucherType === 1 ? 'Giảm SP' : 'Freeship'}
          </div>
        </div>

        {/* Right Side - Details */}
        <div className="flex-1 p-3 flex flex-col justify-between relative bg-white">
          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-50 rounded-full border-l border-slate-200"></div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm line-clamp-2 pr-2 leading-tight">{voucher.name}</h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Đơn từ {formatCurrency(voucher.minOrderValue)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={12} /> HSD: {formatDate(voucher.endDate)}
            </p>
          </div>
          
          <div className="mt-3 flex justify-between items-end gap-2 pr-2">
            <div className="flex-1 max-w-[80px]">
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-orange-500 rounded-full" 
                   style={{ width: `${Math.min(100, (voucher.usedQuantity / voucher.totalQuantity) * 100)}%` }}
                 />
               </div>
               <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">Đã dùng {Math.round((voucher.usedQuantity / voucher.totalQuantity) * 100)}%</p>
            </div>
            <button 
              onClick={() => handleCollect(voucher.voucherID)}
              disabled={voucher.isCollected}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                voucher.isCollected 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {voucher.isCollected ? 'Đã lưu' : 'Lưu Ngay'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWalletVoucher = (voucher: UserWalletVoucher) => {
    const isExpired = voucher.status === 'Expired' || new Date(voucher.endDate) < new Date();
    const isUsed = voucher.status === 'Used';
    const isUsable = voucher.status === 'Unused' && !isExpired;

    return (
      <div key={voucher.userVoucherID} className={`relative flex bg-white rounded-[10px] shadow-sm border overflow-hidden ${
        isUsable ? 'border-slate-200 hover:border-orange-300 transition-all hover:shadow-md' : 'border-slate-100 opacity-70 grayscale'
      }`}>
        <div className={`w-[110px] shrink-0 text-white p-2 flex flex-col justify-center items-center text-center border-r-2 border-dashed relative ${
          isUsable ? 'bg-gradient-to-br from-orange-500 to-rose-500 border-slate-100' : 'bg-slate-400 border-white'
        }`}>
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-50 rounded-full border-r border-slate-200"></div>
          <Ticket size={24} className="mb-1 opacity-90" />
          <div className="font-black text-lg tracking-tight leading-none mb-1 break-all">
            {voucher.discountType === 1 ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue).replace('₫', 'đ')}
          </div>
          <div className="text-[10px] text-white/90 font-bold uppercase tracking-wide">
            {voucher.voucherType === 'ProductDiscount' || voucher.voucherType === '1' ? 'Giảm SP' : 'Freeship'}
          </div>
        </div>

        <div className="flex-1 p-3 flex flex-col justify-between relative bg-white">
          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-50 rounded-full border-l border-slate-200"></div>
          <div>
            <div className="flex justify-between items-start pr-2">
              <h3 className={`font-bold text-sm line-clamp-2 leading-tight ${isUsable ? 'text-slate-800' : 'text-slate-500'}`}>
                {voucher.voucherName}
              </h3>
              {voucher.sourceType === 'ExclusiveCode' && (
                <span className="shrink-0 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ml-2">Độc Quyền</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Đơn từ {formatCurrency(voucher.minOrderValue)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={12} /> HSD: {formatDate(voucher.endDate)}
            </p>
          </div>
          
          <div className="mt-3 flex justify-between items-center pr-2">
            <div className="text-xs font-medium">
              {isUsed && <span className="text-slate-500 flex items-center gap-1"><CheckCircle size={14}/> Đã dùng</span>}
              {isExpired && !isUsed && <span className="text-red-500 flex items-center gap-1"><Clock size={14}/> Đã hết hạn</span>}
              {isUsable && <span className="text-emerald-500 flex items-center gap-1"><Sparkles size={14}/> Sẵn sàng</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl p-6 md:p-10 text-white mb-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3">
            <Gift size={36} /> Kho Voucher LazPe
          </h1>
          <p className="text-orange-100 max-w-[600px] text-base mt-2">
            Sưu tầm ngay hàng ngàn mã giảm giá và ưu đãi miễn phí vận chuyển để mua sắm tiết kiệm hơn mỗi ngày!
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-full opacity-20 pointer-events-none translate-x-1/4 -translate-y-1/4">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.1,-2.4C97.4,13.2,92,29,82.4,41.9C72.8,54.8,59,64.8,44.4,72.6C29.8,80.4,14.9,86,-0.6,87.1C-16.1,88.2,-32.2,84.8,-46.8,76.9C-61.4,69,-74.5,56.6,-82.9,41.8C-91.3,27,-95,9.8,-92.3,-6.4C-89.6,-22.6,-80.5,-37.8,-68.9,-49.8C-57.3,-61.8,-43.2,-70.6,-28.9,-77.2C-14.6,-83.8,0,-88.2,14.9,-85C29.8,-81.8,44.7,-76.4,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>

      {/* Tabs & Code Activation */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="bg-white rounded-[10px] p-1.5 flex shadow-sm border border-slate-100 w-full">
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap text-center ${
              activeTab === 'public' 
                ? 'bg-orange-50 text-orange-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Voucher Săn Sale
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap text-center ${
              activeTab === 'wallet' 
                ? 'bg-orange-50 text-orange-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Ví Của Tôi ({walletVouchers.length})
          </button>
        </div>

        {/* Code Input */}
        {activeTab === 'wallet' && (
          <form onSubmit={handleActivateCode} className="w-full flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã ưu đãi đặc quyền..."
              value={activatingCode}
              onChange={(e) => setActivatingCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2.5 rounded-[10px] border border-slate-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium uppercase placeholder:normal-case"
            />
            <button
              type="submit"
              disabled={isActivating || !activatingCode}
              className="shrink-0 bg-orange-500 text-white px-6 py-2.5 rounded-[10px] font-bold text-sm hover:bg-orange-600 transition-colors disabled:bg-orange-300 whitespace-nowrap"
            >
              {isActivating ? 'Kích hoạt...' : 'Áp Dụng'}
            </button>
          </form>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'public' && (
              publicVouchers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publicVouchers.map(renderPublicVoucher)}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                  <Ticket size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-1">Chưa có voucher nào</h3>
                  <p className="text-slate-500 text-sm">Hiện tại hệ thống không có voucher công khai nào. Vui lòng quay lại sau!</p>
                </div>
              )
            )}

            {activeTab === 'wallet' && (
              !token ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="text-orange-500" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Đăng nhập để xem Ví Voucher</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-[400px] mx-auto">
                    Bạn cần đăng nhập để xem danh sách voucher đã lưu và kích hoạt mã ưu đãi đặc quyền.
                  </p>
                  <a href="/login?redirect=/vouchers" className="inline-block bg-orange-500 text-white px-8 py-2.5 rounded-full font-bold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20">
                    Đăng Nhập Ngay
                  </a>
                </div>
              ) : walletVouchers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {walletVouchers.map(renderWalletVoucher)}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                  <Ticket size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-1">Ví của bạn đang trống</h3>
                  <p className="text-slate-500 text-sm">Hãy chuyển sang mục "Voucher Săn Sale" để lưu ưu đãi nhé!</p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

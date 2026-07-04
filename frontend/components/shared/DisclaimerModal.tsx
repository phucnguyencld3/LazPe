"use client";

import { useState, useEffect } from "react";

export default function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the disclaimer in this browser
    const hasSeenDisclaimer = localStorage.getItem("lazpe_disclaimer_seen");
    
    // Check if we are in the admin area, we probably don't want to show it there
    const isAdmin = window.location.pathname.startsWith('/admin');
    
    if (!hasSeenDisclaimer && !isAdmin) {
      // Add a slight delay so it doesn't pop up instantly jarring the user
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("lazpe_disclaimer_seen", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-[12px] shadow-2xl w-[90vw] sm:w-[500px] max-w-[500px] min-w-[300px] p-6 sm:p-8 animate-in zoom-in-95 duration-300 relative border border-slate-100"
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <span className="material-symbols-outlined text-[32px]">campaign</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              Lưu Ý Quan Trọng!
            </h3>
            <p className="text-slate-500 font-medium mt-2">
              Chào mừng bạn đến với <span className="font-bold text-primary">LazPe</span>
            </p>
          </div>
          
          {/* Body */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-4 p-4 rounded-[8px] bg-slate-50 border border-slate-100 items-start">
              <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">school</span>
              <div>
                <h4 className="font-bold text-slate-700 text-sm mb-1">Dự án học tập & Tốt nghiệp</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Website được xây dựng nhằm mục đích phục vụ <strong>Đồ án tốt nghiệp</strong>. Toàn bộ thông tin, hình ảnh và sản phẩm trên trang đều là dữ liệu mẫu giả lập được thu thập từ nhiều nguồn.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-[8px] bg-error/5 border border-error/20 items-start">
              <span className="material-symbols-outlined text-error text-2xl mt-0.5">gpp_bad</span>
              <div>
                <h4 className="font-bold text-error text-sm mb-1">Không kinh doanh thực tế</h4>
                <p className="text-error text-sm leading-relaxed">
                  Trang web hoàn toàn <strong>không có mục đích thương mại</strong> hay kinh doanh thật. Xin vui lòng <strong>không thực hiện các giao dịch chuyển khoản thật</strong> dưới mọi hình thức!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-primary hover:bg-primary/95 text-on-primary font-bold py-3.5 px-6 rounded-[8px] transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 focus:outline-none flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Tôi đã hiểu và đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}

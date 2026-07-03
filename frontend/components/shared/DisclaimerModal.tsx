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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-[90vw] sm:w-[450px] max-w-[450px] min-w-[300px] p-6 sm:p-8 animate-in zoom-in-95 duration-300 relative"
      >
        {/* Decorative pattern at top */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary rounded-t-2xl"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5 text-blue-500 shadow-inner">
            <span className="material-symbols-outlined text-3xl">info</span>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3 font-quicksand">
            Lưu Ý Quan Trọng
          </h3>
          
          <div className="text-gray-600 mb-8 space-y-3 leading-relaxed">
            <p>
              Chào mừng bạn đến với <strong>LazPe</strong>!
            </p>
            <p>
              Website này được xây dựng nhằm mục đích phục vụ <strong>Đồ án tốt nghiệp</strong>. Toàn bộ thông tin, hình ảnh và sản phẩm trên trang đều là dữ liệu mẫu được thu thập từ nhiều nguồn khác nhau.
            </p>
            <p className="text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">
              Trang web hoàn toàn không có mục đích thương mại hay kinh doanh thực tế. Xin vui lòng không thực hiện các giao dịch chuyển khoản thật!
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50 font-quicksand text-lg"
          >
            Tôi đã hiểu và đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}

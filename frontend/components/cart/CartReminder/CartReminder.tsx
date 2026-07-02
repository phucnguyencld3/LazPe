import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartReminder } from '@/hooks/cart/useCartReminder';
import Image from 'next/image';

const AUTO_HIDE_DURATION = 9000; // 9 seconds

export const CartReminder: React.FC = () => {
  const { isVisible, closeReminder, cart } = useCartReminder();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Auto Hide
  useEffect(() => {
    if (isVisible && !isHovered) {
      timeoutRef.current = setTimeout(() => {
        closeReminder();
      }, AUTO_HIDE_DURATION);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, isHovered, closeReminder]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        closeReminder();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, closeReminder]);

  if (!isVisible || !cart) return null;

  const totalAmount = cart.totalAmount || 0;
  // Count items excluding gifts
  const totalItems = cart.cartDetails?.filter(item => !item.isGift).length || 0;
  
  // Get up to 3 thumbnails
  const thumbnails = cart.cartDetails
    ?.filter(item => !item.isGift)
    .map(item => item.variant?.imageUrl || item.product?.imageUrl)
    .filter((url): url is string => !!url)
    .slice(0, 3) || [];

  const handleNavigateCart = () => {
    // Log analytics event
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({ event: 'cart_reminder_clicked' });
    } else {
      console.log('Event: cart_reminder_clicked');
    }
    
    closeReminder();
    router.push('/cart');
  };

  return (
    <div
      role="dialog"
      aria-label="Giỏ hàng của bạn"
      className="fixed z-[100] bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            <span>Giỏ hàng bỏ quên</span>
          </div>
          <button 
            onClick={closeReminder}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="text-slate-600">
          Bạn vẫn còn <strong className="text-slate-800">{totalItems} sản phẩm</strong> trong giỏ hàng.
          <br/>
          Tổng giá trị: <strong className="text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</strong>
        </div>

        {thumbnails.length > 0 && (
          <div className="flex gap-2">
            {thumbnails.map((url, idx) => (
              <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                <Image
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ))}
            {totalItems > 3 && (
              <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-medium text-sm">
                +{totalItems - 3}
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-slate-500">
          Đừng bỏ lỡ các sản phẩm bạn đã chọn.
        </p>

        <button
          onClick={handleNavigateCart}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex justify-center items-center gap-2"
        >
          <span>Xem giỏ hàng</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

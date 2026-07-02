import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { 
  canShowReminder, 
  markReminderShown, 
  hasExitIntentTriggered, 
  markExitIntentTriggered 
} from '@/utils/cartReminder/storage';
import { setupExitIntent } from '@/utils/cartReminder/exitIntent';

const INACTIVITY_TIMEOUT = 25000; // 25 seconds

export const useCartReminder = () => {
  const { cart, cartCount } = useCart();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isLoggedIn = typeof window !== 'undefined' && 
    (localStorage.getItem('token') || sessionStorage.getItem('token'));

  // Define pages where reminder should NOT show
  const isExcludedPage = useCallback(() => {
    if (!pathname) return true;
    const excludedPrefixes = ['/cart', '/checkout', '/login', '/register', '/order-success', '/payment-success'];
    return excludedPrefixes.some(prefix => pathname.startsWith(prefix));
  }, [pathname]);

  const showReminder = useCallback(() => {
    if (!isLoggedIn) return;
    if (cartCount === 0 || !cart) return;
    if (isExcludedPage()) return;
    if (isVisible) return; // Don't show if already visible
    if (!canShowReminder()) return;

    setIsVisible(true);
    markReminderShown();
    
    // Log analytics event
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({ event: 'cart_reminder_shown' });
    } else {
      console.log('Event: cart_reminder_shown');
    }
  }, [isLoggedIn, cartCount, cart, isExcludedPage, isVisible]);

  const closeReminder = useCallback(() => {
    setIsVisible(false);
    
    // Log analytics event
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({ event: 'cart_reminder_closed' });
    } else {
      console.log('Event: cart_reminder_closed');
    }
  }, []);

  // Trigger 1: Inactivity (Timeout after route change or cart change)
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!isLoggedIn || cartCount === 0 || isExcludedPage()) {
      setIsVisible(false);
      return;
    }

    // Set timeout to show reminder if they stay on page for 25s without going to cart
    timerRef.current = setTimeout(() => {
      showReminder();
    }, INACTIVITY_TIMEOUT);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pathname, cart, isLoggedIn, cartCount, isExcludedPage, showReminder]);

  // Trigger 2: Visibility Change (tab active again)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Add a small delay to avoid jarring effect
        setTimeout(() => {
          if (!isExcludedPage() && cartCount > 0 && canShowReminder()) {
            showReminder();
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cartCount, isExcludedPage, showReminder]);

  // Trigger 3: Exit Intent
  useEffect(() => {
    const cleanup = setupExitIntent(() => {
      if (hasExitIntentTriggered()) return; // Only trigger once per session
      
      if (!isExcludedPage() && cartCount > 0 && canShowReminder()) {
        markExitIntentTriggered();
        showReminder();
      }
    });

    return cleanup;
  }, [cartCount, isExcludedPage, showReminder]);

  // If cart is updated while reminder is open, and becomes empty, close it
  useEffect(() => {
    if (isVisible && cartCount === 0) {
      setIsVisible(false);
    }
  }, [cartCount, isVisible]);

  return {
    isVisible,
    closeReminder,
    cart
  };
};

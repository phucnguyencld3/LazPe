"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
  applyVoucherToCart as apiApplyVoucherToCart,
  removeVoucherFromCart as apiRemoveVoucherFromCart,
  CartInfo
} from "@/lib/api";
import { toast } from "@/lib/toast";

interface CartContextType {
  cart: CartInfo | null;
  cartCount: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (data: { variantID?: number; bundleID?: number; quantity: number }) => Promise<{ success: boolean; message?: string; data?: CartInfo }>;
  updateCartItem: (data: { cartDetailID: number; quantity: number }) => Promise<{ success: boolean; message?: string; data?: CartInfo }>;
  removeFromCart: (cartDetailId: number) => Promise<{ success: boolean; message?: string; data?: CartInfo }>;
  clearCart: () => Promise<{ success: boolean; message?: string }>;
  applyVoucher: (voucherCode: string) => Promise<{ success: boolean; message?: string; data?: CartInfo }>;
  removeVoucher: () => Promise<{ success: boolean; message?: string; data?: CartInfo }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartInfo | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const calculateCount = (cartData: CartInfo | null) => {
    if (!cartData || !cartData.cartDetails) return 0;
    return cartData.cartDetails.reduce((sum, item) => sum + item.quantity, 0);
  };

  const refreshCart = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      setCart(null);
      setCartCount(0);
      setIsInitialized(true);
      return;
    }

    try {
      const data = await getCart(token);
      if (data) {
        setCart(data);
        setCartCount(calculateCount(data));
      } else {
        setCart(null);
        setCartCount(0);
      }
    } catch (err) {
      console.error("Error refreshing cart:", err);
    } finally {
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (data: { variantID?: number; bundleID?: number; quantity: number }) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return { success: false, message: "Chưa đăng nhập" };
    }

    setLoading(true);
    try {
      const res = await apiAddToCart(token, data);
      if (res.success && res.data) {
        setCart(res.data);
        setCartCount(calculateCount(res.data));
      }
      return res;
    } catch (err) {
      console.error("Error in addToCart context:", err);
      return { success: false, message: "Lỗi kết nối đến server" };
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (data: { cartDetailID: number; quantity: number }) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      return { success: false, message: "Chưa đăng nhập" };
    }

    setLoading(true);
    try {
      const res = await apiUpdateCartItem(token, data);
      if (res.success && res.data) {
        setCart(res.data);
        setCartCount(calculateCount(res.data));
      }
      return res;
    } catch (err) {
      console.error("Error in updateCartItem context:", err);
      return { success: false, message: "Lỗi kết nối đến server" };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartDetailId: number) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      return { success: false, message: "Chưa đăng nhập" };
    }

    setLoading(true);
    try {
      const res = await apiRemoveFromCart(token, cartDetailId);
      if (res.success && res.data) {
        setCart(res.data);
        setCartCount(calculateCount(res.data));
      }
      return res;
    } catch (err) {
      console.error("Error in removeFromCart context:", err);
      return { success: false, message: "Lỗi kết nối đến server" };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      return { success: false, message: "Chưa đăng nhập" };
    }

    setLoading(true);
    try {
      const res = await apiClearCart(token);
      if (res.success) {
        setCart(null);
        setCartCount(0);
      }
      return res;
    } catch (err) {
      console.error("Error in clearCart context:", err);
      return { success: false, message: "Lỗi kết nối đến server" };
    } finally {
      setLoading(false);
    }
  };

  const applyVoucher = async (voucherCode: string) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      return { success: false, message: "Chưa đăng nhập" };
    }

    setLoading(true);
    try {
      const res = await apiApplyVoucherToCart(token, voucherCode);
      if (res.success && res.data) {
        setCart(res.data);
        setCartCount(calculateCount(res.data));
      }
      return res;
    } catch (err) {
      console.error("Error in applyVoucher context:", err);
      return { success: false, message: "Lỗi kết nối đến server" };
    } finally {
      setLoading(false);
    }
  };

  const removeVoucher = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      return { success: false, message: "Chưa đăng nhập" };
    }

    setLoading(true);
    try {
      const res = await apiRemoveVoucherFromCart(token);
      if (res.success && res.data) {
        setCart(res.data);
        setCartCount(calculateCount(res.data));
      }
      return res;
    } catch (err) {
      console.error("Error in removeVoucher context:", err);
      return { success: false, message: "Lỗi kết nối đến server" };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        refreshCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        applyVoucher,
        removeVoucher
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

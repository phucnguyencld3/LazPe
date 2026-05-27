"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types";
import { toast } from "sonner";
import { getWishlist, toggleWishlistApi, syncWishlistApi } from "@/lib/api";

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: number) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load and Sync Wishlist on Mount
  useEffect(() => {
    const initializeWishlist = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        
        if (token) {
          // 1. Check if there is a guest wishlist in localStorage
          const guestWishlistStr = localStorage.getItem("lazpe_wishlist");
          if (guestWishlistStr) {
            try {
              const guestWishlist: Product[] = JSON.parse(guestWishlistStr);
              if (guestWishlist.length > 0) {
                const productIds = guestWishlist.map((item) => item.id);
                // Sync with DB
                await syncWishlistApi(token, productIds);
                // Clear guest wishlist
                localStorage.removeItem("lazpe_wishlist");
              }
            } catch (e) {
              console.error("Failed to parse guest wishlist during sync", e);
            }
          }

          // 2. Fetch wishlist from database
          const dbWishlist = await getWishlist(token);
          if (dbWishlist) {
            setWishlist(dbWishlist);
          }
        } else {
          // Guest User: load from localStorage
          const stored = localStorage.getItem("lazpe_wishlist");
          if (stored) {
            setWishlist(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.error("Failed to initialize wishlist", error);
      } finally {
        setIsInitialized(true);
        setLoading(false);
      }
    };

    initializeWishlist();
  }, []);

  // Save guest wishlist to localStorage whenever it changes (only for guests)
  useEffect(() => {
    if (isInitialized) {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        localStorage.setItem("lazpe_wishlist", JSON.stringify(wishlist));
      }
    }
  }, [wishlist, isInitialized]);

  const addToWishlist = async (product: Product) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const exists = wishlist.some((item) => item.id === product.id);
    if (exists) return;

    if (token) {
      try {
        const res = await toggleWishlistApi(token, product.id);
        if (res.success && res.isWishlisted) {
          setWishlist((prev) => [...prev, product]);
          toast.success(`Đã thêm "${product.name}" vào danh sách yêu thích`);
        } else {
          toast.error(res.message || "Không thể cập nhật danh sách yêu thích");
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi kết nối mạng");
      }
    } else {
      // Guest
      setWishlist((prev) => [...prev, product]);
      toast.success(`Đã thêm "${product.name}" vào danh sách yêu thích`);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const item = wishlist.find((p) => p.id === productId);
    if (!item) return;

    if (token) {
      try {
        const res = await toggleWishlistApi(token, productId);
        if (res.success && !res.isWishlisted) {
          setWishlist((prev) => prev.filter((p) => p.id !== productId));
          toast.info(`Đã xóa "${item.name}" khỏi danh sách yêu thích`);
        } else {
          toast.error(res.message || "Không thể cập nhật danh sách yêu thích");
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi kết nối mạng");
      }
    } else {
      // Guest
      setWishlist((prev) => prev.filter((p) => p.id !== productId));
      toast.info(`Đã xóa "${item.name}" khỏi danh sách yêu thích`);
    }
  };

  const toggleWishlist = async (product: Product) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const exists = wishlist.some((item) => item.id === product.id);

    if (token) {
      try {
        const res = await toggleWishlistApi(token, product.id);
        if (res.success) {
          if (res.isWishlisted) {
            setWishlist((prev) => [...prev, product]);
            toast.success(`Đã thêm "${product.name}" vào danh sách yêu thích`);
          } else {
            setWishlist((prev) => prev.filter((item) => item.id !== product.id));
            toast.info(`Đã xóa "${product.name}" khỏi danh sách yêu thích`);
          }
        } else {
          toast.error(res.message || "Không thể cập nhật danh sách yêu thích");
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi kết nối mạng");
      }
    } else {
      // Guest
      if (exists) {
        setWishlist((prev) => prev.filter((item) => item.id !== product.id));
        toast.info(`Đã xóa "${product.name}" khỏi danh sách yêu thích`);
      } else {
        setWishlist((prev) => [...prev, product]);
        toast.success(`Đã thêm "${product.name}" vào danh sách yêu thích`);
      }
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

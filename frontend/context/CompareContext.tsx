"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/types";
import { toast } from "sonner";

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: number) => void;
  clearCompare: () => void;
  isInCompare: (productId: number) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lazpe_compare");
      if (stored) {
        setCompareItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to parse compare items from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when compareItems change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("lazpe_compare", JSON.stringify(compareItems));
    }
  }, [compareItems, isInitialized]);

  const addToCompare = (product: Product) => {
    // Check if already in compare
    if (compareItems.some((item) => item.id === product.id)) {
      toast.info("Sản phẩm đã có trong danh sách so sánh");
      return;
    }

    // Check max limit (3)
    if (compareItems.length >= 3) {
      toast.warning("Chỉ có thể so sánh tối đa 3 sản phẩm");
      return;
    }

    // Check if same category
    if (compareItems.length > 0 && compareItems[0].categoryId !== product.categoryId) {
      toast.error("Vui lòng chọn sản phẩm cùng loại để so sánh");
      return;
    }

    toast.success(`Đã thêm "${product.name}" vào so sánh`);
    setCompareItems((prev) => [...prev, product]);
  };

  const removeFromCompare = (productId: number) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const isInCompare = (productId: number) => {
    return compareItems.some((item) => item.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
};

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { getProductDetail } from "@/lib/api";
import { Product, Variant } from "@/types";
import { useCart } from "@/context/CartContext";
import { toast } from "@/lib/toast";

interface QuickAddModalProps {
  productId: number;
  onClose: () => void;
}

export default function QuickAddModal({ productId, onClose }: QuickAddModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await getProductDetail(productId);
        if (isMounted && data) {
          setProduct(data);
          // Initialize selected options
          if (data.productOptions && data.productOptions.length > 0) {
            const initial: Record<string, string> = {};
            data.productOptions.forEach((opt) => {
              // Find first in-stock value
              const inStockVal = opt.productOptionValues.find((v) => !isOptionValueOutOfStock(data, opt.name, v.value));
              if (inStockVal) {
                initial[opt.name] = inStockVal.value;
              } else if (opt.productOptionValues.length > 0) {
                initial[opt.name] = opt.productOptionValues[0].value;
              }
            });
            setSelectedOptions(initial);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProduct();
    return () => { isMounted = false; };
  }, [productId]);

  const isOptionValueOutOfStock = (prod: Product, optionName: string, value: string) => {
    if (!prod.variants || prod.variants.length === 0) return false;
    const option = prod.productOptions?.find((o) => o.name.toLowerCase() === optionName.toLowerCase());
    const optVal = option?.productOptionValues.find((v) => v.value.toLowerCase() === value.toLowerCase());
    if (!optVal) return true;

    const matchingVariants = prod.variants.filter((variant) =>
      variant.variantOptionValues.some((vov) => vov.productOptionValueID === optVal.productOptionValueID)
    );
    if (matchingVariants.length === 0) return true;
    return matchingVariants.every((variant) => variant.stock <= 0 || !variant.status);
  };

  const activeVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    return product.variants.find((variant) => {
      return Object.entries(selectedOptions).every(([optionName, optionValue]) => {
        const option = product.productOptions?.find((o) => o.name.toLowerCase() === optionName.toLowerCase());
        const optVal = option?.productOptionValues.find((v) => v.value.toLowerCase() === optionValue.toLowerCase());
        if (!optVal) return false;
        return variant.variantOptionValues.some((vov) => vov.productOptionValueID === optVal.productOptionValueID);
      });
    });
  }, [product, selectedOptions]);

  const displayPrice = activeVariant ? activeVariant.unitPrice : product?.price || 0;
  const displayDiscountPrice = activeVariant 
    ? (activeVariant.effectiveDiscountPercent > 0 ? activeVariant.finalPrice : undefined) 
    : product?.discountPrice;
  const displayStock = activeVariant ? activeVariant.stock : product?.quantity ?? 0;
  const displayInStock = activeVariant ? activeVariant.stock > 0 : product?.inStock ?? false;
  const displayImage = activeVariant?.imageUrl || product?.image || (product?.imageUrls?.[0]) || "/assets/img/products/default-product.jpg";

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
    setQuantity(1);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = async () => {
    const hasToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!hasToken) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    const fallbackVariantId = product?.variants?.[0]?.variantID || (product?.variants?.[0] as any)?.variantId;
    const finalVariantId = activeVariant?.variantID || (activeVariant as any)?.variantId || fallbackVariantId;

    if (!finalVariantId) {
      toast.error("Sản phẩm này hiện chưa có phân loại bán hàng!");
      return;
    }

    try {
      setIsAddingToCart(true);
      const res = await addToCart({ variantID: finalVariantId, quantity });
      if (res.success) {
        toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
        onClose();
      } else {
        toast.error(res.message || "Không thể thêm sản phẩm vào giỏ hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối mạng");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[500px] min-w-[300px] sm:w-[500px] overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-lg">Tùy chọn sản phẩm</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-rose-500 animate-spin"></div>
              <span className="text-sm font-medium text-slate-500">Đang tải chi tiết...</span>
            </div>
          ) : !product ? (
            <div className="py-10 text-center text-rose-500 font-medium">Lỗi: Không tìm thấy sản phẩm.</div>
          ) : (
            <div className="space-y-6">
              {/* Product Info Compact */}
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 border border-slate-100 rounded-[10px] overflow-hidden bg-slate-50">
                  <img src={displayImage} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl font-bold text-rose-600">
                      ₫{(displayDiscountPrice || displayPrice).toLocaleString("vi-VN")}
                    </span>
                    {displayDiscountPrice && displayDiscountPrice < displayPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        ₫{displayPrice.toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Kho: <span className="font-semibold text-slate-700">{displayStock}</span> sản phẩm
                  </div>
                </div>
              </div>

              {/* Options */}
              {product.productOptions && product.productOptions.length > 0 && !(product.productOptions.length === 1 && product.productOptions[0].productOptionValues.length === 1) && (
                <div className="space-y-4 pt-4 border-t border-slate-100 max-h-[40vh] overflow-y-auto hide-scrollbar">
                  {product.productOptions.map((option) => (
                    <div key={option.productOptionID} className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-700">
                        {option.name}: <span className="font-bold text-rose-600">{selectedOptions[option.name]}</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {option.productOptionValues.map((optVal) => {
                          const isSelected = selectedOptions[option.name] === optVal.value;
                          const isOutOfStock = isOptionValueOutOfStock(product, option.name, optVal.value);
                          return (
                            <button
                              key={optVal.productOptionValueID}
                              onClick={() => handleOptionSelect(option.name, optVal.value)}
                              disabled={isOutOfStock}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                                isOutOfStock
                                  ? "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed line-through"
                                  : isSelected
                                  ? "bg-rose-50 border-rose-500 text-rose-600 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {optVal.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between w-full sm:w-28 h-11 bg-slate-50 rounded-[8px] px-3 border border-slate-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="text-slate-500 hover:text-slate-900 disabled:opacity-30 p-1"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-sm w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                    disabled={!displayInStock || quantity >= displayStock}
                    className="text-slate-500 hover:text-slate-900 disabled:opacity-30 p-1"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!displayInStock || displayStock <= 0 || isAddingToCart}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-[8px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isAddingToCart ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      Thêm vào giỏ hàng
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
}

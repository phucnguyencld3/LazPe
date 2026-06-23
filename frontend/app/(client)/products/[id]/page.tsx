"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Heart, Star, Minus, Plus, ShoppingCart, ShieldCheck, RotateCcw, Truck } from "lucide-react";
import { toast } from "@/lib/toast";
import { Product, Variant } from "@/types";
import { getProductDetail, getProducts } from "@/lib/api";
import { ProductImageGallery } from "@/components/client/products/ProductImageGallery";
import { ProductDetailInfo } from "@/components/client/products/ProductDetailInfo";
import { CompareButton } from "@/components/client/compare/CompareButton";
import { ProductTabs } from "@/components/client/products/ProductTabs";
import { RelatedProducts } from "@/components/client/products/RelatedProducts";
import { ProductRecommendations } from "@/components/client/products/ProductRecommendations";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { logProductView } from "@/lib/recommendationApi";
import { getCurrentFlashSale, FlashSaleResponseDto, FlashSaleItemResponseDto, FlashSaleStatus } from "@/lib/features/flash-sales/flashSaleApi";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = Number(params.id);
  const router = useRouter();

  // Core Product State
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFlashSale, setActiveFlashSale] = useState<FlashSaleResponseDto | null>(null);

  // UI Interactive States
  const [quantity, setQuantity] = useState(1);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isWishlisted = product ? isInWishlist(product.id) : false;
  const setIsWishlisted = () => {
    if (product) toggleWishlist(product);
  };
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "shipping">("description");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Fetch product detail
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getProductDetail(productId);
        if (data) {
          setProduct(data);
          
          // Log view
          logProductView(productId);
          
          // Fetch related products in the same category
          const related = await getProducts(1, 10, undefined, data.categoryId);
          if (related) {
            const filtered = (related.items || []).filter((p) => p.id !== data.id);
            setRelatedProducts(filtered);
          }
        } else {
          setError("Không tìm thấy thông tin sản phẩm.");
        }
      } catch (err) {
        setError("Có lỗi xảy ra khi kết nối đến máy chủ.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchDetail();
    }
  }, [productId]);

  // Fetch active flash sale
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const sales = await getCurrentFlashSale();
        if (sales && sales.length > 0 && product) {
          // Find if there is an active/upcoming sale containing this product or its variants
          let matchedSale: FlashSaleResponseDto | null = null;
          
          const saleContainsProduct = (sale: FlashSaleResponseDto) => {
            return sale.flashSaleItems.some(item => {
              if (item.itemType === 1 && item.referenceId === productId) return true;
              if (item.itemType === 2 && product.variants?.some(v => v.variantID === item.referenceId)) return true;
              return false;
            });
          };

          // Prioritize active sales (status === 1)
          const activeSales = sales.filter(s => s.isActive && s.status === 1);
          matchedSale = activeSales.find(saleContainsProduct) || null;

          // Fallback to upcoming sales (status === 0)
          if (!matchedSale) {
            const upcomingSales = sales.filter(s => s.isActive && s.status === 0);
            matchedSale = upcomingSales.find(saleContainsProduct) || null;
          }

          setActiveFlashSale(matchedSale);
        }
      } catch (err) {
        console.error("Failed to load product page flash sale:", err);
      }
    };
    if (product) {
      fetchFlashSale();
    }
  }, [product, productId]);

  // Define helper to check if a variant option value is out of stock
  const isOptionValueOutOfStock = (optionName: string, value: string) => {
    if (!product || !product.variants || product.variants.length === 0) return false;

    const option = product.productOptions?.find(
      (o) => o.name.toLowerCase() === optionName.toLowerCase()
    );
    const optVal = option?.productOptionValues.find(
      (v) => v.value.toLowerCase() === value.toLowerCase()
    );
    if (!optVal) return true;

    const matchingVariants = product.variants.filter((variant) =>
      variant.variantOptionValues.some(
        (vov) => vov.productOptionValueID === optVal.productOptionValueID
      )
    );

    if (matchingVariants.length === 0) return true;

    return matchingVariants.every((variant) => variant.stock <= 0 || !variant.status);
  };

  // Initialize selected options when product is loaded
  useEffect(() => {
    if (product && product.productOptions && product.productOptions.length > 0) {
      const initial: Record<string, string> = {};
      product.productOptions.forEach((option) => {
        // Find the first option value that is in stock
        const inStockVal = option.productOptionValues.find(
          (v) => !isOptionValueOutOfStock(option.name, v.value)
        );
        if (inStockVal) {
          initial[option.name] = inStockVal.value;
        } else if (option.productOptionValues.length > 0) {
          initial[option.name] = option.productOptionValues[0].value;
        }
      });
      setSelectedOptions(initial);
    }
  }, [product]);

  const activeFlashSaleItem = useMemo(() => {
    if (!activeFlashSale || !product) return null;

    let matchedItems: FlashSaleItemResponseDto[] = [];
    
    // We need current variant here, so moved this up
    const currentVariant = product.variants?.find((variant) => {
      return Object.entries(selectedOptions).every(([optionName, optionValue]) => {
        const option = product.productOptions?.find((o) => o.name.toLowerCase() === optionName.toLowerCase());
        const optVal = option?.productOptionValues.find((v) => v.value.toLowerCase() === optionValue.toLowerCase());
        if (!optVal) return false;
        return variant.variantOptionValues.some((vov) => vov.productOptionValueID === optVal.productOptionValueID);
      });
    });

    if (currentVariant) {
      matchedItems = activeFlashSale.flashSaleItems.filter(
        (item) => item.itemType === 2 && item.referenceId === currentVariant.variantID
      );
    }
    
    if (matchedItems.length === 0) {
      matchedItems = activeFlashSale.flashSaleItems.filter(
        (item) => item.itemType === 1 && item.referenceId === product.id
      );
    }
    
    if (matchedItems.length === 0) return null;
    
    // Sort by requiredQty DESC
    matchedItems.sort((a, b) => (b.requiredQuantity || 1) - (a.requiredQuantity || 1));
    
    // Find the tier that matches the current quantity
    const tier = matchedItems.find(item => quantity >= (item.requiredQuantity || 1));
    const result = tier || matchedItems[matchedItems.length - 1];
    
    // Nếu flash sale đã hết hàng hoặc người dùng đã hết lượt mua, ẩn hoàn toàn flash sale và hiển thị sản phẩm bình thường
    if (result) {
      if (result.soldQuantity >= result.totalQuantity) {
        return null;
      }
      if (result.maxQuantityPerUser > 0 && (result.userPurchasedQuantity || 0) >= result.maxQuantityPerUser) {
        return null;
      }
    }
    
    return result;
  }, [activeFlashSale, product, selectedOptions, quantity]);

  useEffect(() => {
    if (activeFlashSaleItem?.giftVariantIds && activeFlashSaleItem.giftVariantIds.length > 0) {
      setSelectedGiftId(activeFlashSaleItem.giftVariantIds[0]);
    } else {
      setSelectedGiftId(null);
    }
  }, [activeFlashSaleItem]);

  // Find matching variant based on selected options
  const activeVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;

    return product.variants.find((variant) => {
      return Object.entries(selectedOptions).every(([optionName, optionValue]) => {
        // Find option from product options
        const option = product.productOptions?.find(
          (o) => o.name.toLowerCase() === optionName.toLowerCase()
        );
        // Find matching option value id
        const optVal = option?.productOptionValues.find(
          (v) => v.value.toLowerCase() === optionValue.toLowerCase()
        );
        if (!optVal) return false;

        // Check if variant option values has this value ID
        return variant.variantOptionValues.some(
          (vov) => vov.productOptionValueID === optVal.productOptionValueID
        );
      });
    });
  }, [product, selectedOptions]);

  // Derived Values
  const displayImage = useMemo(() => {
    if (activeVariant?.imageUrl) {
      return activeVariant.imageUrl;
    }

    if (product && product.variants && product.variants.length > 0) {
      // Try to find the color option name in selected options
      const colorOptionName = Object.keys(selectedOptions).find((name) => {
        const lower = name.toLowerCase();
        return lower.includes("màu") || lower.includes("color");
      });

      if (colorOptionName) {
        const currentColorValue = selectedOptions[colorOptionName];
        // Find option from product options to get the option value id
        const option = product.productOptions?.find(
          (o) => o.name.toLowerCase() === colorOptionName.toLowerCase()
        );
        const optVal = option?.productOptionValues.find(
          (v) => v.value.toLowerCase() === currentColorValue.toLowerCase()
        );

        if (optVal) {
          // Find any variant that has this color value and has an image
          const sameColorVariantWithImage = product.variants.find((variant) => {
            if (!variant.imageUrl) return false;
            return variant.variantOptionValues.some(
              (vov) => vov.productOptionValueID === optVal.productOptionValueID
            );
          });

          if (sameColorVariantWithImage?.imageUrl) {
            return sameColorVariantWithImage.imageUrl;
          }
        }
      }

      // If color fallback fails, look for ANY variant that has an image
      const anyVariantWithImage = product.variants.find((v) => v.imageUrl);
      if (anyVariantWithImage?.imageUrl) {
        return anyVariantWithImage.imageUrl;
      }
    }

    return product?.image || (product?.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : undefined);
  }, [activeVariant, product, selectedOptions]);

  const displayPrice = activeVariant ? activeVariant.unitPrice : product?.price || 0;
  
  const displayDiscountPrice = useMemo(() => {
    if (activeFlashSaleItem && activeFlashSale?.status === 1) {
      return activeFlashSaleItem.discountPrice;
    }
    return activeVariant 
      ? (activeVariant.effectiveDiscountPercent > 0 ? activeVariant.finalPrice : undefined)
      : product?.discountPrice;
  }, [activeFlashSaleItem, activeVariant, product, activeFlashSale]);

  const displayStock = activeVariant ? activeVariant.stock : product?.quantity ?? 0;
  const displaySku = activeVariant ? activeVariant.sku : `LP-${product?.id}`;
  const displayInStock = activeVariant ? activeVariant.stock > 0 : product?.inStock ?? false;
  const hasDiscount = !!displayDiscountPrice && displayDiscountPrice < displayPrice;

  // Maximum quantity allowed for purchase
  const maxAllowedQuantity = useMemo(() => {
    let limit = displayStock;
    if (activeFlashSaleItem) {
      const remainingSaleQty = activeFlashSaleItem.totalQuantity - activeFlashSaleItem.soldQuantity;
      limit = Math.min(limit, remainingSaleQty);
      if (activeFlashSaleItem.maxQuantityPerUser > 0) {
        const userLeft = activeFlashSaleItem.maxQuantityPerUser - (activeFlashSaleItem.userPurchasedQuantity || 0);
        limit = Math.min(limit, Math.max(0, userLeft));
      }
    }
    return Math.max(0, limit);
  }, [displayStock, activeFlashSaleItem]);

  // Handle Specifications parsing (JSON mapping)
  const parsedSpecs = useMemo(() => {
    if (!product || !product.specifications) return null;

    try {
      const cleaned = product.specifications.trim();
      if ((cleaned.startsWith("{") && cleaned.endsWith("}")) || (cleaned.startsWith("[") && cleaned.endsWith("]"))) {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => [item.key || "", item.value || ""] as [string, any]);
        }
        if (parsed && typeof parsed === "object") {
          return Object.entries(parsed);
        }
      }
    } catch (e) {
      // Not a JSON string
    }
    return null;
  }, [product]);



  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    if (quantity < maxAllowedQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleQuantityChange = (val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) {
      if (num > maxAllowedQuantity) {
        setQuantity(maxAllowedQuantity);
      } else {
        setQuantity(num);
      }
    } else if (val === "") {
      setQuantity(0); // Temporary state while typing
    }
  };

  const handleAddToCart = async () => {
    const finalQuantity = quantity === 0 ? 1 : quantity;
    const hasToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!hasToken) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      router.push("/login");
      return;
    }

    const fallbackVariantId = product?.variants?.[0]?.variantID || (product?.variants?.[0] as any)?.variantId;
    const finalVariantId = activeVariant?.variantID || (activeVariant as any)?.variantId || fallbackVariantId;

    const payload = {
        variantID: finalVariantId,
        quantity: finalQuantity,
        selectedGiftVariantId: (activeFlashSaleItem && activeFlashSaleItem.discountType === 2 && finalQuantity >= (activeFlashSaleItem.requiredQuantity || 1)) ? selectedGiftId || undefined : undefined
    };

    if (!payload.variantID) {
        toast.error("Sản phẩm này hiện chưa có phân loại bán hàng!");
        return;
    }

    try {
      setIsAddingToCart(true);
      const res = await addToCart(payload);
      if (res.success) {
        toast.success(`Đã thêm ${finalQuantity} sản phẩm vào giỏ hàng! ${activeVariant?.variantName ? `(Phân loại: ${activeVariant.variantName})` : ""}`);
        if (quantity === 0) setQuantity(1);
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

  const handleBuyNow = async () => {
    const finalQuantity = quantity === 0 ? 1 : quantity;
    const hasToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!hasToken) {
      toast.error("Vui lòng đăng nhập để tiếp tục!");
      router.push("/login");
      return;
    }

    const fallbackVariantId = product?.variants?.[0]?.variantID || (product?.variants?.[0] as any)?.variantId;
    const finalVariantId = activeVariant?.variantID || (activeVariant as any)?.variantId || fallbackVariantId;

    const payload = {
        variantID: finalVariantId,
        quantity: finalQuantity,
        selectedGiftVariantId: (activeFlashSaleItem && activeFlashSaleItem.discountType === 2 && finalQuantity >= (activeFlashSaleItem.requiredQuantity || 1)) ? selectedGiftId || undefined : undefined
    };

    if (!payload.variantID) {
        toast.error("Sản phẩm này hiện chưa có phân loại bán hàng!");
        return;
    }

    try {
      const res = await addToCart(payload);
      if (res.success) {
        router.push("/cart");
      } else {
        toast.error(res.message || "Lỗi khi thêm vào giỏ hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối mạng");
    }
  };

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
    setQuantity(1); // Reset quantity on variant change
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-20 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-[28rem] w-full">
          <p className="text-red-500 font-bold text-lg mb-4">{error || "Sản phẩm không tồn tại."}</p>
          <button
            onClick={() => router.push("/products")}
            className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold shadow hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Quay lại cửa hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-4 sm:py-6 px-0 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="px-4 sm:px-0 mt-4 sm:mt-0">
          <button
            onClick={() => router.back()}
            className="mb-4 sm:mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors bg-white px-4 py-2 rounded-[8px] border border-slate-100 shadow-sm hover:shadow active:scale-95"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>
        </div>

        {/* Product Container */}
        <div className="bg-white sm:rounded-[16px] sm:border border-slate-100 sm:shadow-sm overflow-hidden mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[42%_1fr] gap-6 lg:gap-10 p-4 sm:p-6 lg:p-8">
            <ProductImageGallery
              displayImage={displayImage}
              productName={product.name}
              hasDiscount={hasDiscount}
              displayPrice={displayPrice}
              displayDiscountPrice={displayDiscountPrice}
              imageUrls={product?.imageUrls}
              isWishlisted={isWishlisted}
              setIsWishlisted={setIsWishlisted}
              compareAction={
                <CompareButton 
                  product={product} 
                  className="h-10 w-10 rounded-[8px] flex items-center justify-center border border-slate-200 transition-all shrink-0 active:scale-90 shadow-sm" 
                />
              }
            />

            <ProductDetailInfo
              product={product}
              displayInStock={displayInStock}
              displayStock={displayStock}
              displaySku={displaySku}
              displayPrice={displayPrice}
              displayDiscountPrice={displayDiscountPrice}
              hasDiscount={hasDiscount}
              selectedOptions={selectedOptions}
              handleOptionSelect={handleOptionSelect}
              isOptionValueOutOfStock={isOptionValueOutOfStock}
              quantity={quantity}
              handleDecreaseQuantity={handleDecreaseQuantity}
              handleIncreaseQuantity={handleIncreaseQuantity}
              handleQuantityChange={handleQuantityChange}
              setQuantity={setQuantity}
              handleAddToCart={handleAddToCart}
              handleBuyNow={handleBuyNow}
              isWishlisted={isWishlisted}
              setIsWishlisted={setIsWishlisted}
              activeVariant={activeVariant}
              activeFlashSaleItem={activeFlashSaleItem}
              flashSaleEndTime={activeFlashSale?.status === 0 ? activeFlashSale?.startTime : activeFlashSale?.endTime}
              flashSaleStatus={activeFlashSale?.status}
              selectedGiftId={selectedGiftId}
              setSelectedGiftId={setSelectedGiftId}
              isAddingToCart={isAddingToCart}
            />
          </div>
        </div>

        <ProductTabs
          product={product}
          parsedSpecs={parsedSpecs}
        />

        <RelatedProducts
          relatedProducts={relatedProducts}
        />

        <ProductRecommendations limit={5} excludeProductId={productId} />
      </div>
    </div>
  );
}

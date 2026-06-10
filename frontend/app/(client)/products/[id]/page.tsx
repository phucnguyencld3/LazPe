"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Star, Minus, Plus, ShoppingCart, ShieldCheck, RotateCcw, Truck } from "lucide-react";
import { toast } from "@/lib/toast";
import { Product, Variant } from "@/types";
import { getProductDetail, getProducts } from "@/lib/api";
import { ProductImageGallery } from "@/components/client/products/ProductImageGallery";
import { ProductDetailInfo } from "@/components/client/products/ProductDetailInfo";
import { ProductTabs } from "@/components/client/products/ProductTabs";
import { RelatedProducts } from "@/components/client/products/RelatedProducts";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getCurrentFlashSale, FlashSaleResponseDto, FlashSaleItemResponseDto, FlashSaleStatus } from "@/lib/features/flash-sales/flashSaleApi";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = Number(resolvedParams.id);
  const router = useRouter();

  // Core Product State
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
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

  // Fetch product detail
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getProductDetail(productId);
        if (data) {
          setProduct(data);
          
          // Fetch related products in the same category
          const related = await getProducts(1, 4, undefined, data.categoryId);
          if (related) {
            const filtered = (related.items || []).filter((p) => p.id !== data.id);
            setRelatedProducts(filtered);
          }

          // Fetch recommended products
          const recommended = await getProducts(1, 4);
          if (recommended) {
            const filtered = (recommended.items || []).filter(
              (p) => p.id !== data.id && p.categoryId !== data.categoryId
            );
            setRecommendedProducts(filtered);
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
        const sale = await getCurrentFlashSale();
        if (sale && sale.isActive) {
          setActiveFlashSale(sale);
        }
      } catch (err) {
        console.error("Failed to load product page flash sale:", err);
      }
    };
    fetchFlashSale();
  }, []);

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

  const activeFlashSaleItem = useMemo(() => {
    if (!activeFlashSale || !product) return null;

    if (activeVariant) {
      const variantItem = activeFlashSale.flashSaleItems.find(
        (item) => item.itemType === 2 && item.referenceId === activeVariant.variantID
      );
      if (variantItem) return variantItem;
    }

    const productItem = activeFlashSale.flashSaleItems.find(
      (item) => item.itemType === 1 && item.referenceId === product.id
    );
    return productItem;
  }, [activeFlashSale, product, activeVariant]);

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

    return product?.image;
  }, [activeVariant, product, selectedOptions]);

  const displayPrice = activeVariant ? activeVariant.unitPrice : product?.price || 0;
  
  const displayDiscountPrice = useMemo(() => {
    if (activeFlashSaleItem) {
      return activeFlashSaleItem.discountPrice;
    }
    return activeVariant 
      ? (activeVariant.effectiveDiscountPercent > 0 ? activeVariant.finalPrice : undefined)
      : product?.discountPrice;
  }, [activeFlashSaleItem, activeVariant, product]);

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
        limit = Math.min(limit, activeFlashSaleItem.maxQuantityPerUser);
      }
    }
    return Math.max(0, limit);
  }, [displayStock, activeFlashSaleItem]);

  // Handle Specifications parsing (JSON mapping)
  const parsedSpecs = useMemo(() => {
    if (!product || !product.description) return null;

    try {
      const cleaned = product.description.trim();
      if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === "object") {
          return Object.entries(parsed);
        }
      }
    } catch (e) {
      // Not a JSON string
    }
    return null;
  }, [product]);

  // Fallback specifications if description is not a JSON string
  const fallbackSpecs = useMemo(() => {
    if (!product) return [] as [string, string][];
    return [
      ["Thương hiệu", "LazPe"],
      ["Mã sản phẩm", displaySku],
      ["Xuất xứ", "Việt Nam"],
      ["Chất liệu", product.categoryName?.toLowerCase().includes("gỗ") ? "Gỗ tự nhiên cao cấp, sơn nước an toàn" : "Vải Cotton 100% hữu cơ, mềm mịn, thoáng khí"],
      ["Độ tuổi phù hợp", product.categoryName?.toLowerCase().includes("gỗ") ? "Từ 2 đến 6 tuổi" : "Sơ sinh đến 3 tuổi"],
      ["Tiêu chuẩn an toàn", "Đạt chuẩn chất lượng Châu Âu EN71 & Quy chuẩn quốc gia CR"],
    ] as [string, string][];
  }, [product, displaySku]);

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

  const handleAddToCart = async () => {
    const hasToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!hasToken) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      router.push("/login");
      return;
    }

    const variantId = activeVariant?.variantID;
    if (!variantId) {
      // If there are no options, but there is at least one variant, use the first variant
      const firstVariantId = product?.variants?.[0]?.variantID;
      if (!firstVariantId) {
        toast.error("Sản phẩm này hiện chưa có phân loại bán hàng!");
        return;
      }
      
      try {
        const res = await addToCart({
          variantID: firstVariantId,
          quantity: quantity,
        });
        if (res.success) {
          toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng thành công!`);
        } else {
          toast.error(res.message || "Không thể thêm sản phẩm vào giỏ hàng");
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi kết nối mạng");
      }
      return;
    }

    try {
      const res = await addToCart({
        variantID: variantId,
        quantity: quantity,
      });
      if (res.success) {
        toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng! (Phân loại: ${activeVariant?.variantName || "Tiêu chuẩn"})`);
      } else {
        toast.error(res.message || "Không thể thêm sản phẩm vào giỏ hàng");
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
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <button
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm hover:shadow active:scale-95"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </button>

        {/* Product Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-8 lg:p-12">
            <ProductImageGallery
              displayImage={displayImage}
              productName={product.name}
              hasDiscount={hasDiscount}
              displayPrice={displayPrice}
              displayDiscountPrice={displayDiscountPrice}
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
              handleAddToCart={handleAddToCart}
              isWishlisted={isWishlisted}
              setIsWishlisted={setIsWishlisted}
              activeVariant={activeVariant}
              activeFlashSaleItem={activeFlashSaleItem}
              flashSaleEndTime={activeFlashSale?.endTime}
              flashSaleStatus={activeFlashSale?.status}
            />
          </div>
        </div>

        <ProductTabs
          product={product}
          parsedSpecs={parsedSpecs}
          fallbackSpecs={fallbackSpecs}
        />

        <RelatedProducts
          relatedProducts={relatedProducts}
          recommendedProducts={recommendedProducts}
        />
      </div>
    </div>
  );
}

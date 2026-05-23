"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Star, Minus, Plus, ShoppingCart, ShieldCheck, RotateCcw, Truck } from "lucide-react";
import { toast } from "sonner";
import { Product, Variant } from "@/types";
import { getProductDetail, getProducts, addToCart } from "@/lib/api";
import ProductCard from "@/app/components/ProductCard";

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

  // UI Interactive States
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
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
  const displayDiscountPrice = activeVariant 
    ? (activeVariant.effectiveDiscountPercent > 0 ? activeVariant.finalPrice : undefined)
    : product?.discountPrice;
  const displayStock = activeVariant ? activeVariant.stock : product?.quantity ?? 0;
  const displaySku = activeVariant ? activeVariant.sku : `LP-${product?.id}`;
  const displayInStock = activeVariant ? activeVariant.stock > 0 : product?.inStock ?? false;
  const hasDiscount = !!displayDiscountPrice && displayDiscountPrice < displayPrice;

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
    if (!product) return [];
    return [
      ["Thương hiệu", "LazPe"],
      ["Mã sản phẩm", displaySku],
      ["Xuất xứ", "Việt Nam"],
      ["Chất liệu", product.categoryName?.toLowerCase().includes("gỗ") ? "Gỗ tự nhiên cao cấp, sơn nước an toàn" : "Vải Cotton 100% hữu cơ, mềm mịn, thoáng khí"],
      ["Độ tuổi phù hợp", product.categoryName?.toLowerCase().includes("gỗ") ? "Từ 2 đến 6 tuổi" : "Sơ sinh đến 3 tuổi"],
      ["Tiêu chuẩn an toàn", "Đạt chuẩn chất lượng Châu Âu EN71 & Quy chuẩn quốc gia CR"],
    ];
  }, [product, displaySku]);

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    if (quantity < displayStock) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
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
        const res = await addToCart(token, {
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
      const res = await addToCart(token, {
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
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-md w-full">
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
            
            {/* Left: Interactive Product Image */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <span className="text-slate-400 text-sm">Không có hình ảnh</span>
                  </div>
                )}

                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm z-10">
                    Khuyến mãi -{Math.round(((displayPrice - displayDiscountPrice!) / displayPrice) * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Right: Product Details & Variant Selection */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Category & Stock Status */}
                <div className="flex justify-between items-center gap-4 mb-4">
                  <span className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {product.categoryName || "Đồ chơi cao cấp"}
                  </span>
                  {displayInStock ? (
                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Còn hàng ({displayStock} sản phẩm)
                    </span>
                  ) : (
                    <span className="text-xs text-rose-500 font-semibold">Tạm hết hàng</span>
                  )}
                </div>

                {/* Name */}
                <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
                  {product.name}
                </h1>
                
                {/* SKU Code */}
                <div className="text-xs text-slate-400 font-semibold mb-4">
                  SKU: <span className="text-slate-600">{displaySku}</span>
                </div>

                {/* Star Ratings */}
                <div className="flex items-center gap-4 mb-6">
                  {product.rating !== undefined && product.rating !== null && product.rating > 0 ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < Math.round(product.rating!) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-600 font-bold">
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                      {product.ratingCount !== undefined && product.ratingCount !== null && (
                        <span className="text-sm text-slate-400 border-l border-slate-200 pl-4">
                          {product.ratingCount} Đánh giá
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Chưa có đánh giá</span>
                  )}
                </div>

                {/* Price Display */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block mb-1">Giá bán lẻ</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-rose-600">
                        ₫{(displayDiscountPrice || displayPrice).toLocaleString("vi-VN")}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-slate-400 line-through">
                          ₫{displayPrice.toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                  {hasDiscount && (
                    <div className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 h-fit">
                      Tiết kiệm ₫{(displayPrice - displayDiscountPrice!).toLocaleString("vi-VN")}
                    </div>
                  )}
                </div>

                {/* Dynamic Variants Selectors (Text Only) */}
                {product.productOptions && product.productOptions.length > 0 && (
                  <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
                    {product.productOptions.map((option) => (
                      <div key={option.productOptionID} className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700">
                          {option.name}:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {option.productOptionValues.map((optVal) => {
                            const isSelected = selectedOptions[option.name] === optVal.value;
                            const isOutOfStock = isOptionValueOutOfStock(option.name, optVal.value);
                            return (
                              <button
                                key={optVal.productOptionValueID}
                                onClick={() => handleOptionSelect(option.name, optVal.value)}
                                disabled={isOutOfStock}
                                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                  isOutOfStock
                                    ? "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed line-through"
                                    : isSelected
                                    ? "bg-rose-50 border-primary text-primary font-bold shadow-sm"
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
              </div>

              {/* Action Section (Quantity & Add to Cart) */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Quantity Counter */}
                  <div className="flex items-center justify-between w-full sm:w-32 h-12 bg-slate-100 rounded-full px-4 border border-slate-200">
                    <button
                      onClick={handleDecreaseQuantity}
                      disabled={quantity <= 1}
                      className="text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold text-slate-800 text-sm">{quantity}</span>
                    <button
                      onClick={handleIncreaseQuantity}
                      disabled={!displayInStock || quantity >= displayStock}
                      className="text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!displayInStock}
                    className="w-full h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                  >
                    <ShoppingCart size={18} />
                    Thêm vào giỏ hàng
                  </button>

                  {/* Wishlist Toggle Button */}
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all shrink-0 active:scale-90 ${
                      isWishlisted
                        ? "bg-rose-50 border-rose-200 text-rose-500"
                        : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Heart size={20} className={isWishlisted ? "fill-rose-500" : ""} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Tabs Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-12">
          {/* Tab Headers */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 sm:px-8 py-4 flex gap-6">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === "description"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Mô tả sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("specifications")}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === "specifications"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Thông số kỹ thuật
            </button>
            <button
              onClick={() => setActiveTab("shipping")}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === "shipping"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Chính sách giao nhận
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 sm:p-8 text-slate-600 text-sm leading-relaxed min-h-[160px]">
            {activeTab === "description" && (
              <div className="whitespace-pre-line">
                {product.description && !(product.description.trim().startsWith("{") && product.description.trim().endsWith("}")) ? (
                  product.description
                ) : (
                  <div>
                    Sản phẩm cao cấp chất lượng vượt trội của hãng sản xuất được làm từ nguyên liệu cao cấp, đáp ứng hoàn toàn các tiêu chuẩn kỹ thuật nghiêm ngặt về chất lượng và độ an toàn sức khỏe. Thiết kế thông minh đem lại hiệu năng tối đa cùng độ bền lý tưởng trong suốt quá trình sử dụng.
                  </div>
                )}
              </div>
            )}

            {/* Specifications JSON parsed Table */}
            {activeTab === "specifications" && (
              <div className="max-w-2xl">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-100 rounded-lg overflow-hidden">
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(parsedSpecs || fallbackSpecs).map(([key, value]) => (
                      <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-500 bg-slate-50/50 w-1/3">
                          {key}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "shipping" && (
              <ul className="space-y-4 max-w-lg">
                <li className="flex items-start gap-3">
                  <Truck size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">Vận chuyển siêu tốc</strong>
                    <span>Giao hàng tận nơi toàn quốc từ 2 - 4 ngày làm việc. Miễn phí vận chuyển cho đơn hàng lớn.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <RotateCcw size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">Đổi trả dễ dàng</strong>
                    <span>Hỗ trợ chính sách đổi trả/hoàn tiền nhanh chóng trong vòng 7 ngày nếu có lỗi do nhà sản xuất.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">Bảo hành 12 tháng</strong>
                    <span>Bảo hành chính hãng 12 tháng liên tục. Đội ngũ chăm sóc khách hàng phản hồi trong 24h.</span>
                  </div>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              Sản phẩm tương tự
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Recommended Products Grid */}
        {recommendedProducts.length > 0 && (
          <section className="mt-16 pt-16 border-t border-slate-100">
            <h2 className="font-headline-lg text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              Đề xuất sản phẩm cho bạn
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

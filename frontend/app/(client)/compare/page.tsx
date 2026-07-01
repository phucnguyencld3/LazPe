"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Scale, Star, X, Check, Minus, Plus } from "lucide-react";
import { Product } from "@/types";
import { getProductDetail, getProducts } from "@/lib/api";
import { useCompare } from "@/context/CompareContext";
import { toast } from "sonner";
import { Suspense } from "react";

const getProductImage = (p: Product) => {
  if (p.image) return p.image;
  if (p.imageUrls && p.imageUrls.length > 0) return p.imageUrls[0];
  if (p.variants && p.variants.length > 0) {
    const variantWithImage = p.variants.find(v => v.imageUrl);
    if (variantWithImage && variantWithImage.imageUrl) return variantWithImage.imageUrl;
  }
  return "/images/placeholder.png";
};

function ComparePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { removeFromCompare, compareItems } = useCompare();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Parse IDs from query params
  const idsParam = searchParams.get("ids");
  const ids = useMemo(() => {
    if (!idsParam) return [];
    return idsParam.split(",").map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
  }, [idsParam]);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(ids.map(id => getProductDetail(id)));
        const validProducts = results.filter((p): p is Product => p !== null);
        setProducts(validProducts);
      } catch (error) {
        console.error("Error fetching products for compare:", error);
        toast.error("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [ids]);

  const handleRemove = (id: number) => {
    // Remove from Context
    removeFromCompare(id);

    // Remove from URL
    const newIds = ids.filter(i => i !== id);
    if (newIds.length > 0) {
      router.replace(`/compare?ids=${newIds.join(",")}`);
    } else {
      router.replace("/");
    }
  };

  const handleAddProductClick = async () => {
    if (products.length === 0) return;
    setShowAddModal(true);
    setLoadingSimilar(true);
    try {
      const categoryId = products[0].categoryId;
      const res = await getProducts(1, 20, "", categoryId);
      if (res && res.items) {
        // Filter out products already in comparison
        const currentIds = products.map(p => p.id);
        setSimilarProducts(res.items.filter((p: Product) => !currentIds.includes(p.id)));
      }
    } catch (e) {
      console.error("Failed to load similar products", e);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleAddSimilarProduct = (id: number) => {
    const newIds = [...ids, id];
    router.replace(`/compare?ids=${newIds.join(",")}`);
    setShowAddModal(false);
  };

  // Extract all unique specification keys
  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    products.forEach(p => {
      if (p.specifications) {
        try {
          const parsed = JSON.parse(p.specifications);
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            Object.keys(parsed).forEach(k => keys.add(k));
          } else if (Array.isArray(parsed)) {
            // Handle array format if any
            parsed.forEach(item => {
              if (item.key) keys.add(item.key);
            });
          }
        } catch (e) {
          console.error("Failed to parse specifications for product", p.id);
        }
      }
    });
    return Array.from(keys);
  }, [products]);

  // Helper to get spec value for a product
  const getSpecValue = (product: Product, key: string) => {
    if (!product.specifications) return null;
    try {
      const parsed = JSON.parse(product.specifications);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed[key];
      } else if (Array.isArray(parsed)) {
        const found = parsed.find((item: any) => item.key === key);
        return found ? found.value : null;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Đang tải dữ liệu so sánh...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] gap-4 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
          <Scale size={40} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không có sản phẩm nào để so sánh</h2>
        <p className="text-slate-500 max-w-md">Vui lòng chọn thêm sản phẩm từ trang chủ hoặc danh mục để thực hiện so sánh.</p>
        <Link href="/" className="mt-4 bg-primary text-white px-6 py-2.5 rounded-full font-bold hover:bg-primary/90 transition-colors">
          Quay lại mua sắm
        </Link>
      </div>
    );
  }

  // Determine lowest price
  const lowestPrice = Math.min(...products.map(p => p.discountPrice || p.price));

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-primary/5 transition-colors shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">So sánh sản phẩm</h1>
          <p className="text-slate-500 text-sm mt-1">Đối chiếu chi tiết {products.length} sản phẩm</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100" style={{ overflowAnchor: 'none' }}>
        <table className="w-full text-left border-collapse min-w-[800px]">
          {/* Table Header: Products */}
          <thead className="sticky z-40 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.1)] bg-white" style={{ top: '80px' }}>
            <tr>
              <th className="border-b border-slate-100 bg-slate-50 w-1/4 align-middle p-3 align-top">
                <div className="text-[13px] text-slate-500 font-medium">Sản phẩm so sánh</div>
              </th>
              {products.map(product => (
                <th key={product.id} className="border-b border-l border-slate-100 bg-white w-1/4 align-middle relative group p-3 align-top">
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="absolute right-2 bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-500 rounded-full flex items-center justify-center z-10 top-2 w-7 h-7"
                    title="Xoá khỏi so sánh"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex items-start gap-3 text-left w-full pr-4">
                    <Link href={`/products/${product.slug || product.id}`} className="shrink-0 block">
                      <div className="w-16 h-16 rounded-[8px] bg-slate-50 flex items-center justify-center p-2 border border-slate-100 group-hover:border-primary/30 transition-colors">
                        <img 
                          src={product.image || product.imageUrls?.[0] || "/assets/img/products/default-product.jpg"} 
                          alt={product.name} 
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                    </Link>

                    <div className="flex flex-col flex-1 min-w-0">
                      <Link href={`/products/${product.slug || product.id}`} className="block">
                        <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-0.5 truncate">
                          {product.categoryName}
                        </div>
                        <h3 className="font-bold text-slate-900 leading-snug group-hover:text-primary text-[12px] sm:text-[13px] line-clamp-2 mb-1">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex flex-col mt-auto">
                        <div className={`font-black ${(product.discountPrice || product.price) === lowestPrice ? "text-green-600" : "text-rose-600"} text-sm sm:text-base`}>
                          {(product.discountPrice || product.price).toLocaleString("vi-VN")} ₫
                        </div>
                        {product.discountPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {product.price.toLocaleString("vi-VN")} ₫
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </th>
              ))}
              {/* Empty column if < 3 products */}
              {products.length < 3 && Array.from({ length: 3 - products.length }).map((_, i) => (
                <th key={`empty-${i}`} className="border-b border-l border-slate-100 bg-slate-50 w-1/4 align-middle text-center p-3">
                  <button
                    onClick={handleAddProductClick}
                    className="w-full h-full flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 mx-auto w-12 h-12 mb-2">
                      <Plus size={20} />
                    </div>
                    <div className="overflow-hidden flex flex-col h-auto opacity-100 mt-2">
                      <span className="text-[13px] text-slate-400 font-medium hover:text-primary">Thêm sản phẩm</span>
                    </div>
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Rating Row */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-2 sm:px-3 border-b border-slate-100 font-bold text-slate-700 bg-slate-50/50 text-[13px]">Đánh giá</td>
              {products.map(product => (
                <td key={`rating-${product.id}`} className="p-2 sm:px-3 border-b border-l border-slate-100">
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-400">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700">{product.rating?.toFixed(1) || "0.0"}</span>
                    <span className="text-[11px] text-slate-400">({product.ratingCount || 0})</span>
                  </div>
                </td>
              ))}
              {products.length < 3 && Array.from({ length: 3 - products.length }).map((_, i) => (
                <td key={`empty-rating-${i}`} className="border-b border-l border-slate-100 bg-slate-50/30"></td>
              ))}
            </tr>

            {/* In Stock Row */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-2 sm:px-3 border-b border-slate-100 font-bold text-slate-700 bg-slate-50/50 text-[13px]">Tình trạng</td>
              {products.map(product => (
                <td key={`stock-${product.id}`} className="p-2 sm:px-3 border-b border-l border-slate-100">
                  {product.inStock ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      <Check size={12} /> Còn hàng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                      <Minus size={12} /> Hết hàng
                    </span>
                  )}
                </td>
              ))}
              {products.length < 3 && Array.from({ length: 3 - products.length }).map((_, i) => (
                <td key={`empty-stock-${i}`} className="border-b border-l border-slate-100 bg-slate-50/30"></td>
              ))}
            </tr>

            {/* Specifications Rows */}
            {allSpecKeys.length > 0 && (
              <tr>
                <td colSpan={4} className="p-2 sm:px-3 bg-slate-100/80 font-bold text-slate-900 border-b border-slate-200 text-sm">
                  Chi tiết thông số
                </td>
              </tr>
            )}

            {allSpecKeys.map((key, index) => (
              <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-1.5 px-3 border-b border-slate-100 font-semibold text-slate-600 bg-slate-50/50 text-[13px]">
                  {key}
                </td>
                {products.map(product => {
                  const value = getSpecValue(product, key);
                  return (
                    <td key={`${key}-${product.id}`} className="py-1.5 px-3 border-b border-l border-slate-100 text-[13px] text-slate-700 leading-relaxed">
                      {value ? (
                        typeof value === "object" ? JSON.stringify(value) : String(value)
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  );
                })}
                {products.length < 3 && Array.from({ length: 3 - products.length }).map((_, i) => (
                  <td key={`empty-${key}-${i}`} className="border-b border-l border-slate-100 bg-slate-50/30"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Thêm sản phẩm cùng danh mục</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {loadingSimilar ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-sm">Đang tìm sản phẩm...</p>
                </div>
              ) : similarProducts.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  Không tìm thấy sản phẩm nào khác trong cùng danh mục.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {similarProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:border-primary/30 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleAddSimilarProduct(p.id)}>
                      <div className="relative w-16 h-16 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                        <Image src={getProductImage(p)} alt={p.name} fill className="object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug">{p.name}</h4>
                        <div className="text-rose-600 font-bold text-sm mt-1">
                          {(p.discountPrice || p.price).toLocaleString("vi-VN")} ₫
                        </div>
                      </div>
                      <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 hover:bg-primary hover:text-white transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Đang tải dữ liệu so sánh...</p>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}

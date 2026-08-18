"use client";

import React, { useEffect, useState } from "react";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/types";

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductSelectModal({ isOpen, onClose, onSelectProduct }: ProductSelectModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("CreatedAt");
  const [sortDirection, setSortDirection] = useState<string>("desc");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Load Categories on mount or open
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Load Products when filters/page change
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, page, searchTerm, selectedCategoryId, sortBy, sortDirection]);

  const loadCategories = async () => {
    try {
      const catData = await getCategories();
      if (catData) {
        setCategories(catData);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh mục:", err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts(
        page,
        8, // 8 items per page in modal
        searchTerm,
        selectedCategoryId,
        sortBy,
        sortDirection
      );

      if (res) {
        setProducts(res.items || []);
        setTotalPages(res.totalPages || 1);
        setTotalItems(res.totalItems || 0);
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách sản phẩm:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1 on search
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    setSelectedCategoryId(val);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "price_asc") {
      setSortBy("Price");
      setSortDirection("asc");
    } else if (val === "price_desc") {
      setSortBy("Price");
      setSortDirection("desc");
    } else {
      setSortBy("CreatedAt");
      setSortDirection("desc");
    }
    setPage(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[5px] w-[95vw] max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              Chọn sản phẩm tạo Link Tiếp thị
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Tìm và chọn sản phẩm để tạo link giới thiệu duy nhất cho bạn</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200/70 rounded-[5px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-[5px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategoryId ?? ""}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-[5px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white text-slate-700"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              onChange={handleSortChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-[5px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white text-slate-700"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* Product List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[50vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-2">progress_activity</span>
              <p className="text-sm">Đang tải danh sách sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
              <p className="text-sm font-medium">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Thử điều chỉnh từ khóa hoặc bộ lọc danh mục xem sao nhé.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((product) => {
                const displayPrice = product.discountPrice ?? product.minEffectivePrice ?? product.price;
                const originalPrice = product.price;
                const hasDiscount = product.discountPrice && product.discountPrice < product.price;

                return (
                  <div
                    key={product.id}
                    className="flex gap-3 p-3 rounded-[5px] border border-slate-100 bg-slate-50/50 hover:bg-orange-50/40 hover:border-orange-200 transition-all group cursor-pointer"
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                  >
                    <img
                      src={product.image && product.image.trim() !== "" ? product.image : "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&auto=format&fit=crop&q=80"}
                      alt={product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&auto=format&fit=crop&q=80";
                      }}
                      className="w-16 h-16 rounded-[5px] object-cover bg-white border border-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider line-clamp-1">
                            {product.categoryName ? product.categoryName : "Sản phẩm LazPe"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-primary">
                            {displayPrice.toLocaleString("vi-VN")}đ
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {originalPrice.toLocaleString("vi-VN")}đ
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold py-1 px-2.5 rounded-[5px] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">add_link</span>
                          Chọn
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Hiển thị tổng cộng <strong className="text-slate-700">{totalItems}</strong> sản phẩm
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-[5px] text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Trang trước
            </button>
            <span className="text-xs font-medium text-slate-600 px-1">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-[8px] text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

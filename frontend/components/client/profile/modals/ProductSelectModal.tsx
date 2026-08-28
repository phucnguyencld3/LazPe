"use client";

import React, { useEffect, useState } from "react";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/types";

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProducts: (products: Product[]) => void;
  existingProductIds?: number[];
}

export function ProductSelectModal({ 
  isOpen, 
  onClose, 
  onSelectProducts, 
  existingProductIds = [] 
}: ProductSelectModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Multi-select state
  const [selectedProducts, setSelectedProducts] = useState<Map<number, Product>>(new Map());

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("CreatedAt");
  const [sortDirection, setSortDirection] = useState<string>("desc");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Reset multi-select on modal open
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setSelectedProducts(new Map());
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
        8,
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

  const toggleSelectProduct = (product: Product) => {
    if (existingProductIds.includes(product.id)) return;

    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(product.id)) {
        newMap.delete(product.id);
      } else {
        newMap.set(product.id, product);
      }
      return newMap;
    });
  };

  const toggleSelectAllCurrentPage = () => {
    const selectableProducts = products.filter((p) => !existingProductIds.includes(p.id));
    if (selectableProducts.length === 0) return;

    const allSelectableSelected = selectableProducts.every((p) => selectedProducts.has(p.id));
    
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      if (allSelectableSelected) {
        selectableProducts.forEach((p) => newMap.delete(p.id));
      } else {
        selectableProducts.forEach((p) => newMap.set(p.id, p));
      }
      return newMap;
    });
  };

  const handleConfirmSubmit = () => {
    const selectedList = Array.from(selectedProducts.values());
    if (selectedList.length > 0) {
      onSelectProducts(selectedList);
      onClose();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
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

  const selectableProducts = products.filter((p) => !existingProductIds.includes(p.id));
  const isAllCurrentPageSelected = selectableProducts.length > 0 && selectableProducts.every((p) => selectedProducts.has(p.id));
  const selectedCount = selectedProducts.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[20px] w-[95vw] max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              Chọn sản phẩm tạo Link Tiếp thị hàng loạt
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Các sản phẩm đã tạo link sẽ hiển thị trạng thái "Đã tạo link" và không thể chọn lại</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Filter Controls & Select All Header Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Box */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-[10px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <select
                value={selectedCategoryId ?? ""}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-[10px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white text-slate-700"
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
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-[10px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all bg-white text-slate-700"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {/* Quick Select All Toggle Bar */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <label className={`flex items-center gap-2 text-slate-700 font-semibold select-none ${
              selectableProducts.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            }`}>
              <input
                type="checkbox"
                checked={isAllCurrentPageSelected}
                onChange={toggleSelectAllCurrentPage}
                disabled={selectableProducts.length === 0}
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
              />
              <span>Chọn tất cả sản phẩm khả dụng trang này</span>
            </label>

            <span className="text-slate-500 font-medium">
              Đã chọn: <strong className="text-primary font-bold">{selectedCount}</strong> sản phẩm
            </span>
          </div>
        </div>

        {/* Product List Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[48vh]">
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
                const isAlreadyCreated = existingProductIds.includes(product.id);
                const isSelected = selectedProducts.has(product.id);

                return (
                  <div
                    key={product.id}
                    onClick={() => toggleSelectProduct(product)}
                    className={`flex gap-3 p-3 rounded-[12px] border transition-all select-none relative ${
                      isAlreadyCreated
                        ? "bg-slate-100/60 border-slate-200 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-primary/5 border-primary shadow-sm cursor-pointer"
                        : "bg-slate-50/50 border-slate-100 hover:bg-slate-100/60 hover:border-slate-200 cursor-pointer"
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        disabled={isAlreadyCreated}
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary disabled:cursor-not-allowed"
                      />
                    </div>

                    <img
                      src={product.image || "/placeholder.png"}
                      alt={product.name}
                      className="w-16 h-16 rounded-[8px] object-contain p-0.5 bg-white border border-slate-100 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider line-clamp-1">
                          {product.categoryName ? product.categoryName : "Sản phẩm LazPe"}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                          {product.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-bold text-primary">
                            {displayPrice.toLocaleString("vi-VN")}đ
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {originalPrice.toLocaleString("vi-VN")}đ
                            </span>
                          )}
                        </div>

                        {isAlreadyCreated ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-[6px]">
                            Đã tạo link
                          </span>
                        ) : (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[6px] transition-colors ${
                            isSelected ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                          }`}>
                            {isSelected ? "Đã chọn" : "Chọn"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer / Pagination & Confirm Batch Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-[8px] text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trang trước
            </button>
            <span className="text-xs font-medium text-slate-600 px-1">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-[8px] text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trang sau
            </button>
          </div>

          {/* Confirm submit button */}
          <button
            onClick={handleConfirmSubmit}
            disabled={selectedCount === 0}
            className={`w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-[8px] flex items-center justify-center gap-2 transition-all shadow-sm ${
              selectedCount > 0
                ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_link</span>
            Tạo link cho {selectedCount} sản phẩm đã chọn
          </button>
        </div>

      </div>
    </div>
  );
}

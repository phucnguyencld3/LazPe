"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";
import FilterSidebar from "@/app/components/FilterSidebar";
import { Product, Category } from "@/types";
import { getProducts, getCategories } from "@/lib/api";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parameters
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("categoryId") 
    ? Number(searchParams.get("categoryId")) 
    : searchParams.get("category")
    ? Number(searchParams.get("category"))
    : null;
  const sortParam = searchParams.get("sort");
  let initialSort = searchParams.get("sortBy") || "CreatedAt";
  let initialDir = searchParams.get("sortDirection") || "desc";

  if (sortParam === "newest") {
    initialSort = "CreatedAt";
    initialDir = "desc";
  } else if (sortParam === "bestseller") {
    initialSort = "Rating";
    initialDir = "desc";
  }

  const initialPage = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCategory);
  const [maxPrice, setMaxPrice] = useState<number>(2000000);
  
  // Sort and Page State
  const [sortBy, setSortBy] = useState(initialSort);
  const [sortDirection, setSortDirection] = useState(initialDir);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Mobile Filter Drawer Toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch Categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        if (data) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };
    loadCategories();
  }, []);

  // Fetch Products when query params change
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getProducts(
          currentPage,
          15, // pageSize
          activeSearch,
          selectedCategory || undefined,
          sortBy,
          sortDirection
        );

        if (result) {
          setProducts(result.items || []);
          setTotalPages(result.totalPages || 1);
          setTotalItems(result.totalItems || 0);
        } else {
          setError("Tải danh sách sản phẩm thất bại.");
        }
      } catch (err) {
        setError("Có lỗi xảy ra khi tải sản phẩm.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, activeSearch, selectedCategory, sortBy, sortDirection]);

  // Sync state back to URL for shareability
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeSearch) params.set("search", activeSearch);
    if (selectedCategory !== null) params.set("category", selectedCategory.toString());
    if (sortBy !== "CreatedAt") params.set("sortBy", sortBy);
    if (sortDirection !== "desc") params.set("sortDirection", sortDirection);
    if (currentPage !== 1) params.set("page", currentPage.toString());
    
    // Preserve the sort parameter in the URL if it's there
    if (sortParam) params.set("sort", sortParam);
    
    const newUrl = params.toString() ? `/products?${params.toString()}` : "/products";
    window.history.pushState({}, "", newUrl);
  }, [activeSearch, selectedCategory, sortBy, sortDirection, currentPage, sortParam]);

  // Listen to searchParams changes to update states when navigation tabs change
  useEffect(() => {
    const search = searchParams.get("search") || "";
    const category = searchParams.get("categoryId") 
      ? Number(searchParams.get("categoryId")) 
      : searchParams.get("category")
      ? Number(searchParams.get("category"))
      : null;
    const sort = searchParams.get("sort");
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

    let sBy = searchParams.get("sortBy") || "CreatedAt";
    let sDir = searchParams.get("sortDirection") || "desc";

    if (sort === "newest") {
      sBy = "CreatedAt";
      sDir = "desc";
    } else if (sort === "bestseller") {
      sBy = "Rating";
      sDir = "desc";
    }

    setSearchInput(search);
    setActiveSearch(search);
    setSelectedCategory(category);
    setSortBy(sBy);
    setSortDirection(sDir);
    setCurrentPage(page);
  }, [searchParams]);

  // Client-side filtering for Price and Sale
  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      // Price filter
      const price = product.discountPrice || product.price;
      if (price > maxPrice) return false;

      // Sale filter: only show items with a discount price less than original price
      if (sortParam === "sale") {
        if (!product.discountPrice || product.discountPrice >= product.price) {
          return false;
        }
      }

      return true;
    });
  }, [products, maxPrice, sortParam]);

  // Handler for search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    setActiveSearch("");
    setSelectedCategory(null);
    setMaxPrice(2000000);
    setSortBy("CreatedAt");
    setSortDirection("desc");
    setCurrentPage(1);
  };

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCurrentPage(1);
    if (val === "newest") {
      setSortBy("CreatedAt");
      setSortDirection("desc");
    } else if (val === "price_asc") {
      setSortBy("Price");
      setSortDirection("asc");
    } else if (val === "price_desc") {
      setSortBy("Price");
      setSortDirection("desc");
    } else if (val === "popular") {
      setSortBy("Rating");
      setSortDirection("desc");
    }
  };

  const currentSortValue = () => {
    if (sortBy === "Price" && sortDirection === "asc") return "price_asc";
    if (sortBy === "Price" && sortDirection === "desc") return "price_desc";
    if (sortBy === "Rating") return "popular";
    return "newest";
  };

  let pageTitle = "Tất cả sản phẩm";
  let pageSubtitle = "Khám phá bộ sưu tập đồ chơi gỗ cao cấp, quần áo cotton mềm mại và những món quà tuyệt vời dành riêng cho thiên thần nhỏ của bạn tại LazPe.";

  if (sortParam === "bestseller") {
    pageTitle = "Sản phẩm bán chạy nhất";
    pageSubtitle = "Khám phá những món đồ được các mẹ và bé yêu thích nhất tại LazPe. Chất lượng cao cấp, thiết kế an toàn và đầy màu sắc cho tuổi thơ rực rỡ.";
  } else if (sortParam === "newest") {
    pageTitle = "Sản phẩm mới nhất";
    pageSubtitle = "Cập nhật những mẫu đồ chơi gỗ thông minh và trang phục cotton mới nhất cho bé yêu tại LazPe.";
  } else if (sortParam === "sale") {
    pageTitle = "Sản phẩm khuyến mãi";
    pageSubtitle = "Sở hữu những sản phẩm cao cấp cho bé với mức giá ưu đãi cực sốc chỉ có tại LazPe.";
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-[#ffd9de]/30 via-white to-white border-b border-slate-100 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="font-headline-lg text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            {pageTitle}
          </h1>
          <p className="max-w-2xl mx-auto font-body-lg text-base md:text-lg text-slate-600 leading-relaxed">
            {pageSubtitle}
          </p>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Desktop Filter Sidebar (hidden on mobile) */}
          <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-fit sticky top-24">
            <FilterSidebar
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              handleSearchSubmit={handleSearchSubmit}
              selectedCategory={selectedCategory}
              handleCategorySelect={handleCategorySelect}
              categories={categories}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              handleClearFilters={handleClearFilters}
            />
          </aside>

          {/* Product Grid and Controls */}
          <div className="flex-1">
            
            {/* Control Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              
              {/* Product Counter */}
              <div className="text-sm text-slate-600 font-medium flex items-center gap-2">
                <span>Hiển thị:</span>
                <span className="text-slate-900 font-bold">
                  {filteredProducts.length}
                </span>
                <span>/ {totalItems} sản phẩm</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Mobile Filter Toggle Button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden h-10 px-4 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  Bộ lọc
                </button>

                {/* Sắp xếp */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sắp xếp:</span>
                  <select
                    value={currentSortValue()}
                    onChange={handleSortChange}
                    className="bg-transparent border-none text-sm text-slate-700 font-bold focus:ring-0 cursor-pointer py-1 pl-2 pr-8"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="price_asc">Giá tăng dần</option>
                    <option value="price_desc">Giá giảm dần</option>
                    <option value="popular">Phổ biến nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error or Loading State */}
            {loading ? (
              <div className="flex flex-col justify-center items-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Đang tải danh sách sản phẩm...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-red-500 font-semibold mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-primary text-white rounded-full font-medium shadow hover:brightness-110 active:scale-95 transition-all"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-slate-500 font-medium mb-4">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-primary text-white rounded-full font-medium shadow hover:brightness-110 active:scale-95 transition-all"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                          currentPage === pageNumber
                            ? "bg-primary text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer (overlay on mobile when active) */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay backdrop */}
          <div
            onClick={() => setShowMobileFilters(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          ></div>
          
          {/* Drawer sheet */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Bộ lọc tìm kiếm</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <FilterSidebar
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              handleSearchSubmit={handleSearchSubmit}
              selectedCategory={selectedCategory}
              handleCategorySelect={handleCategorySelect}
              categories={categories}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              handleClearFilters={handleClearFilters}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
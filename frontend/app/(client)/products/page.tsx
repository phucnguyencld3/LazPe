"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { HorizontalFilterBar } from "@/components/client/products/HorizontalFilterBar";
import { TopRandomBanner } from "@/components/client/products/TopRandomBanner";
import { Product, Category } from "@/types";
import { getProducts, getCategories } from "@/lib/api";
import { ProductsHero } from "@/components/client/products/ProductsHero";
import { ProductControlBar } from "@/components/client/products/ProductControlBar";
import { ProductGrid } from "@/components/client/products/ProductGrid";
import { ProductPagination } from "@/components/client/products/ProductPagination";

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

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCategory);
  const [maxPrice, setMaxPrice] = useState<number>(2000000);

  // Quick Filters State
  const [filter4Star, setFilter4Star] = useState(false);
  const [filterSale, setFilterSale] = useState(false);

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
        // If it's the first time loading and the URL says we are on page > 1, 
        // fetch all items from page 1 to the current page to preserve the loaded state.
        const isInitialLoadPaginated = products.length === 0 && currentPage > 1;
        const fetchPage = isInitialLoadPaginated ? 1 : currentPage;
        const fetchSize = isInitialLoadPaginated ? currentPage * 15 : 15;

        const result = await getProducts(
          fetchPage,
          fetchSize,
          activeSearch,
          selectedCategory || undefined,
          sortBy,
          sortDirection,
          filterSale // Pass filterSale to backend so it fetches only discounted items
        );

        if (result) {
          if (currentPage === 1 || isInitialLoadPaginated) {
            setProducts(result.items || []);
          } else {
            setProducts(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = (result.items || []).filter((p: Product) => !existingIds.has(p.id));
              return [...prev, ...newItems];
            });
          }
          // Always calculate totalPages based on standard pageSize = 15
          const calculatedTotalPages = Math.ceil((result.totalItems || 0) / 15);
          setTotalPages(calculatedTotalPages || 1);
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
  }, [currentPage, activeSearch, selectedCategory, sortBy, sortDirection, filterSale]);

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
    const list = products.filter((product) => {
      // Price filter
      const price = product.discountPrice || product.price;
      if (price > maxPrice) return false;

      // Quick Filters logic
      if (filter4Star && (product.rating === undefined || product.rating < 4)) {
        return false;
      }

      // We still keep client-side filtering for extra safety and for sortParam === "sale"
      if (filterSale || sortParam === "sale") {
        const hasVariants = product.variantCount !== undefined && product.variantCount > 0;
        const isDiscounted = hasVariants 
          ? ((product.minPrice !== undefined && product.minEffectivePrice !== undefined && product.minEffectivePrice < product.minPrice) || 
             (product.maxPrice !== undefined && product.maxEffectivePrice !== undefined && product.maxEffectivePrice < product.maxPrice) || 
             (product.discountPercent !== undefined && product.discountPercent > 0))
          : ((product.discountPrice !== undefined && product.discountPrice < product.price) || (product.discountPercent !== undefined && product.discountPercent > 0));
          
        if (!isDiscounted) {
          return false;
        }
      }

      return true;
    });

    // Sắp xếp đưa các sản phẩm hết hàng (inStock = false) xuống cuối danh sách
    return [...list].sort((a, b) => {
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;
      return 0;
    });
    // filteredProducts depends on quick filters too
  }, [products, maxPrice, sortParam, filter4Star, filterSale]);

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
    setFilter4Star(false);
    setFilterSale(false);
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

  const currentCategoryName = useMemo(() => {
    if (selectedCategory === null) return undefined;
    const cat = categories.find(c => c.id === selectedCategory);
    return cat ? cat.name : undefined;
  }, [categories, selectedCategory]);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-6">
        <div className="flex flex-col gap-4">

          {/* Hero & Banner Wrapper */}
          <div className="bg-white rounded-[10px] shadow-sm border border-slate-100 overflow-hidden">
            <ProductsHero sortParam={sortParam} categoryName={currentCategoryName} />
            
            {/* Top Random Banner */}
            {!loading && !error && products.length > 0 && (
              <TopRandomBanner products={products} />
            )}
          </div>

          {/* Filter and Control Bar Wrapper */}
          <div className="bg-white rounded-[10px] shadow-sm border border-slate-100">
            <HorizontalFilterBar
              categories={categories}
              selectedCategory={selectedCategory}
              handleCategorySelect={handleCategorySelect}
              filter4Star={filter4Star}
              setFilter4Star={(val) => { setFilter4Star(val); setCurrentPage(1); }}
              filterSale={filterSale}
              setFilterSale={(val) => { setFilterSale(val); setCurrentPage(1); }}
            />

            <hr className="border-slate-100 mx-4 sm:mx-5" />

            <ProductControlBar
              totalFiltered={filteredProducts.length}
              totalItems={totalItems}
              setShowMobileFilters={setShowMobileFilters}
              sortBy={sortBy}
              sortDirection={sortDirection}
              handleSortChange={handleSortChange}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1 w-full min-w-0">

            <ProductGrid
              loading={loading}
              error={error}
              filteredProducts={filteredProducts}
              handleClearFilters={handleClearFilters}
              handleRetry={() => window.location.reload()}
            />

            {!loading && !error && filteredProducts.length > 0 && currentPage < totalPages && (
              <div className="flex justify-center mt-6 mb-8">
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="border-2 border-primary text-primary font-bold py-2 px-12 rounded-[8px] hover:bg-primary/5 transition-colors"
                >
                  Xem thêm
                </button>
              </div>
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
          <div className="relative ml-auto w-full max-w-[20rem] bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Bộ lọc tìm kiếm</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Removed FilterSidebar from Mobile view as the HorizontalFilterBar is responsive */}
            <p className="text-slate-500 mb-4">Các bộ lọc đã được hiển thị trên thanh điều hướng ngang.</p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="font-headline-md text-lg font-bold text-slate-800 mb-4">Khoảng giá tối đa</h3>
              <input
                type="range"
                min="100000"
                max="2000000"
                step="50000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-slate-200 rounded-full cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
                <span>100.000đ</span>
                <span className="text-primary font-bold text-sm">
                  {maxPrice.toLocaleString("vi-VN")}đ
                </span>
                <span>2.000.000đ+</span>
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={() => {
                handleClearFilters();
                setShowMobileFilters(false);
              }}
              className="mt-8 w-full h-11 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Đặt lại bộ lọc
            </button>
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
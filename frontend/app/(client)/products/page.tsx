"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import FilterSidebar from "@/components/client/products/FilterSidebar";
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
    const list = products.filter((product) => {
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

    // Sắp xếp đưa các sản phẩm hết hàng (inStock = false) xuống cuối danh sách
    return [...list].sort((a, b) => {
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;
      return 0;
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

  return (
    <div className="bg-slate-50 min-h-screen">
      <ProductsHero sortParam={sortParam} />

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
            <ProductControlBar
              totalFiltered={filteredProducts.length}
              totalItems={totalItems}
              setShowMobileFilters={setShowMobileFilters}
              sortBy={sortBy}
              sortDirection={sortDirection}
              handleSortChange={handleSortChange}
            />

            <ProductGrid
              loading={loading}
              error={error}
              filteredProducts={filteredProducts}
              handleClearFilters={handleClearFilters}
              handleRetry={() => window.location.reload()}
            />

            {!loading && !error && filteredProducts.length > 0 && (
              <ProductPagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
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
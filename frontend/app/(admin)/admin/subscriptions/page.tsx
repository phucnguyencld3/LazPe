"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  AdminProductInfo,
  CategorySelectOption,
  fetchAdminProducts,
  fetchCategoriesForSelect,
  toggleProductSubscription,
  fetchSubscriptionStats,
  SubscriptionStats,
  bulkToggleSubscription
} from "@/lib/features/products/productApi";
import { Pagination } from "@/components/admin/shared/Pagination";
import { formatCurrency } from "@/lib/utils/formatters";

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data states
  const [products, setProducts] = useState<AdminProductInfo[]>([]);
  const [categories, setCategories] = useState<CategorySelectOption[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Filter/Pagination states
  const [currentPage, setCurrentPage] = useState(() => {
    const p = searchParams.get("page");
    return p ? Math.max(1, parseInt(p)) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10; // As requested
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubscriptionStatus, setSelectedSubscriptionStatus] = useState<string>("all"); // all, active, inactive
  
  const [loading, setLoading] = useState(true);

  // Load select list categories once
  const loadInitialData = async (token: string) => {
    try {
      const [catsData, statsData] = await Promise.all([
        fetchCategoriesForSelect(token),
        fetchSubscriptionStats(token)
      ]);
      setCategories(catsData);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading categories", err);
    }
  };

  // Load products list based on filters/pagination
  const loadProducts = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);

      const paginationData = await fetchAdminProducts(
        token,
        currentPage,
        itemsPerPage,
        searchTerm,
        selectedCategory,
        null // statusParam
      );

      let fetchedProducts = paginationData.products;

      // Filter by subscription status
      if (selectedSubscriptionStatus === "active") {
        fetchedProducts = fetchedProducts.filter(p => p.supportsSubscription === true);
      } else if (selectedSubscriptionStatus === "inactive") {
        fetchedProducts = fetchedProducts.filter(p => p.supportsSubscription !== true);
      }

      setProducts(fetchedProducts);
      setTotalPages(paginationData.totalPages);
      setTotalItems(paginationData.totalItems);
      setSelectedIds([]); // Clear selection on page/filter change
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      loadInitialData(token);
    }
  }, []);

  // Run when filters/page changes
  useEffect(() => {
    loadProducts();
  }, [currentPage, searchTerm, selectedCategory, selectedSubscriptionStatus]);

  // Handle subscription status toggle
  const handleToggleSubscription = async (id: number) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      
      const res = await toggleProductSubscription(token, id);
      if (res.success) {
        toast.success(res.message || "Đã cập nhật tính năng mua định kỳ.");
        loadProducts();
        fetchSubscriptionStats(token).then(setStats);
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật trạng thái sản phẩm.");
    }
  };

  // Handle bulk subscription toggle
  const handleBulkToggle = async (isEnabled: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      
      const res = await bulkToggleSubscription(token, selectedIds, isEnabled);
      if (res.success) {
        toast.success(res.message || "Đã cập nhật tính năng mua định kỳ hàng loạt.");
        setSelectedIds([]);
        loadProducts();
        fetchSubscriptionStats(token).then(setStats);
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái hàng loạt.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật trạng thái nhiều sản phẩm.");
    }
  };

  const isAllSelected = products.length > 0 && products.every(p => selectedIds.includes(p.productID));
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(selectedIds.filter(id => !products.some(p => p.productID === id)));
    } else {
      const newIds = [...selectedIds];
      products.forEach(p => {
        if (!newIds.includes(p.productID)) newIds.push(p.productID);
      });
      setSelectedIds(newIds);
    }
  };

  const handleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <main className="w-full pb-20 p-6 md:p-8">
      {/* Title Header Section */}
      <header className="mb-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Quản lý Mua định kỳ</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">Thiết lập tính năng mua hàng tự động theo chu kỳ (Auto-Replenishment) cho các sản phẩm</p>
        </div>
      </header>

      {/* Master Card container */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8 animate-in fade-in duration-300">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100">
          <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">inventory</span>
              </div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng sản phẩm</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-800">{stats?.totalProducts ?? "..."}</span>
          </div>

          <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">autorenew</span>
              </div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang bật (Active)</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-800">{stats?.activeSubscriptions ?? "..."}</span>
          </div>

          <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <span className="material-symbols-outlined text-[20px]">block</span>
              </div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang tắt (Inactive)</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-800">{stats?.inactiveSubscriptions ?? "..."}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
          {/* Search box */}
          <div className="flex-1 min-w-[260px] relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Tìm theo tên hoặc mã sản phẩm..."
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory || ""}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCategory(val ? Number(val) : null);
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[180px] cursor-pointer"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.categoryID} value={cat.categoryID}>
                {cat.categoryName}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedSubscriptionStatus}
            onChange={(e) => {
              setSelectedSubscriptionStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
          >
            <option value="all">Trạng thái mua định kỳ</option>
            <option value="active">Đã bật</option>
            <option value="inactive">Đã tắt</option>
          </select>

          {/* Reset Filters button */}
          {(searchTerm || selectedCategory !== null || selectedSubscriptionStatus !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory(null);
                setSelectedSubscriptionStatus("all");
                setCurrentPage(1);
              }}
              className="px-6 py-3 text-slate-500 font-bold text-sm rounded-[8px] hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">clear</span>
              Xóa bộ lọc
            </button>
          )}

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <span className="text-sm font-bold text-slate-500 mr-2">Đã chọn {selectedIds.length}</span>
              <button
                onClick={() => handleBulkToggle(true)}
                className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold text-sm rounded-[8px] hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">toggle_on</span>
                Bật định kỳ
              </button>
              <button
                onClick={() => handleBulkToggle(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-sm rounded-[8px] hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">toggle_off</span>
                Tắt định kỳ
              </button>
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="px-2 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">STT</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Giá bán</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest min-w-[340px]">Thiết lập Mua định kỳ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-slate-400 mt-4 font-semibold text-sm">Đang tải dữ liệu sản phẩm...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">autorenew</span>
                    <p className="text-slate-400 font-bold text-sm">Không tìm thấy sản phẩm nào.</p>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const stt = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={product.productID} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.productID)}
                          onChange={() => handleSelectRow(product.productID)}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-5 text-center">
                        <span className="font-bold text-slate-400 text-sm">{stt}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-[8px] overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 flex items-center justify-center">
                            {product.imageUrl && product.imageUrl.trim() !== "" ? (
                              <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-2xl">inventory_2</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-primary transition-colors duration-200">
                              {product.productName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                SKU: {product.code || "N/A"}
                              </span>
                              <span className="h-3 w-px bg-slate-200"></span>
                              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                                {product.categoryName || "Khác"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-800 text-sm">
                          {product.variantCount > 0 && product.minPrice !== product.maxPrice
                            ? `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`
                            : formatCurrency(product.variantCount > 0 && product.minPrice > 0 ? product.minPrice : product.price)}
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        <div className={`flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${product.supportsSubscription ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full flex-shrink-0 transition-colors ${product.supportsSubscription ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                              <span className="material-symbols-outlined text-[20px] leading-none">
                                {product.supportsSubscription ? 'autorenew' : 'block'}
                              </span>
                            </div>
                            <div>
                              <p className={`font-bold text-sm transition-colors ${product.supportsSubscription ? 'text-primary' : 'text-slate-700'}`}>
                                Mua định kỳ
                              </p>
                              <p className="text-[11px] mt-1 text-slate-500 max-w-[200px] leading-relaxed">
                                Giảm thêm <span className="font-bold text-secondary">5%</span> cho các đơn hàng đã đăng ký mua định kỳ
                              </p>
                            </div>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 self-start xl:self-auto mt-2 xl:mt-0">
                            <input
                              type="checkbox"
                              checked={!!product.supportsSubscription}
                              onChange={() => handleToggleSubscription(product.productID)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Circular Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </section>
    </main>
  );
}

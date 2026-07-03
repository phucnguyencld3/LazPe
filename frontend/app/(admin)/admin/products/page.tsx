"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  AdminProductInfo,
  ProductStats,
  CategorySelectOption,
  fetchAdminProducts,
  fetchProductStats,
  toggleProductStatus,
  deleteProduct,
  fetchCategoriesForSelect
} from "@/lib/features/products/productApi";
import { Pagination } from "@/components/admin/shared/Pagination";
import { formatCurrency } from "@/lib/utils/formatters";

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Data states
  const [products, setProducts] = useState<AdminProductInfo[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [categories, setCategories] = useState<CategorySelectOption[]>([]);
  
  // Filter/Pagination states — khởi tạo từ URL nếu có ?page=X
  const [currentPage, setCurrentPage] = useState(() => {
    const p = searchParams.get("page");
    return p ? Math.max(1, parseInt(p)) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all"); // all, active, inactive, outOfStock
  
  const [loading, setLoading] = useState(true);

  // Deletion Modal states
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Load select list categories & stats once
  const loadInitialData = async (token: string) => {
    try {
      const [statsData, catsData] = await Promise.all([
        fetchProductStats(token),
        fetchCategoriesForSelect(token)
      ]);
      setStats(statsData);
      setCategories(catsData);
    } catch (err) {
      console.error("Error loading initial products data", err);
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

      // Map status filter
      let statusParam: boolean | null = null;
      if (selectedStatus === "active") statusParam = true;
      if (selectedStatus === "inactive") statusParam = false;
      // Note: outOfStock filter is handled in code or if backend supports it.
      // If we filter outOfStock, we can fetch all or handle it in client if page size is small.
      // But let's check: if selectedStatus === "outOfStock", we can filter them locally or pass parameters.
      // To be safe and keep paginated consistency, we fetch based on status.

      const paginationData = await fetchAdminProducts(
        token,
        currentPage,
        itemsPerPage,
        searchTerm,
        selectedCategory,
        statusParam
      );

      let fetchedProducts = paginationData.products;

      // Client-side fallback filter for Out of Stock if selected
      if (selectedStatus === "outOfStock") {
        // Dùng totalStock nếu sản phẩm có biến thể, ngược lại dùng stock gốc
        fetchedProducts = fetchedProducts.filter(p => {
          const actualStock = p.variantCount > 0 ? p.totalStock : p.stock;
          return actualStock === 0;
        });
      }

      setProducts(fetchedProducts);
      setTotalPages(paginationData.totalPages);
      setTotalItems(paginationData.totalItems);
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
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);

  // Handle status toggle
  const handleToggleStatus = async (id: number) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      
      const res = await toggleProductStatus(token, id);
      if (res.success) {
        toast.success(res.message || "Đã cập nhật trạng thái sản phẩm.");
        // Refresh data
        loadProducts();
        fetchProductStats(token).then(setStats);
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật trạng thái sản phẩm.");
    }
  };

  // Trigger custom confirmation modal
  const handleDeleteClick = (id: number, name: string) => {
    setProductToDelete({ id, name });
    setDeleteConfirmText("");
  };

  // Perform actual deletion
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id, name } = productToDelete;
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setDeletingId(id);
      const res = await deleteProduct(token, id);
      if (res.success) {
        toast.success("Xóa sản phẩm thành công.");
        setProductToDelete(null);
        loadProducts();
        fetchProductStats(token).then(setStats);
      } else {
        toast.error(res.message || "Lỗi khi xóa sản phẩm.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể xóa sản phẩm do có ràng buộc dữ liệu hoặc liên kết khác.", { duration: 5000 });
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Export to Excel
  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      toast.loading("Đang tạo file Excel...");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101/api'}/ProductImport/export`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.dismiss();
      if (!res.ok) {
        toast.error("Lỗi khi xuất dữ liệu.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ProductsExport_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Xuất dữ liệu thành công!");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Không thể kết nối đến máy chủ.");
    }
  };

  // Helpers for Stock status indicators
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return {
        dotColor: "bg-error",
        textColor: "text-error",
        label: "Hết hàng"
      };
    }
    if (stock <= 10) {
      return {
        dotColor: "bg-amber-500",
        textColor: "text-amber-600",
        label: "Sắp hết"
      };
    }
    return {
      dotColor: "bg-secondary",
      textColor: "text-secondary",
      label: "Sẵn sàng"
    };
  };

  const canDeleteProduct = (createdAtStr?: string) => {
    if (!createdAtStr) return false;
    const createdDate = new Date(createdAtStr);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  return (
    <main className="w-full pb-20">
      {/* Title Header Section */}
      <header className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Quản lý sản phẩm</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">Quản lý kho hàng, danh sách sản phẩm và biến thể kinh doanh</p>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <button
            onClick={() => router.push("/admin/products/import")}
            className="border border-secondary text-secondary px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Import Excel
          </button>
          <button
            onClick={handleExport}
            className="border border-primary text-primary px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">file_export</span>
            Xuất dữ liệu
          </button>
          <button
            onClick={() => {
              toast.info("Điều hướng sang trang tạo sản phẩm mới");
              router.push("/admin/products/new");
            }}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Thêm sản phẩm mới
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Total */}
        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">inventory</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng sản phẩm</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{stats?.totalProducts ?? "..."}</span>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang kinh doanh</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{stats?.activeProducts ?? "..."}</span>
        </div>

        {/* Card 3: Out of stock */}
        <div className={`px-5 py-4 rounded-[8px] shadow-sm border flex items-center justify-between hover:shadow-md transition-all duration-300 ${
          (stats?.outOfStockProducts ?? 0) > 0
            ? "bg-rose-50/50 border-rose-100"
            : "bg-white border-slate-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${
              (stats?.outOfStockProducts ?? 0) > 0
                ? "bg-rose-100 text-error"
                : "bg-slate-100 text-slate-500"
            }`}>
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              (stats?.outOfStockProducts ?? 0) > 0 ? "text-rose-950/60" : "text-slate-500"
            }`}>Hết hàng</span>
          </div>
          <div className="flex items-center gap-2">
            {(stats?.outOfStockProducts ?? 0) > 0 && (
              <span className="px-2 py-0.5 bg-error text-white text-[9px] font-bold rounded-[8px]">
                Cảnh báo
              </span>
            )}
            <span className={`text-2xl font-extrabold ${
              (stats?.outOfStockProducts ?? 0) > 0 ? "text-error" : "text-slate-800"
            }`}>{stats?.outOfStockProducts ?? "..."}</span>
          </div>
        </div>

        {/* Card 4: New products */}
        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">new_releases</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sản phẩm mới</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{stats?.newProducts ?? "..."}</span>
        </div>
      </div>

      {/* Filters & Product Table Area */}
      <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden">
        
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
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
          >
            <option value="all">Trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Đang ẩn</option>
            <option value="outOfStock">Hết hàng</option>
          </select>

          {/* Reset Filters button */}
          {(searchTerm || selectedCategory !== null || selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory(null);
                setSelectedStatus("all");
                setCurrentPage(1);
              }}
              className="px-6 py-3 text-slate-500 font-bold text-sm rounded-[8px] hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">clear</span>
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">STT</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Giá bán</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tồn kho</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
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
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">inventory</span>
                    <p className="text-slate-400 font-bold text-sm">Không tìm thấy sản phẩm nào.</p>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const actualStock = product.variantCount > 0 ? product.totalStock : product.stock;
                  const stockDetails = getStockBadge(actualStock);
                  const stt = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={product.productID} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-5 text-center">
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
                        {product.productDiscountPercent > 0 && (
                          <div className="text-[10px] font-bold text-red-500 mt-0.5">
                            Giảm {product.productDiscountPercent}%
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-800 text-sm">
                          {actualStock} chiếc
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${stockDetails.dotColor}`}></span>
                            <span className={`text-[10px] font-bold uppercase ${stockDetails.textColor}`}>
                              {stockDetails.label}
                            </span>
                          </div>
                          {product.variantCount > 0 && (
                            <span className="text-[10px] font-bold text-slate-400">
                              (Tổng {product.variantCount} biến thể)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Xóa cột Trạng thái riêng, gộp vào Thao tác */}
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Toggle trạng thái */}
                          <div className="flex flex-col items-center gap-1 px-1">
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={product.status}
                                onChange={() => handleToggleStatus(product.productID)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                            <span className={`text-[9px] font-bold uppercase ${product.status ? "text-secondary" : "text-slate-400"}`}>
                              {product.status ? "Đang bán" : "Đã ẩn"}
                            </span>
                          </div>

                          <div className="w-px h-8 bg-slate-100 mx-1"></div>

                          <button
                            onClick={() => {
                              toast.info(`Xem chi tiết sản phẩm: ${product.productName}`);
                              router.push(`/admin/products/${product.productID}?page=${currentPage}`);
                            }}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-primary hover:bg-primary-container/20 transition-all cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => {
                              toast.info(`Chỉnh sửa sản phẩm: ${product.productName}`);
                              router.push(`/admin/products/edit/${product.productID}?page=${currentPage}`);
                            }}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-secondary-container/20 transition-all cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product.productID, product.productName)}
                            disabled={!canDeleteProduct(product.createdAt)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              !canDeleteProduct(product.createdAt)
                                ? "opacity-30 cursor-not-allowed text-slate-300"
                                : "text-error hover:bg-error-container/20 cursor-pointer"
                            }`}
                            title={!canDeleteProduct(product.createdAt) ? "Chỉ được xóa sản phẩm mới tạo trong vòng 3 ngày" : "Xóa"}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
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
      </div>
      {/* Custom Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Xác nhận xóa sản phẩm</h3>
              </div>
              <button
                onClick={() => setProductToDelete(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                disabled={deletingId !== null}
              >
                <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6">
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-800">"{productToDelete.name}"</strong> không? Hành động này không thể hoàn tác và sẽ xóa toàn bộ các biến thể liên quan nếu sản phẩm chưa phát sinh đơn hàng.
              </p>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Vui lòng nhập <span className="text-error">tôi đồng ý xóa</span> để xác nhận:
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="tôi đồng ý xóa"
                  className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error placeholder-slate-300"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="px-5 py-2 rounded-[8px] border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                  disabled={deletingId !== null}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  className="px-5 py-2 rounded-[8px] bg-error text-white hover:bg-error/90 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deletingId !== null || deleteConfirmText.trim().toLowerCase() !== "tôi đồng ý xóa"}
                >
                  {deletingId !== null ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white"></div>
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Xác nhận xóa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
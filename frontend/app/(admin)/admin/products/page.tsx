"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import Badge from "@/components/admin/ui/Badge";
import Modal from "@/components/admin/ui/Modal";
import { Card, StatsCard } from "@/components/admin/ui/Card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/admin/ui/Table";

export default function AdminProductsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Data states
  const [products, setProducts] = useState<AdminProductInfo[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [categories, setCategories] = useState<CategorySelectOption[]>([]);
  
  // Filter/Pagination states
  const [currentPage, setCurrentPage] = useState(1);
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

      let statusParam: boolean | null = null;
      if (selectedStatus === "active") statusParam = true;
      if (selectedStatus === "inactive") statusParam = false;

      const paginationData = await fetchAdminProducts(
        token,
        currentPage,
        itemsPerPage,
        searchTerm,
        selectedCategory,
        statusParam
      );

      let fetchedProducts = paginationData.products;

      if (selectedStatus === "outOfStock") {
        fetchedProducts = fetchedProducts.filter(p => p.stock === 0);
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

  // Helpers for Stock status indicators
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return {
        color: "error" as const,
        label: "Hết hàng"
      };
    }
    if (stock <= 10) {
      return {
        color: "warning" as const,
        label: "Sắp hết"
      };
    }
    return {
      color: "success" as const,
      label: "Sẵn sàng"
    };
  };

  return (
    <main className="w-full pb-20 font-outfit">
      {/* Title Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-400 mt-1">Quản lý kho hàng, danh sách sản phẩm và biến thể kinh doanh</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={() => router.push("/admin/products/import")}
            variant="outline"
            startIcon={<span className="material-symbols-outlined text-lg">upload_file</span>}
            className="rounded-full px-5 py-2.5 font-bold text-xs"
          >
            Import Excel
          </Button>
          <Button
            onClick={() => toast.info("Tính năng xuất dữ liệu chưa khả dụng")}
            variant="outline"
            startIcon={<span className="material-symbols-outlined text-lg">file_export</span>}
            className="rounded-full px-5 py-2.5 font-bold text-xs text-brand-500 border-brand-200 hover:bg-brand-25 dark:hover:bg-brand-500/10"
          >
            Xuất dữ liệu
          </Button>
          <Button
            onClick={() => {
              toast.info("Điều hướng sang trang tạo sản phẩm mới");
              router.push("/admin/products/new");
            }}
            variant="primary"
            startIcon={<span className="material-symbols-outlined text-lg">add_circle</span>}
            className="rounded-full px-5 py-2.5 font-bold text-xs"
          >
            Thêm sản phẩm mới
          </Button>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Tổng sản phẩm"
          value={stats?.totalProducts ?? "..."}
          icon={<span className="material-symbols-outlined text-2xl font-bold">inventory</span>}
          iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
          trend="+5% tháng này"
          trendType="up"
        />
        <StatsCard
          title="Đang kinh doanh"
          value={stats?.activeProducts ?? "..."}
          icon={<span className="material-symbols-outlined text-2xl font-bold">check_circle</span>}
          iconBgColor="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400"
        />
        <StatsCard
          title="Hết hàng"
          value={stats?.outOfStockProducts ?? "..."}
          icon={<span className="material-symbols-outlined text-2xl font-bold">warning</span>}
          iconBgColor="bg-error-50 text-error-500 dark:bg-error-500/10 dark:text-error-400"
          trend="Cảnh báo"
          trendType="down"
        />
        <StatsCard
          title="Sản phẩm mới"
          value={stats?.newProducts ?? "..."}
          icon={<span className="material-symbols-outlined text-2xl font-bold">new_releases</span>}
          iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          trend="Mới tuần này"
          trendType="neutral"
        />
      </div>

      {/* Filters & Product Table Area */}
      <div className="bg-white dark:bg-gray-950 rounded-[2rem] shadow-theme-xs border border-gray-100 dark:border-white/[0.05] overflow-hidden mb-6">
        
        {/* Filter Bar */}
        <div className="p-6 border-b border-gray-100 dark:border-white/[0.05] flex flex-wrap items-center gap-4 bg-gray-50/50 dark:bg-gray-900/10">
          {/* Search box */}
          <div className="flex-1 min-w-[260px] relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl font-semibold text-sm text-gray-750 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-white"
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
            className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all min-w-[180px] cursor-pointer"
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
            className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all min-w-[160px] cursor-pointer"
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
              className="px-6 py-3 text-gray-500 dark:text-gray-400 font-bold text-sm rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">clear</span>
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Table Content */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader className="px-8 py-4">Sản phẩm</TableCell>
              <TableCell isHeader className="px-6 py-4">Giá bán</TableCell>
              <TableCell isHeader className="px-6 py-4">Tồn kho</TableCell>
              <TableCell isHeader className="px-6 py-4 text-center">Trạng thái</TableCell>
              <TableCell isHeader className="px-8 py-4 text-center">Hành động</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4 font-semibold text-sm">Đang tải dữ liệu sản phẩm...</p>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-5xl mb-2">inventory</span>
                  <p className="text-gray-400 font-bold text-sm">Không tìm thấy sản phẩm nào.</p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const actualStock = product.variantCount > 0 ? product.totalStock : product.stock;
                const stockDetails = getStockBadge(actualStock);
                return (
                  <TableRow key={product.productID} className="group">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex-shrink-0 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                          {product.imageUrl && product.imageUrl.trim() !== "" ? (
                            <img
                              src={product.imageUrl}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-gray-400 text-2xl">inventory_2</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white/90 group-hover:text-brand-500 transition-colors duration-200">
                            {product.productName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              SKU: {product.code || "N/A"}
                            </span>
                            <span className="h-3 w-px bg-gray-250 dark:bg-gray-800"></span>
                            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
                              {product.categoryName || "Khác"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-5">
                      <div className="font-bold text-gray-800 dark:text-white/90 text-sm">
                        {formatCurrency(product.price)}
                      </div>
                      {product.productDiscountPercent > 0 && (
                        <Badge color="error" size="sm" className="mt-1">
                          Giảm {product.productDiscountPercent}%
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="px-6 py-5">
                      <div className="font-bold text-gray-800 dark:text-white/90 text-sm">
                        {actualStock} chiếc
                      </div>
                      <div className="flex flex-col gap-1 mt-1.5">
                        <div className="flex items-center">
                          <Badge color={stockDetails.color} size="sm">
                            {stockDetails.label}
                          </Badge>
                        </div>
                        {product.variantCount > 0 && (
                          <span className="text-[10px] font-semibold text-gray-400">
                            ({product.variantCount} biến thể)
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleToggleStatus(product.productID)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold inline-block cursor-pointer transition-all ${
                          product.status
                            ? "bg-success-50 text-success-650 dark:bg-success-500/15 dark:text-success-400"
                            : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                        }`}
                        title="Click để đổi trạng thái"
                      >
                        {product.status ? "Đang bán" : "Đã ẩn"}
                      </button>
                    </TableCell>

                    <TableCell className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          onClick={() => {
                            toast.info(`Xem chi tiết sản phẩm: ${product.productName}`);
                            router.push(`/admin/products/${product.productID}`);
                          }}
                          variant="icon"
                          title="Xem chi tiết"
                          className="text-gray-500 hover:text-brand-500"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </Button>
                        <Button
                          onClick={() => {
                            toast.info(`Chỉnh sửa sản phẩm: ${product.productName}`);
                            router.push(`/admin/products/edit/${product.productID}`);
                          }}
                          variant="icon"
                          title="Chỉnh sửa"
                          className="text-gray-500 hover:text-emerald-500"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(product.productID, product.productName)}
                          variant="icon"
                          title="Xóa"
                          className="text-gray-500 hover:text-rose-500"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Circular Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Reusable Delete Confirmation Modal */}
      <Modal isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} showCloseButton={true}>
        {productToDelete && (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-rose-500">warning</span>
              </div>
              <h3 className="text-lg font-bold text-gray-850 dark:text-white">Xác nhận xóa sản phẩm</h3>
            </div>
            
            {/* Body */}
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-gray-800 dark:text-white">"{productToDelete.name}"</strong> không? Hành động này không thể hoàn tác và sẽ xóa toàn bộ các biến thể liên quan nếu sản phẩm chưa phát sinh đơn hàng.
              </p>
              
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setProductToDelete(null)}
                  variant="secondary"
                  disabled={deletingId !== null}
                  className="rounded-full px-5 py-2"
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={confirmDeleteProduct}
                  variant="danger"
                  disabled={deletingId !== null}
                  className="rounded-full px-5 py-2"
                  startIcon={deletingId === null ? <span className="material-symbols-outlined text-sm">delete</span> : undefined}
                  isLoading={deletingId !== null}
                >
                  Xác nhận xóa
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
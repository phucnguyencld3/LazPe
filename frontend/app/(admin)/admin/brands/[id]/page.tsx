"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { fetchBrandById, BrandInfo } from "@/lib/features/brands/brandApi";
import {
  AdminProductInfo,
  fetchAdminProducts,
  toggleProductStatus,
  deleteProduct
} from "@/lib/features/products/productApi";
import { Pagination } from "@/components/admin/shared/Pagination";
import { formatCurrency } from "@/lib/utils/formatters";

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = Number(params.id);

  // Brand data states
  const [brand, setBrand] = useState<BrandInfo | null>(null);
  const [loadingBrand, setLoadingBrand] = useState(true);

  // Products data states
  const [products, setProducts] = useState<AdminProductInfo[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Filter/Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all"); // all, active, inactive

  // Deletion Modal states
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load Brand Info
  const loadBrandInfo = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoadingBrand(true);
      const data = await fetchBrandById(token, brandId);
      setBrand(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thông tin thương hiệu.");
      router.push("/admin/brands");
    } finally {
      setLoadingBrand(false);
    }
  };

  // Load Linked Products
  const loadLinkedProducts = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      setLoadingProducts(true);

      let statusParam: boolean | null = null;
      if (selectedStatus === "active") statusParam = true;
      if (selectedStatus === "inactive") statusParam = false;

      const paginationData = await fetchAdminProducts(
        token,
        currentPage,
        itemsPerPage,
        searchTerm,
        null, // categoryId
        statusParam,
        brandId // supplierId / brandId
      );

      setProducts(paginationData.products || []);
      setTotalPages(paginationData.totalPages || 1);
      setTotalItems(paginationData.totalItems || 0);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách sản phẩm liên kết.");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadBrandInfo();
  }, [brandId]);

  // Load products when filters or pages change
  useEffect(() => {
    loadLinkedProducts();
  }, [currentPage, searchTerm, selectedStatus, brandId]);

  // Toggle status of a product
  const handleToggleProductStatus = async (id: number) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      
      const res = await toggleProductStatus(token, id);
      if (res.success) {
        toast.success("Đã cập nhật trạng thái sản phẩm.");
        loadLinkedProducts();
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật trạng thái sản phẩm.");
    }
  };

  // Trigger delete modal
  const handleDeleteClick = (id: number, name: string) => {
    setProductToDelete({ id, name });
  };

  // Confirm product delete
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id } = productToDelete;
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setDeletingId(id);
      const res = await deleteProduct(token, id);
      if (res.success) {
        toast.success("Xóa sản phẩm thành công.");
        setProductToDelete(null);
        // Refresh products list and stats
        loadLinkedProducts();
        loadBrandInfo();
      } else {
        toast.error(res.message || "Lỗi khi xóa sản phẩm.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể xóa sản phẩm do có ràng buộc dữ liệu.");
    } finally {
      setDeletingId(null);
    }
  };

  // Stock status helper
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return {
        dotColor: "bg-rose-500",
        textColor: "text-rose-500",
        bgClass: "bg-rose-50 border-rose-100",
        label: "Hết hàng"
      };
    }
    if (stock <= 10) {
      return {
        dotColor: "bg-amber-500",
        textColor: "text-amber-600",
        bgClass: "bg-amber-50 border-amber-100",
        label: "Sắp hết"
      };
    }
    return {
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgClass: "bg-emerald-50 border-emerald-100",
      label: "Sẵn sàng"
    };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loadingBrand && !brand) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-slate-500 font-semibold text-sm">Đang tải thông tin chi tiết...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      {/* Top Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/admin/brands")}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Quay lại</span>
          </button>
          {brand && (
            <>
              <div className="h-6 w-px bg-outline-variant/30"></div>
              <h2 className="font-headline-md text-headline-md text-primary font-bold">Thương hiệu: {brand.supplierName}</h2>
            </>
          )}
        </div>
        {brand && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                router.push(`/admin/brands?edit=${brand.supplierID}`);
              }}
              className="px-6 py-2.5 rounded-[8px] bg-primary text-on-primary hover:bg-primary/95 font-bold text-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Chỉnh sửa thương hiệu
            </button>
          </div>
        )}
      </div>

      {brand && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Brand Profile Card */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-[8px] border border-slate-100 p-8 shadow-sm space-y-6">
              
              {/* Header profile info */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-[8px] overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-2 mb-4 shadow-inner">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.supplierName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-container/30 text-primary font-bold text-2xl flex items-center justify-center">
                      {getInitials(brand.supplierName)}
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{brand.supplierName}</h2>
                <div className="mt-2.5">
                  {brand.status ? (
                    <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-[8px] text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-[8px] text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      Ngừng hoạt động
                    </span>
                  )}
                </div>
              </div>

              <hr className="border-slate-50" />

              {/* Attributes info */}
              <div className="space-y-4 text-xs font-semibold text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Mã thương hiệu:</span>
                  <span className="text-slate-800 font-bold">#{brand.supplierID}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ngày khởi tạo:</span>
                  <span className="text-slate-800 font-bold">
                    {new Date(brand.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tổng sản phẩm:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-extrabold text-[11px]">
                    {brand.productCount} sản phẩm
                  </span>
                </div>
              </div>

              {brand.description && (
                <>
                  <hr className="border-slate-50" />
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mô tả chi tiết</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      {brand.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Side: Linked Products list */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm overflow-hidden">
              
              {/* Product header & filters */}
              <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Danh sách Sản phẩm Liên kết</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Tìm thấy {totalItems} sản phẩm thuộc thương hiệu này
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Search bar */}
                  <div className="relative flex-grow sm:w-60">
                    <span className="material-symbols-outlined text-slate-400 text-base absolute left-4.5 top-1/2 -translate-y-1/2">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={selectedStatus}
                    onChange={e => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">Trạng thái</option>
                    <option value="active">Đang bán</option>
                    <option value="inactive">Đã ẩn</option>
                  </select>
                </div>
              </div>

              {/* Product list table */}
              <div className="overflow-x-auto">
                {loadingProducts ? (
                  <div className="flex flex-col justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-slate-400 text-xs font-bold mt-3">Đang tải sản phẩm...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">inventory</span>
                    <p className="text-xs font-bold">Thương hiệu này chưa liên kết sản phẩm nào</p>
                    {searchTerm && (
                      <p className="text-[10px] text-slate-400 mt-1">Không tìm thấy sản phẩm khớp với từ khóa tìm kiếm</p>
                    )}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50/30 border-b border-slate-50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                        <th className="px-6 py-4">Sản phẩm</th>
                        <th className="px-6 py-4">Giá bán</th>
                        <th className="px-6 py-4">Tồn kho</th>
                        <th className="px-6 py-4 text-center">Trạng thái</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(product => {
                        const actualStock = product.variantCount > 0 ? product.totalStock : product.stock;
                        const stockDetails = getStockBadge(actualStock);

                        return (
                          <tr key={product.productID} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.productName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="material-symbols-outlined text-slate-400 text-lg">image</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 text-sm leading-tight truncate max-w-[200px]" title={product.productName}>
                                    {product.productName}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                    SKU: {product.code || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 text-xs">
                                {formatCurrency(product.price)}
                              </div>
                              {product.productDiscountPercent > 0 && (
                                <div className="text-[9px] font-bold text-rose-500 mt-0.5">
                                  Giảm {product.productDiscountPercent}%
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 text-xs">
                                {actualStock} chiếc
                              </div>
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border mt-1 text-[8px] font-bold tracking-wide uppercase leading-none scale-95 origin-left bg-white shadow-xs">
                                <span className={`w-1 h-1 rounded-full ${stockDetails.dotColor}`}></span>
                                <span className={stockDetails.textColor}>{stockDetails.label}</span>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleToggleProductStatus(product.productID)}
                                className={`px-2.5 py-0.5 rounded-[8px] text-[9px] font-bold inline-block cursor-pointer transition-all border ${
                                  product.status
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : "bg-slate-50 text-slate-400 border-slate-100"
                                }`}
                                title="Click để đổi trạng thái"
                              >
                                {product.status ? "Đang bán" : "Đã ẩn"}
                              </button>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/admin/products/${product.productID}`}
                                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Xem chi tiết"
                                >
                                  <span className="material-symbols-outlined text-base">visibility</span>
                                </Link>
                                <Link
                                  href={`/admin/products/edit/${product.productID}`}
                                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Chỉnh sửa"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </Link>
                                <button
                                  onClick={() => handleDeleteClick(product.productID, product.productName)}
                                  className="p-1.5 hover:bg-rose-50 rounded-full text-rose-500 hover:text-rose-700 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Xóa"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Products Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}

            </div>
          </div>

        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[400px] max-w-full rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-rose-500">warning</span>
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
              <p className="text-slate-600 text-xs leading-relaxed mb-6 font-semibold">
                Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-800">"{productToDelete.name}"</strong> không? Hành động này không thể hoàn tác và sẽ xóa toàn bộ các biến thể liên quan.
              </p>
              
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
                  className="px-5 py-2 rounded-[8px] bg-rose-500 text-white hover:bg-rose-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
                  disabled={deletingId !== null}
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

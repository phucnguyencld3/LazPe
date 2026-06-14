"use client";

import type { FormEvent } from "react";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { Pagination } from "@/components/admin/shared/Pagination";
import {
  fetchBrandsPaginated,
  createBrand,
  updateBrand,
  deleteBrand,
  fetchAllBrands,
  BrandInfo,
  EditBrandPayload
} from "@/lib/features/brands/brandApi";

export default function AdminBrandsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");

  // Loaders
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Stats state
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    totalProducts: number;
  } | null>(null);

  // Data states
  const [brands, setBrands] = useState<BrandInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // "all", "active", "inactive"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;

  // Deletion Modal states
  const [brandToDelete, setBrandToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      const allBrands = await fetchAllBrands(token);
      const active = allBrands.filter(b => b.status).length;
      const inactive = allBrands.filter(b => !b.status).length;
      const totalProducts = allBrands.reduce((sum, b) => sum + b.productCount, 0);
      setStats({
        total: allBrands.length,
        active,
        inactive,
        totalProducts
      });
    } catch (err) {
      console.error("Error loading brand stats", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadBrands = async (page = 1) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);

      const statusVal = statusFilter === "active" ? true : statusFilter === "inactive" ? false : null;
      const data = await fetchBrandsPaginated(token, page, itemsPerPage, searchTerm, statusVal);

      setBrands(data.suppliers);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải danh sách thương hiệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadBrands(1);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page: number) => {
    loadBrands(page);
  };



  const handleToggleStatus = async (brand: BrandInfo) => {
    if (togglingId !== null) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setTogglingId(brand.supplierID);
      
      const payload: EditBrandPayload = {
        supplierName: brand.supplierName,
        logo: brand.logo || null,
        description: brand.description || null,
        status: !brand.status
      };

      const res = await updateBrand(token, brand.supplierID, payload);
      if (res.success) {
        toast.success("Cập nhật trạng thái thương hiệu thành công!");
        setBrands(prev =>
          prev.map(b => (b.supplierID === brand.supplierID ? { ...b, status: !b.status } : b))
        );
        loadStats();
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái thương hiệu.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi cập nhật trạng thái.");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDeleteBrand = async () => {
    if (!brandToDelete || deleting) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setDeleting(true);
      const res = await deleteBrand(token, brandToDelete.id);
      if (res.success) {
        toast.success("Xóa thương hiệu thành công.");
        setBrandToDelete(null);
        const isLastItemOnPage = brands.length === 1;
        const pageToLoad = isLastItemOnPage && currentPage > 1 ? currentPage - 1 : currentPage;
        loadBrands(pageToLoad);
        loadStats();
      } else {
        toast.error(res.message || "Không thể xóa thương hiệu.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể xóa thương hiệu này do có liên kết với sản phẩm.", { duration: 5000 });
    } finally {
      setDeleting(false);
    }
  };



  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">verified</span>
            Quản lý Thương hiệu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem, tạo mới, chỉnh sửa thông tin các thương hiệu của sản phẩm trong hệ thống
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/brands/new")}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Thêm thương hiệu mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Total */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng thương hiệu</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{stats?.total ?? "..."}</span>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang hoạt động</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{stats?.active ?? "..."}</span>
        </div>

        {/* Card 3: Inactive */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <span className="material-symbols-outlined text-[20px]">unpublished</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ngừng hoạt động</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{stats?.inactive ?? "..."}</span>
        </div>

        {/* Card 4: Linked Products */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">inventory</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sản phẩm liên kết</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{stats?.totalProducts ?? "..."}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-12 flex flex-col gap-6 transition-all duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            {/* Search and Filters */}
            <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
              {/* Search box */}
              <div className="flex-1 min-w-[260px] relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm thương hiệu..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>

              {/* Reset Filters button */}
              {(searchTerm || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="px-6 py-3 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">clear</span>
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-24">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : brands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-3 text-slate-200">
                    broken_image
                  </span>
                  <p className="text-sm font-semibold">Không tìm thấy thương hiệu nào</p>
                  <p className="text-xs text-slate-400 mt-1">Hãy thử thay đổi điều kiện tìm kiếm hoặc thêm mới</p>
                </div>
              ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                      <th className="px-6 py-4 text-center w-[80px]">STT</th>
                      <th className="px-6 py-4">Logo</th>
                      <th className="px-6 py-4 w-full">Tên thương hiệu</th>
                      <th className="px-6 py-4 text-right">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {brands.map((brand, index) => (
                      <tr key={brand.supplierID} className="hover:bg-slate-100/70 transition-all duration-200 group">
                        <td className="px-6 py-4 text-center text-xs font-semibold text-slate-400">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        <td className="px-6 py-4">
                          <div className="w-24 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.supplierName}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary-container/30 text-primary font-bold text-xs flex items-center justify-center">
                                {getInitials(brand.supplierName)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 text-sm leading-tight">
                            {brand.supplierName}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`text-[10px] font-bold uppercase min-w-[55px] text-right ${brand.status ? "text-secondary" : "text-slate-400"}`}>
                              {brand.status ? "Hoạt động" : "Đã ẩn"}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={brand.status}
                                disabled={togglingId === brand.supplierID}
                                onChange={() => handleToggleStatus(brand)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/brands/${brand.supplierID}`}
                              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                              title="Xem chi tiết & sản phẩm liên kết"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </Link>
                            <button
                              onClick={() => router.push(`/admin/brands/edit/${brand.supplierID}`)}
                              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Sửa"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => setBrandToDelete({ id: brand.supplierID, name: brand.supplierName })}
                              className="p-2 hover:bg-rose-50 rounded-full text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>


      </div>

      {/* Deletion Confirmation Modal */}
      {brandToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-[400px] max-w-full border border-slate-100 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa thương hiệu?</h3>
              <p className="text-xs text-slate-400 mt-2 px-2 leading-relaxed">
                Bạn có chắc chắn muốn xóa thương hiệu <span className="font-semibold text-slate-800">"{brandToDelete.name}"</span>?
                Hành động này sẽ xóa vĩnh viễn thương hiệu khỏi hệ thống và không thể hoàn tác.
              </p>

              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  onClick={() => setBrandToDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer text-center"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDeleteBrand}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Xác nhận xóa"
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

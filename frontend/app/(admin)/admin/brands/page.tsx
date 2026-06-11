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
  BrandInfo
} from "@/lib/features/brands/brandApi";

export default function AdminBrandsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");

  // Loaders
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  // Form states (Right column)
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);

  // Deletion Modal states
  const [brandToDelete, setBrandToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Trigger edit mode if URL contains ?edit=id
  useEffect(() => {
    if (editParam && brands.length > 0) {
      const brandToEdit = brands.find(b => b.supplierID === Number(editParam));
      if (brandToEdit && editId !== brandToEdit.supplierID) {
        handleEditClick(brandToEdit);
      }
    }
  }, [editParam, brands]);

  const handlePageChange = (page: number) => {
    loadBrands(page);
  };

  const handleEditClick = (brand: BrandInfo) => {
    setIsEditing(true);
    setEditId(brand.supplierID);
    setBrandName(brand.supplierName);
    setLogo(brand.logo || "");
    setDescription(brand.description || "");
    setStatus(brand.status);

    const input = document.getElementById("brandNameInput");
    if (input) {
      input.focus();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setBrandName("");
    setLogo("");
    setDescription("");
    setStatus(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!brandName.trim()) {
      toast.warning("Vui lòng nhập tên thương hiệu.");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setSubmitting(true);

      const payload = {
        supplierName: brandName.trim(),
        logo: logo || null,
        description: description.trim() || null,
        status: status
      };

      if (isEditing && editId !== null) {
        const res = await updateBrand(token, editId, payload);
        if (res.success) {
          toast.success("Cập nhật thương hiệu thành công!");
          resetForm();
          loadBrands(currentPage);
          loadStats();
        } else {
          toast.error(res.message || "Không thể cập nhật thương hiệu.");
        }
      } else {
        const res = await createBrand(token, payload);
        if (res.success) {
          toast.success("Tạo thương hiệu mới thành công!");
          resetForm();
          loadBrands(1);
          loadStats();
        } else {
          toast.error(res.message || "Không thể tạo thương hiệu.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi lưu thương hiệu.");
    } finally {
      setSubmitting(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedExtensions.includes(file.type)) {
      toast.warning("Chỉ hỗ trợ file ảnh JPG, PNG, GIF, WebP");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning("Kích thước ảnh không được vượt quá 10MB");
      return;
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "polystation/brands");

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const res = await fetch(`${API_URL}/Upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Lỗi khi tải ảnh lên máy chủ");
      }

      const result = await res.json();
      if (result.success) {
        setLogo(result.url);
        toast.success("Tải ảnh logo lên thành công!");
      } else {
        toast.error(result.message || "Upload thất bại.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi upload ảnh.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setLogo("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Total */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tổng thương hiệu</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats?.total ?? "..."}</h3>
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Đang hoạt động</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats?.active ?? "..."}</h3>
          </div>
        </div>

        {/* Card 3: Inactive */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
              <span className="material-symbols-outlined">unpublished</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ngừng hoạt động</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats?.inactive ?? "..."}</h3>
          </div>
        </div>

        {/* Card 4: Linked Products */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined">inventory</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sản phẩm liên kết</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats?.totalProducts ?? "..."}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - List of Brands */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            {/* Search and Filters */}
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search input */}
              <div className="w-full sm:w-72 relative">
                <span className="material-symbols-outlined text-slate-400 text-lg absolute left-4.5 top-1/2 -translate-y-1/2">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm thương hiệu..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
                <span className="text-xs font-bold text-slate-400 uppercase">Lọc trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-bold text-slate-700"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>
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
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Logo</th>
                      <th className="px-6 py-4">Tên thương hiệu</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4">Ngày tạo</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {brands.map(brand => (
                      <tr key={brand.supplierID} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          #{brand.supplierID}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
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
                        <td className="px-6 py-4 text-center">
                          {brand.status ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Ngừng hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          {new Date(brand.createdAt).toLocaleDateString("vi-VN")}
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
                              onClick={() => handleEditClick(brand)}
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

        {/* Right Column - Create/Edit Form */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm sticky top-28">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
              <span className="material-symbols-outlined text-primary">
                {isEditing ? "edit_note" : "add_circle"}
              </span>
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? "Chỉnh sửa thương hiệu" : "Tạo thương hiệu mới"}
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Brand Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Tên thương hiệu <span className="text-rose-500">*</span>
                </label>
                <input
                  id="brandNameInput"
                  type="text"
                  required
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="Nhập tên thương hiệu..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
                />
              </div>

              {/* Logo upload & preview */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Logo thương hiệu
                </label>

                {logo ? (
                  /* Image preview state */
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-40 flex items-center justify-center">
                    <img
                      src={logo}
                      alt="Brand logo preview"
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-full bg-white text-slate-800 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                        title="Thay đổi ảnh"
                      >
                        <span className="material-symbols-outlined text-base">cached</span>
                      </button>
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="p-2.5 rounded-full bg-rose-500 text-white hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                        title="Xóa ảnh"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* File upload input state */
                  <div
                    onClick={() => !uploadingLogo && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary/50 bg-slate-50/50 hover:bg-slate-50 transition-all p-6 flex flex-col items-center justify-center gap-2 cursor-pointer ${uploadingLogo ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                  >
                    {uploadingLogo ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-3xl">
                        upload_file
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-500">
                      {uploadingLogo ? "Đang tải lên..." : "Tải logo từ máy tính"}
                    </span>
                    <span className="text-[10px] text-slate-400">Chấp nhận JPG, PNG, GIF, WebP (tối đa 10MB)</span>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                  disabled={uploadingLogo}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Mô tả thương hiệu
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt về thương hiệu..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 resize-none"
                />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-slate-800">Trạng thái hoạt động</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Cho phép hiển thị & lọc thương hiệu khi mua hàng</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status}
                    onChange={e => setStatus(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer text-center"
                    disabled={submitting}
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || uploadingLogo}
                  className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>{isEditing ? "Cập nhật" : "Tạo thương hiệu"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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

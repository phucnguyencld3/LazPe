"use client";

import type { FormEvent } from "react";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import TextArea from "@/components/admin/ui/TextArea";
import Badge from "@/components/admin/ui/Badge";
import Modal from "@/components/admin/ui/Modal";
import { Card, StatsCard } from "@/components/admin/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";

export default function AdminBrandsPage() {
  const router = useRouter();

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
    <main className="w-full pb-20 animate-in fade-in duration-300 font-outfit">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white/90 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-500 text-3xl">verified</span>
            Quản lý Thương hiệu
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Xem, tạo mới, chỉnh sửa thông tin các thương hiệu của sản phẩm trong hệ thống
          </p>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Tổng thương hiệu"
          value={stats?.total ?? "..."}
          icon={<span className="material-symbols-outlined text-[24px]">verified</span>}
          iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
        />
        <StatsCard
          title="Đang hoạt động"
          value={stats?.active ?? "..."}
          icon={<span className="material-symbols-outlined text-[24px]">check_circle</span>}
          iconBgColor="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400"
        />
        <StatsCard
          title="Ngừng hoạt động"
          value={stats?.inactive ?? "..."}
          icon={<span className="material-symbols-outlined text-[24px]">unpublished</span>}
          iconBgColor="bg-error-50 text-error-500 dark:bg-error-500/10 dark:text-error-400"
        />
        <StatsCard
          title="Sản phẩm liên kết"
          value={stats?.totalProducts ?? "..."}
          icon={<span className="material-symbols-outlined text-[24px]">inventory</span>}
          iconBgColor="bg-warning-50 text-warning-500 dark:bg-warning-500/10 dark:text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - List of Brands */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-150 dark:border-white/[0.05] shadow-theme-xs overflow-hidden">
            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search input */}
              <div className="w-full sm:w-72 relative">
                <span className="material-symbols-outlined text-gray-400 text-lg absolute left-4.5 top-1/2 -translate-y-1/2">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm thương hiệu..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-semibold text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
                <span className="text-xs font-bold text-gray-400 uppercase">Lọc trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-xs font-bold text-gray-850 dark:text-white/95 dark:bg-gray-900 cursor-pointer transition-all"
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
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                </div>
              ) : brands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
                  <span className="material-symbols-outlined text-5xl mb-3 text-gray-200 dark:text-gray-800">
                    broken_image
                  </span>
                  <p className="text-sm font-semibold">Không tìm thấy thương hiệu nào</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Hãy thử thay đổi điều kiện tìm kiếm hoặc thêm mới</p>
                </div>
              ) : (
                <Table className="border-none shadow-none rounded-none">
                  <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                    <TableRow>
                      <TableCell isHeader>ID</TableCell>
                      <TableCell isHeader>Logo</TableCell>
                      <TableCell isHeader>Tên thương hiệu</TableCell>
                      <TableCell isHeader className="text-center">Trạng thái</TableCell>
                      <TableCell isHeader>Ngày tạo</TableCell>
                      <TableCell isHeader className="text-right">Thao tác</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {brands.map(brand => (
                      <TableRow key={brand.supplierID}>
                        <TableCell className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          #{brand.supplierID}
                        </TableCell>
                        <TableCell>
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center shrink-0">
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.supplierName}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <div className="w-full h-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400 font-bold text-xs flex items-center justify-center">
                                {getInitials(brand.supplierName)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-800 dark:text-white/90 text-sm">
                          {brand.supplierName}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge color={brand.status ? "success" : "light"} variant="light" size="sm">
                            <span className={`w-1.5 h-1.5 rounded-full ${brand.status ? "bg-success-500" : "bg-gray-400"}`}></span>
                            {brand.status ? "Hoạt động" : "Ngừng hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-gray-400 dark:text-gray-500">
                          {new Date(brand.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="icon"
                              onClick={() => handleEditClick(brand)}
                              title="Sửa"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </Button>
                            <Button
                              variant="icon"
                              onClick={() => setBrandToDelete({ id: brand.supplierID, name: brand.supplierName })}
                              title="Xóa"
                              className="hover:text-error-500 dark:hover:text-error-400"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
          <div className="bg-white dark:bg-gray-950 rounded-[2rem] p-8 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs sticky top-28">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
              <span className="material-symbols-outlined text-brand-500">
                {isEditing ? "edit_note" : "add_circle"}
              </span>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
                {isEditing ? "Chỉnh sửa thương hiệu" : "Tạo thương hiệu mới"}
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Brand Name */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Tên thương hiệu <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="brandNameInput"
                  type="text"
                  required
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="Nhập tên thương hiệu..."
                />
              </div>

              {/* Logo upload & preview */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Logo thương hiệu
                </label>

                {logo ? (
                  /* Image preview state */
                  <div className="relative group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-900 h-40 flex items-center justify-center">
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
                    className={`border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl hover:border-brand-500/50 bg-gray-50/50 dark:bg-white/[0.01] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all p-6 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      uploadingLogo ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploadingLogo ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent"></div>
                    ) : (
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-3xl">
                        upload_file
                      </span>
                    )}
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      {uploadingLogo ? "Đang tải lên..." : "Tải logo từ máy tính"}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Chấp nhận JPG, PNG, GIF, WebP (tối đa 10MB)</span>
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
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Mô tả thương hiệu
                </label>
                <TextArea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt về thương hiệu..."
                  className="resize-none"
                />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-white/90">Trạng thái hoạt động</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Cho phép hiển thị & lọc thương hiệu khi mua hàng</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status}
                    onChange={e => setStatus(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                {isEditing && (
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="secondary"
                    className="flex-1 rounded-full text-xs font-bold py-2.5"
                    disabled={submitting}
                  >
                    Hủy sửa
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={submitting || uploadingLogo}
                  variant="primary"
                  isLoading={submitting}
                  className="flex-1 rounded-full text-xs font-bold py-2.5"
                  startIcon={!submitting ? <span className="material-symbols-outlined text-sm">save</span> : undefined}
                >
                  {isEditing ? "Cập nhật" : "Tạo thương hiệu"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      <Modal
        isOpen={!!brandToDelete}
        onClose={() => setBrandToDelete(null)}
        showCloseButton={!deleting}
        className="max-w-md"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-error-50 dark:bg-error-500/15 text-error-500 rounded-full flex items-center justify-center mb-4 border border-error-100 dark:border-error-500/10">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Xác nhận xóa thương hiệu?</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-2 leading-relaxed">
            Bạn có chắc chắn muốn xóa thương hiệu <span className="font-semibold text-gray-800 dark:text-white">"{brandToDelete?.name}"</span>?
            Hành động này sẽ xóa vĩnh viễn thương hiệu khỏi hệ thống và không thể hoàn tác.
          </p>

          <div className="flex items-center gap-3 w-full mt-6">
            <Button
              onClick={() => setBrandToDelete(null)}
              disabled={deleting}
              variant="secondary"
              className="flex-1 rounded-full text-xs font-bold py-2.5"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={confirmDeleteBrand}
              disabled={deleting}
              variant="danger"
              isLoading={deleting}
              className="flex-1 rounded-full text-xs font-bold py-2.5"
            >
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

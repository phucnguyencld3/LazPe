"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AdminProductDetailInfo,
  fetchAdminProductDetail,
  AdminVariantInfo,
  fetchProductVariants,
  updateProductVariant,
  toggleVariantStatus,
  deleteProductVariant,
  uploadVariantImage,
  deleteVariantImage
} from "@/lib/features/products/productApi";
import { formatCurrency } from "@/lib/utils/formatters";

export default function ProductVariantsPage() {
  const { id } = useParams();
  const router = useRouter();

  // Core data states
  const [product, setProduct] = useState<AdminProductDetailInfo | null>(null);
  const [variants, setVariants] = useState<AdminVariantInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    variant: AdminVariantInfo | null;
  }>({ isOpen: false, variant: null });

  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    variant: AdminVariantInfo | null;
  }>({ isOpen: false, variant: null });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    variant: AdminVariantInfo | null;
  }>({ isOpen: false, variant: null });

  // Edit form states
  const [editForm, setEditForm] = useState({
    name: "",
    price: 0,
    variantDiscountPercent: 0,
    stock: 0,
    description: "",
    status: true
  });

  // Action statuses
  const [actionLoading, setActionLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load product parent details
  const loadProductDetail = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      const data = await fetchAdminProductDetail(token, id as string);
      setProduct(data);
    } catch (err) {
      console.error("Error loading product detail", err);
    }
  };

  // Load variant list (paginated & searched)
  const loadVariants = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const data = await fetchProductVariants(token, Number(id), page, pageSize, debouncedSearch);
      setVariants(data.data);
      setTotalPages(data.pageCount);
      setTotalCount(data.totalCount);
    } catch (err) {
      console.error("Error loading variants", err);
      toast.error("Không thể tải danh sách biến thể.");
    }
  };

  // Initial load
  useEffect(() => {
    if (id) {
      loadProductDetail();
    }
  }, [id]);

  // Reload variants on search, page, or filters
  useEffect(() => {
    if (id) {
      loadVariants();
    }
  }, [id, page, debouncedSearch]);

  // Filter local status (since API doesn't support direct status filtering on server-side)
  const displayedVariants = statusFilter === "all"
    ? variants
    : variants.filter(v => statusFilter === "active" ? v.status : !v.status);

  // Toggle status
  const handleToggleStatus = async (variant: AdminVariantInfo) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const newStatus = !variant.status;
      await toggleVariantStatus(token, variant.variantID, newStatus);
      toast.success(`Đã ${newStatus ? "bật" : "tắt"} trạng thái biến thể "${variant.variantName}".`);
      
      setVariants(prev =>
        prev.map(v => (v.variantID === variant.variantID ? { ...v, status: newStatus } : v))
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi cập nhật trạng thái.");
    }
  };

  // Open edit modal and populate form
  const handleOpenEditModal = (variant: AdminVariantInfo) => {
    setEditForm({
      name: variant.variantName,
      price: variant.unitPrice,
      variantDiscountPercent: variant.variantDiscountPercent,
      stock: variant.stock,
      description: variant.description || "",
      status: variant.status
    });
    setEditModal({ isOpen: true, variant });
  };

  // Submit edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.variant || actionLoading) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setActionLoading(true);
      await updateProductVariant(token, editModal.variant.variantID, {
        name: editForm.name,
        price: editForm.price,
        variantDiscountPercent: editForm.variantDiscountPercent,
        stock: editForm.stock,
        description: editForm.description,
        status: editForm.status
      });

      toast.success("Cập nhật thông tin biến thể thành công.");
      setEditModal({ isOpen: false, variant: null });
      loadVariants();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi cập nhật biến thể.");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute variant deletion
  const handleDeleteConfirm = async () => {
    if (!deleteModal.variant || actionLoading) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setActionLoading(true);
      const res = await deleteProductVariant(token, deleteModal.variant.variantID);
      toast.success("Xóa biến thể thành công.");
      setDeleteModal({ isOpen: false, variant: null });
      
      // If we are on page > 1 and deleted the only item, go to prev page
      if (variants.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadVariants();
      }
    } catch (err: any) {
      console.error("Failed to delete variant", err);
      // Detailed constraints warning
      toast.error(err.message || "Không thể xóa biến thể này do có ràng buộc dữ liệu liên kết.", { duration: 5500 });
    } finally {
      setActionLoading(false);
    }
  };

  // Image upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleImageUpload(e.target.files[0]);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!imageModal.variant || imageUploading) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp tin hình ảnh (.jpg, .png, .webp).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước hình ảnh tối đa cho phép là 5MB.");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setImageUploading(true);
      const res = await uploadVariantImage(token, imageModal.variant.variantID, file);
      toast.success("Tải lên hình ảnh biến thể thành công.");
      
      // Update modal variant status locally
      setImageModal(prev => ({
        ...prev,
        variant: prev.variant ? { ...prev.variant, imageUrl: res.imageUrl } : null
      }));
      
      loadVariants();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi upload hình ảnh.");
    } finally {
      setImageUploading(false);
    }
  };

  // Remove Variant Image
  const handleRemoveImage = async () => {
    if (!imageModal.variant || actionLoading) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setActionLoading(true);
      await deleteVariantImage(token, imageModal.variant.variantID);
      toast.success("Đã xóa hình ảnh biến thể thành công.");
      
      setImageModal(prev => ({
        ...prev,
        variant: prev.variant ? { ...prev.variant, imageUrl: null } : null
      }));
      
      loadVariants();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi xóa hình ảnh.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && variants.length === 0) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate actual display page metrics
  const displayedCount = displayedVariants.length;

  return (
    <div className="w-full pb-20 animate-in fade-in duration-300">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/admin/products/${id}`)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
            title="Quay lại chi tiết sản phẩm"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Quản lý biến thể</h2>
            {product && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 font-semibold text-sm">{product.productName}</span>
                <span className="text-[10px] px-2.5 py-0.5 bg-primary-container/20 rounded-full text-primary font-bold uppercase">
                  #{product.code || product.productID.toString().padStart(6, "0")}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => toast.info("Trang thêm biến thể nhanh đang được phát triển.")}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">bolt</span>
          Thêm biến thể nhanh
        </button>
      </header>

      {/* Search & Filter Area */}
      <section className="mb-6">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition-all text-slate-800"
              placeholder="Tìm kiếm theo SKU hoặc tên biến thể..."
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200/60 text-slate-700 rounded-xl px-4 py-3 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng kinh doanh</option>
            </select>
            <button
              onClick={() => toast.info("Tính năng lọc nâng cao đang được phát triển.")}
              className="flex items-center gap-2 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Lọc nâng cao
            </button>
          </div>
        </div>
      </section>

      {/* Table Content */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider">Ảnh</th>
                  <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider">Tên & SKU</th>
                  <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider">Giá bán</th>
                  <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider">Kho hàng</th>
                  <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedVariants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400 font-medium italic text-sm">
                      Không tìm thấy biến thể nào khớp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  displayedVariants.map((variant) => {
                    const finalPrice = variant.finalPrice;
                    const isDiscounted = variant.variantDiscountPercent > 0 || (product && product.productDiscountPercent > 0);
                    
                    return (
                      <tr key={variant.variantID} className="hover:bg-slate-50/40 transition-colors group">
                        {/* Image Thumbnail */}
                        <td className="px-6 py-4.5">
                          <button
                            onClick={() => setImageModal({ isOpen: true, variant })}
                            className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center cursor-pointer hover:border-primary/40 hover:scale-105 transition-all group/img relative"
                            title="Nhấp để thay đổi ảnh"
                          >
                            {variant.imageUrl ? (
                              <img className="w-full h-full object-cover" src={variant.imageUrl} alt={variant.variantName} />
                            ) : (
                              <span className="material-symbols-outlined text-slate-300 text-lg">image</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                            </div>
                          </button>
                        </td>

                        {/* Name & SKU */}
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">{variant.variantName}</span>
                            <span className="text-xs text-slate-400 font-semibold font-mono tracking-wider mt-0.5">
                              SKU: {variant.sku || "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* Pricing */}
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-primary text-sm">{formatCurrency(finalPrice)}</span>
                            {isDiscounted && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatCurrency(variant.unitPrice)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stock status */}
                        <td className="px-6 py-4.5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              variant.stock > 10
                                ? "bg-emerald-50 text-emerald-700"
                                : variant.stock > 0
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {variant.stock} chiếc
                          </span>
                        </td>

                        {/* Status Switcher */}
                        <td className="px-6 py-4.5">
                          <button
                            onClick={() => handleToggleStatus(variant)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              variant.status
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/60"
                                : "bg-slate-100 text-slate-500 border-slate-200/50 hover:bg-slate-200/50"
                            }`}
                            title={variant.status ? "Click để ẩn biến thể" : "Click để kích hoạt biến thể"}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${variant.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                            {variant.status ? "Đang hoạt động" : "Ngừng bán"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setImageModal({ isOpen: true, variant })}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-container/20 text-primary hover:scale-105 hover:bg-primary-container/30 transition-all cursor-pointer"
                              title="Thay đổi ảnh"
                            >
                              <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(variant)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:text-primary hover:bg-primary-container/10 transition-colors cursor-pointer"
                              title="Sửa thông tin"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, variant })}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-error hover:scale-105 hover:bg-rose-100 transition-all cursor-pointer"
                              title="Xóa biến thể"
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

          {/* Pagination controls */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">
              Đang hiển thị {displayedCount} trên tổng số {totalCount} biến thể
            </span>
            {totalPages > 1 && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      page === pNum
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 1. Modal: Thêm/Thay ảnh biến thể (Minimalist - Upload direct only, no library) */}
      {imageModal.isOpen && imageModal.variant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="relative bg-white w-[calc(100vw-2rem)] md:w-[500px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Cập nhật ảnh biến thể</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Biến thể: <span className="font-bold text-slate-700">{imageModal.variant.variantName}</span>
                </p>
              </div>
              <button
                onClick={() => setImageModal({ isOpen: false, variant: null })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                disabled={imageUploading || actionLoading}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-6">
              {/* Display Current Image */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 align-self-start">Ảnh hiện tại</p>
                <div className="w-40 h-40 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center relative overflow-hidden group shadow-inner">
                  {imageModal.variant.imageUrl ? (
                    <>
                      <img className="w-full h-full object-cover" src={imageModal.variant.imageUrl} alt="Current" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={actionLoading || imageUploading}
                        className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs gap-1.5 cursor-pointer disabled:opacity-0"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Xóa ảnh
                      </button>
                    </>
                  ) : (
                    <div className="text-center text-slate-400 p-4">
                      <span className="material-symbols-outlined text-4xl mb-1 text-slate-300">image</span>
                      <p className="text-[10px] font-semibold">Chưa có hình ảnh</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !imageUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                  dragging
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-slate-200 hover:border-primary/50 hover:bg-slate-50/60"
                } ${imageUploading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  disabled={imageUploading}
                />
                
                {imageUploading ? (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    <span className="text-xs font-bold text-primary">Đang tải ảnh lên Cloudinary...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">upload_file</span>
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-xs text-primary hover:underline">Kéo thả hoặc nhấn để tải ảnh</span>
                      <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa 5MB.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setImageModal({ isOpen: false, variant: null })}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                disabled={imageUploading || actionLoading}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Chỉnh sửa thông tin biến thể */}
      {editModal.isOpen && editModal.variant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[500px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Sửa thông tin biến thể</h3>
              <button
                onClick={() => setEditModal({ isOpen: false, variant: null })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                disabled={actionLoading}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {/* SKU (Readonly) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mã SKU (Không thể đổi)</label>
                  <input
                    type="text"
                    value={editModal.variant.sku}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs font-mono select-none"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tên biến thể</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    placeholder="Vd: SAF-RED-XL"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Giá bán (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 transition-all"
                    />
                  </div>

                  {/* Discount percent */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Chiết khấu (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.variantDiscountPercent}
                      onChange={(e) => setEditForm({ ...editForm, variantDiscountPercent: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 transition-all"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Số lượng tồn kho</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mô tả ngắn</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 transition-all resize-none"
                    placeholder="Mô tả cụ thể cho biến thể này..."
                  />
                </div>

                {/* Active status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Trạng thái kinh doanh</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Cho phép đặt hàng và bán sản phẩm này</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, variant: null })}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/95 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu lại</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Xác nhận xóa (Custom Dialog Overlay) */}
      {deleteModal.isOpen && deleteModal.variant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Xác nhận xóa biến thể</h3>
              </div>
              <button
                onClick={() => setDeleteModal({ isOpen: false, variant: null })}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                disabled={actionLoading}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Bạn có chắc chắn muốn xóa biến thể <strong className="text-slate-800">"{deleteModal.variant.variantName}"</strong> (SKU: {deleteModal.variant.sku}) không?
                Hành động này không thể hoàn tác và chỉ thực hiện được nếu biến thể chưa có liên kết với bất kỳ giỏ hàng, hóa đơn hay combo nào.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: false, variant: null })}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-full bg-error text-white hover:bg-error/90 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
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
    </div>
  );
}

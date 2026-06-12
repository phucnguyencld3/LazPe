"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  AdminProductDetailInfo,
  fetchAdminProductDetail,
  toggleProductStatus,
  deleteProduct
} from "@/lib/features/products/productApi";
import { formatCurrency } from "@/lib/utils/formatters";

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<AdminProductDetailInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  
  // Deletion Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Parse specifications JSON
  const parsedSpecsList = (() => {
    if (!product || !product.specifications) return [];
    try {
      const parsed = JSON.parse(product.specifications);
      if (parsed && typeof parsed === "object") {
        return Object.entries(parsed);
      }
    } catch (e) {
      // Ignore
    }
    return [];
  })();

  const loadProductDetails = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);
      const data = await fetchAdminProductDetail(token, id as string);
      setProduct(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải chi tiết sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProductDetails();
    }
  }, [id, router]);

  // Handle active status toggle
  const handleToggleStatus = async () => {
    if (!product || togglingStatus) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setTogglingStatus(true);
      const res = await toggleProductStatus(token, product.productID);
      if (res.success) {
        toast.success(res.message || "Đã cập nhật trạng thái sản phẩm.");
        // Local state update to feel responsive
        setProduct({
          ...product,
          status: !product.status
        });
      } else {
        toast.error(res.message || "Lỗi khi cập nhật trạng thái.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể thay đổi trạng thái sản phẩm.");
    } finally {
      setTogglingStatus(false);
    }
  };

  // Trigger custom confirmation modal
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // Perform actual deletion
  const confirmDeleteProduct = async () => {
    if (!product || deleting) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setDeleting(true);
      const res = await deleteProduct(token, product.productID);
      if (res.success) {
        toast.success("Xóa sản phẩm thành công.");
        setShowDeleteModal(false);
        router.push("/admin/products");
      } else {
        toast.error(res.message || "Lỗi khi xóa sản phẩm.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể xóa sản phẩm do có ràng buộc dữ liệu hoặc liên kết khác.", { duration: 5000 });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-error font-bold text-lg">Không tìm thấy sản phẩm</p>
        <button
          onClick={() => router.push("/admin/products")}
          className="mt-4 px-6 py-2 bg-primary text-on-primary rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Get first variant image or fallback to box icon
  const getProductImage = () => {
    if (product.variants && product.variants.length > 0) {
      const imgVar = product.variants.find(v => v.imageUrl && v.imageUrl.trim() !== "");
      if (imgVar) return imgVar.imageUrl;
    }
    return null;
  };

  const mainImageUrl = getProductImage();

  // Get effective price: discount applied
  const salePrice = product.productDiscountPercent > 0
    ? product.price * (1 - product.productDiscountPercent / 100)
    : product.price;

  // Total stock of variants
  const totalVariantStock = product.variants.reduce((acc, curr) => acc + curr.stock, 0);

  // Sorting 2 latest variants (by variantID desc)
  const latestVariants = [...product.variants]
    .sort((a, b) => b.variantID - a.variantID)
    .slice(0, 2);

  // Sorting 2 latest attributes/options (by productOptionID desc)
  const latestOptions = [...product.productOptions]
    .sort((a, b) => b.productOptionID - a.productOptionID)
    .slice(0, 2);

  // Description truncation logic
  const isDescLong = product.description.length > 250;
  const displayedDescription = isDescLong && !isDescExpanded
    ? `${product.description.substring(0, 250)}...`
    : product.description;

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      
      {/* Top Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <button
            onClick={() => router.push("/admin/products")}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer mb-2 font-bold"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Quay lại</span>
          </button>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{product.productName}</h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDeleteClick}
            className="px-6 py-2.5 rounded-full border border-rose-200 text-error hover:bg-rose-50 font-bold text-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
            Xóa sản phẩm
          </button>
          <button
            onClick={() => {
              toast.info("Điều hướng đến trang chỉnh sửa sản phẩm");
              router.push(`/admin/products/edit/${product.productID}`);
            }}
            className="px-8 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/95 font-bold text-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            Chỉnh sửa sản phẩm
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Card: Product Overview */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Tổng quan sản phẩm
            </h3>
            <span
              className={`px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 ${
                product.status
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {product.status ? "check_circle" : "cancel"}
              </span>
              {product.status ? "Đang bán" : "Đã ẩn"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Image Box */}
            <div className="md:col-span-2">
              <div className="aspect-[0.9] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden group relative flex items-center justify-center">
                {mainImageUrl ? (
                  <img
                    src={mainImageUrl}
                    alt={product.productName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="material-symbols-outlined text-slate-300 text-5xl">inventory_2</span>
                )}
                {mainImageUrl && (
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4">
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-primary shadow-sm">
                      <span className="material-symbols-outlined text-lg">zoom_in</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Details Box */}
            <div className="md:col-span-3 grid grid-cols-2 gap-y-6 gap-x-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Mã sản phẩm</p>
                <p className="text-lg font-bold text-slate-800">#{product.productID.toString().padStart(6, '0')}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Mã SKU</p>
                <p className="text-sm font-bold text-slate-700">{product.code || "Không có SKU"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Danh mục</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
                  <p className="font-semibold text-slate-700 text-sm">{product.category?.categoryName || "Khác"}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Thương hiệu / Nhà CC</p>
                <p className="font-semibold text-slate-700 text-sm">{product.supplier?.supplierName || "Không có"}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Mô tả sản phẩm</p>
                <div className="font-medium text-slate-600 text-sm leading-relaxed">
                  <p className="inline">{displayedDescription}</p>
                  {isDescLong && (
                    <button
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className="text-primary font-bold text-xs ml-2 hover:underline focus:outline-none cursor-pointer"
                    >
                      {isDescExpanded ? "Thu gọn" : "Xem thêm"}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ngày tạo</p>
                <p className="font-semibold text-slate-700 text-sm">
                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Chiết khấu (%)</p>
                {product.productDiscountPercent > 0 ? (
                  <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-error font-bold text-xs">
                    -{product.productDiscountPercent}% OFF
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm font-semibold">Không giảm giá</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Inventory & Pricing */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  Kho hàng &amp; Trạng thái
                </h3>
                {/* Active switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.status}
                    onChange={handleToggleStatus}
                    disabled={togglingStatus}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-500 font-semibold text-sm">Giá niêm yết</span>
                  <span className="text-slate-700 font-bold text-lg">{formatCurrency(product.price)}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-primary-container/10 border border-primary-container/20 rounded-2xl">
                  <span className="text-slate-500 font-semibold text-sm">Giá bán thực tế</span>
                  <span className="text-primary font-bold text-xl">{formatCurrency(salePrice)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tổng tồn kho</p>
                    <p className="text-2xl font-bold text-slate-800">{product.variants.length > 0 ? totalVariantStock : product.stock}</p>
                    <p className="text-[10px] text-secondary font-bold mt-1">Sản phẩm gốc</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tồn kho biến thể</p>
                    <p className="text-2xl font-bold text-slate-800">{totalVariantStock}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Tổng biến thể</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">layers</span> 
                  Biến thể sản phẩm
                </span>
                <span className="font-bold text-slate-700 text-sm">{product.variants.length} phân loại</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">settings_input_component</span> 
                  Nhóm thuộc tính
                </span>
                <span className="font-bold text-slate-700 text-sm">{product.productOptions.length} nhóm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Section */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm mb-8 animate-in fade-in duration-300">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">fact_check</span>
          Thông số kỹ thuật sản phẩm
        </h3>
        {parsedSpecsList.length === 0 ? (
          <p className="text-slate-400 font-medium text-sm italic py-4">Sản phẩm này chưa cấu hình thông số kỹ thuật.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parsedSpecsList.map(([key, value]) => (
              <div key={key} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-center hover:border-primary/20 transition-colors">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{key}</p>
                <p className="font-bold text-slate-800 text-sm leading-relaxed">{String(value)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Row: Variants & Attributes Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Product Variants List (Max 2 newest) */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">diversity_2</span>
                Biến thể sản phẩm (Mới nhất)
              </h3>
              <button
                onClick={() => {
                  toast.info("Tính năng quản lý biến thể chi tiết");
                  router.push(`/admin/products/${product.productID}/variants`);
                }}
                className="text-primary font-bold hover:underline text-sm focus:outline-none cursor-pointer"
              >
                Quản lý
              </button>
            </div>

            {product.variants.length === 0 ? (
              <p className="text-slate-400 font-medium text-sm italic py-6">Sản phẩm này chưa có biến thể nào.</p>
            ) : (
              <div className="space-y-4">
                {latestVariants.map((variant, index) => (
                  <div
                    key={variant.variantID}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {variant.imageUrl && variant.imageUrl.trim() !== "" ? (
                        <img src={variant.imageUrl} alt={variant.variantName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300 text-2xl">image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-bold text-slate-800 truncate text-sm">{variant.variantName}</h4>
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-secondary-container text-on-secondary-container uppercase shrink-0">
                            Mới nhất
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Giá bán</p>
                          <p className="font-bold text-primary text-xs">{formatCurrency(variant.finalPrice)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Tồn kho</p>
                          <p className="font-bold text-slate-700 text-xs">{variant.stock} chiếc</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">SKU</p>
                          <p className="text-xs font-semibold text-slate-500 truncate">{variant.sku || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {product.variants.length > 2 && (
            <p className="mt-6 text-center text-slate-400 font-bold text-xs">
              + {product.variants.length - 2} biến thể khác khả dụng
            </p>
          )}
        </div>

        {/* Right Side: Product Attributes/Options List (Max 2 newest) */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">list_alt</span>
                Thuộc tính sản phẩm (Mới nhất)
              </h3>
              <button
                onClick={() => {
                  router.push(`/admin/products/${product.productID}/options`);
                }}
                className="text-primary font-bold hover:underline text-sm focus:outline-none cursor-pointer"
              >
                Quản lý
              </button>
            </div>

            {product.productOptions.length === 0 ? (
              <p className="text-slate-400 font-medium text-sm italic py-6">Sản phẩm này chưa có thuộc tính nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestOptions.map((option, idx) => (
                  <div
                    key={option.productOptionID}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-100 relative"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          idx % 2 === 0
                            ? "bg-primary-container/20 text-primary"
                            : "bg-secondary-container/20 text-secondary"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {idx % 2 === 0 ? "category" : "settings_input_component"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Thuộc tính</p>
                        <p className="font-bold text-slate-800 text-sm truncate">{option.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {option.productOptionValues.map((val) => (
                        <span
                          key={val.productOptionValueID}
                          className="px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-semibold border border-slate-200/50 shadow-sm"
                        >
                          {val.value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {product.productOptions.length > 2 && (
            <p className="mt-6 text-center text-slate-400 font-bold text-xs">
              + {product.productOptions.length - 2} thuộc tính khác khả dụng
            </p>
          )}
        </div>
      </div>
      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Xác nhận xóa sản phẩm</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                disabled={deleting}
              >
                <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6">
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-800">"{product.productName}"</strong> không? Hành động này không thể hoàn tác và sẽ xóa toàn bộ các biến thể liên quan nếu sản phẩm chưa phát sinh đơn hàng.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                  disabled={deleting}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  className="px-5 py-2 rounded-full bg-error text-white hover:bg-error/90 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
                  disabled={deleting}
                >
                  {deleting ? (
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

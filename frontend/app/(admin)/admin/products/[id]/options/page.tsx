"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AdminProductDetailInfo,
  fetchAdminProductDetail,
  AdminProductOption,
  AdminProductOptionValue,
  fetchProductOptions,
  createProductOption,
  updateProductOption,
  deleteProductOption,
  createProductOptionValue,
  updateProductOptionValue,
  deleteProductOptionValue
} from "@/lib/features/products/productApi";
import { formatCurrency } from "@/lib/utils/formatters";

export default function ProductOptionsPage() {
  const { id } = useParams();
  const router = useRouter();

  // Core data states
  const [product, setProduct] = useState<AdminProductDetailInfo | null>(null);
  const [options, setOptions] = useState<AdminProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal control states
  // Option Modal (Create/Edit)
  const [optionModal, setOptionModal] = useState<{
    isOpen: boolean;
    type: "create" | "edit";
    optionId?: number;
  }>({ isOpen: false, type: "create" });
  
  // Option Value Modal (Create/Edit)
  const [valueModal, setValueModal] = useState<{
    isOpen: boolean;
    type: "create" | "edit";
    optionId: number;
    valueId?: number;
  }>({ isOpen: false, type: "create", optionId: 0 });

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "option" | "value";
    id: number;
    name: string;
  } | null>(null);

  // Form input states
  const [optionName, setOptionName] = useState("");
  const [optionDisplayOrder, setOptionDisplayOrder] = useState(1);

  const [valueText, setValueText] = useState("");
  const [valuePrice, setValuePrice] = useState(0);
  const [valueDisplayOrder, setValueDisplayOrder] = useState(1);

  // General action states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load product and its options
  const loadData = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);
      
      // Load details and options in parallel
      const [productData, optionsData] = await Promise.all([
        fetchAdminProductDetail(token, id as string),
        fetchProductOptions(token, Number(id))
      ]);
      
      setProduct(productData);
      setOptions(optionsData);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thông tin thuộc tính sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Modal Open Handlers
  const handleOpenOptionModal = (type: "create" | "edit", option?: AdminProductOption) => {
    if (type === "edit" && option) {
      setOptionName(option.name);
      setOptionDisplayOrder(option.displayOrder);
      setOptionModal({ isOpen: true, type: "edit", optionId: option.productOptionID });
    } else {
      setOptionName("");
      setOptionDisplayOrder(options.length + 1);
      setOptionModal({ isOpen: true, type: "create" });
    }
  };

  const handleOpenValueModal = (
    type: "create" | "edit", 
    optionId: number, 
    val?: AdminProductOptionValue
  ) => {
    if (type === "edit" && val) {
      setValueText(val.value);
      setValuePrice(val.price);
      setValueDisplayOrder(val.displayOrder);
      setValueModal({ 
        isOpen: true, 
        type: "edit", 
        optionId, 
        valueId: val.productOptionValueID 
      });
    } else {
      setValueText("");
      setValuePrice(0);
      const targetOption = options.find(o => o.productOptionID === optionId);
      setValueDisplayOrder((targetOption?.productOptionValues?.length || 0) + 1);
      setValueModal({ 
        isOpen: true, 
        type: "create", 
        optionId 
      });
    }
  };

  // Submit Handler for Product Option (Create / Edit)
  const handleOptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionName.trim() || saving) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setSaving(true);
      if (optionModal.type === "create") {
        await createProductOption(token, Number(id), optionName, optionDisplayOrder);
        toast.success("Tạo mới thuộc tính thành công.");
      } else {
        await updateProductOption(token, optionModal.optionId!, optionName, optionDisplayOrder);
        toast.success("Cập nhật thuộc tính thành công.");
      }
      
      setOptionModal({ isOpen: false, type: "create" });
      setOptionName("");
      // Refetched
      const optionsData = await fetchProductOptions(token, Number(id));
      setOptions(optionsData);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi xử lý thuộc tính.");
    } finally {
      setSaving(false);
    }
  };

  // Submit Handler for Option Value (Create / Edit)
  const handleValueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valueText.trim() || saving) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setSaving(true);
      if (valueModal.type === "create") {
        await createProductOptionValue(
          token, 
          valueModal.optionId, 
          valueText, 
          valuePrice, 
          valueDisplayOrder
        );
        toast.success("Thêm giá trị thuộc tính thành công.");
      } else {
        await updateProductOptionValue(
          token, 
          valueModal.valueId!, 
          valueText, 
          valuePrice, 
          valueDisplayOrder
        );
        toast.success("Cập nhật giá trị thuộc tính thành công.");
      }
      
      setValueModal({ isOpen: false, type: "create", optionId: 0 });
      setValueText("");
      setValuePrice(0);
      
      const optionsData = await fetchProductOptions(token, Number(id));
      setOptions(optionsData);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi xử lý giá trị thuộc tính.");
    } finally {
      setSaving(false);
    }
  };

  // Trigger delete confirmations
  const handleDeleteOptionClick = (optionId: number, name: string) => {
    setDeleteModal({ isOpen: true, type: "option", id: optionId, name });
  };

  const handleDeleteValueClick = (valueId: number, name: string) => {
    setDeleteModal({ isOpen: true, type: "value", id: valueId, name });
  };

  // Execute Deletion
  const confirmDeletion = async () => {
    if (!deleteModal || deleting) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setDeleting(true);
      if (deleteModal.type === "option") {
        await deleteProductOption(token, deleteModal.id);
        toast.success("Xóa thuộc tính thành công.");
      } else {
        await deleteProductOptionValue(token, deleteModal.id);
        toast.success("Xóa giá trị thuộc tính thành công.");
      }
      
      setDeleteModal(null);
      const optionsData = await fetchProductOptions(token, Number(id));
      setOptions(optionsData);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể xóa do ràng buộc dữ liệu liên kết.", { duration: 5000 });
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

  // Calculate total combinations
  const totalCombinations = options.length > 0 
    ? options.reduce((acc, curr) => acc * (curr.productOptionValues?.length || 1), 1)
    : 0;

  return (
    <div className="w-full pb-20 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Quản lý thuộc tính sản phẩm</h2>
          <p className="text-slate-500 text-sm mt-1">Cấu hình các phân loại kích thước, màu sắc, chất liệu cho từng sản phẩm.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin/products/${product.productID}`)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm font-bold text-xs cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại chi tiết
          </button>
          <button
            onClick={() => router.push(`/admin/products/${product.productID}/variants`)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/95 transition-all shadow-md font-bold text-xs cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-base">arrow_forward</span>
            Tiếp tục tạo biến thể
          </button>
        </div>
      </div>

      {/* Product Banner Info */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-primary-container/20 rounded-2xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">inventory_2</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{product.productName}</h3>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="bg-secondary-container text-on-secondary-container px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                #{product.code || product.productID.toString().padStart(6, '0')}
              </span>
              <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                Trạng thái: 
                <span className={product.status ? "text-secondary font-bold" : "text-slate-500 font-bold"}>
                  {product.status ? "Đang bán" : "Đã ẩn"}
                </span>
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => handleOpenOptionModal("create")}
          className="bg-primary text-on-primary font-bold text-sm px-8 py-3 rounded-full flex items-center gap-2 shadow-md hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          Thêm thuộc tính
        </button>
      </div>

      {/* Options List Grid */}
      <div className="space-y-8">
        {options.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-sm">
            <span className="material-symbols-outlined text-slate-300 text-6xl mb-3">list_alt</span>
            <p className="text-slate-400 font-bold">Sản phẩm này chưa được cấu hình thuộc tính nào.</p>
            <button
              onClick={() => handleOpenOptionModal("create")}
              className="mt-4 px-6 py-2 bg-primary text-on-primary font-bold rounded-full text-xs shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Thêm thuộc tính đầu tiên
            </button>
          </div>
        ) : (
          options.map((option) => (
            <div 
              key={option.productOptionID}
              className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm"
            >
              {/* Option Card Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-secondary-container/30 text-secondary rounded-xl">
                    <span className="material-symbols-outlined">palette</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 flex flex-wrap items-center gap-2.5">
                      {option.name}
                      <span className="bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                        THỨ TỰ: {option.displayOrder}
                      </span>
                      <span className="bg-primary-container/20 text-primary px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                        {option.productOptionValues?.length || 0} GIÁ TRỊ
                      </span>
                    </h4>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenOptionModal("edit", option)}
                    className="p-2 text-slate-500 hover:text-primary hover:bg-primary-container/10 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Sửa thuộc tính"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteOptionClick(option.productOptionID, option.name)}
                    className="p-2 text-error hover:bg-rose-50 border border-rose-100 rounded-xl transition-all cursor-pointer"
                    title="Xóa thuộc tính"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Values Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-4">Giá trị</th>
                      <th className="px-8 py-4 text-center">Giá cộng thêm</th>
                      <th className="px-8 py-4 text-center">Thứ tự hiển thị</th>
                      <th className="px-8 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!option.productOptionValues || option.productOptionValues.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400 text-sm font-medium italic">
                          Chưa có giá trị nào. Hãy thêm giá trị mới bên dưới.
                        </td>
                      </tr>
                    ) : (
                      option.productOptionValues.map((val) => (
                        <tr key={val.productOptionValueID} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-4.5">
                            <div className="flex items-center gap-3">
                              {/* Color preview circle fallback */}
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                              <span className="font-bold text-slate-800 text-sm">{val.value}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4.5 text-center">
                            {val.price > 0 ? (
                              <span className="font-bold text-secondary text-sm">
                                +{formatCurrency(val.price)}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-sm">0 đ</span>
                            )}
                          </td>
                          <td className="px-8 py-4.5 text-center text-slate-500 font-semibold text-sm">
                            {val.displayOrder}
                          </td>
                          <td className="px-8 py-4.5 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenValueModal("edit", option.productOptionID, val)}
                                className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary-container/10 border border-slate-200 rounded-lg transition-all cursor-pointer"
                                title="Sửa giá trị"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteValueClick(val.productOptionValueID, val.value)}
                                className="p-1.5 text-error hover:bg-rose-50 border border-rose-100 rounded-lg transition-all cursor-pointer"
                                title="Xóa giá trị"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Value Button at Card Footer */}
              <div className="p-4 px-8 border-t border-slate-100 bg-slate-50/20">
                <button
                  onClick={() => handleOpenValueModal("create", option.productOptionID)}
                  className="flex items-center gap-2 px-4 py-2 border border-secondary text-secondary font-bold text-xs rounded-xl hover:bg-secondary/5 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Thêm giá trị thuộc tính
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bento-style Info Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="md:col-span-2 bg-[#f0faf7] rounded-[2rem] p-8 flex items-center gap-6 border border-secondary/10">
          <div className="bg-white p-4 rounded-2xl shadow-lg shadow-secondary/5 text-secondary shrink-0">
            <span className="material-symbols-outlined text-4xl">auto_awesome</span>
          </div>
          <div>
            <h5 className="text-lg font-bold text-secondary">Mẹo: Thứ tự hiển thị</h5>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">
              Bạn nên sắp xếp các thuộc tính và giá trị theo đúng thứ tự logic hiển thị của sản phẩm (ví dụ: Màu sắc hiển thị trước Kích thước) để khách hàng dễ lựa chọn trên giao diện bán hàng.
            </p>
          </div>
        </div>
        <div className="bg-rose-50/50 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center border border-primary/10">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Tổng số biến thể có thể tạo</p>
          <span className="text-5xl font-bold text-primary">{totalCombinations}</span>
          <p className="text-xs text-primary/70 mt-2 font-medium">Tổ hợp thuộc tính đã cấu hình</p>
        </div>
      </div>

      {/* 1. Create/Edit Option Modal */}
      {optionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {optionModal.type === "create" ? "Thêm thuộc tính mới" : "Sửa thuộc tính"}
              </h3>
              <button
                onClick={() => setOptionModal({ isOpen: false, type: "create" })}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                disabled={saving}
              >
                <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleOptionSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tên thuộc tính</label>
                  <input
                    type="text"
                    value={optionName}
                    onChange={(e) => setOptionName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="Vd: Màu sắc, Kích thước, Chất liệu..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min="1"
                    value={optionDisplayOrder}
                    onChange={(e) => setOptionDisplayOrder(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOptionModal({ isOpen: false, type: "create" })}
                  className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                  disabled={saving}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/95 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
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

      {/* 2. Create/Edit Option Value Modal */}
      {valueModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {valueModal.type === "create" ? "Thêm giá trị thuộc tính" : "Sửa giá trị thuộc tính"}
              </h3>
              <button
                onClick={() => setValueModal({ isOpen: false, type: "create", optionId: 0 })}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                disabled={saving}
              >
                <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleValueSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Giá trị</label>
                  <input
                    type="text"
                    value={valueText}
                    onChange={(e) => setValueText(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="Vd: Đỏ, Xanh, XL, L, Cotton..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Giá chênh lệch cộng thêm (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={valuePrice}
                    onChange={(e) => setValuePrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Giá chênh lệch cộng thêm vào giá gốc sản phẩm khi khách chọn phân loại này.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min="1"
                    value={valueDisplayOrder}
                    onChange={(e) => setValueDisplayOrder(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setValueModal({ isOpen: false, type: "create", optionId: 0 })}
                  className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                  disabled={saving}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/95 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
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

      {/* 3. Custom Delete Confirmation Modal */}
      {deleteModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Xác nhận xóa {deleteModal.type === "option" ? "thuộc tính" : "giá trị"}
                </h3>
              </div>
              <button
                onClick={() => setDeleteModal(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                disabled={deleting}
              >
                <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6">
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Bạn có chắc chắn muốn xóa {deleteModal.type === "option" ? "thuộc tính" : "giá trị"} <strong className="text-slate-800">"{deleteModal.name}"</strong> không? 
                Hành động này không thể hoàn tác và chỉ có thể thực hiện nếu mục này chưa liên kết với bất kỳ biến thể sản phẩm đang chạy nào.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                  disabled={deleting}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDeletion}
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
      
    </div>
  );
}

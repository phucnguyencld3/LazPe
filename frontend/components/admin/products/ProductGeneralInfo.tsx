"use client";
import { SupplierSelectOption, CategorySelectOption } from "@/lib/features/products/productApi";
import { SearchableSelect } from "@/components/admin/shared/SearchableSelect";

interface ProductGeneralInfoProps {
  productName: string;
  onProductNameChange: (val: string) => void;
  code: string;
  onCodeChange: (val: string) => void;
  supplierId: number | "";
  onSupplierIdChange: (val: number | "") => void;
  suppliers: SupplierSelectOption[];
  description: string;
  onDescriptionChange: (val: string) => void;
  categories: CategorySelectOption[];
  selectedCategoryId: number | null;
  onCategoryChange: (catId: number | null, pathIds: number[]) => void;
  specifications: { key: string; value: string }[];
  onSpecificationsChange: (val: { key: string; value: string }[]) => void;
  productImages?: string[];
  isUploadingImage?: boolean;
  onUploadProductImage?: (file: File) => void;
  onRemoveProductImage?: (index: number) => void;
}

export function ProductGeneralInfo({
  productName,
  onProductNameChange,
  code,
  onCodeChange,
  supplierId,
  onSupplierIdChange,
  suppliers,
  description,
  onDescriptionChange,
  categories,
  selectedCategoryId,
  onCategoryChange,
  specifications,
  onSpecificationsChange,
  productImages = [],
  isUploadingImage = false,
  onUploadProductImage,
  onRemoveProductImage
}: ProductGeneralInfoProps) {

  // Helper to trace category path from leaf to root
  const getCategoryPath = (catId: number | null): number[] => {
    if (!catId) return [];
    const path: number[] = [];
    let current = categories.find(c => c.categoryID === catId);
    while (current) {
      path.unshift(current.categoryID);
      const parentId = current.parentID;
      current = parentId ? categories.find(c => c.categoryID === parentId) : undefined;
    }
    return path;
  };

  // Filter only active leaf categories (categories that have no child subcategories)
  const leafCategories = categories.filter(cat => {
    if (!cat.status) return false;
    return !categories.some(c => c.parentID === cat.categoryID && c.status);
  });

  const handleCategorySelect = (val: string) => {
    if (val === "") {
      onCategoryChange(null, []);
    } else {
      const catId = Number(val);
      const path = getCategoryPath(catId);
      onCategoryChange(catId, path);
    }
  };

  const selectedPathIds = getCategoryPath(selectedCategoryId);
  const getCategoryName = (id: number) => {
    return categories.find(c => c.categoryID === id)?.categoryName || "";
  };

  const isSpecKeyDuplicate = (key: string) => {
    if (!key.trim()) return false;
    return specifications.filter(s => s.key.trim().toLowerCase() === key.trim().toLowerCase()).length > 1;
  };

  return (
    <>
      {/* General Information Card */}
      <section className="p-8">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
          <span className="material-symbols-outlined text-primary">description</span>
          <h3 className="text-lg font-bold text-slate-800">Thông tin chung</h3>
        </div>

        <div className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Tên sản phẩm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => onProductNameChange(e.target.value)}
              placeholder="Nhập tên sản phẩm ví dụ: Sữa Bột Similac Newborn"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SKU */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Mã sản phẩm (SKU)
              </label>
              <input
                type="text"
                readOnly
                value={code}
                placeholder="Hệ thống tự động sinh..."
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none text-sm font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Supplier/Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Thương hiệu / Nhãn hàng <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={suppliers.map(s => ({ value: s.supplierID, label: s.supplierName }))}
                value={supplierId}
                onChange={(val) => onSupplierIdChange(val === "" ? "" : Number(val))}
                placeholder="Chọn thương hiệu / nhãn hàng..."
                searchPlaceholder="Tìm kiếm thương hiệu..."
                buttonClassName="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-700 cursor-pointer flex justify-between items-center"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Phân loại danh mục <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              options={leafCategories.map(cat => ({ value: cat.categoryID, label: cat.categoryName }))}
              value={selectedCategoryId || ""}
              onChange={handleCategorySelect}
              placeholder="Chọn phân loại danh mục..."
              searchPlaceholder="Tìm kiếm danh mục..."
              buttonClassName="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-700 cursor-pointer flex justify-between items-center"
            />
            
            {/* Detailed Selected Category Path */}
            {selectedCategoryId && selectedPathIds.length > 0 && (
              <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 leading-normal animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-secondary text-sm shrink-0">done_all</span>
                <span className="font-bold text-slate-400">Danh mục đang chọn:</span>
                <div className="flex flex-wrap items-center gap-1 font-semibold text-slate-700">
                  {selectedPathIds.map((id, idx) => (
                    <span key={id} className="flex items-center gap-1">
                      <span className={idx === selectedPathIds.length - 1 ? "text-primary font-bold" : ""}>
                        {getCategoryName(id)}
                      </span>
                      {idx < selectedPathIds.length - 1 && (
                        <span className="material-symbols-outlined text-slate-300 text-[10px]">chevron_right</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Images Uploader */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Ảnh sản phẩm chung
            </label>
            <p className="text-xs text-slate-500 mb-3">Tải lên các ảnh mô tả chung cho sản phẩm (ưu tiên khi không có ảnh biến thể).</p>
            
            <div className="flex flex-wrap gap-4">
              {productImages.map((imgUrl, index) => (
                <div key={index} className="relative w-28 h-28 rounded-xl border border-slate-200 overflow-hidden group">
                  <img src={imgUrl} alt={`Product Image ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemoveProductImage?.(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100 hover:text-rose-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-white text-[10px] py-0.5 text-center font-semibold">
                      Ảnh bìa
                    </div>
                  )}
                </div>
              ))}

              {/* Upload Button */}
              {productImages.length < 10 && (
                <label className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer relative">
                  {isUploadingImage ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-2xl mb-1">add_photo_alternate</span>
                      <span className="text-xs font-semibold">Thêm ảnh</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isUploadingImage}
                    onChange={(e) => {
                      if (e.target.files && onUploadProductImage) {
                        // Pass first file for now, or adapt to multiple
                        Array.from(e.target.files).forEach(file => onUploadProductImage(file));
                        // Reset input to allow uploading same file again if needed
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Mô tả sản phẩm
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Nhập mô tả sản phẩm ở đây để khách hàng nắm rõ thông tin sản phẩm..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 resize-none"
            />
          </div>

          {/* Specifications */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase">
                Thông số kỹ thuật
              </label>
              <button
                type="button"
                onClick={() => onSpecificationsChange([...specifications, { key: "", value: "" }])}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-bold">add</span>
                Thêm thông số
              </button>
            </div>
            
            {specifications.length === 0 ? (
              <p className="text-slate-400 text-xs italic">Chưa có thông số kỹ thuật nào được thiết lập.</p>
            ) : (
              <div className="space-y-3">
                {specifications.map((spec, index) => {
                  const isDup = isSpecKeyDuplicate(spec.key);
                  return (
                    <div key={index} className="flex flex-col gap-1 w-full animate-in fade-in duration-200">
                      <div className="flex items-center gap-3 w-full">
                        <input
                          type="text"
                          value={spec.key}
                          onChange={(e) => {
                            const newSpecs = [...specifications];
                            newSpecs[index].key = e.target.value;
                            onSpecificationsChange(newSpecs);
                          }}
                          placeholder="Tên thông số (Vd: Chất liệu, Xuất xứ...)"
                          className={`w-1/3 px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 transition-all ${
                            isDup
                              ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/5"
                              : "border-slate-200 focus:ring-primary/20 focus:border-primary"
                          }`}
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => {
                            const newSpecs = [...specifications];
                            newSpecs[index].value = e.target.value;
                            onSpecificationsChange(newSpecs);
                          }}
                          placeholder="Giá trị (Vd: Gỗ tự nhiên, Việt Nam...)"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSpecs = specifications.filter((_, idx) => idx !== index);
                            onSpecificationsChange(newSpecs);
                          }}
                          className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer active:scale-95"
                          title="Xóa thông số này"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                      {isDup && (
                        <span className="text-[10px] text-rose-500 font-bold ml-1.5 block">
                          Trùng tên thông số kỹ thuật
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

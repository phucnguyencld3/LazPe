"use client";
import { SupplierSelectOption } from "@/lib/features/products/productApi";

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
  onDescriptionChange
}: ProductGeneralInfoProps) {
  return (
    <div className="space-y-8">
      {/* General Information Card */}
      <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
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
                Thương hiệu / Nhãn hàng
              </label>
              <div className="relative">
                <select
                  value={supplierId}
                  onChange={(e) => onSupplierIdChange(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="">Chọn thương hiệu (Không bắt buộc)</option>
                  {suppliers.map(s => (
                    <option key={s.supplierID} value={s.supplierID}>
                      {s.supplierName}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  unfold_more
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description Card */}
      <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
          <span className="material-symbols-outlined text-primary">subject</span>
          <h3 className="text-lg font-bold text-slate-800">Mô tả sản phẩm</h3>
        </div>
        <div>
          <textarea
            rows={6}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Nhập mô tả sản phẩm ở đây để khách hàng nắm rõ thông tin sản phẩm..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 resize-none"
          />
        </div>
      </section>
    </div>
  );
}

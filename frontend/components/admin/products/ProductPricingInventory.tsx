"use client";
import { formatCurrency } from "@/lib/utils/formatters";

interface ProductPricingInventoryProps {
  price: number | "";
  onPriceChange: (val: number | "") => void;
  discountPercent: number | "";
  onDiscountPercentChange: (val: number | "") => void;
  stock: number | "";
  onStockChange: (val: number | "") => void;
  finalPrice: number;
}

export function ProductPricingInventory({
  price,
  onPriceChange,
  discountPercent,
  onDiscountPercentChange,
  stock,
  onStockChange,
  finalPrice
}: ProductPricingInventoryProps) {
  return (
    <>
      {/* Pricing Section */}
      <section className="p-8">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
          <span className="material-symbols-outlined text-primary">payments</span>
          <h3 className="text-lg font-bold text-slate-800">Giá bán</h3>
        </div>

        <div className="space-y-6">
          {/* Base price */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Giá gốc sản phẩm (VND)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={price}
                onChange={(e) => onPriceChange(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Ví dụ: 250000"
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                đ
              </span>
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Chiết khấu giảm giá (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={discountPercent}
                onChange={(e) => onDiscountPercentChange(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Ví dụ: 10"
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                %
              </span>
            </div>
          </div>

          {/* Dynamic Calculated Pricing Display */}
          <div className="pt-4 border-t border-dashed border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-600">
            <span>Giá bán thực tế:</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(finalPrice)}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

import React, { useState, useEffect } from "react";
import { ArrowLeft, Package, Tag, Layers, ShoppingBag, Box, Image as ImageIcon, Loader } from "lucide-react";
import { getBundleDetail, BundleResponse } from "@/lib/features/combo/comboApi";
import { formatCurrency } from "@/lib/utils/formatters";
import { toast } from "@/lib/toast";

interface ComboDetailAdminProps {
  bundleId: number;
  token: string;
  onBack: () => void;
}

export const ComboDetailAdmin: React.FC<ComboDetailAdminProps> = ({
  bundleId,
  token,
  onBack
}) => {
  const [bundle, setBundle] = useState<BundleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBundle = async () => {
      setLoading(true);
      try {
        const data = await getBundleDetail(bundleId, token);
        setBundle(data);
      } catch (err) {
        toast.error("Lỗi khi tải thông tin combo");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (bundleId) {
      fetchBundle();
    }
  }, [bundleId, token]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400">
        <Loader className="animate-spin text-primary h-10 w-10 mb-4" />
        <p className="font-bold">Đang tải thông tin combo...</p>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="bg-white rounded-[2rem] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400">
        <Package className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Không tìm thấy combo</h3>
        <p className="text-slate-500 mt-2">Combo này có thể đã bị xóa hoặc không tồn tại.</p>
        <button onClick={onBack} className="mt-6 px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-3">
            Chi tiết Combo: {bundle.name}
            <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full ${
              bundle.status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {bundle.status ? 'Đang bán' : 'Tạm ẩn'}
            </span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70 mt-1">
            Mã Combo: {bundle.code || `CB${bundle.bundleID}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100">
          
          {/* Left Column (Products) */}
          <div className="lg:col-span-8 flex flex-col divide-y divide-slate-100">
            {/* Combo Details Box */}
            <div className="p-8 space-y-5">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 uppercase tracking-wider flex items-center gap-2">
                <Layers size={18} className="text-primary" />
                Mô tả chi tiết
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {bundle.description || <span className="italic text-slate-400">Không có mô tả cho combo này.</span>}
              </p>
            </div>

            {/* Selected Products Box */}
            <div className="p-8 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={18} className="text-primary" />
                  Sản phẩm trong Combo ({bundle.items?.length || 0})
                </h3>
              </div>

              {!bundle.items || bundle.items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-4xl text-slate-350 mb-2">inventory_2</span>
                  <p className="text-sm font-bold">Chưa có sản phẩm nào trong combo</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 overflow-hidden">
                  {bundle.items.map((item, index) => (
                    <div key={item.bundleItemID || index} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4 group">
                      {/* Product Image */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                        )}
                      </div>

                      {/* Product Title & Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate" title={item.productName}>
                          {item.productName}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                          {item.variantName !== "Default" && item.variantName !== item.productName 
                            ? `Phân loại: ${item.variantName} | SKU: ${item.sku}` 
                            : `SKU: ${item.sku}`}
                        </p>
                      </div>

                      {/* Pricing & Stock */}
                      <div className="text-right flex-shrink-0 flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-slate-700">{formatCurrency(item.unitPrice || 0)}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Tồn kho: {item.stock}
                          </p>
                        </div>
                        
                        {/* Quantity Badge */}
                        <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold text-sm min-w-[3rem] text-center">
                          x{item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Image, Pricing & Settings) */}
          <div className="lg:col-span-4 flex flex-col divide-y divide-slate-100">
            {/* Image Box */}
            <div className="p-8 space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 uppercase tracking-wider">
                Hình ảnh hiển thị
              </h3>
              
              <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden">
                {bundle.imageUrl ? (
                  <img src={bundle.imageUrl} alt={bundle.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-16 h-16 text-slate-300" />
                )}
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-8 space-y-5 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
                <Tag size={18} className="text-primary" />
                Thông số bán hàng
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 text-sm font-medium">Tồn kho tối đa:</span>
                  <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">
                    {bundle.stock}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 text-sm font-medium">Giá gốc:</span>
                  <span className="font-bold text-slate-700 line-through">
                    {formatCurrency(bundle.originalPrice || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 text-sm font-medium">Khuyến mãi:</span>
                  <span className="font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 text-sm">
                    -{bundle.discountPercent}%
                  </span>
                </div>
                
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-800 font-bold uppercase tracking-wide">Giá bán:</span>
                  <span className="font-extrabold text-2xl text-primary">
                    {formatCurrency(bundle.price || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

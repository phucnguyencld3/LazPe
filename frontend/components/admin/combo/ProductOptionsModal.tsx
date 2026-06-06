import React, { useState, useEffect } from "react";
import { X, Check, ArrowLeft, Loader, Minus, Plus } from "lucide-react";
import { fetchAdminProductDetail, AdminProductDetailInfo, AdminVariantInfo } from "@/lib/features/products/productApi";
import { formatCurrency } from "@/lib/utils/formatters";

interface ProductOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  token: string;
  onAddVariant: (variant: {
    variantID: number;
    variantName: string;
    sku: string;
    price: number;
    stock: number;
    quantity: number;
    imageUrl: string;
    productName: string;
  }) => void;
  onBack: () => void;
}

export const ProductOptionsModal: React.FC<ProductOptionsModalProps> = ({
  isOpen,
  onClose,
  productId,
  token,
  onAddVariant,
  onBack,
}) => {
  const [productDetail, setProductDetail] = useState<AdminProductDetailInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!isOpen || !productId) return;
    loadProductDetail();
  }, [productId, isOpen]);

  const loadProductDetail = async () => {
    if (!token || !productId) return;
    setLoading(true);
    try {
      const detail = await fetchAdminProductDetail(token, String(productId));
      setProductDetail(detail);
      
      // Auto-select single variant if no options exist
      if (detail && detail.productOptions?.length === 0 && detail.variants?.length > 0) {
        setSelectedValues({});
      } else {
        setSelectedValues({});
      }
      setQuantity(1);
    } catch (err) {
      console.error("Error loading product detail in combo selection:", err);
    } finally {
      setLoading(true);
      // Wait, let's keep loading false here. Why was it true? Ah, typo in my draft, should be false!
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getProductImage = () => {
    if (selectedVariant && selectedVariant.imageUrl) {
      return selectedVariant.imageUrl;
    }
    return productDetail?.variants?.[0]?.imageUrl || "";
  };

  // Helper: check if a combination of option values is supported by any active variants
  const isOptionValueSelectable = (optionId: number, valueId: number) => {
    if (!productDetail || !productDetail.variants) return false;

    // Build the constraints for other options
    return productDetail.variants.some((variant) => {
      // 1. Must be active and have stock
      if (!variant.status) return false;

      // 2. Must match the value we are testing
      const hasTestedValue = variant.variantOptionValues.some(
        (vov) => vov.productOptionValueID === valueId
      );
      if (!hasTestedValue) return false;

      // 3. Must match all other currently selected option values
      for (const [otherOptIdStr, selectedValId] of Object.entries(selectedValues)) {
        const otherOptId = Number(otherOptIdStr);
        if (otherOptId === optionId) continue; // Skip current option

        const matchesSelected = variant.variantOptionValues.some(
          (vov) => vov.productOptionValueID === selectedValId
        );
        if (!matchesSelected) return false;
      }

      return true;
    });
  };

  const handleChipClick = (optionId: number, valueId: number) => {
    setSelectedValues((prev) => {
      const next = { ...prev };
      if (next[optionId] === valueId) {
        // Deselect if already selected
        delete next[optionId];
      } else {
        next[optionId] = valueId;
      }
      return next;
    });
  };

  // Find the exact matching variant
  const getSelectedVariant = (): AdminVariantInfo | null => {
    if (!productDetail || !productDetail.variants || !productDetail.productOptions) return null;
    
    // For products with no options, return the first active variant
    if (productDetail.productOptions.length === 0) {
      return productDetail.variants.find((v) => v.status) || productDetail.variants[0] || null;
    }

    // Check if all options have been selected
    const allOptionsSelected = productDetail.productOptions.every(
      (opt) => selectedValues[opt.productOptionID] !== undefined
    );
    if (!allOptionsSelected) return null;

    // Match variant
    return (
      productDetail.variants.find((variant) => {
        if (!variant.status) return false;
        return productDetail.productOptions.every((opt) => {
          const selectedValId = selectedValues[opt.productOptionID];
          return variant.variantOptionValues.some(
            (vov) => vov.productOptionValueID === selectedValId
          );
        });
      }) || null
    );
  };

  const selectedVariant = getSelectedVariant();

  const handleConfirm = () => {
    if (!productDetail || !selectedVariant) return;
    
    onAddVariant({
      variantID: selectedVariant.variantID,
      variantName: selectedVariant.variantName,
      sku: selectedVariant.sku,
      price: selectedVariant.finalPrice || selectedVariant.unitPrice,
      stock: selectedVariant.stock,
      quantity: quantity,
      imageUrl: selectedVariant.imageUrl || getProductImage() || "",
      productName: productDetail.productName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ width: "550px", maxWidth: "100%", height: "550px", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors hover:bg-slate-100/50 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft size={14} />
            Quay lại
          </button>
          <h3 className="text-sm font-bold text-slate-800 absolute left-1/2 -translate-x-1/2">
            Cấu hình thuộc tính
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product Details Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Loader className="animate-spin text-primary h-8 w-8 mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider">Đang tải cấu hình...</p>
          </div>
        ) : !productDetail ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-5">
            <p className="text-sm font-bold">Không tìm thấy thông tin sản phẩm</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Product Summary Header */}
            <div className="p-5 border-b border-slate-100 flex gap-4 bg-slate-50/20">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 bg-white shrink-0 flex items-center justify-center">
                {getProductImage() ? (
                  <img src={getProductImage()} alt={productDetail.productName} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 text-base leading-snug line-clamp-2">
                  {productDetail.productName}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  Mã gốc: {productDetail.code}
                </p>
              </div>
            </div>

            {/* Scrollable Attribute Options */}
            <div className="flex-grow overflow-y-auto p-5 space-y-5 scrollbar-thin">
              {productDetail.productOptions?.length > 0 ? (
                productDetail.productOptions.map((opt) => (
                  <div key={opt.productOptionID} className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      {opt.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {opt.productOptionValues?.map((val) => {
                        const isSelected = selectedValues[opt.productOptionID] === val.productOptionValueID;
                        const isSelectable = isOptionValueSelectable(opt.productOptionID, val.productOptionValueID);
                        
                        return (
                          <button
                            key={val.productOptionValueID}
                            type="button"
                            disabled={!isSelectable}
                            onClick={() => handleChipClick(opt.productOptionID, val.productOptionValueID)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-primary border-primary text-white shadow-sm"
                                : isSelectable
                                ? "bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary cursor-pointer"
                                : "bg-slate-50 border-slate-150 text-slate-300 cursor-not-allowed opacity-40 line-through"
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                            <span>{val.value}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs font-semibold text-slate-400 italic">
                  Sản phẩm này không có biến thể thuộc tính
                </div>
              )}
            </div>

            {/* Bottom Match details & Confirm Section */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50">
              {selectedVariant ? (
                <div className="flex items-center justify-between gap-4">
                  {/* Variant info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-lg">
                        {formatCurrency(selectedVariant.finalPrice || selectedVariant.unitPrice)}
                      </span>
                      {selectedVariant.variantDiscountPercent > 0 && (
                        <span className="bg-rose-100 text-rose-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                          -{selectedVariant.variantDiscountPercent}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <span>SKU: {selectedVariant.sku}</span>
                      <span>•</span>
                      <span className={selectedVariant.stock > 0 ? "text-secondary" : "text-error"}>
                        Kho: {selectedVariant.stock} chiếc
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Confirm action */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-2 hover:bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors"
                        disabled={quantity <= 1}
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-700">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
                        className="p-2 hover:bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors"
                        disabled={quantity >= selectedVariant.stock}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={selectedVariant.stock === 0}
                      onClick={handleConfirm}
                      className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      Xác nhận thêm
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs font-bold text-slate-400 py-3">
                  {productDetail.productOptions?.length > 0 
                    ? "Vui lòng chọn cấu hình thuộc tính của sản phẩm"
                    : "Đang kiểm tra biến thể khả dụng..."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

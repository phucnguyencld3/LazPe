import React, { useState, useEffect } from "react";
import { X, Check, ArrowLeft, Loader, Minus, Plus } from "lucide-react";
import { fetchAdminProductDetail, AdminProductDetailInfo, AdminVariantInfo } from "@/lib/features/products/productApi";
import { formatCurrency } from "@/lib/utils/formatters";
import Modal from "@/components/admin/ui/Modal";
import Button from "@/components/admin/ui/Button";

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
      setSelectedValues({});
      setQuantity(1);
    } catch (err) {
      console.error("Error loading product detail in combo selection:", err);
    } finally {
      setLoading(false);
    }
  };

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl font-outfit"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
        <Button 
          onClick={onBack}
          variant="secondary"
          className="rounded-full text-xs font-bold py-1.5"
          startIcon={<ArrowLeft size={14} />}
        >
          Quay lại
        </Button>
        <h3 className="text-sm font-bold text-gray-850 dark:text-white/90">
          Cấu hình thuộc tính
        </h3>
        <div className="w-20"></div> {/* Spacer to balance header */}
      </div>

      {/* Product Details Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <Loader className="animate-spin text-brand-500 h-8 w-8 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Đang tải cấu hình...</p>
        </div>
      ) : !productDetail ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-550 text-center">
          <p className="text-sm font-bold">Không tìm thấy thông tin sản phẩm</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Product Summary Header */}
          <div className="flex gap-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 p-4 rounded-2xl">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 flex items-center justify-center">
              {getProductImage() ? (
                <img src={getProductImage()} alt={productDetail.productName} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-600">inventory_2</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 dark:text-white/90 text-sm leading-snug line-clamp-2">
                {productDetail.productName}
              </h4>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
                Mã gốc: {productDetail.code}
              </p>
            </div>
          </div>

          {/* Scrollable Attribute Options */}
          <div className="space-y-5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
            {productDetail.productOptions?.length > 0 ? (
              productDetail.productOptions.map((opt) => (
                <div key={opt.productOptionID} className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
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
                              ? "bg-brand-500 border-brand-500 text-white shadow-sm"
                              : isSelectable
                              ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-brand-500 dark:hover:border-brand-400 hover:text-brand-500 dark:hover:text-brand-400 cursor-pointer"
                              : "bg-gray-50 dark:bg-gray-950 border-gray-150 dark:border-gray-900 text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-40 line-through"
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
              <div className="py-4 text-center text-xs font-semibold text-gray-400 dark:text-gray-550 italic">
                Sản phẩm này không có biến thể thuộc tính
              </div>
            )}
          </div>

          {/* Bottom Match details & Confirm Section */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-850">
            {selectedVariant ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Variant info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-800 dark:text-white/90 text-lg">
                      {formatCurrency(selectedVariant.finalPrice || selectedVariant.unitPrice)}
                    </span>
                    {selectedVariant.variantDiscountPercent > 0 && (
                      <span className="bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-450 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                        -{selectedVariant.variantDiscountPercent}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                    <span>SKU: {selectedVariant.sku}</span>
                    <span>•</span>
                    <span className={selectedVariant.stock > 0 ? "text-success-500" : "text-error-500"}>
                      Kho: {selectedVariant.stock} chiếc
                    </span>
                  </div>
                </div>

                {/* Quantity & Confirm action */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center border border-gray-250 dark:border-gray-850 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-450 active:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
                      className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-450 active:bg-gray-100 transition-colors"
                      disabled={quantity >= selectedVariant.stock}
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  </div>

                  <Button
                    type="button"
                    disabled={selectedVariant.stock === 0}
                    onClick={handleConfirm}
                    variant="primary"
                    className="rounded-xl text-xs font-bold py-2 shrink-0"
                  >
                    Xác nhận thêm
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 py-3">
                {productDetail.productOptions?.length > 0 
                  ? "Vui lòng chọn cấu hình thuộc tính của sản phẩm"
                  : "Đang kiểm tra biến thể khả dụng..."}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

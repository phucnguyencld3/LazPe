import React, { useState, useEffect } from "react";
import { ArrowLeft, Upload, Trash2, Plus, Minus, Loader, HelpCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils/formatters";
import { 
  getBundleDetail, 
  createBundle, 
  updateBundle, 
  uploadBundleImage, 
  addBundleItem, 
  deleteBundleItem, 
  updateBundleItemQuantity, 
  BundleResponse, 
  BundleItemResponse 
} from "@/lib/features/combo/comboApi";
import { ProductSelectModal } from "./ProductSelectModal";
import { ProductOptionsModal } from "./ProductOptionsModal";

interface ComboFormProps {
  bundleId: number | null; // null for Create, ID for Edit
  token: string;
  onCancel: () => void;
  onSaveSuccess: () => void;
}

interface LocalComboItem {
  bundleItemID?: number; // only for existing items in database
  variantID: number;
  variantName: string;
  sku: string;
  price: number;
  stock: number;
  quantity: number;
  imageUrl: string;
  productName: string;
}

export const ComboForm: React.FC<ComboFormProps> = ({
  bundleId,
  token,
  onCancel,
  onSaveSuccess,
}) => {
  const isEditMode = bundleId !== null;

  // Basic Info States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [status, setStatus] = useState(true);

  // Items State (Local in Create Mode, synced from Server in Edit Mode)
  const [items, setItems] = useState<LocalComboItem[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  useEffect(() => {
    if (isEditMode && bundleId) {
      loadBundleDetails();
    }
  }, [bundleId]);

  const loadBundleDetails = async () => {
    if (!token || !bundleId) return;
    setLoading(true);
    try {
      const data = await getBundleDetail(bundleId, token);
      setName(data.name || "");
      setDescription(data.description || "");
      setImageUrl(data.imageUrl || "");
      setDiscountPercent(data.discountPercent || 0);
      setStatus(data.status);
      
      const mappedItems: LocalComboItem[] = (data.items || []).map((item) => ({
        bundleItemID: item.bundleItemID,
        variantID: item.variantID,
        variantName: item.variantName,
        sku: item.sku,
        price: item.unitPrice,
        stock: item.stock,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        productName: item.productName,
      }));
      setItems(mappedItems);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thông tin chi tiết combo.");
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalOriginalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round(totalOriginalPrice * (discountPercent / 100));
  const finalPrice = totalOriginalPrice - discountAmount;

  const handleDiscountPercentChange = (val: number) => {
    // Theo luật bảo vệ người tiêu dùng / khuyến mãi, giảm giá tối đa không quá 50%
    const clampedVal = Math.min(50, Math.max(0, val));
    setDiscountPercent(clampedVal);
  };

  const handleDiscountAmountChange = (amount: number) => {
    const maxDiscountAmount = Math.round(totalOriginalPrice * 0.5);
    const clampedAmount = Math.min(maxDiscountAmount, Math.max(0, amount));
    if (totalOriginalPrice > 0) {
      const percent = (clampedAmount / totalOriginalPrice) * 100;
      setDiscountPercent(Number(percent.toFixed(2)));
    } else {
      setDiscountPercent(0);
    }
  };

  // Image Upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.loading("Đang tải ảnh lên...");
    try {
      const res = await uploadBundleImage(file, token, imageUrl || undefined);
      toast.dismiss();
      if (res.success && res.data) {
        setImageUrl(res.data);
        toast.success("Tải ảnh lên thành công!");
      } else {
        toast.error(res.message || "Tải ảnh thất bại.");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Lỗi kết nối khi tải ảnh.");
    } finally {
      setUploading(false);
    }
  };

  // Quantity updates
  const handleQuantityUpdate = async (item: LocalComboItem, newQty: number) => {
    if (newQty < 1 || newQty > item.stock) return;

    if (isEditMode && item.bundleItemID) {
      // Direct API update
      setLoading(true);
      try {
        const res = await updateBundleItemQuantity(item.bundleItemID, newQty, token);
        if (res.success) {
          await loadBundleDetails();
        } else {
          toast.error(res.message || "Không thể cập nhật số lượng.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi khi kết nối.");
      } finally {
        setLoading(false);
      }
    } else {
      // Local state update (Create Mode)
      setItems((prev) =>
        prev.map((i) => (i.variantID === item.variantID ? { ...i, quantity: newQty } : i))
      );
    }
  };

  // Item deletion
  const handleItemDelete = async (item: LocalComboItem) => {
    if (isEditMode && item.bundleItemID) {
      // Direct API delete
      setLoading(true);
      try {
        const res = await deleteBundleItem(item.bundleItemID, token);
        if (res.success) {
          toast.success("Đã xóa sản phẩm khỏi combo.");
          await loadBundleDetails();
        } else {
          toast.error(res.message || "Không thể xóa sản phẩm.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi khi kết nối.");
      } finally {
        setLoading(false);
      }
    } else {
      // Local state update (Create Mode)
      setItems((prev) => prev.filter((i) => i.variantID !== item.variantID));
      toast.success("Đã loại sản phẩm ra khỏi danh sách.");
    }
  };

  // Double modal callbacks
  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    setIsSelectModalOpen(false);
    setIsOptionsModalOpen(true);
  };

  const handleAddVariant = async (variant: {
    variantID: number;
    variantName: string;
    sku: string;
    price: number;
    stock: number;
    quantity: number;
    imageUrl: string;
    productName: string;
  }) => {
    // Check if variant already exists in list
    const exists = items.some((i) => i.variantID === variant.variantID);
    if (exists) {
      toast.warning("Sản phẩm/biến thể này đã tồn tại trong Combo.");
      return;
    }

    if (isEditMode && bundleId) {
      // Direct API add
      setLoading(true);
      try {
        const res = await addBundleItem(
          bundleId,
          { variantID: variant.variantID, quantity: variant.quantity },
          token
        );
        if (res.success) {
          toast.success("Thêm sản phẩm thành công!");
          await loadBundleDetails();
        } else {
          toast.error(res.message || "Không thể thêm sản phẩm vào combo.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    } else {
      // Local state add (Create Mode)
      setItems((prev) => [...prev, variant]);
      toast.success("Đã thêm sản phẩm vào danh sách.");
    }
  };

  // Submit main form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên combo.");
      return;
    }
    if (items.length === 0) {
      toast.error("Combo phải chứa ít nhất 1 sản phẩm.");
      return;
    }
    if (discountPercent > 50) {
      toast.error("Theo quy định, mức giảm giá không được vượt quá 50%.");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && bundleId) {
        const res = await updateBundle(
          bundleId,
          {
            bundleID: bundleId,
            name,
            description,
            imageUrl,
            discountPercent,
            status,
          },
          token
        );
        if (res.success) {
          toast.success("Cập nhật combo thành công!");
          onSaveSuccess();
        } else {
          toast.error(res.message || "Lỗi khi cập nhật combo.");
        }
      } else {
        const res = await createBundle(
          {
            name,
            description,
            imageUrl,
            discountPercent,
            status,
            bundleItems: items.map((i, index) => ({
              variantID: i.variantID,
              quantity: i.quantity,
              sortOrder: index,
            })),
          },
          token
        );
        if (res.success) {
          toast.success("Tạo mới combo thành công!");
          onSaveSuccess();
        } else {
          toast.error(res.message || "Lỗi khi tạo combo.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            title="Quay lại"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold">
              {isEditMode ? "Cập nhật Combo" : "Tạo Combo sản phẩm mới"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant/70">
              {isEditMode ? `Cập nhật thông tin combo sản phẩm #${bundleId}` : "Thiết lập gói sản phẩm bán chung với giá khuyến mãi"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-[8px] hover:bg-slate-50 font-bold text-sm transition-transform cursor-pointer"
            disabled={saving}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-primary text-white rounded-[8px] font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            disabled={saving}
          >
            {saving && <Loader className="animate-spin h-4 w-4" />}
            <span>Lưu Combo</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="bg-white rounded-[2rem] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400">
          <Loader className="animate-spin text-primary h-10 w-10 mb-4" />
          <p className="font-bold">Đang tải thông tin combo...</p>
        </div>
      ) : (
      <>
      {/* Main Form Content */}
      <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100">
          {/* Left / Main Column (Basic info & products) */}
          <div className="lg:col-span-8 flex flex-col divide-y divide-slate-100">
            {/* Basic Info Box */}
            <div className="p-8 space-y-5">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 uppercase tracking-wider">
                Thông tin cơ bản
              </h3>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block ml-1">
                  Tên Combo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Gói sơ sinh tiết kiệm cho bé"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none font-semibold text-sm placeholder-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block ml-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả về các sản phẩm có trong combo và lợi ích tiết kiệm..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none font-semibold text-sm placeholder-slate-400 resize-none"
                />
              </div>
            </div>

            {/* Selected Products Box */}
            <div className="p-8 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">
                  Sản phẩm trong Combo ({items.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSelectModalOpen(true)}
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  Thêm sản phẩm
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-4xl text-slate-350 mb-2">inventory_2</span>
                  <p className="text-sm font-bold">Chưa có sản phẩm nào được chọn</p>
                  <p className="text-xs text-slate-400 mt-1">Bấm nút Thêm sản phẩm phía trên để chọn từ danh mục sản phẩm</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 overflow-hidden">
                  {items.map((item) => (
                    <div key={item.variantID} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4 group">
                      {/* Product Image */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.variantName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                        )}
                      </div>

                      {/* Product Title */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{item.productName}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                          {item.variantName !== "Default" && item.variantName !== item.productName 
                            ? `Phân loại: ${item.variantName} | SKU: ${item.sku}` 
                            : `SKU: ${item.sku}`}
                        </p>
                      </div>

                      {/* Unit Price */}
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-700 text-sm block">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                          Tồn: {item.stock} chiếc
                        </span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityUpdate(item, item.quantity - 1)}
                          className="p-1.5 hover:bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={10} strokeWidth={3} />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-700">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityUpdate(item, item.quantity + 1)}
                          className="p-1.5 hover:bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus size={10} strokeWidth={3} />
                        </button>
                      </div>

                      {/* Delete Action */}
                      <button
                        type="button"
                        onClick={() => handleItemDelete(item)}
                        className="p-2 text-slate-400 hover:text-error hover:bg-rose-50 rounded-full transition-colors shrink-0"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Pricing details & status & image upload) */}
          <div className="lg:col-span-4 bg-slate-50/30 flex flex-col divide-y divide-slate-100">
            {/* Image Box */}
            <div className="p-8 space-y-5">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 uppercase tracking-wider">
                Hình ảnh Combo
              </h3>

              <div className="relative aspect-video rounded-2xl border border-dashed border-slate-300 overflow-hidden flex flex-col items-center justify-center bg-slate-50/50 group">
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Combo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <label className="cursor-pointer bg-white text-slate-700 hover:text-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5">
                        <Upload size={12} />
                        <span>Thay đổi ảnh</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors p-4 w-full h-full justify-center">
                    <Upload size={24} className="text-slate-300" />
                    <span className="text-xs font-bold">Tải ảnh lên (Kéo thả hoặc click)</span>
                    <span className="text-[10px] text-slate-450 normal-case font-normal">(Chấp nhận JPG, PNG, WEBP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-8 space-y-5">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 uppercase tracking-wider">
                Định giá Combo
              </h3>

              {/* Total Original Price */}
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-500">Giá gốc tổng:</span>
                <span className="font-bold text-slate-700">{formatCurrency(totalOriginalPrice)}</span>
              </div>

              {/* Discount Percent */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block ml-1">
                  % Giảm giá
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={discountPercent}
                    onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-4 pr-12 py-2.5 rounded-[8px] bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    %
                  </span>
                </div>
              </div>

              {/* Discount Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block ml-1">
                  Số tiền giảm giá (đ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={Math.round(totalOriginalPrice * 0.5)}
                    value={discountAmount || ""}
                    onChange={(e) => handleDiscountAmountChange(Number(e.target.value))}
                    placeholder="Tự động tính..."
                    className="w-full pl-4 pr-12 py-2.5 rounded-[8px] bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs uppercase">
                    đ
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-amber-50/50 p-3 rounded-[8px] border border-amber-100">
                <span className="material-symbols-outlined text-amber-500 text-base shrink-0 mt-0.5">info</span>
                <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed">
                  Theo quy định pháp luật về khuyến mại, mức giảm giá tối đa cho một Combo / Sản phẩm không được vượt quá <strong>50%</strong> giá trị gốc.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                {/* Final Price */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-sm">Giá bán Combo:</span>
                  <span className="font-extrabold text-primary text-xl">{formatCurrency(finalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Status & Options Box */}
            <div className="p-8 space-y-5">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 uppercase tracking-wider">
                Trạng thái hoạt động
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-slate-700">Trạng thái bán</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {status ? "Đang bán tại cửa hàng" : "Tạm ngưng bán"}
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
      </>
      )}

      {/* Modal 1: Select Main Product */}
      <ProductSelectModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        onProductSelect={handleProductSelect}
        token={token}
      />

      {/* Modal 2: Select Variant Attributes */}
      <ProductOptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        productId={selectedProductId}
        token={token}
        onAddVariant={handleAddVariant}
        onBack={() => {
          setIsOptionsModalOpen(false);
          setIsSelectModalOpen(true);
        }}
      />
    </div>
  );
};

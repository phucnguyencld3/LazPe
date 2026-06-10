import React, { useState, useEffect } from "react";
import { ArrowLeft, Upload, Trash2, Plus, Minus, Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils/formatters";
import { 
  getBundleDetail, 
  createBundle, 
  updateBundle, 
  uploadBundleImage, 
  addBundleItem, 
  deleteBundleItem, 
  updateBundleItemQuantity 
} from "@/lib/features/combo/comboApi";
import { ProductSelectModal } from "./ProductSelectModal";
import { ProductOptionsModal } from "./ProductOptionsModal";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import TextArea from "@/components/admin/ui/TextArea";
import Modal from "@/components/admin/ui/Modal";

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
    const clampedVal = Math.min(100, Math.max(0, val));
    setDiscountPercent(clampedVal);
  };

  const handleDiscountAmountChange = (amount: number) => {
    const clampedAmount = Math.min(totalOriginalPrice, Math.max(0, amount));
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
      setItems((prev) =>
        prev.map((i) => (i.variantID === item.variantID ? { ...i, quantity: newQty } : i))
      );
    }
  };

  // Item deletion
  const handleItemDelete = async (item: LocalComboItem) => {
    if (isEditMode && item.bundleItemID) {
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
    const exists = items.some((i) => i.variantID === variant.variantID);
    if (exists) {
      toast.warning("Sản phẩm/biến thể này đã tồn tại trong Combo.");
      return;
    }

    if (isEditMode && bundleId) {
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
    <div className="space-y-8 font-outfit">
      {/* Title Header bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/5"
            startIcon={<ArrowLeft size={16} />}
            title="Quay lại"
          />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white/90">
              {isEditMode ? "Cập nhật Combo" : "Tạo Combo sản phẩm mới"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {isEditMode ? `Cập nhật thông tin combo sản phẩm #${bundleId}` : "Thiết lập gói sản phẩm bán chung với giá khuyến mãi"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            className="rounded-full text-xs font-bold py-2.5"
            disabled={saving}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            isLoading={saving}
            className="rounded-full text-xs font-bold py-2.5 shadow-theme-xs"
          >
            Lưu Combo
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-150 dark:border-white/[0.05] p-20 flex flex-col items-center justify-center text-gray-400">
          <Loader className="animate-spin text-brand-500 h-10 w-10 mb-4" />
          <p className="font-bold">Đang tải thông tin combo...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Main Column (Basic info & products) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info Box */}
            <div className="bg-white dark:bg-gray-950 rounded-[2rem] p-8 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs space-y-6">
              <h3 className="text-base font-bold text-gray-800 dark:text-white/90 border-b border-gray-100 dark:border-gray-800 pb-3 uppercase tracking-wider">
                Thông tin cơ bản
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Tên Combo <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Gói sơ sinh tiết kiệm cho bé"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Mô tả chi tiết
                </label>
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả về các sản phẩm có trong combo và lợi ích tiết kiệm..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Selected Products Box */}
            <div className="bg-white dark:bg-gray-950 rounded-[2rem] p-8 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-base font-bold text-gray-800 dark:text-white/90 uppercase tracking-wider">
                  Sản phẩm trong Combo ({items.length})
                </h3>
                <Button
                  type="button"
                  onClick={() => setIsSelectModalOpen(true)}
                  variant="primary"
                  size="sm"
                  className="rounded-xl font-bold text-xs"
                  startIcon={<Plus size={14} />}
                >
                  Thêm sản phẩm
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-450 dark:text-gray-500">
                  <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-750 mb-2">inventory_2</span>
                  <p className="text-sm font-bold">Chưa có sản phẩm nào được chọn</p>
                  <p className="text-xs text-gray-400 dark:text-gray-550 mt-1">Bấm nút Thêm sản phẩm phía trên để chọn từ danh mục sản phẩm</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                  {items.map((item) => (
                    <div key={item.variantID} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4 group">
                      {/* Product Image */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.variantName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-gray-400 dark:text-gray-655">inventory_2</span>
                        )}
                      </div>

                      {/* Product Title */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 dark:text-white/90 text-sm truncate">{item.productName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wide">
                          {item.variantName !== "Default" && item.variantName !== item.productName 
                            ? `Phân loại: ${item.variantName} | SKU: ${item.sku}` 
                            : `SKU: ${item.sku}`}
                        </p>
                      </div>

                      {/* Unit Price */}
                      <div className="text-right shrink-0">
                        <span className="font-bold text-gray-700 dark:text-gray-300 text-sm block">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block mt-0.5">
                          Tồn: {item.stock} chiếc
                        </span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityUpdate(item, item.quantity - 1)}
                          className="p-1.5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-450 active:bg-gray-100 transition-colors cursor-pointer"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={10} strokeWidth={3} />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityUpdate(item, item.quantity + 1)}
                          className="p-1.5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-455 active:bg-gray-100 transition-colors cursor-pointer"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus size={10} strokeWidth={3} />
                        </button>
                      </div>

                      {/* Delete Action */}
                      <Button
                        variant="icon"
                        onClick={() => handleItemDelete(item)}
                        className="hover:text-error-500 dark:hover:text-error-400"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Pricing details & status & image upload) */}
          <div className="space-y-8">
            {/* Image Box */}
            <div className="bg-white dark:bg-gray-950 rounded-[2rem] p-8 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs space-y-6">
              <h3 className="text-base font-bold text-gray-800 dark:text-white/90 border-b border-gray-100 dark:border-gray-800 pb-3 uppercase tracking-wider">
                Hình ảnh Combo
              </h3>

              <div className="relative aspect-video rounded-2xl border border-dashed border-gray-300 dark:border-gray-750 overflow-hidden flex flex-col items-center justify-center bg-gray-50/50 dark:bg-white/[0.01] group">
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Combo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-350">
                      <label className="cursor-pointer bg-white text-slate-800 hover:text-brand-500 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5">
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
                  <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors p-4 w-full h-full justify-center">
                    <Upload size={24} className="text-gray-300 dark:text-gray-700" />
                    <span className="text-xs font-bold">Tải ảnh lên (Kéo thả hoặc click)</span>
                    <span className="text-[10px] text-gray-450 dark:text-gray-550 normal-case font-normal">(Chấp nhận JPG, PNG, WEBP)</span>
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
            <div className="bg-white dark:bg-gray-950 rounded-[2rem] p-8 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs space-y-6">
              <h3 className="text-base font-bold text-gray-800 dark:text-white/90 border-b border-gray-100 dark:border-gray-800 pb-3 uppercase tracking-wider">
                Định giá Combo
              </h3>

              {/* Total Original Price */}
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-500 dark:text-gray-450">Giá gốc tổng:</span>
                <span className="font-bold text-gray-800 dark:text-white/95">{formatCurrency(totalOriginalPrice)}</span>
              </div>

              {/* Discount Percent */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  % Giảm giá
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                    placeholder="0"
                    className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 transition-all bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 font-bold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 dark:text-gray-500 text-sm">
                    %
                  </span>
                </div>
              </div>

              {/* Discount Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Số tiền giảm giá (đ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={totalOriginalPrice}
                    value={discountAmount || ""}
                    onChange={(e) => handleDiscountAmountChange(Number(e.target.value))}
                    placeholder="Tự động tính..."
                    className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 transition-all bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 font-bold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase">
                    đ
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-150 dark:border-gray-800 pt-4">
                {/* Final Price */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 dark:text-white/90 text-sm">Giá bán Combo:</span>
                  <span className="font-extrabold text-brand-500 dark:text-brand-400 text-xl">{formatCurrency(finalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Status & Options Box */}
            <div className="bg-white dark:bg-gray-950 rounded-[2rem] p-8 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs space-y-6">
              <h3 className="text-base font-bold text-gray-800 dark:text-white/90 border-b border-gray-100 dark:border-gray-800 pb-3 uppercase tracking-wider">
                Trạng thái hoạt động
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Trạng thái bán</span>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
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
                  <div className="w-10 h-5.5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>
            </div>
          </div>
        </form>
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

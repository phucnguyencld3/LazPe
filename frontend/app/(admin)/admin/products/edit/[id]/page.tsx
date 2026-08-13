"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  CategorySelectOption,
  SupplierSelectOption,
  fetchCategoriesForSelect,
  fetchSuppliersForSelect,
  fetchAdminProductDetail,
  updateProduct,
  UpdateProductPayload
} from "@/lib/features/products/productApi";

// Presentational Components
import { ProductGeneralInfo } from "@/components/admin/products/ProductGeneralInfo";
import { ProductPricingInventory } from "@/components/admin/products/ProductPricingInventory";
import { ImageConflictModal } from "@/components/admin/products/ImageConflictModal";
import { ProductFormActions } from "@/components/admin/products/ProductFormActions";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("page") || "1";

  // Loaders
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [productName, setProductName] = useState("");
  const [code, setCode] = useState(""); // SKU code
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);
  const [price, setPrice] = useState<number | "">("");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState(true);
  const [supportsSubscription, setSupportsSubscription] = useState(false);

  // Lists from API
  const [categories, setCategories] = useState<CategorySelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSelectOption[]>([]);

  // Image state
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [hasVariantImages, setHasVariantImages] = useState(false);

  // Category Selection Path State
  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  // Helper to trace category path [parent, ..., child]
  const buildCategoryPath = (catId: number, allCats: CategorySelectOption[]): number[] => {
    const path: number[] = [];
    let currentId: number | null = catId;
    while (currentId) {
      const cat = allCats.find(c => c.categoryID === currentId);
      if (!cat) break;
      path.unshift(currentId);
      currentId = cat.parentID;
    }
    return path;
  };

  // Load product, categories and brands
  const loadProductAndMetadata = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);

      // Fetch categories, suppliers, and product detail in parallel
      const [catsData, supsData, productData] = await Promise.all([
        fetchCategoriesForSelect(token),
        fetchSuppliersForSelect(token),
        fetchAdminProductDetail(token, id as string)
      ]);

      setCategories(catsData);
      setSuppliers(supsData);

      // Populate form fields
      setProductName(productData.productName);
      setCode(productData.code);
      setSupplierId(productData.supplierID || "");
      setDescription(productData.description || "");
      setPrice(productData.price);
      setDiscountPercent(productData.productDiscountPercent);
      setStock(productData.stock);
      setSelectedCategoryId(productData.categoryID);
      setStatus(productData.status);
      setSupportsSubscription(productData.supportsSubscription || false);
      setProductImages(productData.imageUrls || []);

      const variantsArray = productData.variants || [];
      const vWithImages = variantsArray.some(function (v: any) { return !!v.imageUrl; });
      setHasVariantImages(vWithImages || false);

      // Parse specifications JSON
      let parsedSpecsList: { key: string; value: string }[] = [];
      if (productData.specifications) {
        try {
          const parsed = JSON.parse(productData.specifications);
          if (Array.isArray(parsed)) {
            parsedSpecsList = parsed.map((item: any) => ({
              key: String(item.key || ""),
              value: String(item.value || "")
            }));
          } else if (parsed && typeof parsed === "object") {
            parsedSpecsList = Object.entries(parsed).map(([key, value]) => ({
              key,
              value: String(value)
            }));
          }
        } catch (e) {
          console.error("Failed to parse specifications JSON", e);
        }
      }
      // If no specs exist, initialize with default slots
      if (parsedSpecsList.length === 0) {
        parsedSpecsList = [
          { key: "Tên sản phẩm", value: productData.productName || "" },
          { key: "Thương hiệu", value: "LazPe" },
          { key: "Xuất xứ", value: "Việt Nam" },
          { key: "Chất liệu", value: "" },
          { key: "Độ tuổi phù hợp", value: "" },
          { key: "Tiêu chuẩn an toàn", value: "Đạt chuẩn chất lượng Châu Âu EN71 & Quy chuẩn quốc gia CR" }
        ];
      } else {
        // If specs exist but "Tên sản phẩm" is not in there, let's prepend it
        const hasNameSpec = parsedSpecsList.some(s => s.key === "Tên sản phẩm");
        if (!hasNameSpec) {
          parsedSpecsList.unshift({ key: "Tên sản phẩm", value: productData.productName || "" });
        }
      }
      setSpecifications(parsedSpecsList);

      // Trace category path
      if (productData.categoryID) {
        const path = buildCategoryPath(productData.categoryID, catsData);
        setSelectedPath(path);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải thông tin sản phẩm chỉnh sửa.");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProductAndMetadata();
    }
  }, [id]);

  // Synchronize product name and brand to specifications
  useEffect(() => {
    setSpecifications(prev => {
      const nameIndex = prev.findIndex(s => s.key === "Tên sản phẩm");
      let newSpecs = [...prev];
      if (nameIndex >= 0) {
        if (newSpecs[nameIndex].value !== productName) {
          newSpecs[nameIndex] = { ...newSpecs[nameIndex], value: productName };
          return newSpecs;
        }
      } else {
        return [{ key: "Tên sản phẩm", value: productName }, ...prev];
      }
      return prev;
    });
  }, [productName]);

  useEffect(() => {
    if (!supplierId) return;
    const selectedSupplier = suppliers.find(s => s.supplierID === supplierId);
    if (!selectedSupplier) return;
    const supplierName = selectedSupplier.supplierName;

    setSpecifications(prev => {
      const brandIndex = prev.findIndex(s => s.key === "Thương hiệu");
      let newSpecs = [...prev];
      if (brandIndex >= 0) {
        if (newSpecs[brandIndex].value !== supplierName) {
          newSpecs[brandIndex] = { ...newSpecs[brandIndex], value: supplierName };
          return newSpecs;
        }
      } else {
        const insertIndex = prev.findIndex(s => s.key === "Tên sản phẩm") + 1;
        newSpecs.splice(insertIndex, 0, { key: "Thương hiệu", value: supplierName });
        return newSpecs;
      }
      return prev;
    });
  }, [supplierId, suppliers]);

  // Category change handler from child CategorySelector
  const handleCategoryChange = (catId: number | null, pathIds: number[]) => {
    setSelectedCategoryId(catId);
    setSelectedPath(pathIds);
  };

  const handleUploadProductImage = async (file: File) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setIsUploadingProductImage(true);

      const formData = new FormData();
      formData.append("file", file);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const res = await fetch(`${API_BASE_URL}/Upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload thất bại");

      const data = await res.json();
      if (data.url) {
        setProductImages(prev => [...prev, data.url]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi upload ảnh sản phẩm.");
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  const handleRemoveProductImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate final discounted price preview
  const baseVal = Number(price) || 0;
  const discVal = Number(discountPercent) || 0;
  const finalPrice = Math.max(0, baseVal - baseVal * (discVal / 100));

  const hasDuplicates = (() => {
    const specKeys = specifications.map(s => s.key.trim().toLowerCase()).filter(Boolean);
    if (specKeys.length !== new Set(specKeys).size) return true;
    return false;
  })();

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent, skipConflictCheck = false, clearVariantImages = false) => {
    if (e) e.preventDefault();

    if (!productName.trim()) {
      toast.warning("Vui lòng nhập tên sản phẩm.");
      return;
    }

    if (Number(discountPercent) > 50) {
      toast.error("Chiết khấu không được vượt quá 50% theo quy định pháp luật.");
      return;
    }

    if (!supplierId) {
      toast.warning("Vui lòng chọn thương hiệu / nhãn hàng.");
      return;
    }

    if (!selectedCategoryId) {
      toast.warning("Vui lòng chọn danh mục phân loại sản phẩm.");
      return;
    }

    // Specifications validation
    const specKeysList = specifications.map(s => s.key.trim().toLowerCase()).filter(Boolean);
    if (specKeysList.length !== new Set(specKeysList).size) {
      toast.warning("Tên các thông số kỹ thuật không được trùng nhau.");
      return;
    }

    // Conflict Check
    const hasProductImages = productImages.length > 0;
    if (!skipConflictCheck && hasProductImages && hasVariantImages) {
      setShowConflictModal(true);
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setSaving(true);

      const specsObj: Record<string, string> = {};
      specifications.forEach(item => {
        if (item.key.trim() && item.value.trim()) {
          specsObj[item.key.trim()] = item.value.trim();
        }
      });
      const specsJson = Object.keys(specsObj).length > 0 ? JSON.stringify(specsObj) : "";

      const payload: UpdateProductPayload = {
        productName: productName.trim(),
        code: code.trim() || undefined,
        categoryID: selectedCategoryId as number,
        supplierID: typeof supplierId === "number" ? supplierId : null,
        description: description.trim() || "",
        specifications: specsJson || "",
        price: price === "" ? 0 : Number(price),
        productDiscountPercent: discountPercent === "" ? 0 : Number(discountPercent),
        stock: stock === "" ? 0 : Number(stock),
        status: status,
        supportsSubscription: supportsSubscription,
        images: productImages,
        clearVariantImages: clearVariantImages
      };

      await updateProduct(token, Number(id), payload);

      toast.success("Cập nhật sản phẩm thành công!");
      router.push(`/admin/products/${id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi cập nhật sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full pb-12 animate-in fade-in duration-300">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-slate-400 mb-6 font-bold text-xs">
          <span
            className="hover:text-primary transition-colors cursor-pointer"
            onClick={() => router.push("/admin/products")}
          >
            Sản phẩm
          </span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span
            className="hover:text-primary transition-colors cursor-pointer truncate max-w-[150px]"
            onClick={() => router.push(`/admin/products/${id}`)}
          >
            {productName}
          </span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary">Chỉnh sửa</span>
        </nav>

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/products/${id}`)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
              title="Quay lại chi tiết sản phẩm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div>
              <h2 className="font-headline-md text-headline-md text-primary font-bold">Chỉnh sửa sản phẩm</h2>
              <p className="font-body-md text-body-md text-on-surface-variant/70 mt-1">Cập nhật thông tin gốc cho sản phẩm #{id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/admin/products/${id}?page=${fromPage}`)}
              className="px-6 py-2.5 rounded-[8px] border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              disabled={saving}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving || !productName.trim() || !selectedCategoryId || !supplierId || hasDuplicates}
              className="px-8 py-2.5 rounded-[8px] bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm font-bold animate-pulse">check_circle</span>
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Main Form Content */}
        <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100">
              {/* Left Column - Product details */}
              <div className="lg:col-span-8 flex flex-col divide-y divide-slate-100">
              <ProductGeneralInfo
                productName={productName}
                onProductNameChange={setProductName}
                code={code}
                onCodeChange={setCode}
                supplierId={supplierId}
                onSupplierIdChange={setSupplierId}
                suppliers={suppliers}
                description={description}
                onDescriptionChange={setDescription}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={handleCategoryChange}
                specifications={specifications}
                onSpecificationsChange={setSpecifications}
                productImages={productImages}
                isUploadingImage={isUploadingProductImage}
                onUploadProductImage={handleUploadProductImage}
                onRemoveProductImage={handleRemoveProductImage}
              />
            </div>

            {/* Right Column - Pricing, stock and status */}
            <div className="lg:col-span-4 flex flex-col divide-y divide-slate-100 bg-slate-50/30">
              <ProductPricingInventory
                price={price}
                onPriceChange={setPrice}
                discountPercent={discountPercent}
                onDiscountPercentChange={setDiscountPercent}
                stock={stock}
                onStockChange={setStock}
                finalPrice={finalPrice}
              />

              {/* Visibility Status Card */}
              <section className="p-8">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                  <span className="material-symbols-outlined text-primary">visibility</span>
                  <h3 className="text-lg font-bold text-slate-800">Trạng thái hiển thị</h3>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[8px]">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{status ? "Đang bán" : "Đã ẩn"}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Cho phép hiển thị sản phẩm trên ứng dụng</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status}
                      onChange={(e) => setStatus(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </section>
            </div>
          </div>
        </div>

        </form>

      <ImageConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onKeepProductImages={() => {
          setShowConflictModal(false);
          setHasVariantImages(false);
          setTimeout(() => handleSubmit(undefined, true, true), 100);
        }}
        onKeepVariantImages={() => {
          setShowConflictModal(false);
          setProductImages([]);
          setTimeout(() => handleSubmit(undefined, true, false), 100);
        }}
      />
    </>
  );
}

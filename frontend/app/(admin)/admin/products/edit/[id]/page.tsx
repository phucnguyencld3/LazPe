"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { CategorySelector } from "@/components/admin/products/CategorySelector";
import { ProductGeneralInfo } from "@/components/admin/products/ProductGeneralInfo";
import { ProductPricingInventory } from "@/components/admin/products/ProductPricingInventory";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  // Loaders
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [productName, setProductName] = useState("");
  const [code, setCode] = useState(""); // SKU code
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState(true);

  // Lists from API
  const [categories, setCategories] = useState<CategorySelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSelectOption[]>([]);

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

  // Category change handler from child CategorySelector
  const handleCategoryChange = (catId: number | null, pathIds: number[]) => {
    setSelectedCategoryId(catId);
    setSelectedPath(pathIds);
  };

  // Calculate final discounted price preview
  const baseVal = Number(price) || 0;
  const discVal = Number(discountPercent) || 0;
  const finalPrice = Math.max(0, baseVal - baseVal * (discVal / 100));

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      toast.warning("Vui lòng nhập tên sản phẩm.");
      return;
    }

    if (!selectedCategoryId) {
      toast.warning("Vui lòng chọn danh mục phân loại sản phẩm.");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setSaving(true);

      const payload: UpdateProductPayload = {
        productName: productName.trim(),
        code: code.trim() || undefined,
        categoryID: selectedCategoryId,
        supplierID: supplierId === "" ? null : Number(supplierId),
        description: description.trim() || undefined,
        price: price === "" ? 0 : Number(price),
        productDiscountPercent: discountPercent === "" ? 0 : Number(discountPercent),
        stock: stock === "" ? 0 : Number(stock),
        status: status
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
    <div className="w-full pb-32 animate-in fade-in duration-300">
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
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push(`/admin/products/${id}`)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
          title="Quay lại chi tiết sản phẩm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Chỉnh sửa sản phẩm</h2>
          <p className="text-slate-500 text-xs mt-1">Cập nhật thông tin gốc cho sản phẩm #{id}</p>
        </div>
      </header>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Product details */}
          <div className="lg:col-span-8 space-y-8">
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
            />

            <CategorySelector
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              selectedPath={selectedPath}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Right Column - Pricing, stock and status */}
          <div className="lg:col-span-4 space-y-8">
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
            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                <span className="material-symbols-outlined text-primary">visibility</span>
                <h3 className="text-lg font-bold text-slate-800">Trạng thái hiển thị</h3>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
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

        {/* Custom Actions Footer Bar */}
        <footer
          className="fixed bottom-0 right-0 w-full md:w-[calc(100%-18rem)] bg-white/95 backdrop-blur-md py-4 px-8 border-t border-slate-100 flex justify-end items-center gap-4 z-40 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.08)]"
          style={{ width: "100%", left: "0", position: "fixed", display: "flex", justifyContent: "flex-end" }}
        >
          <div className="flex gap-4 max-w-5xl w-full mx-auto justify-end px-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/products/${id}`)}
              className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              disabled={saving}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving || !productName.trim() || !selectedCategoryId}
              className="px-8 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
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
        </footer>
      </form>
    </div>
  );
}

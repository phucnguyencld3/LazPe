"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  CategorySelectOption,
  SupplierSelectOption,
  fetchCategoriesForSelect,
  fetchSuppliersForSelect,
  createProduct,
  CreateProductPayload
} from "@/lib/features/products/productApi";

// Presentational Components
import { CategorySelector } from "@/components/admin/products/CategorySelector";
import { ProductGeneralInfo } from "@/components/admin/products/ProductGeneralInfo";
import { ProductPricingInventory } from "@/components/admin/products/ProductPricingInventory";
import { ProductFormActions } from "@/components/admin/products/ProductFormActions";

export default function CreateProductPage() {
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

  // Lists from API
  const [categories, setCategories] = useState<CategorySelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSelectOption[]>([]);

  // Category Selection Path State
  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  // Load brands and categories
  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);

      const [catsData, supsData] = await Promise.all([
        fetchCategoriesForSelect(token),
        fetchSuppliersForSelect(token)
      ]);

      setCategories(catsData);
      setSuppliers(supsData);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải danh sách danh mục hoặc thương hiệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Tự động sinh mã SKU ngẫu nhiên cho sản phẩm
    const generatedSku = "SKU-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setCode(generatedSku);
    
    loadInitialData();
  }, []);

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

      const payload: CreateProductPayload = {
        productName: productName.trim(),
        code: code.trim() || undefined,
        categoryID: selectedCategoryId,
        supplierID: supplierId === "" ? null : Number(supplierId),
        description: description.trim() || undefined,
        price: price === "" ? 0 : Number(price),
        productDiscountPercent: discountPercent === "" ? 0 : Number(discountPercent),
        stock: stock === "" ? 0 : Number(stock)
      };

      const res = await createProduct(token, payload);
      
      toast.success("Tạo sản phẩm mới thành công!");
      
      // Auto redirect flow: new product -> options config -> variants config
      const newProductId = res.data?.productID || res.data?.id;
      if (newProductId) {
        router.push(`/admin/products/${newProductId}/options`);
      } else {
        router.push("/admin/products");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi tạo sản phẩm mới.");
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
        <span className="text-primary">Thêm mới</span>
      </nav>

      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/admin/products")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
          title="Quay lại danh sách sản phẩm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Thêm sản phẩm mới</h2>
          <p className="text-slate-500 text-xs mt-1">Khởi tạo sản phẩm gốc (có thể bổ sung thuộc tính và biến thể sau).</p>
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

          {/* Right Column - Pricing and stock */}
          <div className="lg:col-span-4">
            <ProductPricingInventory
              price={price}
              onPriceChange={setPrice}
              discountPercent={discountPercent}
              onDiscountPercentChange={setDiscountPercent}
              stock={stock}
              onStockChange={setStock}
              finalPrice={finalPrice}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <ProductFormActions
          onCancel={() => router.push("/admin/products")}
          saving={saving}
          disabled={!productName.trim() || !selectedCategoryId}
        />
      </form>
    </div>
  );
}

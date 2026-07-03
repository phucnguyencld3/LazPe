"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  CategorySelectOption,
  SupplierSelectOption,
  fetchCategoriesForSelect,
  fetchSuppliersForSelect,
  createFullProduct,
  CreateFullProductPayload
} from "@/lib/features/products/productApi";

// Presentational Components
import { ProductGeneralInfo } from "@/components/admin/products/ProductGeneralInfo";
import { ProductPricingInventory } from "@/components/admin/products/ProductPricingInventory";
import { ProductFormActions } from "@/components/admin/products/ProductFormActions";
import { ImageConflictModal } from "@/components/admin/products/ImageConflictModal";

interface OptionValueState {
  id: string;
  value: string;
  price: number;
  displayOrder: number;
  imageUrl?: string | null;
  isUploadingImage?: boolean;
}

interface OptionState {
  id: string;
  name: string;
  displayOrder: number;
  values: OptionValueState[];
}

interface VariantState {
  id: string;
  variantName: string;
  unitPrice: number;
  variantDiscountPercent: number;
  stock: number;
  sku: string;
  imageUrl?: string | null;
  description?: string | null;
  status: boolean;
  isUploadingImage?: boolean;
  optionValues: {
    optionName: string;
    value: string;
  }[];
  isPriceCustom?: boolean;
  isSkuCustom?: boolean;
  isDiscountCustom?: boolean;
  isImageCustom?: boolean;
}

export default function CreateProductPage() {
  const router = useRouter();

  // Loaders
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields (Product)
  const [productName, setProductName] = useState("");
  const [code, setCode] = useState(""); // SKU code
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([
    { key: "Tên sản phẩm", value: "" },
    { key: "Thương hiệu", value: "LazPe" },
    { key: "Xuất xứ", value: "Việt Nam" },
    { key: "Chất liệu", value: "" },
    { key: "Độ tuổi phù hợp", value: "" },
    { key: "Tiêu chuẩn an toàn", value: "Đạt chuẩn chất lượng Châu Âu EN71 & Quy chuẩn quốc gia CR" }
  ]);
  const [price, setPrice] = useState<number | "">("");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Lists from API
  const [categories, setCategories] = useState<CategorySelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSelectOption[]>([]);

  // Image Management
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Category Selection Path State
  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  // Product Options State
  const [options, setOptions] = useState<OptionState[]>([]);

  // Product Variants State (generated dynamically)
  const [variants, setVariants] = useState<VariantState[]>([]);

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
    const generatedSku = "SP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setCode(generatedSku);

    loadInitialData();
  }, []);

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

  // Option actions
  const handleAddOption = () => {
    const nextOrder = options.length + 1;
    const newOpt: OptionState = {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      displayOrder: nextOrder,
      values: [
        {
          id: Math.random().toString(36).substring(2, 9),
          value: "",
          price: 0,
          displayOrder: 1
        }
      ]
    };
    setOptions([...options, newOpt]);
  };

  const handleRemoveOption = (optId: string) => {
    setOptions(options.filter(o => o.id !== optId));
  };

  const handleUpdateOptionName = (optId: string, name: string) => {
    setOptions(options.map(o => o.id === optId ? { ...o, name } : o));
  };

  const handleUpdateOptionOrder = (optId: string, displayOrder: number) => {
    setOptions(options.map(o => o.id === optId ? { ...o, displayOrder } : o));
  };

  const handleAddValue = (optId: string) => {
    setOptions(options.map(o => {
      if (o.id === optId) {
        const nextValOrder = o.values.length + 1;
        return {
          ...o,
          values: [
            ...o.values,
            {
              id: Math.random().toString(36).substring(2, 9),
              value: "",
              price: 0,
              displayOrder: nextValOrder
            }
          ]
        };
      }
      return o;
    }));
  };

  const handleRemoveValue = (optId: string, valId: string) => {
    setOptions(options.map(o => {
      if (o.id === optId) {
        return {
          ...o,
          values: o.values.filter(v => v.id !== valId)
        };
      }
      return o;
    }));
  };

  const handleUpdateValueField = (optId: string, valId: string, field: keyof OptionValueState, value: any) => {
    setOptions(options.map(o => {
      if (o.id === optId) {
        return {
          ...o,
          values: o.values.map(v => v.id === valId ? { ...v, [field]: value } : v)
        };
      }
      return o;
    }));
  };

  // Cartesian combination generator effect
  useEffect(() => {
    // Filter active options and deduplicate their values (case-insensitive)
    const activeOpts = options
      .filter(o => o.name.trim())
      .map(o => {
        const uniqueValues = new Set<string>();
        const filteredVals = o.values.filter(v => {
          const trimmed = v.value.trim();
          if (!trimmed || uniqueValues.has(trimmed.toLowerCase())) {
            return false;
          }
          uniqueValues.add(trimmed.toLowerCase());
          return true;
        });
        return {
          ...o,
          values: filteredVals
        };
      })
      .filter(o => o.values.length > 0);

    if (activeOpts.length === 0) {
      setVariants([]);
      return;
    }

    // Generate cartesian product combinations
    const combos: { optionValues: { optionName: string; value: string }[] }[] = [];
    const helper = (depth: number, currentCombo: { optionName: string; value: string }[]) => {
      if (depth === activeOpts.length) {
        combos.push({ optionValues: [...currentCombo] });
        return;
      }
      const currentOpt = activeOpts[depth];
      currentOpt.values.forEach(v => {
        if (v.value.trim()) {
          currentCombo.push({ optionName: currentOpt.name.trim(), value: v.value.trim() });
          helper(depth + 1, currentCombo);
          currentCombo.pop();
        }
      });
    };
    helper(0, []);

    // Merge generated combinations with previous variants state to retain custom entries
    setVariants(prevVariants => {
      const existingMap = new Map<string, VariantState>();
      prevVariants.forEach(v => {
        const key = v.optionValues.map(ov => `${ov.optionName}:${ov.value}`).sort().join("|");
        existingMap.set(key, v);
      });

      return combos.map(c => {
        const key = c.optionValues.map(ov => `${ov.optionName}:${ov.value}`).sort().join("|");
        const existing = existingMap.get(key);

        // Compute defaults
        const addedPrice = c.optionValues.reduce((sum, ov) => {
          const opt = options.find(o => o.name.trim().toLowerCase() === ov.optionName.toLowerCase());
          const val = opt?.values.find(v => v.value.trim().toLowerCase() === ov.value.toLowerCase());
          return sum + (val?.price || 0);
        }, 0);
        const defaultUnitPrice = (Number(price) || 0) + addedPrice;

        const valSuffix = c.optionValues.map(ov => ov.value.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "")).join("-");
        const defaultSku = `${code || "SKU"}-${valSuffix}`;

        // Find if any constituent option value has an image
        let matchedImage: string | null = null;
        for (const ov of c.optionValues) {
          const opt = options.find(o => o.name.trim().toLowerCase() === ov.optionName.toLowerCase());
          const val = opt?.values.find(v => v.value.trim().toLowerCase() === ov.value.toLowerCase());
          if (val?.imageUrl) {
            matchedImage = val.imageUrl;
            break;
          }
        }

        if (existing) {
          // Remove the matched entry from the map so it cannot be reused (prevent duplicate keys)
          existingMap.delete(key);
          return {
            ...existing,
            unitPrice: existing.isPriceCustom ? existing.unitPrice : defaultUnitPrice,
            sku: existing.isSkuCustom ? existing.sku : defaultSku,
            variantDiscountPercent: existing.isDiscountCustom ? existing.variantDiscountPercent : (Number(discountPercent) || 0),
            imageUrl: existing.isImageCustom ? existing.imageUrl : (matchedImage || null)
          };
        }

        const suffixName = c.optionValues.map(ov => ov.value).join(" - ");
        return {
          id: Math.random().toString(36).substring(2, 9),
          variantName: `${productName || "Sản phẩm"} - ${suffixName}`,
          unitPrice: defaultUnitPrice,
          variantDiscountPercent: Number(discountPercent) || 0,
          stock: 0,
          sku: defaultSku,
          imageUrl: matchedImage || null,
          description: "",
          status: true,
          optionValues: c.optionValues,
          isPriceCustom: false,
          isSkuCustom: false,
          isDiscountCustom: false,
          isImageCustom: false
        };
      });
    });
  }, [options, price, code, discountPercent, productName]);

  // Variant editing handlers
  const handleUpdateVariantField = (id: string, field: keyof VariantState, value: any) => {
    setVariants(prev => prev.map(v => {
      if (v.id === id) {
        const updated = { ...v, [field]: value };
        if (field === "unitPrice") updated.isPriceCustom = true;
        if (field === "sku") updated.isSkuCustom = true;
        if (field === "variantDiscountPercent") updated.isDiscountCustom = true;
        if (field === "imageUrl") {
          updated.isImageCustom = value !== null;
        }
        return updated;
      }
      return v;
    }));
  };

  // Image Upload helper
  const handleUploadVariantImage = async (variantId: string, file: File) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.warning("Dung lượng ảnh vượt quá 5MB.");
        return;
      }

      setVariants(prev => prev.map(v => v.id === variantId ? { ...v, isUploadingImage: true } : v));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "polystation/variants");

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const res = await fetch(`${API_BASE_URL}/Upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Tải ảnh thất bại.");
      }

      const data = await res.json();
      setVariants(prev => prev.map(v => v.id === variantId ? { ...v, imageUrl: data.url, isUploadingImage: false, isImageCustom: true } : v));
      toast.success("Tải ảnh biến thể thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi upload ảnh.");
      setVariants(prev => prev.map(v => v.id === variantId ? { ...v, isUploadingImage: false } : v));
    }
  };

  const handleUploadOptionValueImage = async (optId: string, valId: string, file: File) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.warning("Dung lượng ảnh vượt quá 5MB.");
        return;
      }

      setOptions(prev => prev.map(o => o.id === optId ? {
        ...o,
        values: o.values.map(v => v.id === valId ? { ...v, isUploadingImage: true } : v)
      } : o));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "polystation/option_values");

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const res = await fetch(`${API_BASE_URL}/Upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Tải ảnh thất bại.");
      }

      const data = await res.json();
      setOptions(prev => prev.map(o => o.id === optId ? {
        ...o,
        values: o.values.map(v => v.id === valId ? { ...v, imageUrl: data.url, isUploadingImage: false } : v)
      } : o));
      toast.success("Tải ảnh thuộc tính thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi upload ảnh.");
      setOptions(prev => prev.map(o => o.id === optId ? {
        ...o,
        values: o.values.map(v => v.id === valId ? { ...v, isUploadingImage: false } : v)
      } : o));
    }
  };

  const handleRemoveOptionValueImage = (optId: string, valId: string) => {
    setOptions(prev => prev.map(o => o.id === optId ? {
      ...o,
      values: o.values.map(v => v.id === valId ? { ...v, imageUrl: null } : v)
    } : o));
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

// Category change handler from child CategorySelector
const handleCategoryChange = (catId: number | null, pathIds: number[]) => {
  setSelectedCategoryId(catId);
  setSelectedPath(pathIds);
};

// Dynamically calculate stock sum when variants exist
const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

// Dynamic duplicate warning helpers
const isOptionNameDuplicate = (name: string) => {
  if (!name.trim()) return false;
  return options.filter(o => o.name.trim().toLowerCase() === name.trim().toLowerCase()).length > 1;
};

const isValueDuplicate = (optId: string, value: string) => {
  if (!value.trim()) return false;
  const opt = options.find(o => o.id === optId);
  if (!opt) return false;
  return opt.values.filter(v => v.value.trim().toLowerCase() === value.trim().toLowerCase()).length > 1;
};

const isSkuDuplicate = (sku: string) => {
  if (!sku.trim()) return false;
  return variants.filter(v => v.sku.trim().toLowerCase() === sku.trim().toLowerCase()).length > 1;
};

// Check if there are any duplicate values
const hasDuplicates = (() => {
  const optNames = options.map(o => o.name.trim().toLowerCase()).filter(Boolean);
  if (optNames.length !== new Set(optNames).size) return true;

  for (const opt of options) {
    const valList = opt.values.map(v => v.value.trim().toLowerCase()).filter(Boolean);
    if (valList.length !== new Set(valList).size) return true;
  }

  const skus = variants.map(v => v.sku.trim().toLowerCase()).filter(Boolean);
  if (skus.length !== new Set(skus).size) return true;

  const specKeys = specifications.map(s => s.key.trim().toLowerCase()).filter(Boolean);
  if (specKeys.length !== new Set(specKeys).size) return true;

  return false;
})();

// Dynamic Pricing Preview
const baseVal = Number(price) || 0;
const discVal = Number(discountPercent) || 0;
const finalPrice = Math.max(0, baseVal - baseVal * (discVal / 100));

// --- Submit Handler ---
const handleSubmit = async (e?: React.FormEvent, skipConflictCheck = false) => {
  if (e) e.preventDefault();

  if (!productName.trim()) {
    toast.warning("Vui lòng nhập tên sản phẩm.");
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

  // Option validations
  const optionNamesList = options.map(o => o.name.trim().toLowerCase()).filter(Boolean);
  if (optionNamesList.length !== new Set(optionNamesList).size) {
    toast.warning("Tên các thuộc tính (Options) không được trùng nhau.");
    return;
  }

  for (const opt of options) {
    const valList = opt.values.map(v => v.value.trim().toLowerCase()).filter(Boolean);
    if (valList.length !== new Set(valList).size) {
      toast.warning(`Thuộc tính '${opt.name}' chứa các giá trị trùng nhau.`);
      return;
    }
  }

  // Variant validation
  const skus = variants.map(v => v.sku.trim().toLowerCase()).filter(Boolean);
  if (skus.length !== new Set(skus).size) {
    toast.warning("Mã SKU của các biến thể bị trùng lặp.");
    return;
  }

  // Specifications validation
  const specKeysList = specifications.map(s => s.key.trim().toLowerCase()).filter(Boolean);
  if (specKeysList.length !== new Set(specKeysList).size) {
    toast.warning("Tên các thông số kỹ thuật không được trùng nhau.");
    return;
  }

  // Image Conflict Detection
  const hasProductImages = productImages.length > 0;
  const hasVariantImages = variants.some(v => !!v.imageUrl);
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
    const specsJson = Object.keys(specsObj).length > 0 ? JSON.stringify(specsObj) : undefined;

    const payload: CreateFullProductPayload = {
      productName: productName.trim(),
      code: code.trim() || undefined,
      categoryID: selectedCategoryId as number,
      supplierID: typeof supplierId === "number" ? supplierId : null,
      description: description.trim() || "",
      specifications: specsJson || "",
      price: price === "" ? 0 : Number(price),
      productDiscountPercent: discountPercent === "" ? 0 : Number(discountPercent),
      stock: options.length > 0 ? totalStock : (stock === "" ? 0 : Number(stock)),
      status: true,
      options: options
        .filter(o => o.name.trim() && o.values.some(v => v.value.trim()))
        .map(o => ({
          name: o.name.trim(),
          displayOrder: o.displayOrder,
          values: o.values
            .filter(v => v.value.trim())
            .map(v => ({
              value: v.value.trim(),
              price: v.price,
              displayOrder: v.displayOrder
            }))
        })),
      variants: variants.map(v => ({
        variantName: v.variantName,
        unitPrice: v.unitPrice,
        variantDiscountPercent: v.variantDiscountPercent,
        stock: v.stock,
        sku: v.sku.trim(),
        imageUrl: v.imageUrl,
        description: v.description,
        status: v.status,
        optionValues: v.optionValues
      })),
      images: productImages
    };

    await createFullProduct(token, payload);
    toast.success("Tạo sản phẩm hoàn chỉnh thành công!");
    router.push("/admin/products");
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Lỗi khi tạo sản phẩm.");
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
          <p className="text-slate-500 text-xs mt-1">Khởi tạo sản phẩm, các tùy chọn thuộc tính và tự động sinh danh sách biến thể trong một màn hình.</p>
        </div>
      </header>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
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

          {/* Right Column - Pricing and stock */}
          <div className="lg:col-span-4">
            <ProductPricingInventory
              price={price}
              onPriceChange={setPrice}
              discountPercent={discountPercent}
              onDiscountPercentChange={setDiscountPercent}
              stock={options.length > 0 ? totalStock : stock}
              onStockChange={(val) => {
                if (options.length === 0) {
                  setStock(val);
                }
              }}
              finalPrice={finalPrice}
            />
          </div>
        </div>

        {/* Side-by-Side Options & Variants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-8">
          {/* Left Column: Dynamic Options Configuration */}
          <div className="lg:col-span-5 space-y-4">
            <section className="bg-white rounded-[8px] p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">tune</span>
                  <h3 className="text-base font-bold text-slate-800">Tùy chọn thuộc tính (Options)</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-3.5 py-1.5 rounded-[8px] text-sm font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm font-bold">add</span>
                  Thêm
                </button>
              </div>

              {options.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-[8px] border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-slate-300 text-2xl mb-1.5">pageview</span>
                  <p className="text-slate-400 text-sm font-bold">Chưa có thuộc tính nào</p>
                  <p className="text-slate-400 text-xs mt-0.5">Vui lòng nhấp nút "Thêm" để định cấu hình thuộc tính sản phẩm.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {options.map((opt) => {
                    const isOptDup = isOptionNameDuplicate(opt.name);
                    return (
                      <div key={opt.id} className="p-3 bg-slate-50/50 rounded-[8px] border border-slate-100 relative">
                        {/* Option Header: Name and Order */}
                        <div className="flex items-center gap-2 mb-3 pr-8 relative">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) => handleUpdateOptionName(opt.id, e.target.value)}
                              placeholder="Tên thuộc tính (Màu sắc, Size...)"
                              className={`w-full px-3 py-1.5 bg-white border rounded-[8px] focus:outline-none text-sm font-semibold text-slate-800 transition-all
                                ${isOptDup
                                  ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/5"
                                  : "border-slate-200 focus:ring-primary/20 focus:border-primary"
                                }
                              `}
                            />
                            {isOptDup && (
                              <span className="text-xs text-rose-500 font-bold mt-0.5 ml-0.5 block">
                                Trùng tên thuộc tính
                              </span>
                            )}
                          </div>
                          <div className="w-16 shrink-0" title="Thứ tự hiển thị">
                            <input
                              type="number"
                              min="1"
                              value={opt.displayOrder}
                              onChange={(e) => handleUpdateOptionOrder(opt.id, Number(e.target.value))}
                              placeholder="Thứ tự"
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-[8px] focus:outline-none text-sm font-semibold text-slate-800 text-center"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(opt.id)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 w-7 h-7 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors"
                            title="Xóa thuộc tính này"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>

                        {/* Values Section */}
                        <div className="space-y-2">
                          <div className="space-y-1.5">
                            {opt.values.map((val) => {
                              const isValDup = isValueDuplicate(opt.id, val.value);
                              return (
                                <div key={val.id} className="flex items-center gap-1.5 bg-white p-1.5 rounded-[8px] border border-slate-100 shadow-sm relative pr-7">
                                  {/* Micro Image Uploader Thumbnail */}
                                  <div className="relative w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group/valimg">
                                    {val.isUploadingImage ? (
                                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary border-t-transparent"></div>
                                    ) : val.imageUrl ? (
                                      <>
                                        <img src={val.imageUrl} className="w-full h-full object-cover" alt="ValThumb" />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveOptionValueImage(opt.id, val.id)}
                                          className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] hover:bg-rose-600 shadow z-10 animate-in fade-in zoom-in duration-200"
                                          title="Xóa ảnh"
                                        >
                                          <span className="material-symbols-outlined text-[8px] font-bold">close</span>
                                        </button>
                                      </>
                                    ) : (
                                      <span className="material-symbols-outlined text-slate-300 text-base">image</span>
                                    )}

                                    {!val.imageUrl && !val.isUploadingImage && (
                                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/valimg:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                                        <span className="material-symbols-outlined text-[12px]">add_a_photo</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              handleUploadOptionValueImage(opt.id, val.id, e.target.files[0]);
                                            }
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <input
                                      type="text"
                                      value={val.value}
                                      onChange={(e) => handleUpdateValueField(opt.id, val.id, "value", e.target.value)}
                                      placeholder="Giá trị (Đỏ, Xanh, S, M...)"
                                      className={`w-full px-2 py-1 bg-slate-50 border rounded-lg focus:outline-none text-sm font-semibold text-slate-800 transition-all
                                        ${isValDup
                                          ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/5"
                                          : "border-slate-100 focus:ring-primary/20 focus:border-primary"
                                        }
                                      `}
                                    />
                                    {isValDup && (
                                      <span className="text-xs text-rose-500 font-bold mt-0.5 ml-0.5 block">
                                        Trùng giá trị
                                      </span>
                                    )}
                                  </div>
                                  <div className="w-24 relative shrink-0" title="Giá cộng thêm">
                                    <input
                                      type="number"
                                      value={val.price === 0 ? "" : val.price}
                                      onChange={(e) => handleUpdateValueField(opt.id, val.id, "price", e.target.value === "" ? 0 : Number(e.target.value))}
                                      placeholder="+0"
                                      className="w-full pl-2 pr-5 py-1 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none text-sm font-semibold text-slate-800"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">đ</span>
                                  </div>
                                  <div className="w-12 shrink-0" title="Thứ tự hiển thị giá trị">
                                    <input
                                      type="number"
                                      min="1"
                                      value={val.displayOrder}
                                      onChange={(e) => handleUpdateValueField(opt.id, val.id, "displayOrder", Number(e.target.value))}
                                      className="w-full px-0.5 py-1 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none text-sm text-center font-semibold text-slate-800"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveValue(opt.id, val.id)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-0.5 rounded hover:bg-rose-50 transition-colors"
                                    title="Xóa giá trị này"
                                  >
                                    <span className="material-symbols-outlined text-base">close</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddValue(opt.id)}
                            className="text-xs font-bold text-secondary flex items-center gap-0.5 hover:underline cursor-pointer ml-0.5"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">add</span>
                            Thêm giá trị
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Variants combination dynamic list */}
          <div className="lg:col-span-7">
            {variants.length > 0 ? (
              <section className="bg-white rounded-[8px] p-5 border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">diversity_3</span>
                    <h3 className="text-base font-bold text-slate-800">Biến thể tự động sinh ({variants.length})</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 bg-primary/10 rounded-[8px] text-primary font-bold">
                    Tổ hợp tự động
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[550px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-2 py-2.5 font-bold text-xs text-slate-400 uppercase tracking-wider w-12 text-center">Ảnh</th>
                        <th className="px-2 py-2.5 font-bold text-xs text-slate-400 uppercase tracking-wider w-1/3">Tên biến thể</th>
                        <th className="px-2 py-2.5 font-bold text-xs text-slate-400 uppercase tracking-wider">SKU</th>
                        <th className="px-2 py-2.5 font-bold text-xs text-slate-400 uppercase tracking-wider w-28">Giá bán (VND)</th>
                        <th className="px-2 py-2.5 font-bold text-xs text-slate-400 uppercase tracking-wider text-center w-16">KM (%)</th>
                        <th className="px-2 py-2.5 font-bold text-xs text-slate-400 uppercase tracking-wider text-center w-16">Tồn kho</th>
                        <th className="px-2 py-2.5 font-bold text-xs text-slate-400 uppercase tracking-wider text-center w-14">Bán</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {variants.map((v) => {
                        const variantFinalPrice = Math.max(0, v.unitPrice - v.unitPrice * (v.variantDiscountPercent / 100));
                        const isSkuDup = isSkuDuplicate(v.sku);
                        return (
                          <tr key={v.id} className="hover:bg-slate-50/40 transition-colors group">
                            {/* Image Uploader Thumbnail */}
                            <td className="px-2 py-2 text-center">
                              <div className="relative w-8 h-8 mx-auto rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center group/img shadow-inner">
                                {v.isUploadingImage ? (
                                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary border-t-transparent"></div>
                                ) : v.imageUrl ? (
                                  <>
                                    <img src={v.imageUrl} className="w-full h-full object-cover" alt="Thumb" />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateVariantField(v.id, "imageUrl", null)}
                                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] hover:bg-rose-600 shadow z-10"
                                      title="Xóa ảnh"
                                    >
                                      <span className="material-symbols-outlined text-[8px] font-bold">close</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="material-symbols-outlined text-slate-300 text-base">image</span>
                                )}

                                {!v.imageUrl && !v.isUploadingImage && (
                                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                                    <span className="material-symbols-outlined text-[12px]">add_a_photo</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleUploadVariantImage(v.id, e.target.files[0]);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </td>

                            {/* Name */}
                            <td className="px-2 py-2 font-semibold text-xs text-slate-800 leading-normal">
                              {v.variantName}
                            </td>

                            {/* SKU */}
                            <td className="px-2 py-2">
                              <div>
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) => handleUpdateVariantField(v.id, "sku", e.target.value)}
                                  className={`w-full px-2 py-1 bg-slate-50 border rounded-lg focus:outline-none text-xs font-semibold text-slate-800 transition-all
                                    ${isSkuDup
                                      ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/5"
                                      : "border-slate-200 focus:ring-primary/20 focus:border-primary"
                                    }
                                  `}
                                />
                                {isSkuDup && (
                                  <span className="text-[10px] text-rose-500 font-bold mt-0.5 ml-0.5 block">
                                    Trùng SKU
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Price */}
                            <td className="px-2 py-2">
                              <div className="flex flex-col gap-0.5 w-24">
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={v.unitPrice}
                                  onChange={(e) => handleUpdateVariantField(v.id, "unitPrice", Number(e.target.value))}
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-bold text-slate-800"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold ml-0.5 leading-none">
                                  {new Intl.NumberFormat("vi-VN").format(variantFinalPrice)} đ
                                </span>
                              </div>
                            </td>

                            {/* Discount */}
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={v.variantDiscountPercent}
                                onChange={(e) => handleUpdateVariantField(v.id, "variantDiscountPercent", Number(e.target.value))}
                                className="w-12 px-1 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 text-center"
                              />
                            </td>

                            {/* Stock */}
                            <td className="px-2 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={(e) => handleUpdateVariantField(v.id, "stock", Number(e.target.value))}
                                className="w-12 px-1 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 text-center"
                              />
                            </td>

                            {/* Status Switch */}
                            <td className="px-2 py-2 text-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={v.status}
                                  onChange={(e) => handleUpdateVariantField(v.id, "status", e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <div className="bg-white rounded-[8px] p-12 text-center border border-slate-100 shadow-sm h-full flex flex-col justify-center items-center text-slate-400 font-semibold italic text-sm min-h-[250px]">
                <span className="material-symbols-outlined text-3xl mb-1.5 text-slate-300">diversity_3</span>
                Chưa có biến thể nào được sinh ra.
                <p className="text-slate-400 text-xs mt-0.5 leading-normal">Định cấu hình ít nhất một thuộc tính và giá trị ở cột bên trái để sinh tổ hợp tự động.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <ProductFormActions
          onCancel={() => router.push("/admin/products")}
          saving={saving}
          disabled={!productName.trim() || !selectedCategoryId || !supplierId || hasDuplicates}
        />
      </form>
    </div>

    <ImageConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onKeepProductImages={() => {
          setShowConflictModal(false);
          // Xóa ảnh biến thể
          setVariants(prev => prev.map(v => ({ ...v, imageUrl: null })));
          setTimeout(() => handleSubmit(undefined, true), 100);
        }}
        onKeepVariantImages={() => {
          setShowConflictModal(false);
          // Xóa ảnh sản phẩm
          setProductImages([]);
          setTimeout(() => handleSubmit(undefined, true), 100);
        }}
      />
    </>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AdminProductDetailInfo,
  fetchAdminProductDetail,
  VariantCombinationInfo,
  generateVariantCombinations,
  createMultipleVariants
} from "@/lib/features/products/productApi";
import { formatCurrency } from "@/lib/utils/formatters";

export default function QuickCreateVariantsPage() {
  const { id } = useParams();
  const router = useRouter();

  // Core data states
  const [product, setProduct] = useState<AdminProductDetailInfo | null>(null);
  const [combinations, setCombinations] = useState<VariantCombinationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters and Inputs
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkStock, setBulkStock] = useState<number | "">("");

  // Selections
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  // Load parent product detail and potential variant combinations
  const loadData = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);

      const [productData, combData] = await Promise.all([
        fetchAdminProductDetail(token, id as string),
        generateVariantCombinations(token, Number(id))
      ]);

      setProduct(productData);
      setCombinations(combData.combinations);

      // Pre-populate stock for all combinations to 0
      const initialStock: Record<string, number> = {};
      combData.combinations.forEach(c => {
        const key = c.optionValueIds.join(",");
        initialStock[key] = 0;
      });
      setStockMap(initialStock);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải tổ hợp biến thể của sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Filter combinations on the client side based on name search
  const filteredCombinations = combinations.filter(c =>
    c.variantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Checkbox select all
  const availableCombinations = filteredCombinations.filter(c => !c.alreadyExists);
  const isAllSelected = availableCombinations.length > 0 && 
    availableCombinations.every(c => selectedKeys.has(c.optionValueIds.join(",")));

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      const newKeys = new Set(selectedKeys);
      availableCombinations.forEach(c => {
        newKeys.add(c.optionValueIds.join(","));
      });
      setSelectedKeys(newKeys);
    } else {
      const newKeys = new Set(selectedKeys);
      availableCombinations.forEach(c => {
        newKeys.delete(c.optionValueIds.join(","));
      });
      setSelectedKeys(newKeys);
    }
  };

  const handleSelectRow = (key: string, checked: boolean) => {
    const newKeys = new Set(selectedKeys);
    if (checked) {
      newKeys.add(key);
    } else {
      newKeys.delete(key);
    }
    setSelectedKeys(newKeys);
  };

  const handleStockChange = (key: string, value: number) => {
    setStockMap(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Bulk Apply stock to all SELECTED variants
  const handleApplyBulkStock = () => {
    if (bulkStock === "" || bulkStock < 0) {
      toast.warning("Vui lòng nhập số lượng tồn kho ban đầu hợp lệ (>= 0).");
      return;
    }
    if (selectedKeys.size === 0) {
      toast.warning("Vui lòng tích chọn các tổ hợp biến thể muốn áp dụng.");
      return;
    }

    setStockMap(prev => {
      const updated = { ...prev };
      selectedKeys.forEach(key => {
        updated[key] = bulkStock;
      });
      return updated;
    });

    toast.success(`Đã gán số lượng ${bulkStock} chiếc cho ${selectedKeys.size} tổ hợp đang chọn.`);
  };

  // Submit quick creation
  const handleCreateVariants = async () => {
    if (selectedKeys.size === 0) {
      toast.warning("Vui lòng tích chọn ít nhất một tổ hợp biến thể.");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setSaving(true);

      // Map selected keys back to VariantCreateDto payloads
      const payload = combinations
        .filter(c => selectedKeys.has(c.optionValueIds.join(",")))
        .map(c => {
          const key = c.optionValueIds.join(",");
          return {
            productID: Number(id),
            variantName: c.variantName,
            name: c.variantName,
            unitPrice: c.unitPrice,
            variantDiscountPercent: product ? product.productDiscountPercent : 0,
            stock: stockMap[key] || 0,
            sku: "", // left empty so backend auto-generates
            optionValueIds: c.optionValueIds
          };
        });

      const res = await createMultipleVariants(token, Number(id), payload);
      toast.success(res.message || `Tạo thành công ${payload.length} biến thể.`);
      router.push(`/admin/products/${id}/variants`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Có lỗi xảy ra khi tạo các biến thể hàng loạt.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to extract parent product thumbnail
  const getProductImage = () => {
    if (product?.variants && product.variants.length > 0) {
      const imgVar = product.variants.find(v => v.imageUrl && v.imageUrl.trim() !== "");
      if (imgVar) return imgVar.imageUrl;
    }
    return null;
  };

  const mainImageUrl = getProductImage();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-slate-400 mb-6 font-bold text-xs">
        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => router.push("/admin/products")}>Sản phẩm</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => router.push(`/admin/products/${id}`)}>Chi tiết</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => router.push(`/admin/products/${id}/variants`)}>Biến thể</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary">Tạo nhanh</span>
      </nav>

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/admin/products/${id}/variants`)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
            title="Quay lại danh sách biến thể"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Tạo biến thể nhanh</h2>
        </div>
        <button
          onClick={() => router.push(`/admin/products/${id}/variants`)}
          className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs cursor-pointer active:scale-95 shadow-sm"
        >
          Quay lại
        </button>
      </header>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Product Summary & Bulk Tool */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Product Summary Card */}
          {product && (
            <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {mainImageUrl ? (
                  <img src={mainImageUrl} alt={product.productName} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-slate-300 text-2xl">image</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-0.5">Sản phẩm chính</span>
                <h3 className="font-bold text-slate-800 text-sm truncate" title={product.productName}>
                  {product.productName}
                </h3>
              </div>
            </section>
          )}

          {/* Bulk Action Tool */}
          <section className="bg-rose-50/50 rounded-2xl p-6 border border-primary-container/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary font-bold">bolt</span>
              <h3 className="font-bold text-slate-800 text-base">Cập nhật nhanh</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Số lượng tồn kho ban đầu</label>
                <input
                  type="number"
                  min="0"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ví dụ: 100"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 shadow-inner"
                />
              </div>
              <button
                onClick={handleApplyBulkStock}
                className="w-full py-3 bg-primary text-on-primary rounded-full font-bold text-xs shadow-md hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">done_all</span>
                Áp dụng cho tất cả đã chọn
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Attribute list combinations */}
        <div className="lg:col-span-8">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header section with search */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20">
              <h3 className="font-bold text-slate-800 text-lg">Danh sách tổ hợp thuộc tính</h3>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm thuộc tính..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Combinations list table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAllChange(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider">Tên thuộc tính</th>
                    <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider">Giá bán (Gốc + Chênh lệch)</th>
                    <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider">Tồn kho</th>
                    <th className="px-6 py-4 font-bold text-[11px] text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCombinations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-400 font-medium italic text-sm">
                        Chưa cấu hình giá trị hoặc không tìm thấy tổ hợp nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredCombinations.map((c) => {
                      const key = c.optionValueIds.join(",");
                      const isSelected = selectedKeys.has(key);
                      
                      // Calculate extra difference
                      const baseProductPrice = product ? product.price : 0;
                      const extraPrice = c.unitPrice - baseProductPrice;

                      return (
                        <tr
                          key={key}
                          className={`transition-colors duration-150 ${
                            c.alreadyExists
                              ? "bg-slate-50/50 text-slate-400"
                              : isSelected
                              ? "bg-primary-container/10 hover:bg-primary-container/15"
                              : "hover:bg-slate-50/40"
                          }`}
                        >
                          {/* Checkbox select */}
                          <td className="px-6 py-4.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={c.alreadyExists}
                              onChange={(e) => handleSelectRow(key, e.target.checked)}
                              className="w-4.5 h-4.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* Combination Name */}
                          <td className="px-6 py-4.5">
                            <div className="flex flex-col">
                              <span className={`font-bold text-sm ${c.alreadyExists ? "text-slate-400" : "text-slate-800"}`}>
                                {c.variantName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {Object.entries(c.optionCombination)
                                  .map(([optName, valName]) => `${optName}: ${valName}`)
                                  .join(" • ")}
                              </span>
                            </div>
                          </td>

                          {/* Price Offset & Total */}
                          <td className="px-6 py-4.5">
                            <div className="flex flex-col">
                              <span className={`font-bold text-sm ${c.alreadyExists ? "text-slate-400" : "text-secondary"}`}>
                                {extraPrice > 0 ? `+${formatCurrency(extraPrice)}` : "0 đ"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Tổng: {formatCurrency(c.unitPrice)}
                              </span>
                            </div>
                          </td>

                          {/* Initial Stock Input */}
                          <td className="px-6 py-4.5">
                            <input
                              type="number"
                              min="0"
                              disabled={c.alreadyExists || !isSelected}
                              value={stockMap[key] ?? 0}
                              onChange={(e) => handleStockChange(key, Math.max(0, Number(e.target.value)))}
                              className="w-24 h-9 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 disabled:opacity-40 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                            />
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4.5">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                c.alreadyExists
                                  ? "bg-slate-100 text-slate-400"
                                  : isSelected
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {c.alreadyExists ? "Đã tồn tại" : isSelected ? "Sẵn sàng" : "Đang chờ"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* List footer summary */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-400">
              <span>
                Hiển thị {filteredCombinations.length} tổ hợp biến thể của thuộc tính
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="mt-12 border-t border-slate-100 pt-8 pb-12 w-full text-center" style={{ width: "100%", display: "block", clear: "both" }}>
        <div className="mx-auto px-4" style={{ width: "100%", maxWidth: "550px", display: "block" }}>
          <p className="text-slate-500 text-sm font-semibold mb-4" style={{ width: "100%", display: "block", textAlign: "center", whiteSpace: "normal" }}>
            Bạn đang chọn <strong className="text-primary text-base">{selectedKeys.size}</strong> tổ hợp để tạo biến thể mới cho sản phẩm này.
          </p>
          <button
            onClick={handleCreateVariants}
            disabled={selectedKeys.size === 0 || saving}
            className="px-12 py-3.5 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
            style={{ width: "auto", minWidth: "240px", display: "flex" }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Đang khởi tạo các biến thể...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm font-bold">add_circle</span>
                Tạo các biến thể đã chọn
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

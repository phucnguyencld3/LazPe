import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Grid, 
  List, 
  RotateCcw, 
  Edit, 
  Trash2, 
  Loader, 
  TrendingDown, 
  Tag, 
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils/formatters";
import { 
  getBundles, 
  deleteBundle, 
  toggleBundleStatus, 
  BundleResponse,
  exportCombosExcel
} from "@/lib/features/combo/comboApi";

interface ComboListProps {
  token: string;
  onCreateClick: () => void;
  onEditClick: (bundleId: number) => void;
}

export const ComboList: React.FC<ComboListProps> = ({
  token,
  onCreateClick,
  onEditClick,
}) => {
  const [bundles, setBundles] = useState<BundleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const statusVal = statusFilter === "active" ? true : statusFilter === "inactive" ? false : null;
      const blob = await exportCombosExcel(token, searchTerm, statusVal);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DanhSachCombo_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Xuất file Excel thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể xuất file Excel.");
    } finally {
      setExporting(false);
    }
  };
  
  // View mode: grid or table
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-asc" | "price-desc" | "discount-desc">("newest");

  // Deletion Modal
  const [bundleToDelete, setBundleToDelete] = useState<BundleResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status Toggling State (to disable double-clicks)
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getBundles(token);
      setBundles(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách combo sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!token || togglingId !== null) return;
    setTogglingId(id);
    try {
      const res = await toggleBundleStatus(id, token);
      if (res.success) {
        toast.success(
          currentStatus 
            ? "Đã tạm dừng hoạt động combo." 
            : "Đã kích hoạt hoạt động combo."
        );
        // Optimistic UI update or refresh
        setBundles((prev) =>
          prev.map((b) => (b.bundleID === id ? { ...b, status: !currentStatus } : b))
        );
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi thay đổi trạng thái.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteClick = (bundle: BundleResponse) => {
    setBundleToDelete(bundle);
  };

  const confirmDelete = async () => {
    if (!bundleToDelete || !token) return;
    setDeleting(true);
    try {
      const res = await deleteBundle(bundleToDelete.bundleID, token);
      if (res.success) {
        toast.success("Xóa combo sản phẩm thành công!");
        setBundles((prev) => prev.filter((b) => b.bundleID !== bundleToDelete.bundleID));
        setBundleToDelete(null);
      } else {
        toast.error(res.message || "Lỗi khi xóa combo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setDeleting(false);
    }
  };

  // Filter and sort bundles locally
  const filteredBundles = bundles
    .filter((bundle) => {
      const matchesSearch = 
        bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bundle.description && bundle.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bundle.code && bundle.code.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && bundle.status) ||
        (statusFilter === "inactive" && !bundle.status);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdDate || "").getTime() - new Date(a.createdDate || "").getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdDate || "").getTime() - new Date(b.createdDate || "").getTime();
      }
      if (sortBy === "price-asc") {
        return a.price - b.price;
      }
      if (sortBy === "price-desc") {
        return b.price - a.price;
      }
      if (sortBy === "discount-desc") {
        return b.discountPercent - a.discountPercent;
      }
      return 0;
    });

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  // Calculate statistics
  const totalCombos = bundles.length;
  const activeCombos = bundles.filter(b => b.status).length;
  const inactiveCombos = totalCombos - activeCombos;
  const avgDiscount = totalCombos > 0 
    ? Math.round(bundles.reduce((sum, b) => sum + b.discountPercent, 0) / totalCombos) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">
            Quản lý Combo sản phẩm
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">
            Tạo và cấu hình các gói sản phẩm đi kèm với giá ưu đãi để tăng doanh thu
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <Loader className="animate-spin h-4.5 w-4.5" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">download</span>
            )}
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={onCreateClick}
            className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Plus size={18} />
            <span>Tạo Combo mới</span>
          </button>
        </div>
      </header>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Combos */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary shrink-0">
              <Tag size={18} />
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng số Combo</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : totalCombos}</span>
        </div>

        {/* Active Combos */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang hoạt động</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : activeCombos}</span>
        </div>

        {/* Inactive Combos */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
              <span className="material-symbols-outlined text-[20px]">pause_circle</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tạm ẩn</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : inactiveCombos}</span>
        </div>

        {/* Average Discount */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <TrendingDown size={18} />
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Giảm giá trung bình</span>
          </div>
          <span className="text-2xl font-extrabold text-rose-500">{loading ? "..." : `${avgDiscount}%`}</span>
        </div>
      </div>

      {/* Filter and Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tool Filter Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Search Box */}
            <div className="flex-1 min-w-[260px] relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm combo theo tên, mã..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[150px] cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[170px] cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="discount-desc">% Giảm: Nhiều nhất</option>
            </select>

            {/* Reset Filters */}
            {(searchTerm || statusFilter !== "all" || sortBy !== "newest") && (
              <button
                onClick={resetFilters}
                className="px-6 py-3 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer animate-in fade-in duration-200"
              >
                <RotateCcw size={14} />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>

          {/* View Mode Toggles */}
          <div className="flex items-center gap-1 border border-slate-200 bg-slate-50 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid" 
                  ? "bg-white text-primary shadow-sm border border-slate-100" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Xem dạng lưới"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table" 
                  ? "bg-white text-primary shadow-sm border border-slate-100" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Xem dạng bảng"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Content List Area */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader className="animate-spin text-primary h-9 w-9 mb-4" />
            <p className="text-sm font-bold uppercase tracking-wider">Đang tải danh sách combo...</p>
          </div>
        ) : filteredBundles.length === 0 ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">inventory_2</span>
            <p className="text-base font-bold">Không tìm thấy combo sản phẩm nào</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng điều chỉnh tiêu chí tìm kiếm hoặc tạo mới combo</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Bento/Grid Layout */
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredBundles.map((bundle) => (
              <div 
                key={bundle.bundleID}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Thumbnail Image Container */}
                <div className="relative aspect-video w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                  {bundle.imageUrl ? (
                    <img 
                      src={bundle.imageUrl} 
                      alt={bundle.name} 
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                  )}

                  {/* Discount Badge */}
                  {bundle.discountPercent > 0 && (
                    <div className="absolute top-4 left-4 bg-rose-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm flex items-center gap-0.5">
                      <TrendingDown size={12} />
                      <span>-{bundle.discountPercent}%</span>
                    </div>
                  )}

                  {/* Quick Edit Overlay */}
                  <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-3">
                    <button
                      onClick={() => onEditClick(bundle.bundleID)}
                      className="p-2.5 bg-white text-slate-700 hover:text-primary rounded-full shadow-md hover:scale-110 active:scale-95 transition-all font-bold"
                      title="Sửa Combo"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(bundle)}
                      className="p-2.5 bg-white text-slate-700 hover:text-error rounded-full shadow-md hover:scale-110 active:scale-95 transition-all font-bold"
                      title="Xóa Combo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                        {bundle.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                        {bundle.code || `ID: ${bundle.bundleID}`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                      {bundle.description || "Không có mô tả chi tiết cho combo này."}
                    </p>

                    {/* Mini Item Indicators */}
                    {bundle.items && bundle.items.length > 0 && (
                      <div className="pt-2 flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">
                          Sản phẩm:
                        </span>
                        <div className="flex -space-x-2 overflow-hidden">
                          {bundle.items.slice(0, 4).map((item, index) => (
                            <div 
                              key={item.bundleItemID || index}
                              className="w-6 h-6 rounded-full border border-white bg-slate-100 overflow-hidden flex items-center justify-center shrink-0"
                              title={`${item.productName} (${item.quantity} chiếc)`}
                            >
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.variantName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] font-bold text-slate-400">P</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {bundle.items.length > 4 && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            +{bundle.items.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing and Switch Status footer */}
                  <div className="border-t border-slate-50 pt-4 mt-4 flex items-center justify-between">
                    <div>
                      {bundle.discountPercent > 0 && (
                        <span className="text-xs text-slate-400 line-through block font-medium">
                          {formatCurrency(bundle.originalPrice)}
                        </span>
                      )}
                      <span className="font-extrabold text-primary text-base">
                        {formatCurrency(bundle.price)}
                      </span>
                    </div>

                    {/* Status switch */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${bundle.status ? "text-secondary" : "text-slate-400"}`}>
                        {bundle.status ? "Đang bán" : "Tạm dừng"}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={bundle.status}
                          disabled={togglingId === bundle.bundleID}
                          onChange={() => handleToggleStatus(bundle.bundleID, bundle.status)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table Layout */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                  <th className="px-4 py-4 text-center w-12">STT</th>
                  <th className="px-8 py-4">Combo</th>
                  <th className="px-6 py-4">Mã</th>
                  <th className="px-6 py-4">Giá gốc</th>
                  <th className="px-6 py-4">Giá Combo</th>
                  <th className="px-6 py-4 text-center">Giảm giá</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-8 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBundles.map((bundle, index) => (
                  <tr key={bundle.bundleID} className="hover:bg-slate-100/70 transition-all duration-200 group">
                    {/* STT */}
                    <td className="px-4 py-4 text-center text-xs font-semibold text-slate-400">
                      {index + 1}
                    </td>
                    {/* Item Detail */}
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 flex items-center justify-center">
                          {bundle.imageUrl ? (
                            <img src={bundle.imageUrl} alt={bundle.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                            {bundle.name}
                          </h5>
                          {bundle.items && bundle.items.length > 0 ? (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                              {bundle.items.length} sản phẩm trong gói
                            </p>
                          ) : (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                              Chưa có sản phẩm
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600 font-mono">
                        {bundle.code || `ID: ${bundle.bundleID}`}
                      </span>
                    </td>

                    {/* Original Price */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-500">
                        {formatCurrency(bundle.originalPrice)}
                      </span>
                    </td>

                    {/* Final Price */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold text-primary">
                        {formatCurrency(bundle.price)}
                      </span>
                    </td>

                    {/* Discount */}
                    <td className="px-6 py-4 text-center">
                      {bundle.discountPercent > 0 ? (
                        <span className="text-rose-500 text-sm font-extrabold">
                          -{bundle.discountPercent}%
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">-</span>
                      )}
                    </td>

                    {/* Status Switch */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-[10px] font-bold uppercase min-w-[50px] text-right ${bundle.status ? "text-secondary" : "text-slate-400"}`}>
                          {bundle.status ? "Đang bán" : "Tạm ẩn"}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={bundle.status}
                            disabled={togglingId === bundle.bundleID}
                            onChange={() => handleToggleStatus(bundle.bundleID, bundle.status)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditClick(bundle.bundleID)}
                          className="p-2 text-slate-450 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(bundle)}
                          className="p-2 text-slate-450 hover:text-error hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {bundleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-[400px] max-w-[90vw] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-error">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Xác nhận xóa Combo</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Bạn có chắc chắn muốn xóa combo sản phẩm <span className="text-slate-700 font-bold">"{bundleToDelete.name}"</span>?
                  Hành động này không thể hoàn tác và sẽ xóa bỏ vĩnh viễn gói combo này khỏi hệ thống.
                </p>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBundleToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                disabled={deleting}
              >
                {deleting && <Loader className="animate-spin h-3.5 w-3.5" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

